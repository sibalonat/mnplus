// limitations-give-more-game.js - The Tower You Can Still Stand On
// You stack a tower. Green ANCHOR blocks add one floor and bolt down everything
// beneath them. Red FREEWAY blocks add three floors fast but stay unanchored.
// Exposure rises with FREEWAY and ignored FLAGs; it sets how soon a BREACH hits.
// A BREACH knocks off every floor above your highest ANCHOR. You keep what you
// anchored. Lose when Integrity hits 0; win by anchoring your way to the top.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initTower() {
        const canvas = document.getElementById('limitationsCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startLimitationsGame');
        const scoreEl = document.getElementById('limitationsScore');
        const expoEl = document.getElementById('limitationsExposure');
        const verdictEl = document.getElementById('limitationsVerdict');

        if (!canvas || !ctx || !startBtn || !scoreEl || !expoEl || !verdictEl) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initTower, 200);
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = 300;
        const H = 400;
        const CELL = 18;
        const HEADER_H = 34;                               // top strip for exposure bar + counts
        const MAX_VISIBLE = Math.floor((H - HEADER_H) / CELL);
        const WIN_HEIGHT = 24;                             // anchored floors to "complete" the tower

        const ANCHOR_CD = 620;                             // ms between anchors (slow)
        const FREEWAY_CD = 230;                            // ms between freeways (fast)

        const C_BG = '#0a0a0a';
        const C_GRID = 'rgba(244, 162, 97, 0.05)';
        const C_ANCHOR = '#2a9d8f';
        const C_ANCHOR_EDGE = '#2ecc71';
        const C_FREEWAY = '#c0392b';
        const C_FREEWAY_EDGE = '#e63946';
        const C_FREEWAY_LOCKED = '#7a4a44';                // banked freeway (below an anchor)
        const C_FLAG = '#f4a261';
        const C_BREACH = '#457b9d';
        const C_TEXT = '#ecf0f1';

        let running = false;
        let loopId = null;
        let lastTick = 0;
        let elapsed = 0;

        // tower[0] is the ground floor. Each entry: { type: 'anchor' | 'freeway' }
        let tower = [];
        let highestAnchor = -1;                            // index of topmost anchor, -1 if none
        let bestAnchored = 0;                              // highest anchored height reached

        let exposure = 0;                                  // 0..100
        let integrity = 55;                                // 0..100, lose at 0

        let lastAnchorAt = -9999;
        let lastFreewayAt = -9999;

        let breachTimer = 0;
        let flag = null;                                   // { floor, timer }
        let flagSpawnTimer = 0;

        let shakeTimer = 0;
        let feedbackText = '';
        let feedbackColor = '';
        let feedbackTimer = 0;

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

        function recomputeAnchor() {
            highestAnchor = -1;
            for (let i = tower.length - 1; i >= 0; i--) {
                if (tower[i].type === 'anchor') { highestAnchor = i; break; }
            }
        }

        function anchoredHeight() { return highestAnchor + 1; }

        function showFeedback(text, color) {
            feedbackText = text;
            feedbackColor = color;
            feedbackTimer = 1000;
        }

        function placeAnchor() {
            if (!running) return;
            if (elapsed - lastAnchorAt < ANCHOR_CD) return;
            lastAnchorAt = elapsed;

            tower.push({ type: 'anchor' });
            recomputeAnchor();
            bestAnchored = Math.max(bestAnchored, anchoredHeight());

            exposure = clamp(exposure - 12, 0, 100);
            integrity = clamp(integrity + 5, 0, 100);

            if (flag) {
                integrity = clamp(integrity + 8, 0, 100);
                flag = null;
                showFeedback('FLAG cleared +8', C_FLAG);
            } else {
                showFeedback('ANCHOR — locked', C_ANCHOR_EDGE);
            }

            if (anchoredHeight() >= WIN_HEIGHT) {
                endGame('Anchored to the top. It stands.', true);
            }
        }

        function placeFreeway() {
            if (!running) return;
            if (elapsed - lastFreewayAt < FREEWAY_CD) return;
            lastFreewayAt = elapsed;

            for (let k = 0; k < 3; k++) tower.push({ type: 'freeway' });
            exposure = clamp(exposure + 15, 0, 100);
            showFeedback('FREEWAY +3 — exposed', C_FREEWAY_EDGE);
        }

        function breachIntervalMs() {
            // Higher exposure => breaches come much sooner.
            return Math.max(1900, 6800 - exposure * 44);
        }

        function doBreach() {
            const lost = tower.length - (highestAnchor + 1);
            if (lost > 0) {
                tower.length = highestAnchor + 1;
                const penalty = Math.min(42, lost * 4);
                integrity = clamp(integrity - penalty, 0, 100);
                shakeTimer = 600;
                showFeedback('BREACH: -' + lost + ' floors', C_FREEWAY_EDGE);
            } else {
                // Nothing unanchored. Your limits held.
                integrity = clamp(integrity + 3, 0, 100);
                shakeTimer = 260;
                showFeedback('BREACH held — anchored', C_ANCHOR_EDGE);
            }
            exposure = clamp(exposure - 8, 0, 100);
            if (integrity <= 0) endGame('The breach took it all.', false);
        }

        function maybeSpawnFlag() {
            if (flag || tower.length === 0) return;
            flag = { floor: tower.length - 1, timer: 3600 };
        }

        function update(dt) {
            elapsed += dt;
            breachTimer += dt;
            flagSpawnTimer += dt;
            if (feedbackTimer > 0) feedbackTimer -= dt;
            if (shakeTimer > 0) shakeTimer -= dt;

            // Exposure decays slowly on its own; anchoring is the real relief.
            exposure = clamp(exposure - dt * 0.0016, 0, 100);

            if (breachTimer >= breachIntervalMs()) {
                breachTimer = 0;
                doBreach();
                if (!running) return;
            }

            if (flagSpawnTimer >= 5200) {
                flagSpawnTimer = 0;
                maybeSpawnFlag();
            }

            if (flag) {
                flag.timer -= dt;
                if (flag.timer <= 0) {
                    flag = null;
                    exposure = clamp(exposure + 20, 0, 100);
                    integrity = clamp(integrity - 4, 0, 100);
                    showFeedback('FLAG ignored — exposure up', C_FLAG);
                    if (integrity <= 0) { endGame('Ignored one flag too many.', false); return; }
                }
            }
        }

        // ---- drawing ----

        function cameraCells() {
            return Math.max(0, tower.length - MAX_VISIBLE);
        }

        function cellScreenY(i, cam) {
            // top-left y of block i given camera offset
            const visIndex = i - cam;
            return H - (visIndex + 1) * CELL;
        }

        function drawGrid() {
            ctx.strokeStyle = C_GRID;
            ctx.lineWidth = 1;
            for (let x = 1; x < W / CELL; x++) {
                ctx.beginPath();
                ctx.moveTo(x * CELL, HEADER_H);
                ctx.lineTo(x * CELL, H);
                ctx.stroke();
            }
        }

        function drawTower(shakeX, shakeY) {
            const cam = cameraCells();
            for (let i = cam; i < tower.length; i++) {
                const y = cellScreenY(i, cam) + shakeY;
                if (y + CELL < HEADER_H) continue;
                const x = (W - CELL * 6) / 2 + shakeX;     // tower is 6 cells wide, centered
                const bw = CELL * 6;
                const block = tower[i];
                const safe = i <= highestAnchor;

                if (block.type === 'anchor') {
                    ctx.fillStyle = C_ANCHOR;
                    ctx.fillRect(x + 1, y + 1, bw - 2, CELL - 2);
                    ctx.strokeStyle = C_ANCHOR_EDGE;
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, bw - 2, CELL - 2);
                    // bolt marks
                    ctx.fillStyle = '#0d0d0d';
                    ctx.fillRect(x + 6, y + CELL / 2 - 1.5, 3, 3);
                    ctx.fillRect(x + bw - 9, y + CELL / 2 - 1.5, 3, 3);
                } else {
                    if (safe) {
                        ctx.fillStyle = C_FREEWAY_LOCKED;
                        ctx.fillRect(x + 1, y + 1, bw - 2, CELL - 2);
                        ctx.strokeStyle = C_ANCHOR_EDGE;
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x + 1, y + 1, bw - 2, CELL - 2);
                    } else {
                        const pulse = 0.85 + 0.15 * Math.sin(elapsed / 120 + i);
                        ctx.globalAlpha = pulse;
                        ctx.fillStyle = C_FREEWAY;
                        ctx.fillRect(x + 1, y + 1, bw - 2, CELL - 2);
                        ctx.globalAlpha = 1;
                        ctx.strokeStyle = C_FREEWAY_EDGE;
                        ctx.lineWidth = 1.5;
                        ctx.strokeRect(x + 1, y + 1, bw - 2, CELL - 2);
                    }
                }
            }

            // The breach line: everything above this falls.
            if (highestAnchor >= cam) {
                const ly = cellScreenY(highestAnchor, cam) + shakeY;
                ctx.strokeStyle = 'rgba(69, 123, 157, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                ctx.moveTo(0, ly);
                ctx.lineTo(W, ly);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#7fb2cc';
                ctx.font = '8px Arial';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                ctx.fillText('anchored line', 3, ly - 1);
            }

            // Flag marker on the current top.
            if (flag) {
                const fi = tower.length - 1;
                if (fi >= cam) {
                    const fy = cellScreenY(fi, cam) + shakeY;
                    const fx = (W - CELL * 6) / 2 + shakeX + CELL * 6 + 3;
                    const blink = 0.5 + 0.5 * Math.sin(elapsed / 120);
                    ctx.globalAlpha = 0.5 + 0.5 * blink;
                    ctx.fillStyle = C_FLAG;
                    ctx.beginPath();
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(fx + 12, fy + 5);
                    ctx.lineTo(fx, fy + 10);
                    ctx.closePath();
                    ctx.fill();
                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = C_FLAG;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(fx, fy + CELL);
                    ctx.stroke();
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

            // Exposure bar
            const barX = 8, barY = 6, barW = W - 16, barH = 8;
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(barX, barY, barW, barH);
            const ex = exposure / 100;
            const r = Math.round(46 + ex * 184);
            const g = Math.round(204 - ex * 150);
            const b = Math.round(113 - ex * 50);
            ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            ctx.fillRect(barX, barY, barW * ex, barH);
            ctx.strokeStyle = 'rgba(244,162,97,0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('KEPT ' + anchoredHeight(), 8, HEADER_H - 9);
            ctx.textAlign = 'center';
            ctx.fillText('BUILT ' + tower.length, W / 2, HEADER_H - 9);
            ctx.textAlign = 'right';
            ctx.fillStyle = integrity <= 20 ? C_FREEWAY_EDGE : C_TEXT;
            ctx.fillText('INTEGRITY ' + Math.round(integrity), W - 8, HEADER_H - 9);
        }

        function drawFeedback() {
            if (feedbackTimer > 0 && feedbackText) {
                ctx.globalAlpha = Math.min(1, feedbackTimer / 350);
                ctx.fillStyle = feedbackColor;
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(feedbackText, W / 2, H - 10);
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
                const mag = Math.min(5, shakeTimer / 90);
                shakeX = (Math.sin(elapsed / 23) ) * mag;
                shakeY = (Math.sin(elapsed / 17) ) * mag;
            }

            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            drawGrid();
            drawTower(shakeX, shakeY);
            drawHeader();
            drawFeedback();

            updateDisplays();
            loopId = requestAnimationFrame(drawFrame);
        }

        function updateDisplays() {
            scoreEl.textContent = 'Anchored: ' + anchoredHeight();
            expoEl.textContent = 'Exposure: ' + Math.round(exposure) + '%';
            expoEl.style.color = exposure >= 66 ? '#e63946' : exposure >= 33 ? '#f4a261' : '#2ecc71';
        }

        function startGame() {
            if (running) return;
            running = true;
            elapsed = 0;
            tower = [{ type: 'anchor' }];                  // start on solid ground
            recomputeAnchor();
            bestAnchored = anchoredHeight();
            exposure = 0;
            integrity = 55;
            lastAnchorAt = -9999;
            lastFreewayAt = -9999;
            breachTimer = 0;
            flag = null;
            flagSpawnTimer = 0;
            shakeTimer = 0;
            feedbackText = '';
            feedbackTimer = 0;
            lastTick = 0;

            verdictEl.textContent = '';
            startBtn.textContent = 'Building...';
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
            ctx.fillText(won ? 'IT STANDS' : 'COLLAPSE', W / 2, H / 2 - 78);

            ctx.font = '13px Arial';
            ctx.fillStyle = '#f4a261';
            ctx.fillText(reason || '', W / 2, H / 2 - 50);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = '16px Arial';
            ctx.fillText('Anchored: ' + anchoredHeight(), W / 2, H / 2 - 18);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Built ' + tower.length + ' floors total', W / 2, H / 2 + 4);
            ctx.fillText('Best anchored height: ' + bestAnchored, W / 2, H / 2 + 22);
            ctx.fillText('Survived ' + Math.floor(elapsed / 1000) + 's', W / 2, H / 2 + 40);

            const a = bestAnchored;
            let msg, col;
            if (won || a >= 18) {
                msg = 'You built slow and it still stands.';
                col = '#2ecc71';
            } else if (a >= 8) {
                msg = 'Tall, then shorter, then tall again.';
                col = '#f4a261';
            } else {
                msg = 'You chased the free height. The shake took it.';
                col = '#e63946';
            }
            ctx.fillStyle = col;
            ctx.font = 'bold 13px Arial';
            ctx.fillText(msg, W / 2, H / 2 + 74);

            verdictEl.textContent = reason || '';
            startBtn.textContent = 'Rebuild';
            startBtn.disabled = false;
        }

        function drawIdle() {
            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('The Tower You Can Still Stand On', W / 2, 54);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Stack it. Anchor it. Survive the breach.', W / 2, 80);

            const legend = [
                { c: C_ANCHOR, e: C_ANCHOR_EDGE, l: 'ANCHOR', t: '+1 floor, slow, locks below' },
                { c: C_FREEWAY, e: C_FREEWAY_EDGE, l: 'FREEWAY', t: '+3 floors, fast, exposed' },
                { c: C_FLAG, e: C_FLAG, l: 'FLAG', t: 'clear with an anchor in time' },
                { c: C_BREACH, e: C_BREACH, l: 'BREACH', t: 'drops all unanchored floors' }
            ];
            ctx.textBaseline = 'middle';
            for (let i = 0; i < legend.length; i++) {
                const y = 120 + i * 32;
                const x = W / 2 - 110;
                ctx.fillStyle = legend[i].c;
                ctx.fillRect(x, y - 9, 18, 18);
                ctx.strokeStyle = legend[i].e;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x, y - 9, 18, 18);

                ctx.fillStyle = '#ecf0f1';
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
            ctx.fillText('← / A anchor   •   → / D freeway', W / 2, H - 40);
            ctx.fillText('Tap left or right on mobile.', W / 2, H - 24);
        }

        function handleKey(e) {
            if (!running) return;
            const k = e.key;
            if (k === 'ArrowLeft' || k === 'a' || k === 'A') { placeAnchor(); e.preventDefault(); }
            else if (k === 'ArrowRight' || k === 'd' || k === 'D') { placeFreeway(); e.preventDefault(); }
        }

        function pointerToSide(clientX) {
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            if (x < rect.width / 2) placeAnchor();
            else placeFreeway();
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
        document.addEventListener('DOMContentLoaded', initTower);
    } else {
        initTower();
    }
})();
