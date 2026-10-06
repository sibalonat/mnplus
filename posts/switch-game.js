// switch-game.js - One Row at a Time
// A single sheet with five systems on it, one per row. You are the green box
// around one row - the way a cell is selected. On the row where you stand you
// read the number live, and the switch is right there. Every other row gives
// you only a light, and the further the row is from you, the older the light.
// Some readings climb and come back on their own: noise. Some climb slowly,
// then faster, and pass the threshold: an incident. You can walk to a row, or
// send a request to switch it off from far - slower, one at a time, and
// decided on a light you already know is old. When the shift is over, the
// game tells you how far away you were standing.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initSwitch() {
        const canvas = document.getElementById('switchCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startSwitchGame');
        const scoreEl = document.getElementById('switchScore');
        const incEl = document.getElementById('switchIncidents');
        const verdictEl = document.getElementById('switchVerdict');

        if (!canvas || !ctx || !startBtn || !scoreEl || !incEl || !verdictEl) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initSwitch, 200);
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = 300;
        const H = 400;
        const COLS_Y = 42;
        const ROW_Y0 = 58;
        const ROW_H = 52;
        const GUTTER_W = 16;
        const NAME_X = 22;
        const LIGHT_X = 108;
        const BAR_X = 124;
        const BAR_W = 98;
        const SW_X = 230;
        const SW_W = 62;
        const SW_H = 28;
        const NEAR = 0.35;                      // close enough to read the number

        const SHIFT_MS = 80000;
        const WALK_MS = 320;                    // one row, on foot
        const LAG_PER_ROW = 900;                // how much older a light gets per row of distance
        const REQUEST_MS = 1800;                // a request has to be approved
        const RESTART_MS = 4500;                // a system you switched off comes back
        const DOWN_MS = 9000;                   // a system that had an incident comes back later
        const MAX_INCIDENTS = 3;
        const AMBER_AT = 55;
        const RED_AT = 80;
        const THRESHOLD = 100;

        // The rows of the sheet.
        const NAMES = ['MAIL', 'PAYROLL', 'VENDORS', 'BACKUPS', 'THE AGENT'];
        const ROWS = NAMES.length;

        const C_BG = '#0a0a0a';
        const C_GRID = '#232323';
        const C_GRID_HEAD = '#151515';
        const C_SHEET = '#21a366';
        const C_SHEET_FILL = 'rgba(33, 163, 102, 0.35)';
        const C_LIT = '#f4a261';
        const C_LIT_FILL = 'rgba(244, 162, 97, 0.28)';
        const C_DARK = '#6c7a86';
        const C_RED = '#e63946';
        const C_GOOD = '#2ecc71';
        const C_BLUE = '#457b9d';
        const C_BLUE_TEXT = '#7fb3d0';
        const C_BLUE_FILL = 'rgba(69, 123, 157, 0.45)';
        const C_TEXT = '#ecf0f1';

        let running = false;
        let loopId = null;
        let lastTick = 0;
        let elapsed = 0;

        let machines = [];
        let cursorPos = 2;                      // where you are, between rows while you walk
        let targetRow = 2;                      // where you are going
        let pendingOff = false;                 // you pressed the switch on the way there
        let request = null;                     // { row, t } - one at a time
        let nextEventIn = 0;
        let eventsSpawned = 0;

        let output = 0;
        let incidents = 0;
        let incidentDist = 0;
        let caughtHand = 0;
        let caughtRequest = 0;
        let nothingHand = 0;
        let nothingRequest = 0;
        let lateRequests = 0;
        let realSeen = 0;

        let shakeTimer = 0;
        let feedbackText = '';
        let feedbackColor = '';
        let feedbackTimer = 0;

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
        function rand(a, b) { return a + Math.random() * (b - a); }
        function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
        function times(n) { return n + (n === 1 ? ' time' : ' times'); }
        function rowsWord(n) { return n + (n === 1 ? ' row' : ' rows'); }

        function showFeedback(text, color) {
            feedbackText = text;
            feedbackColor = color;
            feedbackTimer = 1900;
        }

        function newMachine(i) {
            const m = { name: NAMES[i], base: rand(16, 28), phase: rand(0, 6.28), value: 0, state: 'run', timer: 0, ev: null, hist: [] };
            m.value = baseline(m);
            resetHist(m);
            return m;
        }

        function baseline(m) { return m.base + 4 * Math.sin(elapsed / 1300 + m.phase); }

        function resetHist(m) { m.hist = [{ t: elapsed, v: m.value }]; }

        // what the light showed some time ago
        function laggedValue(m, lag) {
            const at = elapsed - lag;
            for (let i = m.hist.length - 1; i >= 0; i--) {
                if (m.hist[i].t <= at) return m.hist[i].v;
            }
            return m.hist.length ? m.hist[0].v : m.value;
        }

        function lightColor(v) { return v >= RED_AT ? C_RED : v >= AMBER_AT ? C_LIT : C_GOOD; }

        // what you can only tell when you stand on the row
        function trend(m) {
            if (!m.ev) return { text: 'steady', color: C_DARK };
            if (m.ev.real) return { text: 'rising, faster', color: C_RED };
            if (m.ev.t / m.ev.T < 0.5) return { text: 'rising, slowing', color: C_LIT };
            return { text: 'falling', color: C_GOOD };
        }

        function spawnEvent() {
            const progress = clamp(elapsed / SHIFT_MS, 0, 1);
            const free = [];
            let active = 0;
            for (let i = 0; i < ROWS; i++) {
                if (machines[i].ev) active++;
                else if (machines[i].state === 'run') free.push(i);
            }
            if (!free.length || active >= (progress < 0.3 ? 2 : 3)) return;

            const m = machines[pick(free)];
            // the first one is real and slow, so you see what real looks like
            const real = eventsSpawned === 0 ? true : Math.random() < 0.4;
            if (real) {
                const T = eventsSpawned === 0 ? 11000 : (9500 - 2700 * progress) * rand(0.9, 1.1);
                m.ev = { real: true, t: 0, T: T };
                realSeen++;
            } else {
                m.ev = { real: false, t: 0, T: rand(5500, 8500), peak: rand(60, 93) };
            }
            eventsSpawned++;
        }

        function incident(i) {
            const m = machines[i];
            const dist = Math.abs(i - cursorPos);
            incidents++;
            incidentDist += dist;
            m.state = 'down';
            m.timer = DOWN_MS;
            m.ev = null;
            m.value = THRESHOLD;
            resetHist(m);
            shakeTimer = 400;
            const r = Math.round(dist);
            showFeedback('INCIDENT - ' + m.name + ' passed 100. ' + (r === 0 ? 'You were standing on it.' : 'You were ' + rowsWord(r) + ' away.'), C_RED);
        }

        function switchOff(i, how) {
            const m = machines[i];
            const real = !!(m.ev && m.ev.real);
            const was = real ? 'It was real.' : m.ev ? 'It was only noise.' : 'It was fine.';
            m.state = 'off';
            m.timer = RESTART_MS;
            m.ev = null;
            m.value = 0;
            resetHist(m);
            if (how === 'hand') {
                if (real) caughtHand++; else nothingHand++;
                if (request && request.row === i) request = null;
                showFeedback(m.name + ' switched off by hand. ' + was, real ? C_GOOD : C_LIT);
            } else {
                if (real) caughtRequest++; else nothingRequest++;
                showFeedback('The request for ' + m.name + ' went through. ' + was, real ? C_GOOD : C_LIT);
            }
        }

        function notRunning(m) {
            showFeedback(m.state === 'off' ? m.name + ' is already off.' : m.name + ' is down. Too late for the switch.', C_DARK);
        }

        function switchByHand(i) {
            const m = machines[i];
            if (m.state !== 'run') { notRunning(m); return; }
            switchOff(i, 'hand');
        }

        function requestOff(i) {
            const m = machines[i];
            if (m.state !== 'run') { notRunning(m); return; }
            if (request) {
                showFeedback('One request at a time. ' + machines[request.row].name + ' is still waiting.', C_BLUE_TEXT);
                return;
            }
            request = { row: i, t: REQUEST_MS };
            showFeedback('Request sent for ' + m.name + '. Waiting for approval.', C_BLUE_TEXT);
        }

        function finishRequest() {
            const i = request.row;
            const m = machines[i];
            request = null;
            if (m.state === 'run') {
                switchOff(i, 'request');
            } else if (m.state === 'down') {
                lateRequests++;
                showFeedback('The request for ' + m.name + ' arrived after the incident.', C_RED);
            }
        }

        // the switch of the row you stand on is a switch; any other is a request
        function pressSwitch(i) {
            if (i !== targetRow) { requestOff(i); return; }
            if (cursorPos === targetRow) switchByHand(i);
            else pendingOff = true;             // you are on your way, it happens when you arrive
        }

        function walk(d) {
            targetRow = clamp(targetRow + d, 0, ROWS - 1);
            pendingOff = false;
        }

        function walkTo(i) {
            targetRow = i;
            pendingOff = false;
        }

        function update(dt) {
            elapsed += dt;
            if (feedbackTimer > 0) feedbackTimer -= dt;
            if (shakeTimer > 0) shakeTimer -= dt;

            // you walk, one row at a time
            if (cursorPos !== targetRow) {
                const step = dt / WALK_MS;
                cursorPos = cursorPos < targetRow ? Math.min(targetRow, cursorPos + step) : Math.max(targetRow, cursorPos - step);
            }
            if (pendingOff && cursorPos === targetRow) {
                pendingOff = false;
                switchByHand(targetRow);
            }

            // things start, more often as the shift goes on
            nextEventIn -= dt;
            if (nextEventIn <= 0) {
                spawnEvent();
                const progress = clamp(elapsed / SHIFT_MS, 0, 1);
                nextEventIn = (3000 - 1500 * progress) * rand(0.75, 1.25);
            }

            let up = 0;
            for (let i = 0; i < ROWS; i++) {
                const m = machines[i];
                if (m.state !== 'run') {
                    m.timer -= dt;
                    if (m.timer <= 0) {
                        m.state = 'run';
                        m.base = rand(16, 28);
                        m.value = baseline(m);
                        resetHist(m);
                    }
                    continue;
                }
                up++;
                const b = baseline(m);
                if (m.ev) {
                    m.ev.t += dt;
                    const p = m.ev.t / m.ev.T;
                    if (m.ev.real) {
                        // slowly at first, then faster, and it does not come back
                        m.value = b + (THRESHOLD - b) * Math.pow(Math.min(1, p), 1.7);
                        if (p >= 1) { incident(i); continue; }
                    } else if (p >= 1) {
                        m.ev = null;
                        m.value = b;
                    } else {
                        // fast at first, then slowing, and back down on its own
                        m.value = b + Math.max(0, m.ev.peak - b) * Math.sin(Math.PI * p);
                    }
                } else {
                    m.value = b;
                }
                const last = m.hist[m.hist.length - 1];
                if (!last || elapsed - last.t >= 60) m.hist.push({ t: elapsed, v: m.value });
                while (m.hist.length > 2 && m.hist[1].t < elapsed - 5000) m.hist.shift();
            }
            output += up * dt / 1000;

            if (request) {
                request.t -= dt;
                if (request.t <= 0) finishRequest();
            }

            if (incidents >= MAX_INCIDENTS) {
                endGame(false);
                return;
            }
            if (elapsed >= SHIFT_MS) {
                endGame(true);
            }
        }

        function fitText(text, maxW, size) {
            let s = size;
            ctx.font = s + 'px Arial';
            while (ctx.measureText(text).width > maxW && s > 6) {
                s -= 0.5;
                ctx.font = s + 'px Arial';
            }
        }

        function wrapLines(text, maxW) {
            const words = text.split(' ');
            const lines = [];
            let line = '';
            for (let i = 0; i < words.length; i++) {
                const test = line ? line + ' ' + words[i] : words[i];
                if (line && ctx.measureText(test).width > maxW) {
                    lines.push(line);
                    line = words[i];
                } else {
                    line = test;
                }
            }
            if (line) lines.push(line);
            return lines;
        }

        function drawHeader() {
            const frac = clamp(elapsed / SHIFT_MS, 0, 1);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(8, 6, W - 16, 4);
            ctx.fillStyle = C_SHEET;
            ctx.fillRect(8, 6, (W - 16) * frac, 4);

            const s = Math.ceil(Math.max(0, SHIFT_MS - elapsed) / 1000);
            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('Shift: ' + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60) + ' left', 8, 28);

            let up = 0;
            for (let i = 0; i < ROWS; i++) if (machines[i].state === 'run') up++;
            ctx.textAlign = 'right';
            ctx.fillStyle = up === ROWS ? C_GOOD : up >= 3 ? C_LIT : C_RED;
            ctx.fillText('Running: ' + up + '/' + ROWS, W - 8, 28);
        }

        function drawRows(sx, sy) {
            ctx.save();
            ctx.translate(sx, sy);
            ctx.textBaseline = 'middle';

            // the column titles, like the first row of any sheet
            ctx.fillStyle = C_GRID_HEAD;
            ctx.fillRect(0, COLS_Y, W, ROW_Y0 - COLS_Y);
            const ty = COLS_Y + (ROW_Y0 - COLS_Y) / 2;
            ctx.fillStyle = '#888';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('SYSTEM', NAME_X, ty);
            ctx.fillText('READING', BAR_X, ty);
            ctx.textAlign = 'center';
            ctx.fillText('LIGHT', LIGHT_X, ty);
            ctx.fillText('SWITCH', SW_X + SW_W / 2, ty);

            for (let i = 0; i < ROWS; i++) {
                const m = machines[i];
                const y = ROW_Y0 + i * ROW_H;
                const dist = Math.abs(i - cursorPos);
                const near = dist < NEAR;
                const lag = dist * LAG_PER_ROW;

                // the gutter with the row number
                ctx.fillStyle = Math.round(cursorPos) === i ? C_SHEET_FILL : C_GRID_HEAD;
                ctx.fillRect(0, y, GUTTER_W, ROW_H);
                ctx.fillStyle = Math.round(cursorPos) === i ? C_TEXT : '#777';
                ctx.font = '9px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(String(i + 1), GUTTER_W / 2, y + ROW_H / 2);
                ctx.strokeStyle = C_GRID;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, y + ROW_H + 0.5);
                ctx.lineTo(W, y + ROW_H + 0.5);
                ctx.stroke();

                // the name, and how old what you see is
                ctx.textAlign = 'left';
                ctx.fillStyle = m.state === 'run' ? C_TEXT : C_DARK;
                ctx.font = 'bold 10px Arial';
                ctx.fillText(m.name, NAME_X, y + 19);
                ctx.font = '8.5px Arial';
                if (m.state === 'off') {
                    ctx.fillStyle = C_DARK;
                    ctx.fillText('back in ' + Math.ceil(m.timer / 1000) + ' s', NAME_X, y + 35);
                } else if (m.state === 'down') {
                    ctx.fillStyle = C_RED;
                    ctx.fillText('down, ' + Math.ceil(m.timer / 1000) + ' s', NAME_X, y + 35);
                } else if (near) {
                    ctx.fillStyle = C_SHEET;
                    ctx.fillText('live', NAME_X, y + 35);
                } else {
                    ctx.fillStyle = C_DARK;
                    ctx.fillText('light: ' + (lag / 1000).toFixed(1) + ' s old', NAME_X, y + 35);
                }

                // the light - all you get from far
                let lc = C_DARK;
                if (m.state === 'down') lc = C_RED;
                else if (m.state === 'run') lc = lightColor(near ? m.value : laggedValue(m, lag));
                ctx.fillStyle = lc;
                ctx.globalAlpha = m.state === 'off' ? 0.3 : lc === C_GOOD ? 0.85 : 0.65 + 0.35 * Math.sin(elapsed / 120);
                ctx.beginPath();
                ctx.arc(LIGHT_X, y + ROW_H / 2, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.strokeStyle = lc;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // the reading - only where you stand
                if (m.state === 'off') {
                    ctx.fillStyle = C_DARK;
                    ctx.font = '9px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('switched off', BAR_X + BAR_W / 2, y + ROW_H / 2);
                } else if (m.state === 'down') {
                    ctx.fillStyle = C_RED;
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('INCIDENT', BAR_X + BAR_W / 2, y + ROW_H / 2);
                } else if (near) {
                    const by = y + 12;
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(BAR_X, by, BAR_W, 11);
                    ctx.fillStyle = lightColor(m.value);
                    ctx.fillRect(BAR_X, by, BAR_W * clamp(m.value / THRESHOLD, 0, 1), 11);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                    ctx.fillRect(BAR_X + BAR_W * AMBER_AT / THRESHOLD, by - 2, 1, 15);
                    ctx.fillRect(BAR_X + BAR_W * RED_AT / THRESHOLD, by - 2, 1, 15);

                    ctx.fillStyle = C_TEXT;
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText(String(Math.round(m.value)), BAR_X, y + 38);
                    const tr = trend(m);
                    ctx.fillStyle = tr.color;
                    ctx.font = '9px Arial';
                    ctx.fillText(tr.text, BAR_X + 26, y + 38);
                } else {
                    ctx.fillStyle = '#3f464c';
                    ctx.font = 'italic 9px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('too far to read', BAR_X + BAR_W / 2, y + ROW_H / 2);
                }

                // the switch - a switch where you stand, a request anywhere else
                const by2 = y + (ROW_H - SW_H) / 2;
                let label = 'REQUEST';
                let col = C_BLUE;
                let textCol = C_BLUE_TEXT;
                let fill = null;
                if (m.state === 'off') {
                    label = 'OFF'; col = C_DARK; textCol = C_DARK;
                } else if (m.state === 'down') {
                    label = 'DOWN'; col = C_RED; textCol = C_RED;
                } else if (i === targetRow) {
                    label = 'SWITCH OFF'; col = C_LIT; textCol = C_LIT;
                    fill = cursorPos === targetRow ? C_LIT_FILL : null;
                } else if (request && request.row === i) {
                    label = 'APPROVAL...';
                }
                if (fill) {
                    ctx.fillStyle = fill;
                    ctx.fillRect(SW_X, by2, SW_W, SW_H);
                }
                if (request && request.row === i && m.state === 'run') {
                    ctx.fillStyle = C_BLUE_FILL;
                    ctx.fillRect(SW_X, by2, SW_W * clamp(1 - request.t / REQUEST_MS, 0, 1), SW_H);
                }
                ctx.strokeStyle = col;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(SW_X, by2, SW_W, SW_H);
                ctx.fillStyle = textCol;
                ctx.font = 'bold 8.5px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(label, SW_X + SW_W / 2, y + ROW_H / 2);
            }

            // you: the box around one row, the way a cell is selected
            const cy = ROW_Y0 + cursorPos * ROW_H;
            ctx.strokeStyle = C_SHEET;
            ctx.lineWidth = 2;
            ctx.strokeRect(GUTTER_W + 1, cy + 1, W - GUTTER_W - 3, ROW_H - 2);
            ctx.fillStyle = C_SHEET;
            ctx.fillRect(W - 7, cy + ROW_H - 6, 6, 6);

            ctx.restore();
        }

        function drawFooter() {
            const y0 = ROW_Y0 + ROWS * ROW_H;
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
            ctx.font = '9.5px Arial';
            if (request) {
                ctx.fillStyle = C_BLUE_TEXT;
                ctx.fillText('Request for ' + machines[request.row].name + ': approval in ' + (Math.max(0, request.t) / 1000).toFixed(1) + ' s', 8, y0 + 18);
            } else {
                ctx.fillStyle = '#555';
                ctx.fillText('No request waiting.', 8, y0 + 18);
            }
            ctx.fillStyle = '#aaa';
            ctx.fillText('By hand: ' + (caughtHand + nothingHand) + '   By request: ' + (caughtRequest + nothingRequest) + '   For nothing: ' + (nothingHand + nothingRequest), 8, y0 + 36);
            ctx.fillStyle = '#555';
            ctx.font = '8.5px Arial';
            ctx.fillText('Every row between you and a light makes the light older.', 8, y0 + 52);
        }

        function drawFeedback() {
            if (feedbackTimer > 0 && feedbackText) {
                ctx.globalAlpha = Math.min(1, feedbackTimer / 360);
                ctx.fillStyle = feedbackColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                fitText(feedbackText, W - 12, 9.5);
                ctx.font = 'bold ' + ctx.font;
                ctx.fillText(feedbackText, W / 2, H - 6);
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
                const mag = Math.min(3, shakeTimer / 100);
                sx = Math.sin(elapsed / 21) * mag;
                sy = Math.sin(elapsed / 15) * mag;
            }

            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            drawRows(sx, sy);
            drawHeader();
            drawFooter();
            drawFeedback();

            updateDisplays();
            loopId = requestAnimationFrame(drawFrame);
        }

        function updateDisplays() {
            scoreEl.textContent = 'Output: ' + Math.floor(output);
            incEl.textContent = 'Incidents: ' + incidents + '/' + MAX_INCIDENTS;
            incEl.style.color = incidents >= 2 ? '#e63946' : incidents >= 1 ? '#f4a261' : '#e9c46a';
        }

        function startGame() {
            if (running) return;
            running = true;
            elapsed = 0;
            machines = [];
            for (let i = 0; i < ROWS; i++) machines.push(newMachine(i));
            cursorPos = 2;
            targetRow = 2;
            pendingOff = false;
            request = null;
            nextEventIn = 2200;
            eventsSpawned = 0;
            output = 0;
            incidents = 0;
            incidentDist = 0;
            caughtHand = 0;
            caughtRequest = 0;
            nothingHand = 0;
            nothingRequest = 0;
            lateRequests = 0;
            realSeen = 0;
            shakeTimer = 0;
            feedbackText = '';
            feedbackTimer = 0;
            lastTick = 0;

            verdictEl.textContent = '';
            startBtn.textContent = 'On shift...';
            startBtn.disabled = true;

            loopId = requestAnimationFrame(drawFrame);
        }

        // what the game says about where you were standing
        function writeVerdict(won) {
            const caught = caughtHand + caughtRequest;
            const nothing = nothingHand + nothingRequest;
            const byRequest = caughtRequest + nothingRequest + lateRequests;
            if (!won) {
                const avg = incidents ? incidentDist / incidents : 0;
                if (avg < 0.5) return { label: 'RIGHT THERE', msg: 'Three incidents, and you were standing next to them. The switch was one press away.' };
                return { label: 'TOO FAR', msg: 'Three incidents. On average you were ' + avg.toFixed(1) + ' rows away when it happened.' };
            }
            if (nothing >= 4 && nothing > caught) return { label: 'NOTHING RAN', msg: 'Not much broke, and not much ran. You switched off ' + nothing + ' systems that were fine.' };
            if (byRequest > caughtHand + nothingHand) {
                return { label: 'BY REQUEST', msg: 'Most of your switching went by request' + (lateRequests ? ', and ' + lateRequests + ' arrived after the incident.' : ', decided on a light that was already old.') };
            }
            if (incidents === 0) return { label: 'CLOSE ENOUGH', msg: 'No incidents. You were standing next to it ' + times(caughtHand) + ' out of ' + realSeen + '.' };
            return { label: 'ALMOST', msg: 'You were close enough ' + times(caughtHand) + ' out of ' + realSeen + '. The rest happened behind your back.' };
        }

        function endGame(won) {
            running = false;
            request = null;
            if (loopId) cancelAnimationFrame(loopId);
            updateDisplays();

            const verdict = writeVerdict(won);
            const best = Math.round(ROWS * Math.min(elapsed, SHIFT_MS) / 1000);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(won ? 'THE SHIFT IS OVER' : 'THREE INCIDENTS', W / 2, 96);

            ctx.font = '16px Arial';
            ctx.fillText('Output: ' + Math.floor(output) + ' of ' + best, W / 2, 128);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('By hand: ' + caughtHand + ' real, ' + nothingHand + ' for nothing', W / 2, 156);
            ctx.fillText('By request: ' + caughtRequest + ' real, ' + nothingRequest + ' for nothing, ' + lateRequests + ' too late', W / 2, 174);
            ctx.fillText('Incidents: ' + incidents + (incidents ? ', on average ' + (incidentDist / incidents).toFixed(1) + ' rows from you' : ''), W / 2, 192);

            // the cell the game fills in for you
            const good = verdict.label === 'CLOSE ENOUGH';
            const col = good ? C_SHEET : won ? C_LIT : C_RED;
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.strokeRect(W / 2 - 60, 212, 120, 26);
            ctx.fillStyle = col;
            ctx.fillRect(W / 2 + 55, 233, 6, 6);
            ctx.font = 'bold 11px Arial';
            ctx.textBaseline = 'middle';
            ctx.fillText(verdict.label, W / 2, 225);
            ctx.textBaseline = 'alphabetic';

            ctx.font = 'bold 11px Arial';
            const lines = wrapLines(verdict.msg, W - 28);
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], W / 2, 264 + i * 16);
            }

            verdictEl.textContent = verdict.msg;
            startBtn.textContent = 'Another Shift';
            startBtn.disabled = false;
        }

        function drawIdle() {
            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 17px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('One Row at a Time', W / 2, 52);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Five systems on one sheet. You stand on one row.', W / 2, 76);

            const legend = [
                { c: C_SHEET, l: 'THE ROW YOU STAND ON', t: 'the live number, and the switch is right there' },
                { c: C_LIT, l: 'A LIGHT ON ANOTHER ROW', t: 'the further the row, the older the light' },
                { c: C_BLUE, l: 'A REQUEST', t: 'switch off from far: slow, one at a time, blind' },
                { c: C_RED, l: 'THE THRESHOLD', t: 'a reading that passes 100 is an incident' }
            ];
            ctx.textBaseline = 'middle';
            for (let i = 0; i < legend.length; i++) {
                const y = 112 + i * 32;
                const x = W / 2 - 126;
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
                ctx.font = '9.5px Arial';
                ctx.fillText(legend[i].t, x + 26, y + 7);
            }

            // a small sheet, so you know what you are looking at
            const lights = [C_GOOD, C_LIT, C_GOOD, C_RED, C_GOOD];
            const mx = W / 2 - 60, my = 238, mh = 13;
            for (let i = 0; i < ROWS; i++) {
                const y = my + i * mh;
                ctx.fillStyle = C_GRID_HEAD;
                ctx.fillRect(mx, y, 10, mh);
                ctx.strokeStyle = C_GRID;
                ctx.lineWidth = 1;
                ctx.strokeRect(mx + 0.5, y + 0.5, 120, mh);
                ctx.fillStyle = '#444';
                ctx.fillRect(mx + 16, y + 5, 34, 3);
                ctx.fillStyle = lights[i];
                ctx.beginPath();
                ctx.arc(mx + 64, y + mh / 2, 3.5, 0, Math.PI * 2);
                ctx.fill();
                if (i === 2) {
                    ctx.fillStyle = C_GOOD;
                    ctx.fillRect(mx + 76, y + 4, 18, 5);
                }
            }
            ctx.strokeStyle = C_SHEET;
            ctx.lineWidth = 2;
            ctx.strokeRect(mx + 11, my + 2 * mh + 1, 109, mh - 1);
            ctx.fillStyle = C_SHEET;
            ctx.fillRect(mx + 117, my + 3 * mh - 3, 5, 5);

            ctx.fillStyle = '#888';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('W / S, or tap a row, to walk to it.', W / 2, H - 70);
            ctx.fillText('SPACE, or tap its switch, to switch it off at once.', W / 2, H - 54);
            ctx.fillText('1-5, or tap a far switch, to send a request.', W / 2, H - 38);
            ctx.fillText('Three incidents end the shift.', W / 2, H - 22);
        }

        function handleKey(e) {
            if (!running) return;
            const k = e.key;
            if (k >= '1' && k <= '5') { pressSwitch(parseInt(k, 10) - 1); e.preventDefault(); }
            else if (k === 'w' || k === 'W' || k === 'ArrowUp') { walk(-1); e.preventDefault(); }
            else if (k === 's' || k === 'S' || k === 'ArrowDown') { walk(1); e.preventDefault(); }
            else if (k === ' ' || k === 'Enter') { pressSwitch(targetRow); e.preventDefault(); }
        }

        function pointerAt(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            const x = (clientX - rect.left) * (W / rect.width);
            const y = (clientY - rect.top) * (H / rect.height);

            if (y < ROW_Y0 || y >= ROW_Y0 + ROWS * ROW_H) return;
            const i = clamp(Math.floor((y - ROW_Y0) / ROW_H), 0, ROWS - 1);
            if (x >= SW_X - 6) pressSwitch(i);
            else walkTo(i);
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
        document.addEventListener('DOMContentLoaded', initSwitch);
    } else {
        initSwitch();
    }
})();
