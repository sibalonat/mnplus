// warning-light-game.js - The Light That Never Comes On
// The last hundred and twenty kilometres to Bajram Curri. Things break as you go.
// Some of them light up on the dashboard - and some of those lights are sensor
// errors that clear on their own. Some things break with no light at all: an
// tailpipe, a wheel bolt, a brake line. There is no sensor for them. The only
// warning is a faint rattle, and a second car that keeps overtaking you and
// waving - usually to say hello, once in a while to say something else.
// Pull over and a mechanic fixes what is real for 25 euros each, but every
// stop costs daylight. Dismiss a light and keep driving if you think the
// machine is wrong. Reach the town before dark, without being stranded.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initWarning() {
        const canvas = document.getElementById('warningCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startWarningGame');
        const scoreEl = document.getElementById('warningScore');
        const paidEl = document.getElementById('warningPaid');
        const verdictEl = document.getElementById('warningVerdict');

        if (!canvas || !ctx || !startBtn || !scoreEl || !paidEl || !verdictEl) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initWarning, 200);
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = 300;
        const H = 400;
        const HEADER_H = 58;
        const ROAD_L = 38;
        const ROAD_R = 262;
        const LANE_X = [94, 206];               // the other car's lane, your lane
        const CAR_W = 24;
        const CAR_H = 38;
        const CAR_Y = 300;
        const TARGET_KM = 120;                  // to Bajram Curri
        const DRIVE_MS = 78000;                 // time to cover it without one stop
        const DAY_MS = 120000;                  // how long the daylight lasts
        const STOP_MS = 4000;                   // what one stop costs
        const REPAIR_COST = 25;                 // what Ismet charged
        const DAMAGE_PER_MS = 0.0021;           // per real fault you carry
        const REPAIR_HEAL = 15;                 // he tightens other things too
        const SMOKE_AT = 55;                    // when hidden damage becomes visible
        const INSIST_MS = 4500;                 // a real light you dismissed comes back

        const LIGHTS = ['ENGINE', 'OIL', 'BATTERY', 'TEMP'];
        const SILENT = ['TAILPIPE', 'WHEEL BOLT', 'BRAKE LINE'];
        const LIGHT_Y = 17;
        const LIGHT_H = 20;
        const LIGHT_W = 64;
        const LIGHT_GAP = 72;
        const LIGHT_X0 = 8;

        const C_BG = '#0a0a0a';
        const C_ROAD = '#151515';
        const C_CLIFF = '#0b1016';
        const C_ROCK = '#1a1410';
        const C_LINE = 'rgba(236, 240, 241, 0.30)';
        const C_VERGE = 'rgba(233, 196, 106, 0.45)';
        const C_LIT = '#f4a261';
        const C_LIT_FILL = 'rgba(244, 162, 97, 0.28)';
        const C_DARK = '#6c7a86';
        const C_RED = '#e63946';
        const C_GOOD = '#2ecc71';
        const C_BLUE = '#457b9d';
        const C_TEXT = '#ecf0f1';

        let running = false;
        let stopping = false;
        let stopTimer = 0;
        let loopId = null;
        let lastTick = 0;
        let elapsed = 0;

        let km = 0;
        let daylight = 100;
        let damage = 0;
        let paid = 0;
        let stops = 0;
        let emptyStops = 0;
        let falseChased = 0;
        let silentCaught = 0;
        let silentSeen = 0;
        let badDismiss = 0;
        let goodDismiss = 0;
        let dash = 0;

        let faults = [];
        let nextFaultIn = 7000;
        let overtaker = null;
        let nextOvertakerIn = 5000;
        let smoke = [];

        let shakeTimer = 0;
        let feedbackText = '';
        let feedbackColor = '';
        let feedbackTimer = 0;
        let lastSilentName = '';

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
        function rand(a, b) { return a + Math.random() * (b - a); }

        function showFeedback(text, color) {
            feedbackText = text;
            feedbackColor = color;
            feedbackTimer = 1500;
        }

        function silentActive() {
            for (let i = 0; i < faults.length; i++) {
                if (faults[i].silent) return true;
            }
            return false;
        }

        function faultOnLight(i) {
            for (let k = 0; k < faults.length; k++) {
                if (faults[k].light === i) return faults[k];
            }
            return null;
        }

        function spawnFault() {
            const free = [];
            for (let i = 0; i < LIGHTS.length; i++) {
                if (!faultOnLight(i)) free.push(i);
            }
            let goSilent = !silentActive() && Math.random() < 0.42;
            if (!free.length) goSilent = !silentActive();

            if (goSilent) {
                // No sensor. No light. Only the rattle, and whoever is looking.
                const name = SILENT[Math.floor(Math.random() * SILENT.length)];
                faults.push({ name: name, silent: true, real: true, light: -1, age: 0, hidden: false, hiddenTimer: 0, selfClear: 0 });
                silentSeen++;
                lastSilentName = name;
                // They kept passing us. Bring the other car back sooner.
                if (!overtaker) nextOvertakerIn = Math.min(nextOvertakerIn, rand(1800, 3200));
                return;
            }
            if (!free.length) return;

            const li = free[Math.floor(Math.random() * free.length)];
            const real = Math.random() < 0.65;
            faults.push({
                name: LIGHTS[li], silent: false, real: real, light: li, age: 0,
                hidden: false, hiddenTimer: 0,
                selfClear: real ? 0 : rand(7000, 11000)
            });
        }

        function spawnOvertaker() {
            overtaker = {
                y: H + 50,
                vy: rand(0.10, 0.14),
                shown: false,
                bubbleTimer: 0,
                bubble: ''
            };
        }

        function pullOver() {
            if (!running || stopping) return;
            stopping = true;
            stopTimer = STOP_MS;
            stops++;
        }

        function finishStop() {
            stopping = false;
            const real = [];
            const fake = [];
            for (let i = 0; i < faults.length; i++) {
                if (faults[i].real) real.push(faults[i]); else fake.push(faults[i]);
            }

            if (real.length) {
                paid += REPAIR_COST * real.length;
                damage = clamp(damage - REPAIR_HEAL * real.length, 0, 100);
                let names = [];
                for (let i = 0; i < real.length; i++) {
                    if (real[i].silent) silentCaught++;
                    names.push(real[i].name);
                }
                showFeedback('ISMET - ' + names.join(' + ') + ', ' + (REPAIR_COST * real.length) + '€', C_GOOD);
            } else if (fake.length) {
                falseChased += fake.length;
                showFeedback('SENSOR ERROR - nothing under the car', C_LIT);
            } else {
                emptyStops++;
                showFeedback('NOTHING WRONG - daylight gone for nothing', C_DARK);
            }
            faults = [];
        }

        function dismissLight(i) {
            if (!running || stopping) return false;
            const f = faultOnLight(i);
            if (!f || f.hidden) return false;
            if (f.real) {
                f.hidden = true;
                f.hiddenTimer = INSIST_MS;
                badDismiss++;
            } else {
                faults.splice(faults.indexOf(f), 1);
                goodDismiss++;
            }
            showFeedback('DISMISSED - trusting the road over the light', C_BLUE);
            return true;
        }

        function dismissAny() {
            for (let i = 0; i < LIGHTS.length; i++) {
                if (dismissLight(i)) return;
            }
        }

        function update(dt) {
            elapsed += dt;
            if (feedbackTimer > 0) feedbackTimer -= dt;
            if (shakeTimer > 0) shakeTimer -= dt;

            daylight = clamp(daylight - dt * (100 / DAY_MS), 0, 100);
            if (daylight <= 0) {
                endGame('The dark caught you still on the road.', false, 'dark');
                return;
            }

            if (stopping) {
                stopTimer -= dt;
                if (stopTimer <= 0) finishStop();
                return;
            }

            km += dt * TARGET_KM / DRIVE_MS;
            dash += 0.09 * dt;

            for (let i = faults.length - 1; i >= 0; i--) {
                const f = faults[i];
                f.age += dt;
                if (f.real) {
                    damage += DAMAGE_PER_MS * dt;
                } else {
                    f.selfClear -= dt;
                    if (f.selfClear <= 0) { faults.splice(i, 1); continue; }
                }
                if (f.hidden) {
                    f.hiddenTimer -= dt;
                    if (f.hiddenTimer <= 0) {
                        f.hidden = false;
                        shakeTimer = 300;
                        showFeedback(f.name + ' - the light insists', C_RED);
                    }
                }
            }
            damage = clamp(damage, 0, 100);

            if (damage >= 100) {
                if (silentActive()) {
                    endGame('The ' + lastSilentName.toLowerCase() + '. There was never a light for it.', false, 'silent');
                } else {
                    endGame('You drove on with the light on.', false, 'lit');
                }
                return;
            }
            if (km >= TARGET_KM) {
                km = TARGET_KM;
                endGame('You reached Bajram Curri before dark.', true, 'won');
                return;
            }

            nextFaultIn -= dt;
            if (nextFaultIn <= 0) {
                spawnFault();
                nextFaultIn = Math.max(4200, 8500 - km * 30) + rand(0, 2500);
            }

            if (!overtaker) {
                nextOvertakerIn -= dt;
                if (nextOvertakerIn <= 0) spawnOvertaker();
            } else {
                overtaker.y -= overtaker.vy * dt;
                if (!overtaker.shown && overtaker.y <= CAR_Y + 6) {
                    overtaker.shown = true;
                    overtaker.bubbleTimer = 1500;
                    overtaker.bubble = (silentActive() && Math.random() < 0.8) ? 'warn' : 'hi';
                }
                if (overtaker.bubbleTimer > 0) overtaker.bubbleTimer -= dt;
                if (overtaker.y < HEADER_H - 60) {
                    overtaker = null;
                    nextOvertakerIn = silentActive() ? rand(2500, 5000) : rand(6000, 10000);
                }
            }

            if (damage >= SMOKE_AT && Math.random() < dt * 0.012 * (damage / 100)) {
                smoke.push({ x: LANE_X[1] + rand(-5, 5), y: CAR_Y + CAR_H, r: rand(2, 4), a: 0.55 });
            }
            for (let i = smoke.length - 1; i >= 0; i--) {
                const s = smoke[i];
                s.y += 0.06 * dt;
                s.r += 0.004 * dt;
                s.a -= 0.0006 * dt;
                if (s.a <= 0 || s.y > H) smoke.splice(i, 1);
            }
        }

        // ---- drawing ----

        function drawRoad(sx) {
            ctx.fillStyle = C_CLIFF;
            ctx.fillRect(0, HEADER_H, ROAD_L, H - HEADER_H);
            ctx.fillStyle = C_ROCK;
            ctx.fillRect(ROAD_R, HEADER_H, W - ROAD_R, H - HEADER_H);
            ctx.fillStyle = C_ROAD;
            ctx.fillRect(ROAD_L + sx, HEADER_H, ROAD_R - ROAD_L, H - HEADER_H);

            // guard rail posts on the cliff side
            ctx.fillStyle = 'rgba(236, 240, 241, 0.18)';
            for (let y = HEADER_H - (dash % 40); y < H; y += 40) {
                ctx.fillRect(ROAD_L - 9 + sx, y, 3, 14);
            }

            ctx.strokeStyle = C_LINE;
            ctx.lineWidth = 2;
            ctx.setLineDash([14, 16]);
            ctx.lineDashOffset = -(dash % 30);
            ctx.beginPath();
            ctx.moveTo(150 + sx, HEADER_H);
            ctx.lineTo(150 + sx, H);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;

            ctx.strokeStyle = C_VERGE;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ROAD_L + 2 + sx, HEADER_H);
            ctx.lineTo(ROAD_L + 2 + sx, H);
            ctx.moveTo(ROAD_R - 2 + sx, HEADER_H);
            ctx.lineTo(ROAD_R - 2 + sx, H);
            ctx.stroke();
        }

        function drawSmoke(sx, sy) {
            for (let i = 0; i < smoke.length; i++) {
                const s = smoke[i];
                ctx.globalAlpha = Math.max(0, s.a);
                ctx.fillStyle = '#9a9a9a';
                ctx.beginPath();
                ctx.arc(s.x + sx, s.y + sy, s.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        function drawOvertaker(sx, sy) {
            if (!overtaker) return;
            const x = LANE_X[0] + sx - CAR_W / 2;
            const y = overtaker.y + sy;
            ctx.fillStyle = C_BLUE;
            ctx.fillRect(x, y, CAR_W, CAR_H);
            ctx.fillStyle = '#2b4c60';
            ctx.fillRect(x + 4, y + 5, CAR_W - 8, 12);
            ctx.fillStyle = '#f4a261';
            ctx.fillRect(x + 2, y + CAR_H - 4, 5, 3);
            ctx.fillRect(x + CAR_W - 7, y + CAR_H - 4, 5, 3);

            if (overtaker.bubbleTimer > 0 && overtaker.bubble) {
                const warn = overtaker.bubble === 'warn';
                const text = warn ? 'YOUR CAR!' : 'hello!';
                ctx.font = warn ? 'bold 10px Arial' : '10px Arial';
                const tw = ctx.measureText(text).width + 12;
                const bx = LANE_X[0] + sx - tw / 2;
                const by = y - 24;
                ctx.globalAlpha = Math.min(1, overtaker.bubbleTimer / 300);
                ctx.fillStyle = warn ? C_RED : 'rgba(233, 196, 106, 0.9)';
                ctx.fillRect(bx, by, tw, 16);
                ctx.fillStyle = warn ? '#fff' : '#000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, LANE_X[0] + sx, by + 8);
                if (warn) {
                    // a hand pointing at the underside of your car
                    ctx.strokeStyle = C_RED;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(x + CAR_W + 2, y + 12);
                    ctx.lineTo(LANE_X[1] + sx - CAR_W / 2 - 4, CAR_Y + sy + CAR_H - 4);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }
        }

        function drawCar(sx, sy) {
            let jx = 0, jy = 0;
            if (silentActive()) {
                jx = rand(-1.2, 1.2);
                jy = rand(-0.8, 0.8);
            }
            const x = LANE_X[1] + sx + jx - CAR_W / 2;
            const y = CAR_Y + sy + jy;
            ctx.fillStyle = C_RED;
            ctx.fillRect(x, y, CAR_W, CAR_H);
            ctx.fillStyle = C_BLUE;
            ctx.fillRect(x + 4, y + 5, CAR_W - 8, 12);
            ctx.fillStyle = '#f4a261';
            ctx.fillRect(x + 2, y + CAR_H - 4, 5, 3);
            ctx.fillRect(x + CAR_W - 7, y + CAR_H - 4, 5, 3);

            if (silentActive() && Math.sin(elapsed / 260) > 0.3) {
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = '#bbb';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText('tk  tk', LANE_X[1] + sx, y + CAR_H + 12);
                ctx.globalAlpha = 1;
            }
        }

        function drawHeader() {
            ctx.fillStyle = 'rgba(13, 13, 13, 0.97)';
            ctx.fillRect(0, 0, W, HEADER_H);
            ctx.strokeStyle = 'rgba(244, 162, 97, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, HEADER_H);
            ctx.lineTo(W, HEADER_H);
            ctx.stroke();

            // daylight
            const barX = 8, barY = 6, barW = W - 16, barH = 6;
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(barX, barY, barW, barH);
            const d = daylight / 100;
            const r = Math.round(233 - (1 - d) * 120);
            const g = Math.round(196 - (1 - d) * 150);
            const b = Math.round(106 - (1 - d) * 40);
            ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            ctx.fillRect(barX, barY, barW * d, barH);
            ctx.strokeStyle = 'rgba(244,162,97,0.4)';
            ctx.strokeRect(barX, barY, barW, barH);

            // the dashboard: four lights, and nothing for the rest
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < LIGHTS.length; i++) {
                const x = LIGHT_X0 + i * LIGHT_GAP;
                const f = faultOnLight(i);
                const on = f && !f.hidden;
                if (on) {
                    const pulse = 0.7 + 0.3 * Math.sin(elapsed / 160);
                    ctx.globalAlpha = pulse;
                    ctx.fillStyle = C_LIT_FILL;
                    ctx.fillRect(x, LIGHT_Y, LIGHT_W, LIGHT_H);
                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = C_LIT;
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x, LIGHT_Y, LIGHT_W, LIGHT_H);
                    ctx.fillStyle = C_LIT;
                    ctx.font = 'bold 8px Arial';
                } else {
                    ctx.strokeStyle = 'rgba(108, 122, 134, 0.35)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, LIGHT_Y, LIGHT_W, LIGHT_H);
                    ctx.fillStyle = 'rgba(108, 122, 134, 0.5)';
                    ctx.font = '8px Arial';
                }
                ctx.fillText(LIGHTS[i], x + LIGHT_W / 2, LIGHT_Y + LIGHT_H / 2);
            }

            ctx.font = 'bold 9px Arial';
            ctx.fillStyle = C_TEXT;
            ctx.textAlign = 'left';
            ctx.fillText('KM ' + Math.floor(km) + '/' + TARGET_KM, 8, HEADER_H - 9);
            ctx.textAlign = 'center';
            ctx.fillText('STOPS ' + stops, W / 2, HEADER_H - 9);
            ctx.textAlign = 'right';
            ctx.fillStyle = paid > 0 ? C_LIT : C_TEXT;
            ctx.fillText('PAID ' + paid + '€', W - 8, HEADER_H - 9);
        }

        function drawStopOverlay() {
            if (!stopping) return;
            const y0 = 150;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(ROAD_L, y0, ROAD_R - ROAD_L, 78);
            ctx.strokeStyle = C_LIT;
            ctx.lineWidth = 1;
            ctx.strokeRect(ROAD_L, y0, ROAD_R - ROAD_L, 78);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('PULLED OVER', W / 2, y0 + 24);
            ctx.fillStyle = '#aaa';
            ctx.font = '10px Arial';
            ctx.fillText('Ismet is under the car...', W / 2, y0 + 42);

            const p = 1 - clamp(stopTimer / STOP_MS, 0, 1);
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(ROAD_L + 20, y0 + 56, ROAD_R - ROAD_L - 40, 6);
            ctx.fillStyle = C_LIT;
            ctx.fillRect(ROAD_L + 20, y0 + 56, (ROAD_R - ROAD_L - 40) * p, 6);
        }

        function drawFeedback() {
            if (feedbackTimer > 0 && feedbackText) {
                ctx.globalAlpha = Math.min(1, feedbackTimer / 360);
                ctx.fillStyle = feedbackColor;
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(feedbackText, W / 2, H - 8);
                ctx.globalAlpha = 1;
            }
        }

        function drawFrame(timestamp) {
            const dt = lastTick ? Math.min(60, timestamp - lastTick) : 16.67;
            lastTick = timestamp;

            if (!running) return;

            update(dt);
            if (!running) return;

            let sx = 0, sy = 0;
            if (shakeTimer > 0) {
                const mag = Math.min(4, shakeTimer / 100);
                sx = Math.sin(elapsed / 21) * mag;
                sy = Math.sin(elapsed / 15) * mag;
            }

            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            drawRoad(sx);
            drawSmoke(sx, sy);
            drawOvertaker(sx, sy);
            drawCar(sx, sy);
            drawStopOverlay();
            drawHeader();
            drawFeedback();

            updateDisplays();
            loopId = requestAnimationFrame(drawFrame);
        }

        function updateDisplays() {
            scoreEl.textContent = 'Distance: ' + Math.floor(km) + '/' + TARGET_KM + ' km';
            paidEl.textContent = 'Paid: ' + paid + '€';
            paidEl.style.color = paid >= 100 ? '#e63946' : paid >= 50 ? '#f4a261' : '#e9c46a';
        }

        function startGame() {
            if (running) return;
            running = true;
            stopping = false;
            stopTimer = 0;
            elapsed = 0;
            km = 0;
            daylight = 100;
            damage = 0;
            paid = 0;
            stops = 0;
            emptyStops = 0;
            falseChased = 0;
            silentCaught = 0;
            silentSeen = 0;
            badDismiss = 0;
            goodDismiss = 0;
            dash = 0;
            faults = [];
            nextFaultIn = 6000;
            overtaker = null;
            nextOvertakerIn = 4000;
            smoke = [];
            shakeTimer = 0;
            feedbackText = '';
            feedbackTimer = 0;
            lastSilentName = '';
            lastTick = 0;

            verdictEl.textContent = '';
            startBtn.textContent = 'Driving...';
            startBtn.disabled = true;

            loopId = requestAnimationFrame(drawFrame);
        }

        function endGame(reason, won, kind) {
            running = false;
            stopping = false;
            if (loopId) cancelAnimationFrame(loopId);
            updateDisplays();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            let title = 'STRANDED';
            if (won) title = 'YOU ARRIVED';
            else if (kind === 'dark') title = 'CAUGHT BY THE DARK';
            ctx.fillText(title, W / 2, H / 2 - 92);

            ctx.font = '12px Arial';
            ctx.fillStyle = C_LIT;
            ctx.fillText(reason || '', W / 2, H / 2 - 66);

            ctx.fillStyle = C_TEXT;
            ctx.font = '16px Arial';
            ctx.fillText('Distance: ' + Math.floor(km) + '/' + TARGET_KM + ' km', W / 2, H / 2 - 34);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Stops: ' + stops + '   Paid: ' + paid + '€', W / 2, H / 2 - 12);
            ctx.fillText('False alarms chased: ' + falseChased + '   Empty stops: ' + emptyStops, W / 2, H / 2 + 6);
            ctx.fillText('Faults with no light: ' + silentSeen + '   Caught: ' + silentCaught, W / 2, H / 2 + 24);
            ctx.fillText('Lights dismissed: ' + goodDismiss + ' rightly, ' + badDismiss + ' wrongly', W / 2, H / 2 + 42);

            let msg, col;
            if (won && silentSeen > 0 && silentCaught === silentSeen && falseChased <= 1) {
                msg = 'You read the wave, not only the dashboard.';
                col = C_GOOD;
            } else if (won) {
                msg = 'You arrived. The dashboard never knew about half of it.';
                col = C_BLUE;
            } else if (kind === 'silent') {
                msg = 'The light for that one does not exist.';
                col = C_RED;
            } else if (kind === 'lit') {
                msg = 'The light was on. You kept driving.';
                col = C_LIT;
            } else if (stops >= 6) {
                msg = 'You stopped for every light. The day did not wait.';
                col = C_LIT;
            } else {
                msg = 'The road was longer than the daylight.';
                col = C_BLUE;
            }
            ctx.fillStyle = col;
            ctx.font = 'bold 12px Arial';
            ctx.fillText(msg, W / 2, H / 2 + 78);

            verdictEl.textContent = reason || '';
            startBtn.textContent = 'Drive Again';
            startBtn.disabled = false;
        }

        function drawIdle() {
            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 17px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('The Light That Never Comes On', W / 2, 52);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Four lights on the dashboard. More things can break.', W / 2, 76);

            const legend = [
                { c: C_LIT, l: 'LIGHT ON', t: 'a real fault - or a sensor error' },
                { c: C_DARK, l: 'NO LIGHT', t: 'tailpipe, wheel bolt, brake line' },
                { c: C_BLUE, l: 'THE OTHER CAR', t: 'waves hello - or waves at your car' },
                { c: C_GOOD, l: 'PULL OVER', t: 'real faults fixed, 25€ each, daylight lost' }
            ];
            ctx.textBaseline = 'middle';
            for (let i = 0; i < legend.length; i++) {
                const y = 116 + i * 32;
                const x = W / 2 - 118;
                ctx.fillStyle = legend[i].c;
                ctx.globalAlpha = 0.35;
                ctx.fillRect(x, y - 9, 18, 18);
                ctx.globalAlpha = 1;
                ctx.strokeStyle = legend[i].c;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x, y - 9, 18, 18);

                ctx.fillStyle = C_TEXT;
                ctx.font = 'bold 9px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(legend[i].l, x + 26, y - 4);
                ctx.fillStyle = '#bbb';
                ctx.font = '10px Arial';
                ctx.fillText(legend[i].t, x + 26, y + 7);
            }

            ctx.fillStyle = '#888';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Reach 120 km before the daylight goes.', W / 2, H - 70);
            ctx.fillText('SPACE / S, or tap the road: pull over.', W / 2, H - 54);
            ctx.fillText('D / X, or tap a lit light: dismiss it.', W / 2, H - 38);
            ctx.fillText('Hidden damage shows as smoke. Late.', W / 2, H - 22);
        }

        function handleKey(e) {
            if (!running) return;
            const k = e.key;
            if (k === ' ' || k === 'Enter' || k === 's' || k === 'S') { pullOver(); e.preventDefault(); }
            else if (k === 'd' || k === 'D' || k === 'x' || k === 'X') { dismissAny(); e.preventDefault(); }
            else if (k >= '1' && k <= '4') { dismissLight(parseInt(k, 10) - 1); e.preventDefault(); }
        }

        function pointerAt(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            const x = (clientX - rect.left) * (W / rect.width);
            const y = (clientY - rect.top) * (H / rect.height);
            if (y < HEADER_H) {
                for (let i = 0; i < LIGHTS.length; i++) {
                    const lx = LIGHT_X0 + i * LIGHT_GAP;
                    if (x >= lx - 4 && x <= lx + LIGHT_W + 4 && y >= LIGHT_Y - 8 && y <= LIGHT_Y + LIGHT_H + 12) {
                        dismissLight(i);
                        return;
                    }
                }
                return;
            }
            pullOver();
        }

        function handleClick(e) {
            if (!running) return;
            pointerAt(e.clientX, e.clientY);
        }

        function handleTouch(e) {
            if (!running) return;
            if (!e.touches.length && !e.changedTouches.length) return;
            const t = e.touches.length ? e.touches[0] : e.changedTouches[0];
            pointerAt(t.clientX, t.clientY);
            e.preventDefault();
        }

        startBtn.addEventListener('click', startGame);
        document.addEventListener('keydown', handleKey);
        canvas.addEventListener('mousedown', handleClick);
        canvas.addEventListener('touchstart', handleTouch, { passive: false });

        drawIdle();
        updateDisplays();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWarning);
    } else {
        initWarning();
    }
})();
