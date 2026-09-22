// dial-game.js - The Number Nobody Wrote Down
// A pale yellow phone with a dial. Around the dial, five labels - the services
// somebody decided you might need in an emergency - and a sixth label that is
// blank. Things happen through the evening: smoke from the kitchen, a stranger
// at the door, a bill that is wrong. Dial the right label and it is handled.
// Dial the wrong one and a polite voice says "not our number", and the dial
// has to come all the way back around. Then the other kind of thing arrives:
// the machine did something. No service has a label for it. The only thing
// that works is the blank label - put the phone down and go and look yourself,
// which takes long, and everything else keeps losing patience while you are
// out. When the evening is over, the game writes the sixth label for you,
// based on what you did.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initDial() {
        const canvas = document.getElementById('dialCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startDialGame');
        const scoreEl = document.getElementById('dialScore');
        const badEl = document.getElementById('dialBad');
        const verdictEl = document.getElementById('dialVerdict');

        if (!canvas || !ctx || !startBtn || !scoreEl || !badEl || !verdictEl) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initDial, 200);
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = 300;
        const H = 400;
        const HEADER_H = 40;
        const CARD_Y0 = 46;
        const CARD_H = 34;
        const CARD_GAP = 4;
        const CARD_X = 8;
        const CARD_W = W - 16;
        const MAX_CARDS = 3;
        const DIAL_CX = 150;
        const DIAL_CY = 274;
        const DIAL_R = 66;
        const LABEL_R = 100;
        const LABEL_W = 78;
        const LABEL_H = 18;

        const EVENING_MS = 105000;              // until it is fully dark
        const DIAL_MS = 950;                    // almost a full circle, and back
        const LOOK_MS = 3200;                   // put the phone down and go and look
        const WRONG_PENALTY = 1400;             // patience lost on "not our number"
        const MAX_BAD = 3;                      // things that can go bad in one evening
        const FIRST_MACHINE_AT = 14000;         // the machine waits a little

        // The labels on the phone. The sixth is blank.
        const SERVICES = [
            { label: 'RENSEIGNEMENTS', en: 'information', angle: -90 },
            { label: 'RÉCLAMATIONS', en: 'complaints', angle: -30 },
            { label: 'TÉLÉGRAPHE', en: 'telegraph', angle: 30 },
            { label: 'POLICE-SECOURS', en: 'police', angle: 90 },
            { label: 'POMPIERS', en: 'fire brigade', angle: 150 },
            { label: '', en: 'go and look', angle: 210 }
        ];
        const BLANK = 5;

        // What the wrong service says when you call it about the machine.
        const NOT_OURS = [
            'RENSEIGNEMENTS - we have no entry for that.',
            'RÉCLAMATIONS - a complaint against whom?',
            'TÉLÉGRAPHE - addressed to whom?',
            'POLICE-SECOURS - nothing has been stolen.',
            'POMPIERS - there is no fire.'
        ];

        const NORMAL = [
            { text: 'Smoke from the kitchen.', svc: 4, bad: 'The kitchen burned.' },
            { text: "The neighbour's barn is on fire.", svc: 4, bad: 'The barn is gone.' },
            { text: 'A stranger at the door. It is 2 a.m.', svc: 3, bad: 'The stranger came in.' },
            { text: 'The car is gone from the street.', svc: 3, bad: 'The car is in another country.' },
            { text: 'A message must reach Paris tonight.', svc: 2, bad: 'Paris never heard.' },
            { text: 'Tell my brother: the boat leaves at six.', svc: 2, bad: 'Your brother missed the boat.' },
            { text: 'The bill is twice what it should be.', svc: 1, bad: 'You paid it twice.' },
            { text: 'The line has been dead since Monday.', svc: 1, bad: 'The line is still dead.' },
            { text: 'What time is the last train?', svc: 0, bad: 'The last train left.' },
            { text: "The doctor's address, quickly.", svc: 0, bad: 'The doctor was never found.' },
            { text: 'Is the road to Pukë open?', svc: 0, bad: 'You drove into the snow.' }
        ];

        const MACHINE = [
            { text: 'The machine wrote the letter and signed your name.', bad: 'The letter went out with your name.' },
            { text: 'The machine says the road is clear. It is not.', bad: 'Somebody trusted the road.' },
            { text: 'The machine chose the school for your daughter.', bad: 'The school was chosen for you.' },
            { text: 'The machine answered the complaint before you read it.', bad: 'The answer went out. You never read it.' },
            { text: 'The machine dialed a number for you. Which one?', bad: 'Somebody picked up. You will never know who.' },
            { text: 'The machine says there is no fire. You smell smoke.', bad: 'There was a fire.' }
        ];

        const C_BG = '#0a0a0a';
        const C_PHONE = '#e9d8a6';
        const C_PHONE_DARK = '#b8a87a';
        const C_PHONE_SHADOW = '#5e5540';
        const C_LIT = '#f4a261';
        const C_LIT_FILL = 'rgba(244, 162, 97, 0.28)';
        const C_DARK = '#6c7a86';
        const C_RED = '#e63946';
        const C_GOOD = '#2ecc71';
        const C_BLUE = '#457b9d';
        const C_TEXT = '#ecf0f1';

        let running = false;
        let loopId = null;
        let lastTick = 0;
        let elapsed = 0;

        let cards = [];
        let selected = 0;
        let nextCardIn = 2500;
        let busy = null;                        // { kind: 'dial' | 'wrong' | 'look', t, total, svc, card }
        let dialAngle = 0;

        let handled = 0;
        let arrived = 0;
        let bad = 0;
        let wrongCalls = 0;
        let machineSeen = 0;
        let machineLooked = 0;
        let machineDialed = [0, 0, 0, 0, 0];
        let blankOnNormal = 0;
        let sixthLabel = '';

        let shakeTimer = 0;
        let feedbackText = '';
        let feedbackColor = '';
        let feedbackTimer = 0;
        let lastBad = '';

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
        function rand(a, b) { return a + Math.random() * (b - a); }
        function rad(deg) { return deg * Math.PI / 180; }

        function showFeedback(text, color) {
            feedbackText = text;
            feedbackColor = color;
            feedbackTimer = 1700;
        }

        function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

        function spawnCard() {
            if (cards.length >= MAX_CARDS) return;
            const progress = clamp(elapsed / EVENING_MS, 0, 1);
            let machine = elapsed >= FIRST_MACHINE_AT && Math.random() < 0.18 + progress * 0.5;
            if (machine && machineSeen === 0) machine = true;
            let src, tries = 0;
            do {
                src = machine ? pick(MACHINE) : pick(NORMAL);
                tries++;
            } while (tries < 8 && cards.some(function (c) { return c.text === src.text; }));

            const patience = machine ? rand(12000, 15000) : Math.max(7500, rand(9500, 13000) - progress * 3000);
            cards.push({
                text: src.text,
                bad: src.bad,
                machine: machine,
                svc: machine ? -1 : src.svc,
                patience: patience,
                left: patience,
                tried: {}
            });
            arrived++;
            if (machine) machineSeen++;
            if (cards.length === 1) selected = 0;
        }

        function dial(svc) {
            if (!running || busy) return;
            if (!cards.length) { showFeedback('Nothing to call about. Yet.', C_DARK); return; }
            const card = cards[clamp(selected, 0, cards.length - 1)];
            busy = { kind: 'dial', t: DIAL_MS, total: DIAL_MS, svc: svc, card: card };
        }

        function finishDial() {
            const svc = busy.svc;
            const card = busy.card;
            busy = null;
            if (cards.indexOf(card) < 0) {
                showFeedback('Too late. It already went bad.', C_DARK);
                return;
            }

            if (card.machine) {
                if (svc === BLANK) {
                    busy = { kind: 'look', t: LOOK_MS, total: LOOK_MS, svc: svc, card: card };
                    showFeedback('You put the phone down.', C_BLUE);
                    return;
                }
                machineDialed[svc]++;
                wrongCalls++;
                card.tried[svc] = true;
                card.left -= WRONG_PENALTY;
                shakeTimer = 220;
                busy = { kind: 'wrong', t: 600, total: 600, svc: svc, card: card };
                showFeedback(NOT_OURS[svc], C_LIT);
                return;
            }

            if (svc === card.svc) {
                resolve(card, 'HANDLED - ' + SERVICES[svc].label, C_GOOD);
                return;
            }
            if (svc === BLANK) {
                blankOnNormal++;
                card.left -= WRONG_PENALTY;
                busy = { kind: 'wrong', t: 600, total: 600, svc: svc, card: card };
                showFeedback('NOBODY ANSWERS - nothing is written there.', C_DARK);
                return;
            }
            wrongCalls++;
            card.tried[svc] = true;
            card.left -= WRONG_PENALTY;
            shakeTimer = 220;
            busy = { kind: 'wrong', t: 600, total: 600, svc: svc, card: card };
            showFeedback('NOT OUR NUMBER - ' + SERVICES[svc].label, C_LIT);
        }

        function finishLook() {
            const card = busy.card;
            busy = null;
            if (cards.indexOf(card) < 0) {
                showFeedback('You came back. It had already gone bad.', C_DARK);
                return;
            }
            machineLooked++;
            resolve(card, 'YOU WENT AND LOOKED. It is handled.', C_GOOD);
        }

        function resolve(card, text, color) {
            const i = cards.indexOf(card);
            if (i >= 0) cards.splice(i, 1);
            handled++;
            if (selected >= cards.length) selected = Math.max(0, cards.length - 1);
            showFeedback(text, color);
        }

        function selectCard(i) {
            if (!running) return;
            if (i < 0 || i >= cards.length) return;
            selected = i;
        }

        function moveSelect(d) {
            if (!cards.length) return;
            selected = (selected + d + cards.length) % cards.length;
        }

        function writeSixthLabel() {
            let best = -1, bestN = 0;
            for (let i = 0; i < machineDialed.length; i++) {
                if (machineDialed[i] > bestN) { bestN = machineDialed[i]; best = i; }
            }
            if (machineSeen === 0) return { label: '', msg: 'The machine never called. Nothing was learned tonight.' };
            if (machineLooked === 0 && bestN === 0) return { label: '', msg: 'You never answered the machine. The label stayed blank.' };
            if (machineLooked >= bestN) return { label: 'ALLER VOIR', msg: 'You wrote: ALLER VOIR - go and look yourself.' };
            const why = [
                'You kept asking what it was.',
                'You complained to whoever picked up.',
                'You sent word to someone far away.',
                'You called it a danger, every time.',
                'You kept smelling smoke that was not there.'
            ];
            return { label: SERVICES[best].label, msg: 'You wrote: ' + SERVICES[best].label + '. ' + why[best] };
        }

        function update(dt) {
            elapsed += dt;
            if (feedbackTimer > 0) feedbackTimer -= dt;
            if (shakeTimer > 0) shakeTimer -= dt;

            // the cards lose patience whether you are on the phone or not
            for (let i = cards.length - 1; i >= 0; i--) {
                const c = cards[i];
                c.left -= dt;
                if (c.left <= 0) {
                    cards.splice(i, 1);
                    bad++;
                    lastBad = c.bad;
                    shakeTimer = 400;
                    showFeedback('WENT BAD - ' + c.bad, C_RED);
                    if (selected >= cards.length) selected = Math.max(0, cards.length - 1);
                    if (busy && busy.card === c && busy.kind !== 'look') busy = null;
                }
            }
            if (bad >= MAX_BAD) {
                endGame('Three things went bad. ' + lastBad, false, 'bad');
                return;
            }

            if (busy) {
                busy.t -= dt;
                if (busy.kind === 'dial') {
                    const p = 1 - busy.t / busy.total;
                    const sweep = 60 + (busy.svc + 1) * 40;           // higher numbers, longer turn
                    dialAngle = p < 0.55 ? sweep * (p / 0.55) : sweep * (1 - (p - 0.55) / 0.45);
                    if (busy.t <= 0) { dialAngle = 0; finishDial(); }
                } else if (busy.kind === 'wrong') {
                    dialAngle = 0;
                    if (busy.t <= 0) busy = null;
                } else if (busy.kind === 'look') {
                    dialAngle = 0;
                    if (busy.t <= 0) finishLook();
                }
            }

            if (elapsed >= EVENING_MS) {
                endGame('It is fully dark. The evening is over.', true, 'won');
                return;
            }

            nextCardIn -= dt;
            if (nextCardIn <= 0) {
                spawnCard();
                const progress = clamp(elapsed / EVENING_MS, 0, 1);
                nextCardIn = Math.max(3200, 6500 - progress * 2800) + rand(0, 1800);
            }
        }

        // ---- drawing ----

        function labelPos(i) {
            const a = rad(SERVICES[i].angle);
            return { x: DIAL_CX + Math.cos(a) * LABEL_R, y: DIAL_CY + Math.sin(a) * LABEL_R };
        }

        function drawPhone(sx, sy) {
            const cx = DIAL_CX + sx, cy = DIAL_CY + sy;

            // the body of the phone, pale yellow, a little worn
            ctx.fillStyle = C_PHONE_SHADOW;
            ctx.beginPath();
            ctx.arc(cx + 2, cy + 3, DIAL_R + 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = C_PHONE;
            ctx.beginPath();
            ctx.arc(cx, cy, DIAL_R + 8, 0, Math.PI * 2);
            ctx.fill();

            // the finger stop
            ctx.fillStyle = C_PHONE_DARK;
            ctx.fillRect(cx + DIAL_R - 6, cy + 14, 12, 5);

            // the dial ring, rotating while you dial
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rad(dialAngle));
            ctx.fillStyle = C_PHONE_DARK;
            ctx.beginPath();
            ctx.arc(0, 0, DIAL_R, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = C_PHONE;
            ctx.beginPath();
            ctx.arc(0, 0, DIAL_R - 3, 0, Math.PI * 2);
            ctx.fill();
            for (let n = 0; n < 10; n++) {
                const a = rad(-60 + n * 30);
                const hx = Math.cos(a) * (DIAL_R - 14);
                const hy = Math.sin(a) * (DIAL_R - 14);
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.arc(hx, hy, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = C_PHONE;
                ctx.font = 'bold 8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String((n + 1) % 10), hx, hy);
            }
            ctx.restore();

            // the centre disc, where the phone tells you what it is doing
            ctx.fillStyle = '#f5ecc9';
            ctx.beginPath();
            ctx.arc(cx, cy, 28, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = C_PHONE_DARK;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#3a3320';
            if (busy && busy.kind === 'dial') {
                ctx.font = 'bold 8px Arial';
                ctx.fillText('dialing', cx, cy - 6);
                ctx.font = '7px Arial';
                ctx.fillText(SERVICES[busy.svc].label ? SERVICES[busy.svc].label.slice(0, 12) : '?', cx, cy + 6);
            } else if (busy && busy.kind === 'wrong') {
                ctx.font = 'bold 8px Arial';
                ctx.fillStyle = C_RED;
                ctx.fillText('not our', cx, cy - 6);
                ctx.fillText('number', cx, cy + 6);
            } else {
                ctx.font = 'bold 9px Arial';
                ctx.fillText('DIAL', cx, cy - 5);
                ctx.font = '7px Arial';
                ctx.fillText(cards.length ? 'card ' + (selected + 1) : 'quiet', cx, cy + 7);
            }
        }

        function drawLabels(sx, sy) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < SERVICES.length; i++) {
                const p = labelPos(i);
                const x = p.x + sx - LABEL_W / 2;
                const y = p.y + sy - LABEL_H / 2;
                const active = busy && busy.svc === i && busy.kind !== 'wrong';
                const wrong = busy && busy.svc === i && busy.kind === 'wrong';
                const blank = i === BLANK;

                if (wrong) {
                    ctx.fillStyle = 'rgba(230, 57, 70, 0.25)';
                    ctx.fillRect(x, y, LABEL_W, LABEL_H);
                    ctx.strokeStyle = C_RED;
                    ctx.lineWidth = 1.5;
                } else if (active) {
                    ctx.fillStyle = C_LIT_FILL;
                    ctx.fillRect(x, y, LABEL_W, LABEL_H);
                    ctx.strokeStyle = C_LIT;
                    ctx.lineWidth = 1.5;
                } else {
                    ctx.fillStyle = blank ? 'rgba(108, 122, 134, 0.08)' : 'rgba(233, 216, 166, 0.14)';
                    ctx.fillRect(x, y, LABEL_W, LABEL_H);
                    ctx.strokeStyle = blank ? 'rgba(108, 122, 134, 0.5)' : 'rgba(233, 216, 166, 0.55)';
                    ctx.lineWidth = 1;
                }
                if (blank && !sixthLabel) ctx.setLineDash([3, 3]);
                ctx.strokeRect(x, y, LABEL_W, LABEL_H);
                ctx.setLineDash([]);

                let text = SERVICES[i].label;
                if (blank) text = sixthLabel || '?';
                ctx.fillStyle = wrong ? C_RED : active ? C_LIT : blank ? 'rgba(108, 122, 134, 0.9)' : C_PHONE;
                ctx.font = 'bold 7.5px Arial';
                ctx.fillText(text, p.x + sx, p.y + sy - (blank && !sixthLabel ? 0 : 3));
                if (!blank || sixthLabel) {
                    ctx.fillStyle = 'rgba(236, 240, 241, 0.45)';
                    ctx.font = '6.5px Arial';
                    ctx.fillText(String(i + 1) + ' · ' + SERVICES[i].en, p.x + sx, p.y + sy + 6);
                }
            }
        }

        function fitText(text, maxW, size) {
            ctx.font = size + 'px Arial';
            while (ctx.measureText(text).width > maxW && size > 6.5) {
                size -= 0.5;
                ctx.font = size + 'px Arial';
            }
        }

        function drawCards(sx, sy) {
            for (let i = 0; i < cards.length; i++) {
                const c = cards[i];
                const y = CARD_Y0 + i * (CARD_H + CARD_GAP) + sy;
                const x = CARD_X + sx;
                const sel = i === selected;
                const urgent = c.left / c.patience < 0.3;

                ctx.fillStyle = c.machine ? 'rgba(69, 123, 157, 0.14)' : 'rgba(236, 240, 241, 0.06)';
                ctx.fillRect(x, y, CARD_W, CARD_H);
                ctx.strokeStyle = sel ? C_LIT : c.machine ? 'rgba(69, 123, 157, 0.7)' : 'rgba(236, 240, 241, 0.25)';
                ctx.lineWidth = sel ? 1.5 : 1;
                ctx.strokeRect(x, y, CARD_W, CARD_H);

                ctx.fillStyle = urgent && Math.sin(elapsed / 120) > 0 ? C_RED : C_TEXT;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                fitText(c.text, CARD_W - 16, 9.5);
                ctx.fillText(c.text, x + 8, y + 12);

                // patience
                const f = clamp(c.left / c.patience, 0, 1);
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.fillRect(x + 8, y + CARD_H - 9, CARD_W - 16, 4);
                ctx.fillStyle = f > 0.5 ? '#e9c46a' : f > 0.25 ? C_LIT : C_RED;
                ctx.fillRect(x + 8, y + CARD_H - 9, (CARD_W - 16) * f, 4);

                // the numbers already tried, crossed out
                let tx = x + CARD_W - 10;
                for (let s = 4; s >= 0; s--) {
                    if (c.tried[s]) {
                        ctx.fillStyle = 'rgba(230, 57, 70, 0.8)';
                        ctx.font = 'bold 7px Arial';
                        ctx.textAlign = 'right';
                        ctx.fillText('x' + (s + 1), tx, y + 24);
                        tx -= 14;
                    }
                }
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

            // the evening: what is left of the light
            const barX = 8, barY = 6, barW = W - 16, barH = 6;
            const d = 1 - clamp(elapsed / EVENING_MS, 0, 1);
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(barX, barY, barW, barH);
            const r = Math.round(233 - (1 - d) * 150);
            const g = Math.round(196 - (1 - d) * 160);
            const b = Math.round(106 - (1 - d) * 40);
            ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            ctx.fillRect(barX, barY, barW * d, barH);
            ctx.strokeStyle = 'rgba(244,162,97,0.4)';
            ctx.strokeRect(barX, barY, barW, barH);

            ctx.font = 'bold 9px Arial';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = C_TEXT;
            ctx.textAlign = 'left';
            ctx.fillText('HANDLED ' + handled, 8, HEADER_H - 11);
            ctx.textAlign = 'center';
            ctx.fillStyle = machineSeen ? C_BLUE : C_TEXT;
            ctx.fillText('MACHINE ' + machineSeen, W / 2, HEADER_H - 11);
            ctx.textAlign = 'right';
            ctx.fillStyle = bad > 0 ? C_RED : C_TEXT;
            ctx.fillText('WENT BAD ' + bad + '/' + MAX_BAD, W - 8, HEADER_H - 11);
        }

        function drawLookOverlay() {
            if (!busy || busy.kind !== 'look') return;
            // the trail in the dark: black leaves, a stony ground
            ctx.fillStyle = 'rgba(0, 0, 0, 0.86)';
            ctx.fillRect(0, HEADER_H + 1, W, H - HEADER_H - 1);
            ctx.fillStyle = 'rgba(120, 110, 90, 0.18)';
            ctx.fillRect(0, H - 60, W, 60);
            ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
            for (let i = 0; i < 9; i++) {
                const lx = 20 + ((i * 53 + Math.floor(elapsed / 400) * 7) % (W - 40));
                const ly = 200 + (i * 37) % 130;
                ctx.beginPath();
                ctx.ellipse(lx, ly, 8, 4, rad(i * 40), 0, Math.PI * 2);
                ctx.fill();
            }
            // something on the left, maybe
            const p = 1 - clamp(busy.t / busy.total, 0, 1);
            ctx.fillStyle = 'rgba(20, 20, 20, ' + (0.5 + 0.4 * Math.sin(elapsed / 300)) + ')';
            ctx.beginPath();
            ctx.moveTo(0, 250);
            ctx.lineTo(40 + p * 20, 235);
            ctx.lineTo(55 + p * 20, 260);
            ctx.lineTo(30, 300);
            ctx.lineTo(0, 310);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('YOU PUT THE PHONE DOWN', W / 2, 150);
            ctx.fillStyle = '#aaa';
            ctx.font = '10px Arial';
            ctx.fillText('and go and look. It is dark. The leaves are black.', W / 2, 168);
            ctx.fillText('Nobody is answering anything while you are out.', W / 2, 182);

            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(50, 196, W - 100, 6);
            ctx.fillStyle = C_BLUE;
            ctx.fillRect(50, 196, (W - 100) * p, 6);
        }

        function drawFeedback() {
            if (feedbackTimer > 0 && feedbackText) {
                ctx.globalAlpha = Math.min(1, feedbackTimer / 360);
                ctx.fillStyle = feedbackColor;
                ctx.font = 'bold 9.5px Arial';
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

            drawPhone(sx, sy);
            drawLabels(sx, sy);
            drawCards(sx, sy);
            drawLookOverlay();
            drawHeader();
            drawFeedback();

            updateDisplays();
            loopId = requestAnimationFrame(drawFrame);
        }

        function updateDisplays() {
            scoreEl.textContent = 'Handled: ' + handled;
            badEl.textContent = 'Went bad: ' + bad + '/' + MAX_BAD;
            badEl.style.color = bad >= 2 ? '#e63946' : bad >= 1 ? '#f4a261' : '#e9c46a';
        }

        function startGame() {
            if (running) return;
            running = true;
            elapsed = 0;
            cards = [];
            selected = 0;
            nextCardIn = 1800;
            busy = null;
            dialAngle = 0;
            handled = 0;
            arrived = 0;
            bad = 0;
            wrongCalls = 0;
            machineSeen = 0;
            machineLooked = 0;
            machineDialed = [0, 0, 0, 0, 0];
            blankOnNormal = 0;
            sixthLabel = '';
            shakeTimer = 0;
            feedbackText = '';
            feedbackTimer = 0;
            lastBad = '';
            lastTick = 0;

            verdictEl.textContent = '';
            startBtn.textContent = 'On the phone...';
            startBtn.disabled = true;

            loopId = requestAnimationFrame(drawFrame);
        }

        function endGame(reason, won, kind) {
            running = false;
            busy = null;
            if (loopId) cancelAnimationFrame(loopId);
            updateDisplays();

            const sixth = writeSixthLabel();
            sixthLabel = sixth.label;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(won ? 'THE EVENING IS OVER' : 'THREE THINGS WENT BAD', W / 2, H / 2 - 96);

            ctx.font = '11px Arial';
            ctx.fillStyle = C_LIT;
            fitText(reason || '', W - 20, 11);
            ctx.fillText(reason || '', W / 2, H / 2 - 72);

            ctx.fillStyle = C_TEXT;
            ctx.font = '16px Arial';
            ctx.fillText('Handled: ' + handled + ' of ' + arrived, W / 2, H / 2 - 42);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Went bad: ' + bad + '   Wrong numbers: ' + wrongCalls, W / 2, H / 2 - 18);
            const dialedTotal = machineDialed.reduce(function (a, b) { return a + b; }, 0);
            ctx.fillText('The machine called ' + machineSeen + ' times', W / 2, H / 2 + 2);
            ctx.fillText('You went to look ' + machineLooked + ', dialed a service ' + dialedTotal, W / 2, H / 2 + 20);

            // the sixth label, written from what you did
            const bx = W / 2 - LABEL_W / 2 - 6, by = H / 2 + 40;
            ctx.fillStyle = sixth.label ? C_LIT_FILL : 'rgba(108, 122, 134, 0.1)';
            ctx.fillRect(bx, by, LABEL_W + 12, LABEL_H + 6);
            ctx.strokeStyle = sixth.label ? C_LIT : 'rgba(108, 122, 134, 0.6)';
            ctx.lineWidth = 1.5;
            if (!sixth.label) ctx.setLineDash([3, 3]);
            ctx.strokeRect(bx, by, LABEL_W + 12, LABEL_H + 6);
            ctx.setLineDash([]);
            ctx.fillStyle = sixth.label ? C_LIT : 'rgba(108, 122, 134, 0.9)';
            ctx.font = 'bold 9px Arial';
            ctx.textBaseline = 'middle';
            ctx.fillText(sixth.label || '?', W / 2, by + (LABEL_H + 6) / 2);
            ctx.textBaseline = 'alphabetic';

            ctx.fillStyle = sixth.label === 'ALLER VOIR' ? C_GOOD : sixth.label ? C_LIT : C_BLUE;
            ctx.font = 'bold 11px Arial';
            fitText(sixth.msg, W - 16, 11);
            ctx.font = 'bold ' + ctx.font;
            ctx.fillText(sixth.msg, W / 2, H / 2 + 88);

            verdictEl.textContent = sixth.msg;
            startBtn.textContent = 'Another Evening';
            startBtn.disabled = false;
        }

        function drawIdle() {
            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 17px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('The Number Nobody Wrote Down', W / 2, 52);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Five labels on the phone. A sixth one, blank.', W / 2, 76);

            const legend = [
                { c: C_PHONE, l: 'A LABEL', t: 'information, complaints, telegraph, police, fire' },
                { c: C_TEXT, l: 'A CARD', t: 'something happened - dial the right label' },
                { c: C_BLUE, l: 'THE MACHINE', t: 'did something - no service has a number for it' },
                { c: C_DARK, l: 'THE BLANK', t: 'put the phone down and go and look. Slow.' }
            ];
            ctx.textBaseline = 'middle';
            for (let i = 0; i < legend.length; i++) {
                const y = 116 + i * 32;
                const x = W / 2 - 122;
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

            // a small phone, so you know what you are looking at
            ctx.fillStyle = C_PHONE;
            ctx.beginPath();
            ctx.arc(W / 2, 282, 26, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = C_PHONE_DARK;
            ctx.beginPath();
            ctx.arc(W / 2, 282, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1a1a1a';
            for (let n = 0; n < 10; n++) {
                const a = rad(-60 + n * 30);
                ctx.beginPath();
                ctx.arc(W / 2 + Math.cos(a) * 14, 282 + Math.sin(a) * 14, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = '#888';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('Tap a label, or press 1-6, to dial it.', W / 2, H - 70);
            ctx.fillText('Tap a card, or W / S, to choose what you deal with.', W / 2, H - 54);
            ctx.fillText('Every card loses patience on its own.', W / 2, H - 38);
            ctx.fillText('Three things going bad ends the evening.', W / 2, H - 22);
        }

        function handleKey(e) {
            if (!running) return;
            const k = e.key;
            if (k >= '1' && k <= '6') { dial(parseInt(k, 10) - 1); e.preventDefault(); }
            else if (k === 'w' || k === 'W' || k === 'ArrowUp') { moveSelect(-1); e.preventDefault(); }
            else if (k === 's' || k === 'S' || k === 'ArrowDown' || k === 'Tab') { moveSelect(1); e.preventDefault(); }
        }

        function pointerAt(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            const x = (clientX - rect.left) * (W / rect.width);
            const y = (clientY - rect.top) * (H / rect.height);

            for (let i = 0; i < cards.length; i++) {
                const cy = CARD_Y0 + i * (CARD_H + CARD_GAP);
                if (x >= CARD_X && x <= CARD_X + CARD_W && y >= cy && y <= cy + CARD_H) {
                    selectCard(i);
                    return;
                }
            }
            for (let i = 0; i < SERVICES.length; i++) {
                const p = labelPos(i);
                if (x >= p.x - LABEL_W / 2 - 6 && x <= p.x + LABEL_W / 2 + 6 && y >= p.y - LABEL_H / 2 - 8 && y <= p.y + LABEL_H / 2 + 8) {
                    dial(i);
                    return;
                }
            }
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
        document.addEventListener('DOMContentLoaded', initDial);
    } else {
        initDial();
    }
})();
