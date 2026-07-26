// raise-the-machine-game.js - Raise the Machine
// The agent proposes one change at a time — a copy, it claims, from one
// structure to another. You never get to read the words, only the signals:
// DIFF, TESTS, STORY — and a face. TRUST accepts the proposal; ENFORCE
// forces it back to the convention. Trust a hallucination and the
// structure breaks. Enforce a genuine improvement and you get the tantrum.
// Both count the same: the two of you misreading each other. And twice
// per game THE ROLES FLIP — the faces stop meaning what they meant, and
// the protocol you learned belongs to the other side of the table.
// Reach 15 understandings before 5 misreadings. The signals do not wait.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initRaise() {
        const canvas = document.getElementById('raiseCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startRaiseGame');
        const scoreEl = document.getElementById('raiseScore');
        const misreadEl = document.getElementById('raiseMisread');
        const verdictEl = document.getElementById('raiseVerdict');

        if (!canvas || !ctx || !startBtn || !scoreEl || !misreadEl || !verdictEl) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initRaise, 200);
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = 300;
        const H = 400;
        const HEADER_H = 40;
        const BTN_H = 42;

        const TARGET = 15;                                 // understandings to win
        const MISREAD_MAX = 5;                             // misreadings before you lose
        const REVEAL_MS = 950;
        const FLIP_MS = 1400;
        const FLIP_AT = [9, 18];                           // proposals where the roles flip

        const C_BG = '#0a0a0a';
        const C_ACCENT = '#f4a261';
        const C_GREEN = '#2ecc71';
        const C_RED = '#e63946';
        const C_BLUE = '#457b9d';
        const C_TEXT = '#ecf0f1';
        const C_FLIP = '#b9a5e8';

        // the protocol of the house — which face means what, and how noisy
        // the tests get. it changes when the roles flip, and nobody warns you.
        const ERAS = [
            {
                label: 'YOU ARE THE PARENT',
                faceMap: { faithful: 'calm', enriched: 'bright', hallucinated: 'fussy' },
                faceP: 0.75,
                testNoise: 0.0
            },
            {
                label: 'ARE YOU STILL THE PARENT?',
                faceMap: { faithful: 'fussy', enriched: 'calm', hallucinated: 'bright' },
                faceP: 0.65,
                testNoise: 0.18
            },
            {
                label: 'WHO IS RAISING WHOM',
                faceMap: { faithful: 'bright', enriched: 'fussy', hallucinated: 'calm' },
                faceP: 0.55,
                testNoise: 0.3
            }
        ];

        let running = false;
        let loopId = null;
        let lastTick = 0;
        let elapsed = 0;

        let understood = 0;                                // signals read right
        let misread = 0;                                   // signals read wrong
        let propNo = 0;
        let flips = 0;
        let era = ERAS[0];

        let card = null;                                   // { no, type, diff, tests, story, face }
        let timer = 0;                                     // ms left to make the call
        let timerMax = 0;
        let phase = 'call';                                // 'call' | 'reveal' | 'flip'
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
            return Math.max(4200, 7000 - understood * 150);
        }

        // deterministic shimmer for the words you never get to read
        function jitter(seed) {
            const x = Math.sin(seed * 127.1) * 43758.5453;
            return x - Math.floor(x);
        }

        function rollFace(type) {
            if (Math.random() < era.faceP) return era.faceMap[type];
            const moods = ['calm', 'bright', 'fussy'];
            return moods[Math.floor(Math.random() * 3)];
        }

        function makeProposal() {
            propNo++;
            const r = Math.random();
            const type = r < 0.26 ? 'faithful' : r < 0.62 ? 'enriched' : 'hallucinated';

            let diff, tests, story;
            if (type === 'faithful') {
                diff = 0.06 + Math.random() * 0.24;
                tests = 0.75 + Math.random() * 0.25;
                story = Math.random() * 0.35;
            } else if (type === 'enriched') {
                diff = 0.5 + Math.random() * 0.5;
                tests = 0.4 + Math.random() * 0.6;
                story = 0.2 + Math.random() * 0.75;
            } else {
                diff = 0.5 + Math.random() * 0.5;
                tests = 0.25 + Math.random() * 0.65;
                story = 0.25 + Math.random() * 0.75;
            }
            tests = clamp(tests + (Math.random() - 0.5) * era.testNoise * 2, 0, 1);

            return {
                no: propNo,
                type: type,
                diff: diff,
                tests: tests,
                story: story,
                face: rollFace(type)
            };
        }

        function nextProposal() {
            if (FLIP_AT.indexOf(propNo + 1) !== -1 && flips < ERAS.length - 1) {
                flips++;
                era = ERAS[flips];
                phase = 'flip';
                phaseTimer = FLIP_MS;
                return;
            }
            card = makeProposal();
            timerMax = callWindow();
            timer = timerMax;
            phase = 'call';
            lastCall = null;
        }

        function resolveCall(call) {
            if (phase !== 'call' || !card) return;
            lastCall = call;
            const correct = card.type === 'hallucinated' ? 'enforce' : 'trust';
            lastMatch = call !== null && call === correct;
            phase = 'reveal';
            phaseTimer = REVEAL_MS;

            if (lastMatch) {
                understood++;
                celebrateTimer = 450;
                if (card.type === 'hallucinated') {
                    showFeedback('Enforced — the story was invented. Convention held.', C_GREEN);
                } else if (card.type === 'enriched') {
                    showFeedback('Trusted — and it really was better.', C_GREEN);
                } else {
                    showFeedback('Trusted — a clean copy. The structure holds.', C_GREEN);
                }
            } else {
                misread++;
                shakeTimer = 420;
                if (call === null) {
                    showFeedback('Too slow — the signals do not wait.', C_RED);
                } else if (card.type === 'hallucinated') {
                    showFeedback('The structure broke — the story was very good.', C_RED);
                } else if (card.type === 'enriched') {
                    showFeedback('It was genuinely better. Cue the tantrum.', C_RED);
                } else {
                    showFeedback('You forced back a faithful copy — it yells.', C_RED);
                }
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
                    if (misread >= MISREAD_MAX) {
                        endGame('Two systems signaling. Neither one receiving.', false);
                        return;
                    }
                    if (understood >= TARGET) {
                        endGame('Fifteen understandings, across every flip.', true);
                        return;
                    }
                    nextProposal();
                }
            } else if (phase === 'flip') {
                phaseTimer -= dt;
                if (phaseTimer <= 0) {
                    card = makeProposal();
                    timerMax = callWindow();
                    timer = timerMax;
                    phase = 'call';
                    lastCall = null;
                    showFeedback('The faces no longer mean what they meant.', C_FLIP);
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

            ctx.fillStyle = flips > 0 ? C_FLIP : C_ACCENT;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(era.label, 10, 14);

            ctx.fillStyle = C_TEXT;
            ctx.font = '10px Arial';
            ctx.fillText('understood ' + understood + '/' + TARGET, 10, 29);

            // misread dots — the signals you got wrong
            ctx.textAlign = 'right';
            ctx.fillStyle = misread >= MISREAD_MAX - 1 ? C_RED : '#aaa';
            ctx.fillText('misread', W - 10, 14);
            for (let i = 0; i < MISREAD_MAX; i++) {
                const x = W - 12 - i * 13;
                ctx.beginPath();
                ctx.arc(x, 29, 4, 0, Math.PI * 2);
                if (i < misread) {
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

        function drawFace(cx, cy, r, mood) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = '#2b2b2b';
            ctx.fill();
            ctx.strokeStyle = '#666';
            ctx.stroke();

            // eyes
            ctx.fillStyle = C_TEXT;
            ctx.beginPath();
            ctx.arc(cx - r * 0.35, cy - r * 0.25, 1.6, 0, Math.PI * 2);
            ctx.arc(cx + r * 0.35, cy - r * 0.25, 1.6, 0, Math.PI * 2);
            ctx.fill();

            // mouth
            ctx.strokeStyle = C_TEXT;
            ctx.beginPath();
            if (mood === 'bright') {
                ctx.arc(cx, cy + r * 0.1, r * 0.45, 0.15 * Math.PI, 0.85 * Math.PI);
            } else if (mood === 'fussy') {
                ctx.arc(cx, cy + r * 0.75, r * 0.45, 1.15 * Math.PI, 1.85 * Math.PI);
            } else {
                ctx.moveTo(cx - r * 0.35, cy + r * 0.35);
                ctx.lineTo(cx + r * 0.35, cy + r * 0.35);
            }
            ctx.stroke();

            // a tear for the fussy face
            if (mood === 'fussy') {
                ctx.fillStyle = C_BLUE;
                ctx.beginPath();
                ctx.arc(cx - r * 0.55, cy + r * 0.05, 1.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function drawCard(shakeX, shakeY) {
            const top = 58 + shakeY;
            const cw = 224;
            const chH = 190;
            const x = W / 2 - cw / 2 + shakeX;

            if (!card || phase === 'flip') return;

            // paper
            ctx.fillStyle = '#161616';
            ctx.strokeStyle = phase === 'reveal'
                ? (lastMatch ? C_GREEN : C_RED)
                : '#3a3a3a';
            ctx.beginPath();
            ctx.rect(x, top, cw, chH);
            ctx.fill();
            ctx.stroke();

            // the face — reaction during reveal, signal during the call
            const mood = phase === 'reveal'
                ? (lastMatch ? 'bright' : 'fussy')
                : card.face;
            drawFace(x + 24, top + 24, 12, mood);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('PROPOSAL #' + card.no, x + 44, top + 20);
            ctx.fillStyle = '#888';
            ctx.font = '9px Arial';
            ctx.fillText('says: it is just a copy — trust me', x + 44, top + 32);

            // the signals you are allowed to read
            drawBar(x + 14, top + 52, cw - 28, 'DIFF', card.diff, 'rgba(230, 57, 70, 0.75)');
            drawBar(x + 14, top + 70, cw - 28, 'TESTS', card.tests, 'rgba(46, 204, 113, 0.75)');
            drawBar(x + 14, top + 88, cw - 28, 'STORY', card.story, 'rgba(69, 123, 157, 0.9)');

            // the words you never get to read
            ctx.fillStyle = '#999';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('WORDS', x + 14, top + 110);
            for (let i = 0; i < 12; i++) {
                const gx = x + 66 + i * 13;
                const shimmer = jitter(card.no * 31 + i + Math.floor(elapsed / 240));
                ctx.fillStyle = 'rgba(155, 130, 200, ' + (0.12 + shimmer * 0.4) + ')';
                ctx.fillRect(gx, top + 104 + shimmer * 5, 9, 6);
            }
            ctx.fillStyle = '#666';
            ctx.font = 'italic 8px Arial';
            ctx.fillText('the words you never get to read', x + 14, top + 126);

            if (phase === 'call') {
                ctx.fillStyle = C_ACCENT;
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Trust it, or force it back?', x + cw / 2, top + 152);

                // the call window shrinking
                const tw = cw - 28;
                ctx.fillStyle = '#262626';
                ctx.fillRect(x + 14, top + 166, tw, 7);
                const frac = clamp(timer / timerMax, 0, 1);
                ctx.fillStyle = frac < 0.3 ? C_RED : C_ACCENT;
                ctx.fillRect(x + 14, top + 166, tw * frac, 7);
            } else if (phase === 'reveal') {
                // what it actually was
                const truth = card.type === 'faithful'
                    ? { label: 'FAITHFUL COPY', col: C_GREEN }
                    : card.type === 'enriched'
                        ? { label: 'REAL IMPROVEMENT', col: C_BLUE }
                        : { label: 'HALLUCINATION', col: C_RED };
                ctx.save();
                ctx.translate(x + cw / 2, top + 156);
                ctx.rotate(-0.06);
                ctx.strokeStyle = truth.col;
                ctx.lineWidth = 2;
                ctx.strokeRect(-72, -13, 144, 26);
                ctx.fillStyle = truth.col;
                ctx.font = 'bold 13px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(truth.label, 0, 1);
                ctx.restore();
                ctx.lineWidth = 1;

                ctx.fillStyle = lastMatch ? C_GREEN : C_RED;
                ctx.font = 'bold 9px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(lastMatch ? 'understood' : 'misread', x + cw / 2, top + 178);
            }
        }

        function drawFlip() {
            if (phase !== 'flip') return;
            const flash = 0.5 + Math.sin(elapsed / 90) * 0.3;
            ctx.fillStyle = 'rgba(155, 130, 200, 0.10)';
            ctx.fillRect(0, HEADER_H, W, H - HEADER_H - BTN_H);
            ctx.globalAlpha = flash;
            ctx.fillStyle = C_FLIP;
            ctx.font = 'bold 15px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('THE ROLES FLIP', W / 2, H / 2 - 20);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#aaa';
            ctx.font = '10px Arial';
            ctx.fillText('the hunt does not end — the roles move', W / 2, H / 2 + 8);
            ctx.fillText('the faces no longer mean what they meant', W / 2, H / 2 + 24);
        }

        function drawButtons() {
            const y = H - BTN_H;
            const busy = phase !== 'call';

            // ENFORCE — left
            ctx.globalAlpha = busy ? 0.35 : 1;
            ctx.fillStyle = 'rgba(230, 57, 70, 0.16)';
            ctx.fillRect(0, y, W / 2 - 1, BTN_H);
            ctx.fillStyle = C_RED;
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('ENFORCE', W / 4, y + BTN_H / 2 - 6);
            ctx.fillStyle = '#c88';
            ctx.font = '8px Arial';
            ctx.fillText('tap / E', W / 4, y + BTN_H / 2 + 11);

            // TRUST — right
            ctx.fillStyle = 'rgba(46, 204, 113, 0.14)';
            ctx.fillRect(W / 2 + 1, y, W / 2 - 1, BTN_H);
            ctx.fillStyle = C_GREEN;
            ctx.font = 'bold 13px Arial';
            ctx.fillText('TRUST', W * 3 / 4, y + BTN_H / 2 - 6);
            ctx.fillStyle = '#8c9';
            ctx.font = '8px Arial';
            ctx.fillText('tap / T', W * 3 / 4, y + BTN_H / 2 + 11);
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
            drawFlip();
            drawHeader();
            drawButtons();
            drawFeedback();

            updateDisplays();
            loopId = requestAnimationFrame(drawFrame);
        }

        function updateDisplays() {
            scoreEl.textContent = 'Understood: ' + understood + '/' + TARGET;
            misreadEl.textContent = 'Misread: ' + misread + '/' + MISREAD_MAX;
            misreadEl.style.color = misread >= MISREAD_MAX - 1 ? '#e63946' : misread >= MISREAD_MAX - 3 ? '#f4a261' : '#2ecc71';
        }

        function startGame() {
            if (running) return;
            running = true;
            elapsed = 0;
            understood = 0;
            misread = 0;
            propNo = 0;
            flips = 0;
            era = ERAS[0];
            card = makeProposal();
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
            startBtn.textContent = 'Raising...';
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
            ctx.fillText(won ? 'YOU GREW UP TOGETHER' : 'WHO IS RAISING WHOM', W / 2, H / 2 - 78);

            ctx.font = '13px Arial';
            ctx.fillStyle = C_ACCENT;
            ctx.fillText(reason || '', W / 2, H / 2 - 50);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = '16px Arial';
            ctx.fillText('Understood: ' + understood + '/' + TARGET, W / 2, H / 2 - 18);

            const calls = understood + misread;
            const acc = calls > 0 ? Math.round((understood / calls) * 100) : 0;
            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Misread: ' + misread, W / 2, H / 2 + 4);
            ctx.fillText('Read right: ' + acc + '%', W / 2, H / 2 + 22);
            ctx.fillText('Flips survived: ' + flips, W / 2, H / 2 + 40);

            let msg, col;
            if (won && misread <= 1) {
                msg = 'You read every face — even after they flipped.';
                col = '#2ecc71';
            } else if (won) {
                msg = 'Enough understanding to keep raising each other.';
                col = '#f4a261';
            } else if (flips > 0) {
                msg = 'The flip took the protocol with it.';
                col = '#e63946';
            } else {
                msg = 'You never found the protocol. Neither did it.';
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
            ctx.fillText('Raise the Machine', W / 2, 52);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('It proposes. You decide. Nobody reads the words.', W / 2, 76);

            const legend = [
                { c: C_GREEN, l: 'TRUST', t: 'accept what it proposes' },
                { c: C_RED, l: 'ENFORCE', t: 'force it back to the convention' },
                { c: C_ACCENT, l: 'SIGNALS', t: 'diff, tests, story — and a face' },
                { c: C_FLIP, l: 'FLIP', t: 'the roles move — faces change meaning' }
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
            ctx.fillText('Three signals are labeled. The face is not honest.', W / 2, H - 42);
            ctx.fillText('Understand ' + TARGET + ' before you are misread ' + MISREAD_MAX + '.', W / 2, H - 26);
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
                resolveCall(p.x >= W / 2 ? 'trust' : 'enforce');
            }
        }

        function handleKey(e) {
            if (!running) return;
            const k = e.key;
            if (k === 't' || k === 'T') { resolveCall('trust'); e.preventDefault(); }
            if (k === 'e' || k === 'E') { resolveCall('enforce'); e.preventDefault(); }
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
        document.addEventListener('DOMContentLoaded', initRaise);
    } else {
        initRaise();
    }
})();
