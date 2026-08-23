// road-nobody-offered-game.js - The Lane Nobody Lit
// Three lanes. At every junction the navigation lights two of them SUGGESTED and
// leaves one dark. A lit lane moves you one junction closer. The dark lane costs
// you that progress, but it drops Convergence and buys back Margin.
// The higher Convergence climbs, the more often a lit lane turns out to be CLOSED
// - the route rewritten under you, revealed only at the last moment. Past 70%,
// both lit lanes can close at once, and the only lane left is the one nobody lit.
// Arrive before the daylight runs out, with margin still on the car.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initRoad() {
        const canvas = document.getElementById('roadCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startRoadGame');
        const scoreEl = document.getElementById('roadScore');
        const convEl = document.getElementById('roadConvergence');
        const verdictEl = document.getElementById('roadVerdict');

        if (!canvas || !ctx || !startBtn || !scoreEl || !convEl || !verdictEl) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initRoad, 200);
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = 300;
        const H = 400;
        const HEADER_H = 36;
        const LANES = 3;
        const LANE_W = W / LANES;
        const BAND_H = 30;
        const BAND_GAP = 134;
        const BAND_TOP = HEADER_H - BAND_H;
        const CAR_W = 24;
        const CAR_H = 38;
        const CAR_Y = 316;
        const REVEAL_Y = 200;                   // closed lanes show themselves this late
        const TARGET = 20;                      // junctions to the guesthouse
        const DAY_MS = 84000;                   // how long the daylight lasts

        const C_BG = '#0a0a0a';
        const C_ROAD = '#151515';
        const C_LINE = 'rgba(236, 240, 241, 0.30)';
        const C_VERGE = 'rgba(233, 196, 106, 0.45)';
        const C_LIT = '#f4a261';
        const C_LIT_FILL = 'rgba(244, 162, 97, 0.20)';
        const C_DARK = '#6c7a86';
        const C_DARK_FILL = 'rgba(108, 122, 134, 0.10)';
        const C_CLOSED = '#e63946';
        const C_CLOSED_FILL = 'rgba(230, 57, 70, 0.30)';
        const C_LEAD = '#5f5f5f';
        const C_GOOD = '#2ecc71';
        const C_BLUE = '#457b9d';
        const C_TEXT = '#ecf0f1';

        let running = false;
        let loopId = null;
        let lastTick = 0;
        let elapsed = 0;

        let lane = 1;
        let carX = LANE_W * 1.5;
        let bands = [];
        let covered = 0;
        let offMenu = 0;
        let overrides = 0;
        let convergence = 0;
        let peakConv = 0;
        let margin = 60;
        let daylight = 100;
        let speed = 0.075;
        let dash = 0;

        let lead = { lane: 1, x: LANE_W * 1.5, y: 150, timer: 2400 };
        let tailing = false;

        let shakeTimer = 0;
        let feedbackText = '';
        let feedbackColor = '';
        let feedbackTimer = 0;

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
        function laneCenter(i) { return i * LANE_W + LANE_W / 2; }

        function showFeedback(text, color) {
            feedbackText = text;
            feedbackColor = color;
            feedbackTimer = 1100;
        }

        function trapChance() {
            // The more everyone takes the offered route, the more often it is rewritten.
            return 0.05 + (convergence / 100) * 0.45;
        }

        function spawnBand() {
            // The lane nobody lit is never the lane you are already sitting in.
            // Keeping an option off the menu always costs a deliberate move.
            const candidates = [];
            for (let i = 0; i < LANES; i++) {
                if (i !== lane) candidates.push(i);
            }
            const dark = candidates[Math.floor(Math.random() * candidates.length)];
            const litLanes = [];
            for (let i = 0; i < LANES; i++) {
                if (i !== dark) litLanes.push(i);
            }

            const closed = [];
            if (Math.random() < trapChance()) {
                if (convergence >= 70 && Math.random() < 0.35) {
                    closed.push(litLanes[0]);
                    closed.push(litLanes[1]);
                } else {
                    closed.push(litLanes[Math.floor(Math.random() * litLanes.length)]);
                }
            }

            bands.push({
                y: BAND_TOP,
                dark: dark,
                closed: closed,
                revealed: false,
                resolved: false
            });
        }

        function resolveBand(b) {
            b.resolved = true;

            if (b.closed.indexOf(lane) !== -1) {
                overrides++;
                margin = clamp(margin - 25, 0, 100);
                convergence = clamp(convergence - 8, 0, 100);
                shakeTimer = 620;
                showFeedback('OVERRIDE - rewritten under you', C_CLOSED);
                if (margin <= 0) {
                    endGame('Two systems, one lane, no margin left.', false);
                }
                return;
            }

            if (lane === b.dark) {
                offMenu++;
                convergence = clamp(convergence - 16, 0, 100);
                margin = clamp(margin + 7, 0, 100);
                showFeedback('OFF-MENU - slower, and yours', C_GOOD);
                return;
            }

            covered++;
            convergence = clamp(convergence + 7, 0, 100);
            showFeedback('SUGGESTED - same as everyone', C_LIT);
            if (covered >= TARGET) {
                endGame('You reached the guesthouse before dark.', true);
            }
        }

        function update(dt) {
            elapsed += dt;
            dash += speed * dt;
            if (feedbackTimer > 0) feedbackTimer -= dt;
            if (shakeTimer > 0) shakeTimer -= dt;

            daylight = clamp(daylight - dt * (100 / DAY_MS), 0, 100);
            if (daylight <= 0) {
                endGame('The dark caught you still on the road.', false);
                return;
            }

            convergence = clamp(convergence - dt * 0.0012, 0, 100);
            peakConv = Math.max(peakConv, convergence);
            speed = Math.min(0.13, 0.075 + covered * 0.0026);

            const tx = laneCenter(lane);
            carX += (tx - carX) * Math.min(1, dt / 90);

            lead.timer -= dt;
            if (lead.timer <= 0) {
                lead.timer = 1700 + Math.random() * 2300;
                let nl = lead.lane + (Math.random() < 0.5 ? -1 : 1);
                if (nl < 0 || nl > LANES - 1) nl = 1;
                lead.lane = nl;
            }
            lead.x += (laneCenter(lead.lane) - lead.x) * Math.min(1, dt / 150);
            lead.y = 148 + Math.sin(elapsed / 900) * 16;

            tailing = (lead.lane === lane);
            if (tailing) {
                convergence = clamp(convergence + dt * 0.0075, 0, 100);
            }

            for (let i = 0; i < bands.length; i++) {
                const b = bands[i];
                b.y += speed * dt;
                if (!b.revealed && b.y >= REVEAL_Y) b.revealed = true;
                if (!b.resolved && b.y + BAND_H / 2 >= CAR_Y + CAR_H / 2) {
                    resolveBand(b);
                    if (!running) return;
                }
            }

            bands = bands.filter(function (b) { return b.y < H + 6; });

            if (!bands.length || bands[bands.length - 1].y >= BAND_TOP + BAND_GAP) {
                spawnBand();
            }
        }

        // ---- drawing ----

        function drawRoad(sx) {
            ctx.fillStyle = C_ROAD;
            ctx.fillRect(0, HEADER_H, W, H - HEADER_H);

            ctx.strokeStyle = C_LINE;
            ctx.lineWidth = 2;
            ctx.setLineDash([14, 16]);
            ctx.lineDashOffset = -(dash % 30);
            for (let i = 1; i < LANES; i++) {
                ctx.beginPath();
                ctx.moveTo(i * LANE_W + sx, HEADER_H);
                ctx.lineTo(i * LANE_W + sx, H);
                ctx.stroke();
            }
            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;

            ctx.strokeStyle = C_VERGE;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(2 + sx, HEADER_H);
            ctx.lineTo(2 + sx, H);
            ctx.moveTo(W - 2 + sx, HEADER_H);
            ctx.lineTo(W - 2 + sx, H);
            ctx.stroke();
        }

        function drawBands(sx, sy) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (let i = 0; i < bands.length; i++) {
                const b = bands[i];
                if (b.y + BAND_H < HEADER_H) continue;

                for (let l = 0; l < LANES; l++) {
                    const x = l * LANE_W + 4 + sx;
                    const y = b.y + sy;
                    const w = LANE_W - 8;
                    const isClosed = b.revealed && b.closed.indexOf(l) !== -1;
                    const isDark = (l === b.dark);

                    if (isClosed) {
                        ctx.fillStyle = C_CLOSED_FILL;
                        ctx.fillRect(x, y, w, BAND_H);
                        ctx.strokeStyle = C_CLOSED;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, w, BAND_H);
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + w, y + BAND_H);
                        ctx.moveTo(x + w, y);
                        ctx.lineTo(x, y + BAND_H);
                        ctx.stroke();
                        ctx.fillStyle = C_CLOSED;
                        ctx.font = 'bold 8px Arial';
                        ctx.fillText('CLOSED', x + w / 2, y + BAND_H / 2);
                    } else if (isDark) {
                        ctx.fillStyle = C_DARK_FILL;
                        ctx.fillRect(x, y, w, BAND_H);
                        ctx.strokeStyle = C_DARK;
                        ctx.lineWidth = 1;
                        ctx.setLineDash([3, 3]);
                        ctx.strokeRect(x, y, w, BAND_H);
                        ctx.setLineDash([]);
                        ctx.fillStyle = C_DARK;
                        ctx.font = 'bold 13px Arial';
                        ctx.fillText('?', x + w / 2, y + BAND_H / 2 + 1);
                    } else {
                        const pulse = 0.82 + 0.18 * Math.sin(elapsed / 220 + l);
                        ctx.globalAlpha = pulse;
                        ctx.fillStyle = C_LIT_FILL;
                        ctx.fillRect(x, y, w, BAND_H);
                        ctx.globalAlpha = 1;
                        ctx.strokeStyle = C_LIT;
                        ctx.lineWidth = 1.5;
                        ctx.strokeRect(x, y, w, BAND_H);
                        ctx.fillStyle = C_LIT;
                        ctx.font = 'bold 7px Arial';
                        ctx.fillText('SUGGESTED', x + w / 2, y + BAND_H / 2);
                    }
                }
            }
        }

        function drawLead(sx, sy) {
            const x = lead.x + sx - CAR_W / 2;
            const y = lead.y + sy;
            ctx.globalAlpha = 0.75;
            ctx.fillStyle = C_LEAD;
            ctx.fillRect(x, y, CAR_W, CAR_H);
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(x + 4, y + CAR_H - 14, CAR_W - 8, 9);
            ctx.globalAlpha = 1;
            if (tailing) {
                ctx.fillStyle = C_CLOSED;
                ctx.font = 'bold 8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText('TAILING', lead.x + sx, y - 4);
            }
        }

        function drawCar(sx, sy) {
            const x = carX + sx - CAR_W / 2;
            const y = CAR_Y + sy;
            ctx.fillStyle = '#e63946';
            ctx.fillRect(x, y, CAR_W, CAR_H);
            ctx.fillStyle = C_BLUE;
            ctx.fillRect(x + 4, y + 5, CAR_W - 8, 12);
            ctx.fillStyle = '#f4a261';
            ctx.fillRect(x + 2, y + CAR_H - 4, 5, 3);
            ctx.fillRect(x + CAR_W - 7, y + CAR_H - 4, 5, 3);
        }

        function drawHeader() {
            ctx.fillStyle = 'rgba(13, 13, 13, 0.95)';
            ctx.fillRect(0, 0, W, HEADER_H);
            ctx.strokeStyle = 'rgba(244, 162, 97, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, HEADER_H);
            ctx.lineTo(W, HEADER_H);
            ctx.stroke();

            const barX = 8, barY = 6, barW = W - 16, barH = 7;
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

            ctx.font = 'bold 9px Arial';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = C_TEXT;
            ctx.textAlign = 'left';
            ctx.fillText('COVERED ' + covered + '/' + TARGET, 8, HEADER_H - 10);
            ctx.textAlign = 'center';
            ctx.fillStyle = convergence >= 70 ? C_CLOSED : convergence >= 35 ? C_LIT : C_GOOD;
            ctx.fillText('CONV ' + Math.round(convergence) + '%', W / 2, HEADER_H - 10);
            ctx.textAlign = 'right';
            ctx.fillStyle = margin <= 25 ? C_CLOSED : C_TEXT;
            ctx.fillText('MARGIN ' + Math.round(margin), W - 8, HEADER_H - 10);
        }

        function drawFeedback() {
            if (feedbackTimer > 0 && feedbackText) {
                ctx.globalAlpha = Math.min(1, feedbackTimer / 360);
                ctx.fillStyle = feedbackColor;
                ctx.font = 'bold 11px Arial';
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
                const mag = Math.min(5, shakeTimer / 100);
                sx = Math.sin(elapsed / 21) * mag;
                sy = Math.sin(elapsed / 15) * mag;
            }

            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            drawRoad(sx);
            drawBands(sx, sy);
            drawLead(sx, sy);
            drawCar(sx, sy);
            drawHeader();
            drawFeedback();

            updateDisplays();
            loopId = requestAnimationFrame(drawFrame);
        }

        function updateDisplays() {
            scoreEl.textContent = 'Covered: ' + covered + '/' + TARGET;
            convEl.textContent = 'Convergence: ' + Math.round(convergence) + '%';
            convEl.style.color = convergence >= 70 ? '#e63946' : convergence >= 35 ? '#f4a261' : '#2ecc71';
        }

        function startGame() {
            if (running) return;
            running = true;
            elapsed = 0;
            lane = 1;
            carX = laneCenter(1);
            bands = [];
            covered = 0;
            offMenu = 0;
            overrides = 0;
            convergence = 0;
            peakConv = 0;
            margin = 60;
            daylight = 100;
            speed = 0.075;
            dash = 0;
            lead = { lane: 1, x: laneCenter(1), y: 148, timer: 2400 };
            tailing = false;
            shakeTimer = 0;
            feedbackText = '';
            feedbackTimer = 0;
            lastTick = 0;

            spawnBand();

            verdictEl.textContent = '';
            startBtn.textContent = 'Driving...';
            startBtn.disabled = true;

            loopId = requestAnimationFrame(drawFrame);
        }

        function endGame(reason, won) {
            running = false;
            if (loopId) cancelAnimationFrame(loopId);
            updateDisplays();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(won ? 'YOU ARRIVED' : 'OFF THE ROAD', W / 2, H / 2 - 78);

            ctx.font = '12px Arial';
            ctx.fillStyle = C_LIT;
            ctx.fillText(reason || '', W / 2, H / 2 - 52);

            ctx.fillStyle = C_TEXT;
            ctx.font = '16px Arial';
            ctx.fillText('Covered: ' + covered + '/' + TARGET, W / 2, H / 2 - 20);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Off-menu lanes taken: ' + offMenu, W / 2, H / 2 + 2);
            ctx.fillText('Overrides taken head-on: ' + overrides, W / 2, H / 2 + 20);
            ctx.fillText('Peak convergence: ' + Math.round(peakConv) + '%', W / 2, H / 2 + 38);

            let msg, col;
            if (won) {
                msg = 'You kept a lane they never lit for you.';
                col = C_GOOD;
            } else if (offMenu === 0) {
                msg = 'You only ever took what was offered.';
                col = C_CLOSED;
            } else if (peakConv >= 70) {
                msg = 'You followed until both lanes closed.';
                col = C_LIT;
            } else {
                msg = 'Careful, but the daylight is finite too.';
                col = C_BLUE;
            }
            ctx.fillStyle = col;
            ctx.font = 'bold 12px Arial';
            ctx.fillText(msg, W / 2, H / 2 + 72);

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
            ctx.fillText('The Lane Nobody Lit', W / 2, 52);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Two lanes are offered. One is not.', W / 2, 76);

            const legend = [
                { c: C_LIT, l: 'SUGGESTED', t: '+1 junction, convergence up' },
                { c: C_DARK, l: 'DARK LANE', t: 'no progress, convergence down' },
                { c: C_CLOSED, l: 'CLOSED', t: 'a lit lane, rewritten late' },
                { c: C_LEAD, l: 'LEAD CAR', t: 'tailing it raises convergence' }
            ];
            ctx.textBaseline = 'middle';
            for (let i = 0; i < legend.length; i++) {
                const y = 116 + i * 32;
                const x = W / 2 - 108;
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
            ctx.fillText('Reach 20 junctions before the daylight goes.', W / 2, H - 54);
            ctx.fillText('Arrow keys / A and D change lane.', W / 2, H - 38);
            ctx.fillText('Tap the left or right side on mobile.', W / 2, H - 22);
        }

        function moveLane(dir) {
            if (!running) return;
            lane = clamp(lane + dir, 0, LANES - 1);
        }

        function handleKey(e) {
            if (!running) return;
            const k = e.key;
            if (k === 'ArrowLeft' || k === 'a' || k === 'A') { moveLane(-1); e.preventDefault(); }
            else if (k === 'ArrowRight' || k === 'd' || k === 'D') { moveLane(1); e.preventDefault(); }
        }

        function pointerToSide(clientX) {
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            if (x < rect.width / 2) moveLane(-1);
            else moveLane(1);
        }

        function handleClick(e) {
            if (!running) return;
            pointerToSide(e.clientX);
        }

        function handleTouch(e) {
            if (!running) return;
            if (!e.touches.length && !e.changedTouches.length) return;
            const t = e.touches.length ? e.touches[0] : e.changedTouches[0];
            pointerToSide(t.clientX);
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
        document.addEventListener('DOMContentLoaded', initRoad);
    } else {
        initRoad();
    }
})();
