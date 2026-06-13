// remember-forget-game.js - Make Room
// Facts arrive one at a time. HOLD the ones you think you'll be asked to recall;
// LET GO of the rest. Memory has only a few distinct slots, and what you hold
// fades on its own. Recalls fire on a timer: hold the asked symbol and you score
// and free the slot; miss it and integrity drops. Hold a full memory and the new
// fact overflows the oldest. Win by recalling enough before integrity hits 0 —
// remember long enough, forget fast enough to make room for the next thing.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initRecall() {
        const canvas = document.getElementById('recallCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startRecallGame');
        const scoreEl = document.getElementById('recallScore');
        const loadEl = document.getElementById('recallLoad');
        const verdictEl = document.getElementById('recallVerdict');

        if (!canvas || !ctx || !startBtn || !scoreEl || !loadEl || !verdictEl) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initRecall, 200);
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = 300;
        const H = 400;
        const HEADER_H = 40;
        const CAP = 4;                                     // distinct symbols you can hold
        const TARGET = 15;                                 // recalls to "win"
        const DECISION_MS = 2400;                          // time to decide on the incoming fact
        const FADE_MS = 9000;                              // how long a held memory lasts untouched

        const SYMS = ['●', '▲', '■', '◆', '★', '✚'];
        const SYM_COL = ['#e63946', '#2ecc71', '#457b9d', '#f4a261', '#9b5de5', '#e9c46a'];

        const C_BG = '#0a0a0a';
        const C_TEXT = '#ecf0f1';
        const C_ACCENT = '#f4a261';
        const C_GREEN = '#2ecc71';
        const C_RED = '#e63946';

        let running = false;
        let loopId = null;
        let lastTick = 0;
        let elapsed = 0;

        let memory = [];                                   // [{ idx, fade, age }]
        let incoming = null;                               // { idx, timer }
        let recalled = 0;
        let integrity = 50;
        let activeCount = 5;                               // symbols in play (<= SYMS.length)

        let recallTimer = 0;
        let recall = null;                                 // { idx, flash }

        let feedbackText = '';
        let feedbackColor = '';
        let feedbackTimer = 0;
        let shakeTimer = 0;

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

        function showFeedback(text, color) {
            feedbackText = text;
            feedbackColor = color;
            feedbackTimer = 1100;
        }

        function spawnIncoming() {
            incoming = { idx: Math.floor(Math.random() * activeCount), timer: DECISION_MS };
        }

        function holdIncoming() {
            if (!running || !incoming) return;
            const idx = incoming.idx;
            const existing = memory.find(function (m) { return m.idx === idx; });
            if (existing) {
                existing.fade = 1; existing.age = 0;       // rehearse -> refresh
                showFeedback('rehearsed ' + SYMS[idx], C_ACCENT);
            } else if (memory.length >= CAP) {
                // overflow: drop the oldest to make room, then add
                let oldest = 0;
                for (let i = 1; i < memory.length; i++) {
                    if (memory[i].age > memory[oldest].age) oldest = i;
                }
                const dropped = memory[oldest].idx;
                memory.splice(oldest, 1);
                memory.push({ idx: idx, fade: 1, age: 0 });
                integrity = clamp(integrity - 6, 0, 100);
                shakeTimer = 280;
                showFeedback('OVERFLOW — dropped ' + SYMS[dropped], C_RED);
                if (integrity <= 0) { endGame('No room left to keep anything.', false); return; }
            } else {
                memory.push({ idx: idx, fade: 1, age: 0 });
                showFeedback('held ' + SYMS[idx], C_GREEN);
            }
            spawnIncoming();
        }

        function letGoIncoming() {
            if (!running || !incoming) return;
            spawnIncoming();
        }

        function fireRecall() {
            recall = { idx: Math.floor(Math.random() * activeCount), flash: 700 };
            const slot = memory.findIndex(function (m) { return m.idx === recall.idx; });
            if (slot >= 0) {
                memory.splice(slot, 1);                    // served its purpose, frees room
                recalled++;
                integrity = clamp(integrity + 4, 0, 100);
                showFeedback('RECALLED ' + SYMS[recall.idx] + ' ✓', C_GREEN);
                if ((recalled % 5) === 0 && activeCount < SYMS.length) activeCount++;
                if (recalled >= TARGET) { endGame('You kept what mattered.', true); return; }
            } else {
                integrity = clamp(integrity - 7, 0, 100);
                shakeTimer = 360;
                showFeedback('needed ' + SYMS[recall.idx] + ' — gone', C_RED);
                if (integrity <= 0) { endGame('Asked for what you let slip.', false); return; }
            }
        }

        function recallInterval() {
            // Recalls come a little faster the deeper you get.
            return Math.max(1800, 3200 - recalled * 70);
        }

        function update(dt) {
            elapsed += dt;
            if (feedbackTimer > 0) feedbackTimer -= dt;
            if (shakeTimer > 0) shakeTimer -= dt;
            if (recall) { recall.flash -= dt; if (recall.flash <= 0) recall = null; }

            // Incoming fact slips by if you don't decide in time.
            if (incoming) {
                incoming.timer -= dt;
                if (incoming.timer <= 0) {
                    showFeedback('slipped by', '#888');
                    spawnIncoming();
                }
            }

            // Recall cadence.
            recallTimer += dt;
            if (recallTimer >= recallInterval()) {
                recallTimer = 0;
                fireRecall();
                if (!running) return;
            }

            // Natural fade: held memories forget themselves over time.
            for (let i = memory.length - 1; i >= 0; i--) {
                memory[i].age += dt;
                memory[i].fade -= dt / FADE_MS;
                if (memory[i].fade <= 0) memory.splice(i, 1);
            }
        }

        // ---- drawing ----

        function drawGlyph(idx, cx, cy, size, alpha) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = SYM_COL[idx];
            ctx.font = 'bold ' + size + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(SYMS[idx], cx, cy);
            ctx.globalAlpha = 1;
        }

        function drawRecall() {
            const y = 70;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (recall) {
                const a = 0.5 + 0.5 * Math.sin(elapsed / 90);
                ctx.fillStyle = 'rgba(244, 162, 97, ' + (0.16 + 0.12 * a).toFixed(3) + ')';
                ctx.fillRect(20, y - 18, W - 40, 36);
                ctx.strokeStyle = C_ACCENT;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(20, y - 18, W - 40, 36);
                ctx.fillStyle = C_ACCENT;
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText('RECALL', W / 2 + 6, y);
                drawGlyph(recall.idx, W / 2 + 34, y, 22, 1);
            } else {
                ctx.fillStyle = '#666';
                ctx.font = '10px Arial';
                ctx.fillText('next recall coming…', W / 2, y);
            }
        }

        function drawIncoming() {
            const cy = 152;
            const bs = 58;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#888';
            ctx.font = '9px Arial';
            ctx.fillText('INCOMING', W / 2, cy - 44);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.fillRect(W / 2 - bs / 2, cy - bs / 2, bs, bs);
            ctx.strokeStyle = 'rgba(244, 162, 97, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(W / 2 - bs / 2, cy - bs / 2, bs, bs);

            if (incoming) {
                drawGlyph(incoming.idx, W / 2, cy, 30, 1);
                const t = clamp(incoming.timer / DECISION_MS, 0, 1);
                const bx = W / 2 - bs / 2, by = cy + bs / 2 + 6, bw = bs;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(bx, by, bw, 4);
                ctx.fillStyle = t < 0.3 ? C_RED : C_ACCENT;
                ctx.fillRect(bx, by, bw * t, 4);
            }

            ctx.font = '8px Arial';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = C_RED;
            ctx.textAlign = 'left';
            ctx.fillText('◀ LET GO', 10, cy);
            ctx.fillStyle = C_GREEN;
            ctx.textAlign = 'right';
            ctx.fillText('HOLD ▶', W - 10, cy);
        }

        function drawShelf(shakeX, shakeY) {
            const slotW = 46, gap = 6;
            const total = CAP * slotW + (CAP - 1) * gap;
            const startX = (W - total) / 2 + shakeX;
            const y = 296 + shakeY;

            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#888';
            ctx.font = '9px Arial';
            ctx.fillText('MEMORY', W / 2 + shakeX, y - 10);

            for (let i = 0; i < CAP; i++) {
                const x = startX + i * (slotW + gap);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.fillRect(x, y, slotW, 46);
                ctx.strokeStyle = 'rgba(244, 162, 97, 0.2)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, slotW, 46);

                const item = memory[i];
                if (item) {
                    const a = clamp(0.25 + item.fade * 0.75, 0, 1);
                    drawGlyph(item.idx, x + slotW / 2, y + 22, 26, a);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
                    ctx.fillRect(x + 6, y + 40, slotW - 12, 3);
                    ctx.fillStyle = item.fade < 0.3 ? C_RED : 'rgba(46, 204, 113, 0.7)';
                    ctx.fillRect(x + 6, y + 40, (slotW - 12) * clamp(item.fade, 0, 1), 3);
                }
            }
        }

        function drawHeader() {
            ctx.fillStyle = 'rgba(13, 13, 13, 0.95)';
            ctx.fillRect(0, 0, W, HEADER_H);
            ctx.strokeStyle = 'rgba(244, 162, 97, 0.3)';
            ctx.beginPath();
            ctx.moveTo(0, HEADER_H);
            ctx.lineTo(W, HEADER_H);
            ctx.stroke();

            const barX = 8, barY = 6, barW = W - 16, barH = 7;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(barX, barY, barW, barH);
            const load = memory.length / CAP;
            ctx.fillStyle = load >= 1 ? C_RED : load >= 0.75 ? C_ACCENT : C_GREEN;
            ctx.fillRect(barX, barY, barW * Math.min(1, load), barH);
            ctx.strokeStyle = 'rgba(244, 162, 97, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);

            ctx.font = 'bold 9px Arial';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = C_TEXT;
            ctx.textAlign = 'left';
            ctx.fillText('RECALLED ' + recalled + '/' + TARGET, 8, HEADER_H - 11);
            ctx.textAlign = 'center';
            ctx.fillText('HELD ' + memory.length + '/' + CAP, W / 2, HEADER_H - 11);
            ctx.textAlign = 'right';
            ctx.fillStyle = integrity <= 20 ? C_RED : C_TEXT;
            ctx.fillText('INTEGRITY ' + Math.round(integrity), W - 8, HEADER_H - 11);
        }

        function drawFeedback() {
            if (feedbackTimer > 0 && feedbackText) {
                ctx.globalAlpha = Math.min(1, feedbackTimer / 350);
                ctx.fillStyle = feedbackColor;
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(feedbackText, W / 2, H - 12);
                ctx.globalAlpha = 1;
            }
        }

        function drawFrame(timestamp) {
            const dt = lastTick ? Math.min(60, timestamp - lastTick) : 16.67;
            lastTick = timestamp;

            if (!running) return;

            update(dt);
            if (!running) return;

            let shakeX = 0, shakeY = 0;
            if (shakeTimer > 0) {
                const mag = Math.min(4, shakeTimer / 90);
                shakeX = Math.sin(elapsed / 23) * mag;
                shakeY = Math.sin(elapsed / 17) * mag;
            }

            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            drawRecall();
            drawIncoming();
            drawShelf(shakeX, shakeY);
            drawHeader();
            drawFeedback();

            updateDisplays();
            loopId = requestAnimationFrame(drawFrame);
        }

        function updateDisplays() {
            scoreEl.textContent = 'Recalled: ' + recalled;
            const load = Math.round(memory.length / CAP * 100);
            loadEl.textContent = 'Load: ' + load + '%';
            loadEl.style.color = load >= 100 ? '#e63946' : load >= 75 ? '#f4a261' : '#2ecc71';
        }

        function startGame() {
            if (running) return;
            running = true;
            elapsed = 0;
            memory = [];
            incoming = null;
            recalled = 0;
            integrity = 50;
            activeCount = 5;
            recallTimer = 0;
            recall = null;
            feedbackText = '';
            feedbackTimer = 0;
            shakeTimer = 0;
            lastTick = 0;
            spawnIncoming();

            verdictEl.textContent = '';
            startBtn.textContent = 'Remembering...';
            startBtn.disabled = true;

            loopId = requestAnimationFrame(drawFrame);
        }

        function endGame(reason, won) {
            running = false;
            if (loopId) cancelAnimationFrame(loopId);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(won ? 'IT HELD' : 'BLANK', W / 2, H / 2 - 70);

            ctx.font = '13px Arial';
            ctx.fillStyle = C_ACCENT;
            ctx.fillText(reason || '', W / 2, H / 2 - 44);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = '16px Arial';
            ctx.fillText('Recalled ' + recalled + '/' + TARGET, W / 2, H / 2 - 12);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Survived ' + Math.floor(elapsed / 1000) + 's', W / 2, H / 2 + 10);

            let msg, col;
            if (won) {
                msg = 'You held a few, let the rest go.';
                col = '#2ecc71';
            } else if (recalled >= 8) {
                msg = 'Close. Room for a little more forgetting.';
                col = '#f4a261';
            } else {
                msg = 'You held too much, or too little.';
                col = '#e63946';
            }
            ctx.fillStyle = col;
            ctx.font = 'bold 13px Arial';
            ctx.fillText(msg, W / 2, H / 2 + 44);

            verdictEl.textContent = reason || '';
            startBtn.textContent = 'Again';
            startBtn.disabled = false;
        }

        function drawIdle() {
            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('Make Room', W / 2, 50);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText("Hold what you'll be asked. Let the rest go.", W / 2, 74);

            const legend = [
                { c: C_GREEN, l: 'HOLD', t: 'store a symbol (→ / D / tap right)' },
                { c: C_RED, l: 'LET GO', t: 'discard it (← / A / tap left)' },
                { c: C_ACCENT, l: 'RECALL', t: 'asked for a symbol — hold it to score' },
                { c: '#888', l: 'FADE', t: 'held memories slip away on their own' }
            ];
            ctx.textBaseline = 'middle';
            for (let i = 0; i < legend.length; i++) {
                const y = 112 + i * 34;
                const x = W / 2 - 118;
                ctx.fillStyle = legend[i].c;
                ctx.fillRect(x, y - 8, 16, 16);
                ctx.fillStyle = '#ecf0f1';
                ctx.font = 'bold 9px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(legend[i].l, x + 24, y - 3);
                ctx.fillStyle = '#bbb';
                ctx.font = '10px Arial';
                ctx.fillText(legend[i].t, x + 24, y + 8);
            }

            ctx.fillStyle = '#888';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("Only " + CAP + " slots. You can't keep everything.", W / 2, H - 40);
            ctx.fillText('Recall ' + TARGET + ' to win.', W / 2, H - 24);
        }

        function handleKey(e) {
            if (!running) return;
            const k = e.key;
            if (k === 'ArrowLeft' || k === 'a' || k === 'A') { letGoIncoming(); e.preventDefault(); }
            else if (k === 'ArrowRight' || k === 'd' || k === 'D') { holdIncoming(); e.preventDefault(); }
        }

        function pointerToSide(clientX) {
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            if (x < rect.width / 2) letGoIncoming();
            else holdIncoming();
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
        document.addEventListener('DOMContentLoaded', initRecall);
    } else {
        initRecall();
    }
})();
