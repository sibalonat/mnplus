// explain-the-machine-game.js - Explain the Machine
// You are the loan officer from chapter three. The black box has already
// decided every application; the applicant in front of you wants a why.
// The only way to hand them one is to have seen the pattern yourself:
// before the box stamps, you call its verdict. Three features are labeled
// and learnable — but a fourth pattern only the model sees fires on a
// quarter of cases, and twice per game the model RETRAINS overnight and
// the rule you learned quietly dies. Match the box and a why is given.
// Get surprised and the applicant leaves with nothing. Give 15 whys
// before the gap hits 6 — you can get good at this, never perfect.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initWhy() {
        const canvas = document.getElementById('whyCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startWhyGame');
        const scoreEl = document.getElementById('whyScore');
        const gapEl = document.getElementById('whyGap');
        const verdictEl = document.getElementById('whyVerdict');

        if (!canvas || !ctx || !startBtn || !scoreEl || !gapEl || !verdictEl) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initWhy, 200);
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = 300;
        const H = 400;
        const HEADER_H = 40;
        const BTN_H = 42;

        const TARGET = 15;                                 // whys to give to win
        const GAP_MAX = 6;                                 // surprises before you lose
        const HIDDEN_P = 0.25;                             // how often the unseen pattern fires
        const HIDDEN_MAG = 0.32;
        const REVEAL_MS = 900;
        const RETRAIN_MS = 1300;
        const RETRAIN_AT = [8, 16];                        // cases where the model retrains

        const C_BG = '#0a0a0a';
        const C_ACCENT = '#f4a261';
        const C_GREEN = '#2ecc71';
        const C_RED = '#e63946';
        const C_BLUE = '#457b9d';
        const C_TEXT = '#ecf0f1';

        // the model's weights — the part you never get to read
        const WEIGHT_SETS = [
            { wi: 0.50, wh: 0.40, wd: 0.50, th: 0.20 },    // income matters most
            { wi: 0.10, wh: 0.70, wd: 0.40, th: 0.20 },    // suddenly it is all history
            { wi: 0.60, wh: 0.15, wd: 0.55, th: 0.10 }     // now history barely counts
        ];

        let running = false;
        let loopId = null;
        let lastTick = 0;
        let elapsed = 0;

        let whys = 0;                                      // matched calls — explanations given
        let gap = 0;                                       // surprises — no why to give
        let caseNo = 0;
        let retrains = 0;
        let weights = WEIGHT_SETS[0];

        let card = null;                                   // { no, income, history, debt, hidden, approve }
        let timer = 0;                                     // ms left to make the call
        let timerMax = 0;
        let phase = 'call';                                // 'call' | 'reveal' | 'retrain'
        let phaseTimer = 0;
        let lastCall = null;                               // player's call during reveal
        let lastMatch = false;

        let shakeTimer = 0;
        let celebrateTimer = 0;
        let feedbackText = '';
        let feedbackColor = '';
        let feedbackTimer = 0;

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

        function showFeedback(text, color) {
            feedbackText = text;
            feedbackColor = color;
            feedbackTimer = 1300;
        }

        function callWindow() {
            return Math.max(4200, 7000 - whys * 150);
        }

        // deterministic shimmer for the hidden-feature glyphs
        function jitter(seed) {
            const x = Math.sin(seed * 127.1) * 43758.5453;
            return x - Math.floor(x);
        }

        function makeCard() {
            caseNo++;
            const income = Math.random();
            const history = Math.random();
            const debt = Math.random();
            const hidden = Math.random() < HIDDEN_P
                ? (Math.random() < 0.5 ? -1 : 1) * HIDDEN_MAG
                : 0;
            const score = weights.wi * income + weights.wh * history - weights.wd * debt + hidden;
            return {
                no: caseNo,
                income: income,
                history: history,
                debt: debt,
                hidden: hidden,
                approve: score > weights.th
            };
        }

        function nextCard() {
            if (RETRAIN_AT.indexOf(caseNo + 1) !== -1) {
                retrains++;
                weights = WEIGHT_SETS[Math.min(retrains, WEIGHT_SETS.length - 1)];
                phase = 'retrain';
                phaseTimer = RETRAIN_MS;
                return;
            }
            card = makeCard();
            timerMax = callWindow();
            timer = timerMax;
            phase = 'call';
            lastCall = null;
        }

        function resolveCall(call) {
            if (phase !== 'call' || !card) return;
            lastCall = call;
            lastMatch = call !== null && call === card.approve;
            phase = 'reveal';
            phaseTimer = REVEAL_MS;

            if (lastMatch) {
                whys++;
                celebrateTimer = 450;
                showFeedback('Matched — you had a why to give.', C_GREEN);
            } else {
                gap++;
                shakeTimer = 420;
                showFeedback(call === null
                    ? 'Too slow — they left without a why.'
                    : 'Surprised — no why to give.', C_RED);
            }
        }

        function update(dt) {
            elapsed += dt;
            if (feedbackTimer > 0) feedbackTimer -= dt;
            if (shakeTimer > 0) shakeTimer -= dt;
            if (celebrateTimer > 0) celebrateTimer -= dt;

            if (phase === 'call') {
                timer -= dt;
                if (timer <= 0) resolveCall(null);          // silence counts against you
            } else if (phase === 'reveal') {
                phaseTimer -= dt;
                if (phaseTimer <= 0) {
                    if (gap >= GAP_MAX) {
                        endGame('The box stayed accurate. Your explanations did not.', false);
                        return;
                    }
                    if (whys >= TARGET) {
                        endGame('Fifteen applicants left knowing why.', true);
                        return;
                    }
                    nextCard();
                }
            } else if (phase === 'retrain') {
                phaseTimer -= dt;
                if (phaseTimer <= 0) {
                    card = makeCard();
                    timerMax = callWindow();
                    timer = timerMax;
                    phase = 'call';
                    lastCall = null;
                    showFeedback('New weights. Your old pattern is gone.', C_ACCENT);
                }
            }
        }

        function drawHeader() {
            ctx.fillStyle = 'rgba(244, 162, 97, 0.08)';
            ctx.fillRect(0, 0, W, HEADER_H);
            ctx.strokeStyle = 'rgba(244, 162, 97, 0.3)';
            ctx.beginPath();
            ctx.moveTo(0, HEADER_H + 0.5);
            ctx.lineTo(W, HEADER_H + 0.5);
            ctx.stroke();

            ctx.fillStyle = C_ACCENT;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('LOAN OFFICE', 10, 14);

            ctx.fillStyle = C_TEXT;
            ctx.font = '10px Arial';
            ctx.fillText('whys ' + whys + '/' + TARGET, 10, 29);

            // gap dots — surprises you could not explain
            ctx.textAlign = 'right';
            ctx.fillStyle = gap >= GAP_MAX - 1 ? C_RED : '#aaa';
            ctx.fillText('gap', W - 10, 14);
            for (let i = 0; i < GAP_MAX; i++) {
                const x = W - 12 - i * 13;
                ctx.beginPath();
                ctx.arc(x, 29, 4, 0, Math.PI * 2);
                if (i < gap) {
                    ctx.fillStyle = C_RED;
                    ctx.fill();
                } else {
                    ctx.strokeStyle = '#444';
                    ctx.stroke();
                }
            }
        }

        function drawBar(x, y, w, label, value, color) {
            ctx.fillStyle = '#999';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, y + 4);
            ctx.fillStyle = '#262626';
            ctx.fillRect(x + 52, y, w - 52, 9);
            ctx.fillStyle = color;
            ctx.fillRect(x + 52, y, (w - 52) * value, 9);
        }

        function drawCard(shakeX, shakeY) {
            const top = 58 + shakeY;
            const cw = 224;
            const chH = 190;
            const x = W / 2 - cw / 2 + shakeX;

            if (!card || phase === 'retrain') return;

            // paper
            ctx.fillStyle = '#161616';
            ctx.strokeStyle = phase === 'reveal'
                ? (lastMatch ? C_GREEN : C_RED)
                : '#3a3a3a';
            ctx.beginPath();
            ctx.rect(x, top, cw, chH);
            ctx.fill();
            ctx.stroke();

            // applicant
            ctx.beginPath();
            ctx.arc(x + 24, top + 24, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#2b2b2b';
            ctx.fill();
            ctx.strokeStyle = '#666';
            ctx.stroke();
            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('APPLICANT #' + card.no, x + 42, top + 20);
            ctx.fillStyle = '#888';
            ctx.font = '9px Arial';
            ctx.fillText('asks: will I get the loan — and why?', x + 42, top + 32);

            // labeled features — the pattern you are allowed to learn
            drawBar(x + 14, top + 52, cw - 28, 'INCOME', card.income, 'rgba(46, 204, 113, 0.75)');
            drawBar(x + 14, top + 70, cw - 28, 'HISTORY', card.history, 'rgba(69, 123, 157, 0.9)');
            drawBar(x + 14, top + 88, cw - 28, 'DEBT', card.debt, 'rgba(230, 57, 70, 0.75)');

            // the pattern only the model sees
            ctx.fillStyle = '#999';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('???', x + 14, top + 110);
            for (let i = 0; i < 12; i++) {
                const gx = x + 66 + i * 13;
                const shimmer = jitter(card.no * 31 + i + Math.floor(elapsed / 240));
                ctx.fillStyle = 'rgba(155, 130, 200, ' + (0.12 + shimmer * 0.4) + ')';
                ctx.fillRect(gx, top + 104 + shimmer * 5, 9, 6);
            }
            ctx.fillStyle = '#666';
            ctx.font = 'italic 8px Arial';
            ctx.fillText('the pattern only the model sees', x + 14, top + 126);

            if (phase === 'call') {
                // your call, before the stamp
                ctx.fillStyle = C_ACCENT;
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('What will the box say?', x + cw / 2, top + 152);

                // the call window shrinking
                const tw = cw - 28;
                ctx.fillStyle = '#262626';
                ctx.fillRect(x + 14, top + 166, tw, 7);
                const frac = clamp(timer / timerMax, 0, 1);
                ctx.fillStyle = frac < 0.3 ? C_RED : C_ACCENT;
                ctx.fillRect(x + 14, top + 166, tw * frac, 7);
            } else if (phase === 'reveal') {
                // the stamp lands
                const stampCol = card.approve ? C_GREEN : C_RED;
                ctx.save();
                ctx.translate(x + cw / 2, top + 156);
                ctx.rotate(-0.06);
                ctx.strokeStyle = stampCol;
                ctx.lineWidth = 2;
                ctx.strokeRect(-60, -13, 120, 26);
                ctx.fillStyle = stampCol;
                ctx.font = 'bold 15px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(card.approve ? 'APPROVE' : 'REJECT', 0, 1);
                ctx.restore();
                ctx.lineWidth = 1;

                ctx.fillStyle = lastMatch ? C_GREEN : C_RED;
                ctx.font = 'bold 9px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(lastMatch ? 'why given' : 'no why to give', x + cw / 2, top + 178);
            }
        }

        function drawRetrain() {
            if (phase !== 'retrain') return;
            const flash = 0.5 + Math.sin(elapsed / 90) * 0.3;
            ctx.fillStyle = 'rgba(155, 130, 200, 0.10)';
            ctx.fillRect(0, HEADER_H, W, H - HEADER_H - BTN_H);
            ctx.globalAlpha = flash;
            ctx.fillStyle = '#b9a5e8';
            ctx.font = 'bold 15px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('THE MODEL RETRAINED', W / 2, H / 2 - 30);
            ctx.fillText('OVERNIGHT', W / 2, H / 2 - 10);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#aaa';
            ctx.font = '10px Arial';
            ctx.fillText('someone clicked the mouse', W / 2, H / 2 + 16);
            ctx.fillText('the accuracy is fine — your pattern is not', W / 2, H / 2 + 32);
        }

        function drawButtons() {
            const y = H - BTN_H;
            const busy = phase !== 'call';

            // REJECT — left
            ctx.globalAlpha = busy ? 0.35 : 1;
            ctx.fillStyle = 'rgba(230, 57, 70, 0.16)';
            ctx.fillRect(0, y, W / 2 - 1, BTN_H);
            ctx.fillStyle = C_RED;
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('IT WILL REJECT', W / 4, y + BTN_H / 2 - 6);
            ctx.fillStyle = '#c88';
            ctx.font = '8px Arial';
            ctx.fillText('tap / R', W / 4, y + BTN_H / 2 + 11);

            // APPROVE — right
            ctx.fillStyle = 'rgba(46, 204, 113, 0.14)';
            ctx.fillRect(W / 2 + 1, y, W / 2 - 1, BTN_H);
            ctx.fillStyle = C_GREEN;
            ctx.font = 'bold 13px Arial';
            ctx.fillText('IT WILL APPROVE', W * 3 / 4, y + BTN_H / 2 - 6);
            ctx.fillStyle = '#8c9';
            ctx.font = '8px Arial';
            ctx.fillText('tap / A', W * 3 / 4, y + BTN_H / 2 + 11);
            ctx.globalAlpha = 1;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(W, y + 0.5);
            ctx.moveTo(W / 2 + 0.5, y);
            ctx.lineTo(W / 2 + 0.5, H);
            ctx.stroke();
        }

        function drawCelebrate() {
            if (celebrateTimer <= 0) return;
            ctx.globalAlpha = Math.min(0.85, celebrateTimer / 500);
            ctx.fillStyle = 'rgba(46, 204, 113, 0.12)';
            ctx.fillRect(0, HEADER_H, W, H - HEADER_H - BTN_H);
            ctx.globalAlpha = 1;
        }

        function drawFeedback() {
            if (feedbackTimer > 0 && feedbackText) {
                ctx.globalAlpha = Math.min(1, feedbackTimer / 350);
                ctx.fillStyle = feedbackColor;
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(feedbackText, W / 2, H - BTN_H - 10);
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
                shakeX = Math.sin(elapsed / 23) * mag;
                shakeY = Math.sin(elapsed / 17) * mag;
            }

            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            drawCelebrate();
            drawCard(shakeX, shakeY);
            drawRetrain();
            drawHeader();
            drawButtons();
            drawFeedback();

            updateDisplays();
            loopId = requestAnimationFrame(drawFrame);
        }

        function updateDisplays() {
            scoreEl.textContent = 'Whys: ' + whys + '/' + TARGET;
            gapEl.textContent = 'Gap: ' + gap + '/' + GAP_MAX;
            gapEl.style.color = gap >= GAP_MAX - 1 ? '#e63946' : gap >= GAP_MAX - 3 ? '#f4a261' : '#2ecc71';
        }

        function startGame() {
            if (running) return;
            running = true;
            elapsed = 0;
            whys = 0;
            gap = 0;
            caseNo = 0;
            retrains = 0;
            weights = WEIGHT_SETS[0];
            card = makeCard();
            timerMax = callWindow();
            timer = timerMax;
            phase = 'call';
            lastCall = null;
            shakeTimer = 0;
            celebrateTimer = 0;
            feedbackText = '';
            feedbackTimer = 0;
            lastTick = 0;

            verdictEl.textContent = '';
            startBtn.textContent = 'Explaining...';
            startBtn.disabled = true;

            loopId = requestAnimationFrame(drawFrame);
        }

        function endGame(reason, won) {
            running = false;
            if (loopId) cancelAnimationFrame(loopId);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 19px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(won ? 'THE WHYS HELD' : 'NOBODY CAN TELL YOU WHY', W / 2, H / 2 - 78);

            ctx.font = '13px Arial';
            ctx.fillStyle = C_ACCENT;
            ctx.fillText(reason || '', W / 2, H / 2 - 50);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = '16px Arial';
            ctx.fillText('Whys given: ' + whys + '/' + TARGET, W / 2, H / 2 - 18);

            const calls = whys + gap;
            const acc = calls > 0 ? Math.round((whys / calls) * 100) : 0;
            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Surprises: ' + gap, W / 2, H / 2 + 4);
            ctx.fillText('Your accuracy: ' + acc + '%', W / 2, H / 2 + 22);
            ctx.fillText('Retrains survived: ' + retrains, W / 2, H / 2 + 40);

            let msg, col;
            if (won && gap <= 1) {
                msg = 'You read the box like a book. This edition.';
                col = '#2ecc71';
            } else if (won) {
                msg = 'A good pattern — the box never promised to keep it.';
                col = '#f4a261';
            } else if (retrains > 0) {
                msg = 'The click of a mouse cost you the pattern.';
                col = '#e63946';
            } else {
                msg = 'Accuracy was never the part it owed you.';
                col = '#e63946';
            }
            ctx.fillStyle = col;
            ctx.font = 'bold 13px Arial';
            ctx.fillText(msg, W / 2, H / 2 + 74);

            verdictEl.textContent = reason || '';
            startBtn.textContent = 'Again';
            startBtn.disabled = false;
        }

        function drawIdle() {
            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 17px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('Explain the Machine', W / 2, 52);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('The box decides. The applicant asks you why.', W / 2, 76);

            const legend = [
                { c: C_GREEN, l: 'CALL IT', t: 'predict the stamp before it lands' },
                { c: C_ACCENT, l: 'WHY', t: 'a match means you had an explanation' },
                { c: C_RED, l: 'GAP', t: 'a surprise leaves the applicant with nothing' },
                { c: '#b9a5e8', l: 'RETRAIN', t: 'overnight, a click — your pattern dies' }
            ];
            ctx.textBaseline = 'middle';
            for (let i = 0; i < legend.length; i++) {
                const y = 116 + i * 32;
                const x = W / 2 - 122;
                ctx.beginPath();
                ctx.arc(x + 8, y, 8, 0, Math.PI * 2);
                ctx.fillStyle = legend[i].c;
                ctx.fill();

                ctx.fillStyle = '#ecf0f1';
                ctx.font = 'bold 9px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(legend[i].l, x + 24, y - 4);
                ctx.fillStyle = '#bbb';
                ctx.font = '9px Arial';
                ctx.fillText(legend[i].t, x + 24, y + 7);
            }

            ctx.fillStyle = '#888';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Three labeled features — and one only the model sees.', W / 2, H - 42);
            ctx.fillText('Give ' + TARGET + ' whys before the gap hits ' + GAP_MAX + '.', W / 2, H - 26);
        }

        function canvasPoint(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            const x = (clientX - rect.left) * (canvas.width / rect.width);
            const y = (clientY - rect.top) * (canvas.height / rect.height);
            return { x: x, y: y };
        }

        function handlePoint(clientX, clientY) {
            if (!running) return;
            const p = canvasPoint(clientX, clientY);

            if (p.y >= H - BTN_H) {
                resolveCall(p.x >= W / 2);
            }
        }

        function handleKey(e) {
            if (!running) return;
            const k = e.key;
            if (k === 'a' || k === 'A') { resolveCall(true); e.preventDefault(); }
            if (k === 'r' || k === 'R') { resolveCall(false); e.preventDefault(); }
        }

        function handleClick(e) {
            if (!running) return;
            handlePoint(e.clientX, e.clientY);
        }

        function handleTouch(e) {
            if (!running) return;
            if (!e.touches.length && !e.changedTouches.length) return;
            const t = e.touches.length ? e.touches[0] : e.changedTouches[0];
            handlePoint(t.clientX, t.clientY);
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
        document.addEventListener('DOMContentLoaded', initWhy);
    } else {
        initWhy();
    }
})();
