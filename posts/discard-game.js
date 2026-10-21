// discard-game.js - Already Done
// A feature you finished over four days: six decisions, one per tile, each
// with a note on what you already handled. Then the sessions start. Each one
// arrives as a card that says one of your decisions is a bug and wants to
// change it, with a reason that is sometimes clear and sometimes not, and a
// timer: if you do nothing, the change applies itself. Some cards are real -
// the session found something new. Most have simply forgotten what you did,
// and bring back a reason you already handled. You can keep yours, accept,
// ask why - which takes time - or write the rule down, which takes longer and
// makes every later card about that decision come clear. Meanwhile your own
// memory of what you decided fades, tile by tile, unless it is written. At
// the end the game tells you which of the four you had: visibility,
// authority, the right measurement, feedback.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initDiscard() {
        const canvas = document.getElementById('discardCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startDiscardGame');
        const scoreEl = document.getElementById('discardScore');
        const undoneEl = document.getElementById('discardUndone');
        const verdictEl = document.getElementById('discardVerdict');

        if (!canvas || !ctx || !startBtn || !scoreEl || !undoneEl || !verdictEl) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initDiscard, 200);
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = 300;
        const H = 400;
        const CARD_X = 8;
        const CARD_Y = 38;
        const CARD_W = 284;
        const CARD_H = 110;
        const TILE_X0 = 9;
        const TILE_Y0 = 156;
        const TILE_W = 90;
        const TILE_H = 50;
        const TILE_GAP = 6;
        const BTN_Y = 272;
        const BTN_W = 66;
        const BTN_H = 30;
        const BTN_GAP = 4;
        const BTN_X0 = 9;
        const FOOT_Y = 326;

        const SESSION_MS = 75000;
        const ASK_MS = 1700;                    // reading the history back
        const WRITE_MS = 2300;                  // writing a rule in the settings
        const GAP_MS = 900;                     // between one card and the next
        const MAX_UNDONE = 3;
        const TILES_N = 6;

        // The six decisions of the feature. "mine" is what you decided, "done" is
        // the note on what you already handled, "stale" is the reason a session
        // that forgot brings back, "fresh" is a reason nobody has seen yet.
        const DEFS = [
            { name: 'EMPTY FORM', mine: 'SHOW ERRORS', other: 'GREY OUT', done: 'errors on top', stale: 'the errors show below the fold and nobody sees them', fresh: 'the screen reader skips the whole error list' },
            { name: 'DOUBLE SUBMIT', mine: 'LOCK BUTTON', other: 'MERGE BOTH', done: 'lock on server', stale: 'the lock drops on a slow network, two orders go through', fresh: 'the lock stays on after a failed payment' },
            { name: 'EXPIRED LINK', mine: 'ASK AGAIN', other: 'EXTEND A DAY', done: 'keeps login', stale: 'asking again logs the person out of the app', fresh: 'the new link goes to the old email address' },
            { name: 'NO NETWORK', mine: 'KEEP DRAFT', other: 'RETRY 3 TIMES', done: 'draft on disk', stale: 'the draft is lost when the tab closes', fresh: 'two open tabs overwrite each other\'s draft' },
            { name: 'SAME EMAIL', mine: 'LOG THEM IN', other: 'BLOCK IT', done: 'asks password', stale: 'logging them in skips the password', fresh: 'capital letters make a second account' },
            { name: 'WRONG DATE', mine: 'SET TODAY', other: 'REJECT', done: 'warns first', stale: 'setting today hides a typo in the year', fresh: 'the warning comes in the wrong language' }
        ];
        const MURKY = [
            'aligns with the updated flow, for consistency',
            'refactor, see previous context',
            'this was flagged as an issue',
            'edge case not handled per the new approach',
            'small fix while I was here',
            'as discussed, moving to the standard pattern',
            'cleanup after the last change',
            'this is a bug'
        ];

        const C_BG = '#0a0a0a';
        const C_GRID = '#232323';
        const C_GRID_HEAD = '#151515';
        const C_LIT = '#f4a261';
        const C_LIT_FILL = 'rgba(244, 162, 97, 0.28)';
        const C_DARK = '#6c7a86';
        const C_RED = '#e63946';
        const C_RED_FILL = 'rgba(230, 57, 70, 0.25)';
        const C_GOOD = '#2ecc71';
        const C_GOOD_FILL = 'rgba(46, 204, 113, 0.22)';
        const C_BLUE = '#457b9d';
        const C_BLUE_TEXT = '#7fb3d0';
        const C_BLUE_FILL = 'rgba(69, 123, 157, 0.45)';
        const C_TEXT = '#ecf0f1';
        const C_MURKY = '#8a8f94';

        let running = false;
        let loopId = null;
        let lastTick = 0;
        let elapsed = 0;

        let tiles = [];
        let card = null;                        // { idx, real, clear, text, t, T, asked, reveal }
        let busy = null;                        // { kind, t, T, idx }
        let nextCardIn = 0;
        let sessionNo = 1;
        let cardsSpawned = 0;

        let undone = 0;
        let undoneByYou = 0;
        let missed = 0;
        let fixed = 0;
        let kept = 0;
        let behindBack = 0;
        let instinct = 0;
        let informed = 0;
        let asked = 0;
        let written = 0;
        let resolved = 0;
        let couldSee = 0;

        let shakeTimer = 0;
        let feedbackText = '';
        let feedbackColor = '';
        let feedbackTimer = 0;

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
        function rand(a, b) { return a + Math.random() * (b - a); }
        function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
        function times(n) { return n + (n === 1 ? ' time' : ' times'); }
        function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

        function showFeedback(text, color) {
            feedbackText = text;
            feedbackColor = color;
            feedbackTimer = 1900;
        }

        function newTile(i) {
            const d = DEFS[i];
            return {
                name: d.name, mine: d.mine, other: d.other, done: d.done, stale: d.stale, fresh: d.fresh,
                day: 1 + (i % 4),
                value: d.mine,
                memory: rand(12000, 38000),     // how long until you no longer remember it
                faded: false,
                written: false,
                state: 'mine'                   // mine | fixed | undone
            };
        }

        function standing() {
            let n = 0;
            for (let i = 0; i < TILES_N; i++) if (tiles[i].state !== 'undone') n++;
            return n;
        }

        function freeTiles() {
            const free = [];
            for (let i = 0; i < TILES_N; i++) if (tiles[i].state === 'mine') free.push(i);
            return free;
        }

        // what the card says, depending on how clear the session is today
        function cardText(tile, real, clear) {
            if (tile.written) {
                return real ? tile.fresh + ' (not in your rule)' : tile.stale + ' (your rule: handled on day ' + tile.day + ')';
            }
            if (!clear) return pick(MURKY);
            return real ? tile.fresh : tile.stale;
        }

        function spawnCard() {
            const free = freeTiles();
            if (!free.length) { endGame(true); return; }
            const progress = clamp(elapsed / SESSION_MS, 0, 1);
            const idx = pick(free);
            const tile = tiles[idx];
            // the first card has forgotten, and says so clearly; the second one is real
            let real, clear;
            if (cardsSpawned === 0) { real = false; clear = true; }
            else if (cardsSpawned === 1) { real = true; clear = true; }
            else { real = Math.random() < 0.35; clear = Math.random() < 0.75 - 0.45 * progress; }
            if (tile.written) clear = true;
            const T = Math.max(3500, (9000 - 4500 * progress) * rand(0.85, 1.15));
            sessionNo++;
            cardsSpawned++;
            card = { idx: idx, real: real, clear: clear, text: cardText(tile, real, clear), t: T, T: T, asked: false, reveal: '', no: sessionNo };
        }

        // could you see why, at the moment it was decided
        function hadVisibility() {
            const tile = tiles[card.idx];
            return card.asked || tile.written || (card.clear && !tile.faded);
        }

        function resolve(how) {
            const tile = tiles[card.idx];
            const saw = hadVisibility();
            resolved++;
            if (saw) couldSee++;
            if (how !== 'auto') {
                if (saw) informed++; else instinct++;
            }
            const c = card;
            card = null;
            if (busy && busy.kind === 'ask') busy = null;   // nothing left to ask about
            nextCardIn = GAP_MS;

            if (how === 'keep') {
                if (c.real) {
                    missed++;
                    showFeedback('You kept ' + tile.mine + '. That one was real.', C_LIT);
                } else {
                    kept++;
                    showFeedback('You kept ' + tile.mine + '. It had forgotten day ' + tile.day + '.', C_GOOD);
                }
                return;
            }
            // accept, or it applied itself
            tile.value = tile.other;
            if (c.real) {
                tile.state = 'fixed';
                fixed++;
                if (how === 'auto') { behindBack++; showFeedback(tile.name + ' changed while you were reading. It was real.', C_BLUE_TEXT); }
                else showFeedback(tile.name + ' is now ' + tile.other + '. It was real.', C_GOOD);
            } else {
                tile.state = 'undone';
                undone++;
                shakeTimer = 400;
                if (how === 'auto') { behindBack++; showFeedback('UNDONE - ' + tile.name + ' changed behind your back. It had forgotten.', C_RED); }
                else { undoneByYou++; showFeedback('UNDONE - you said yes, and ' + tile.name + ' was already done.', C_RED); }
            }
        }

        function stillBusy() {
            showFeedback(busy.kind === 'ask' ? 'Still reading the history...' : 'Still writing the rule...', C_DARK);
        }

        function keepMine() {
            if (!card) { showFeedback('Nothing to keep. The session is thinking.', C_DARK); return; }
            if (busy) { stillBusy(); return; }
            resolve('keep');
        }

        function accept() {
            if (!card) { showFeedback('Nothing to accept. The session is thinking.', C_DARK); return; }
            if (busy) { stillBusy(); return; }
            resolve('accept');
        }

        function askWhy() {
            if (!card) { showFeedback('Nothing to ask about yet.', C_DARK); return; }
            if (busy) { stillBusy(); return; }
            if (card.asked) { showFeedback('You already know why.', C_DARK); return; }
            busy = { kind: 'ask', t: ASK_MS, T: ASK_MS, idx: card.idx };
        }

        function finishAsk() {
            busy = null;
            if (!card) return;
            const tile = tiles[card.idx];
            card.asked = true;
            asked++;
            card.reveal = card.real ? 'It is new. Nothing in your notes covers it. Real.' : 'It forgot. You handled that on day ' + tile.day + ': ' + tile.done + '.';
        }

        function writeDown(idx) {
            const tile = tiles[idx];
            if (busy) { stillBusy(); return; }
            if (tile.written) { showFeedback(tile.name + ' is already written down.', C_DARK); return; }
            if (tile.state === 'undone') { showFeedback(tile.name + ' is gone. Nothing left to write.', C_DARK); return; }
            busy = { kind: 'write', t: WRITE_MS, T: WRITE_MS, idx: idx };
        }

        function finishWrite() {
            const tile = tiles[busy.idx];
            busy = null;
            tile.written = true;
            tile.faded = false;
            written++;
            // the session reads the rule: the card about this tile comes clear
            if (card && tiles[card.idx] === tile) {
                card.clear = true;
                card.text = cardText(tile, card.real, true);
            }
            showFeedback('Written: ' + tile.name + ' = ' + tile.value + '. Every session reads it now.', C_GOOD);
        }

        function update(dt) {
            elapsed += dt;
            if (feedbackTimer > 0) feedbackTimer -= dt;
            if (shakeTimer > 0) shakeTimer -= dt;

            // what you decided four days ago fades, unless it is written
            for (let i = 0; i < TILES_N; i++) {
                const tile = tiles[i];
                if (tile.written || tile.faded || tile.state === 'undone') continue;
                tile.memory -= dt;
                if (tile.memory <= 0) tile.faded = true;
            }

            if (busy) {
                busy.t -= dt;
                if (busy.t <= 0) {
                    if (busy.kind === 'ask') finishAsk(); else finishWrite();
                }
            }

            if (card) {
                card.t -= dt;
                if (card.t <= 0) resolve('auto');
            } else {
                nextCardIn -= dt;
                if (nextCardIn <= 0) spawnCard();
            }
            if (!running) return;

            if (undone >= MAX_UNDONE) {
                endGame(false);
                return;
            }
            if (elapsed >= SESSION_MS) {
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
            const frac = clamp(elapsed / SESSION_MS, 0, 1);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(8, 6, W - 16, 4);
            ctx.fillStyle = C_LIT;
            ctx.fillRect(8, 6, (W - 16) * frac, 4);

            const s = Math.ceil(Math.max(0, SESSION_MS - elapsed) / 1000);
            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('Session: ' + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60) + ' left', 8, 28);

            const st = standing();
            ctx.textAlign = 'right';
            ctx.fillStyle = st === TILES_N ? C_GOOD : st >= 4 ? C_LIT : C_RED;
            ctx.fillText('Standing: ' + st + '/' + TILES_N, W - 8, 28);
        }

        function drawCard() {
            ctx.fillStyle = C_GRID_HEAD;
            ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);
            ctx.strokeStyle = card ? C_LIT : C_GRID;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(CARD_X, CARD_Y, CARD_W, CARD_H);
            ctx.textBaseline = 'alphabetic';

            if (!card) {
                ctx.fillStyle = '#555';
                ctx.font = 'italic 11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('The session is thinking...', W / 2, CARD_Y + CARD_H / 2 + 4);
                return;
            }
            const tile = tiles[card.idx];
            ctx.textAlign = 'left';
            ctx.fillStyle = '#888';
            ctx.font = 'bold 8px Arial';
            ctx.fillText('SESSION ' + card.no + ' SAYS:', CARD_X + 8, CARD_Y + 16);
            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 12px Arial';
            ctx.fillText(tile.name + ' is a bug.', CARD_X + 8, CARD_Y + 33);
            ctx.font = '10px Arial';
            ctx.fillStyle = C_LIT;
            ctx.fillText('Wants: ' + tile.other, CARD_X + 8, CARD_Y + 48);

            // why - clear, murky, or what you found out by asking
            let text, color, font;
            if (card.asked) { text = card.reveal; color = card.real ? C_GOOD : C_RED; font = 'bold 9px Arial'; }
            else if (card.clear) { text = 'Because: ' + card.text; color = C_TEXT; font = '9px Arial'; }
            else { text = 'Because: ' + card.text; color = C_MURKY; font = 'italic 9px Arial'; }
            ctx.font = font;
            ctx.fillStyle = color;
            const lines = wrapLines(text, CARD_W - 16);
            for (let i = 0; i < Math.min(2, lines.length); i++) {
                ctx.fillText(lines[i], CARD_X + 8, CARD_Y + 64 + i * 12);
            }
            if (!card.asked && !card.clear) {
                ctx.fillStyle = '#555';
                ctx.font = 'italic 8px Arial';
                ctx.fillText('(you cannot tell from this)', CARD_X + 8, CARD_Y + 88);
            } else if (!card.asked && tile.faded && !tile.written) {
                ctx.fillStyle = '#555';
                ctx.font = 'italic 8px Arial';
                ctx.fillText('(is this new, or already handled? the tile says ?)', CARD_X + 8, CARD_Y + 88);
            }

            // the timer - it applies itself
            const by = CARD_Y + CARD_H - 12;
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(CARD_X + 8, by, CARD_W - 16, 5);
            const frac = clamp(card.t / card.T, 0, 1);
            ctx.fillStyle = frac < 0.3 ? C_RED : C_LIT;
            ctx.fillRect(CARD_X + 8, by, (CARD_W - 16) * frac, 5);
            ctx.fillStyle = frac < 0.3 ? C_RED : '#888';
            ctx.font = '8px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('applies itself in ' + (Math.max(0, card.t) / 1000).toFixed(1) + ' s', CARD_X + CARD_W - 8, by - 3);
        }

        function tileRect(i) {
            const col = i % 3;
            const row = Math.floor(i / 3);
            return { x: TILE_X0 + col * (TILE_W + TILE_GAP), y: TILE_Y0 + row * (TILE_H + TILE_GAP) };
        }

        function drawTiles() {
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#888';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('WHAT YOU DECIDED, OVER FOUR DAYS', TILE_X0, TILE_Y0 - 5);

            for (let i = 0; i < TILES_N; i++) {
                const tile = tiles[i];
                const r = tileRect(i);
                const target = card && card.idx === i;
                const writing = busy && busy.kind === 'write' && busy.idx === i;

                let border = C_GRID;
                let fill = C_GRID_HEAD;
                if (tile.state === 'undone') { border = C_RED; fill = C_RED_FILL; }
                else if (tile.state === 'fixed') { border = C_BLUE; fill = C_BLUE_FILL; }
                else if (tile.written) { border = C_GOOD; fill = C_GOOD_FILL; }
                ctx.fillStyle = fill;
                ctx.fillRect(r.x, r.y, TILE_W, TILE_H);
                if (writing) {
                    ctx.fillStyle = C_GOOD_FILL;
                    ctx.fillRect(r.x, r.y, TILE_W * clamp(1 - busy.t / busy.T, 0, 1), TILE_H);
                }
                ctx.strokeStyle = target ? C_LIT : border;
                ctx.lineWidth = target ? 2 : 1;
                ctx.strokeRect(r.x + 0.5, r.y + 0.5, TILE_W - 1, TILE_H - 1);

                ctx.textAlign = 'left';
                ctx.fillStyle = tile.state === 'undone' ? C_RED : C_TEXT;
                ctx.font = 'bold 8.5px Arial';
                ctx.fillText(tile.name, r.x + 5, r.y + 13);

                // your decision - readable, fading, or gone
                ctx.font = 'bold 10px Arial';
                if (tile.state === 'undone') {
                    ctx.fillStyle = C_RED;
                    ctx.fillText(tile.value, r.x + 5, r.y + 29);
                    ctx.fillStyle = C_RED;
                    ctx.font = '7.5px Arial';
                    ctx.fillText('undone', r.x + 5, r.y + 42);
                } else if (tile.state === 'fixed') {
                    ctx.fillStyle = C_BLUE_TEXT;
                    ctx.fillText(tile.value, r.x + 5, r.y + 29);
                    ctx.font = '7.5px Arial';
                    ctx.fillText('fixed, real', r.x + 5, r.y + 42);
                } else if (tile.faded) {
                    ctx.fillStyle = '#3f464c';
                    ctx.font = 'bold 13px Arial';
                    ctx.fillText('?', r.x + 5, r.y + 30);
                    ctx.font = 'italic 7.5px Arial';
                    ctx.fillText('four days ago...', r.x + 5, r.y + 42);
                } else {
                    const left = tile.written ? 1 : clamp(tile.memory / 12000, 0.35, 1);
                    ctx.globalAlpha = left;
                    ctx.fillStyle = tile.written ? C_GOOD : C_TEXT;
                    ctx.fillText(tile.value, r.x + 5, r.y + 29);
                    ctx.globalAlpha = 1;
                    ctx.font = '7.5px Arial';
                    ctx.fillStyle = tile.written ? C_GOOD : '#999';
                    ctx.fillText((tile.written ? 'rule: ' : 'done: ') + tile.done, r.x + 5, r.y + 42);
                }
            }
        }

        function buttonDefs() {
            return [
                { key: 'D', label: 'KEEP MINE', col: C_GOOD, act: keepMine },
                { key: 'A', label: 'ACCEPT', col: C_LIT, act: accept },
                { key: 'W', label: 'ASK WHY', col: C_BLUE, act: askWhy },
                { key: 'R', label: 'WRITE IT', col: C_GOOD, act: function () { if (card) writeDown(card.idx); else showFeedback('Tap a tile to write it down.', C_DARK); } }
            ];
        }

        function drawButtons() {
            const defs = buttonDefs();
            ctx.textBaseline = 'middle';
            for (let i = 0; i < defs.length; i++) {
                const x = BTN_X0 + i * (BTN_W + BTN_GAP);
                const d = defs[i];
                const active = busy && ((busy.kind === 'ask' && i === 2) || (busy.kind === 'write' && i === 3));
                const dim = busy && !active;
                if (active) {
                    ctx.fillStyle = i === 2 ? C_BLUE_FILL : C_GOOD_FILL;
                    ctx.fillRect(x, BTN_Y, BTN_W * clamp(1 - busy.t / busy.T, 0, 1), BTN_H);
                }
                ctx.globalAlpha = dim ? 0.35 : 1;
                ctx.strokeStyle = d.col;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x, BTN_Y, BTN_W, BTN_H);
                ctx.fillStyle = i === 2 ? C_BLUE_TEXT : d.col;
                ctx.font = 'bold 8.5px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(d.label, x + BTN_W / 2, BTN_Y + BTN_H / 2);
                ctx.fillStyle = '#666';
                ctx.font = '8px Arial';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(d.key, x + BTN_W / 2, BTN_Y + BTN_H + 11);
                ctx.textBaseline = 'middle';
                ctx.globalAlpha = 1;
            }
            ctx.textBaseline = 'alphabetic';
        }

        function drawFooter() {
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
            ctx.font = '9.5px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Undone: ' + undone + '   Missed: ' + missed + '   Behind your back: ' + behindBack, 8, FOOT_Y);
            ctx.fillText('On instinct: ' + instinct + '   Asked: ' + asked + '   Written: ' + written + '/' + TILES_N, 8, FOOT_Y + 16);
            ctx.fillStyle = '#555';
            ctx.font = '8.5px Arial';
            if (busy) {
                ctx.fillStyle = busy.kind === 'ask' ? C_BLUE_TEXT : C_GOOD;
                ctx.fillText(busy.kind === 'ask' ? 'Reading the history back... the card keeps ticking.' : 'Writing the rule... the card keeps ticking.', 8, FOOT_Y + 33);
            } else {
                ctx.fillText('A tile you have not written down fades. A rule you wrote stays.', 8, FOOT_Y + 33);
            }
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

            ctx.save();
            ctx.translate(sx, sy);
            drawCard();
            drawTiles();
            drawButtons();
            ctx.restore();
            drawHeader();
            drawFooter();
            drawFeedback();

            updateDisplays();
            loopId = requestAnimationFrame(drawFrame);
        }

        function updateDisplays() {
            scoreEl.textContent = 'Standing: ' + (tiles.length ? standing() : TILES_N) + '/' + TILES_N;
            undoneEl.textContent = 'Undone: ' + undone + '/' + MAX_UNDONE;
            undoneEl.style.color = undone >= 2 ? '#e63946' : undone >= 1 ? '#f4a261' : '#e9c46a';
        }

        function startGame() {
            if (running) return;
            running = true;
            elapsed = 0;
            tiles = [];
            for (let i = 0; i < TILES_N; i++) tiles.push(newTile(i));
            card = null;
            busy = null;
            nextCardIn = 2600;
            sessionNo = 1;
            cardsSpawned = 0;
            undone = 0;
            undoneByYou = 0;
            missed = 0;
            fixed = 0;
            kept = 0;
            behindBack = 0;
            instinct = 0;
            informed = 0;
            asked = 0;
            written = 0;
            resolved = 0;
            couldSee = 0;
            shakeTimer = 0;
            feedbackText = '';
            feedbackTimer = 0;
            lastTick = 0;

            verdictEl.textContent = '';
            startBtn.textContent = 'In session...';
            startBtn.disabled = true;

            loopId = requestAnimationFrame(drawFrame);
        }

        // which of the four you had
        function fourThings() {
            return [
                { label: 'SEE', ok: resolved > 0 && couldSee / resolved >= 0.6 },
                { label: 'STOP', ok: behindBack <= 1 },
                { label: 'MEASURE', ok: instinct <= 1 },
                { label: 'FEEDBACK', ok: written >= 2 }
            ];
        }

        function writeVerdict(won) {
            if (!won) {
                return { label: 'THROWN OFF', msg: 'Three decisions you made over four days are gone' + (undoneByYou ? ', and you said yes to ' + undoneByYou + ' of them.' : ', and you never touched the button.') };
            }
            if (undone === 0 && missed === 0 && behindBack === 0) {
                return { label: 'IN THE LOOP', msg: 'Nothing was undone, nothing real was thrown away. You could see, you could stop it, and you knew what done looked like.' };
            }
            if (missed >= 2 && missed >= fixed) {
                return { label: 'DISCARD ALL', msg: 'You kept the feature by throwing away ' + plural(missed, 'real fix') + '. Your instinct was right about the session and wrong about the bugs.' };
            }
            if (behindBack >= 3) {
                return { label: 'BEHIND YOUR BACK', msg: plural(behindBack, 'change') + ' went in while you were still reading. The button was there, and you were not.' };
            }
            if (instinct >= 3 && instinct > informed) {
                return { label: 'ON INSTINCT', msg: 'You decided ' + times(instinct) + ' without seeing why and without knowing what you had decided. Some of it went well.' };
            }
            if (written === 0) {
                return { label: 'NOTHING WRITTEN', msg: 'You never wrote a rule down. Every session started from zero, and so did you.' };
            }
            return { label: 'ALMOST', msg: 'Undone ' + undone + ', missed ' + missed + ', ' + behindBack + ' behind your back. Close, and still in your hands.' };
        }

        function endGame(won) {
            running = false;
            card = null;
            busy = null;
            if (loopId) cancelAnimationFrame(loopId);
            updateDisplays();

            const verdict = writeVerdict(won);
            const four = fourThings();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(won ? 'THE SESSION IS OVER' : 'THROWN OFF', W / 2, 62);

            ctx.font = '15px Arial';
            ctx.fillText('Standing: ' + standing() + ' of ' + TILES_N + ', fixed: ' + fixed, W / 2, 90);

            ctx.font = '11.5px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Could see why: ' + couldSee + ' of ' + resolved, W / 2, 116);
            ctx.fillText('Kept yours: ' + kept + ' right, ' + missed + ' real ones thrown away', W / 2, 133);
            ctx.fillText('Said yes: ' + fixed + ' real, ' + undoneByYou + ' already done', W / 2, 150);
            ctx.fillText('Behind your back: ' + behindBack + '   On instinct: ' + instinct, W / 2, 167);
            ctx.fillText('Written down: ' + written + ' of ' + TILES_N, W / 2, 184);

            // the four things, each a box
            const bw = 64, bh = 24, gap = 6;
            const x0 = W / 2 - (4 * bw + 3 * gap) / 2;
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 8.5px Arial';
            for (let i = 0; i < four.length; i++) {
                const x = x0 + i * (bw + gap);
                const col = four[i].ok ? C_GOOD : C_RED;
                ctx.fillStyle = four[i].ok ? C_GOOD_FILL : C_RED_FILL;
                ctx.fillRect(x, 202, bw, bh);
                ctx.strokeStyle = col;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x, 202, bw, bh);
                ctx.fillStyle = col;
                ctx.fillText(four[i].label, x + bw / 2, 214);
            }
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#777';
            ctx.font = '8.5px Arial';
            ctx.fillText('visibility, authority, the right measurement, feedback', W / 2, 240);

            // the card the game fills in for you
            const good = verdict.label === 'IN THE LOOP';
            const col = good ? C_GOOD : won ? C_LIT : C_RED;
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.strokeRect(W / 2 - 70, 256, 140, 26);
            ctx.fillStyle = col;
            ctx.font = 'bold 11px Arial';
            ctx.textBaseline = 'middle';
            ctx.fillText(verdict.label, W / 2, 269);
            ctx.textBaseline = 'alphabetic';

            ctx.font = 'bold 11px Arial';
            const lines = wrapLines(verdict.msg, W - 28);
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], W / 2, 306 + i * 16);
            }

            verdictEl.textContent = verdict.msg;
            startBtn.textContent = 'Another Session';
            startBtn.disabled = false;
        }

        function drawIdle() {
            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 17px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('Already Done', W / 2, 52);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Six decisions, four days of work. Then the sessions.', W / 2, 76);

            const legend = [
                { c: C_LIT, l: 'A CARD', t: 'a session says one decision is a bug - it applies itself' },
                { c: C_TEXT, l: 'A TILE', t: 'what you decided, and what you handled - it fades' },
                { c: C_BLUE, l: 'ASK WHY', t: 'read the history back: takes time, shows the truth' },
                { c: C_GOOD, l: 'WRITE IT', t: 'a rule every session reads: takes longer, stays' }
            ];
            ctx.textBaseline = 'middle';
            for (let i = 0; i < legend.length; i++) {
                const y = 112 + i * 32;
                const x = W / 2 - 132;
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

            // a small card and the six tiles, so you know what you are looking at
            const mx = W / 2 - 66, my = 240;
            ctx.strokeStyle = C_LIT;
            ctx.lineWidth = 1;
            ctx.strokeRect(mx + 0.5, my + 0.5, 132, 22);
            ctx.fillStyle = '#444';
            ctx.fillRect(mx + 6, my + 6, 60, 3);
            ctx.fillRect(mx + 6, my + 13, 90, 3);
            ctx.fillStyle = C_LIT;
            ctx.fillRect(mx + 100, my + 16, 26, 3);
            for (let i = 0; i < TILES_N; i++) {
                const x = mx + (i % 3) * 45;
                const y = my + 28 + Math.floor(i / 3) * 16;
                ctx.fillStyle = C_GRID_HEAD;
                ctx.fillRect(x, y, 42, 13);
                ctx.strokeStyle = i === 1 ? C_GOOD : i === 4 ? C_RED : C_GRID;
                ctx.strokeRect(x + 0.5, y + 0.5, 42, 13);
                ctx.fillStyle = i === 4 ? '#3f464c' : i === 1 ? C_GOOD : '#777';
                ctx.fillRect(x + 5, y + 5, i === 4 ? 6 : 22, 3);
            }

            ctx.fillStyle = '#888';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('D keeps yours, A accepts, W asks why, R writes the rule.', W / 2, H - 70);
            ctx.fillText('Or tap the buttons. Tap a tile to write it down.', W / 2, H - 54);
            ctx.fillText('Do nothing, and the change applies itself.', W / 2, H - 38);
            ctx.fillText('Three decisions undone end the session.', W / 2, H - 22);
        }

        function handleKey(e) {
            if (!running) return;
            const k = e.key;
            if (k === 'd' || k === 'D' || k === 'ArrowLeft') { keepMine(); e.preventDefault(); }
            else if (k === 'a' || k === 'A' || k === 'ArrowRight' || k === 'Enter') { accept(); e.preventDefault(); }
            else if (k === 'w' || k === 'W' || k === 'ArrowUp') { askWhy(); e.preventDefault(); }
            else if (k === 'r' || k === 'R' || k === 'ArrowDown') { buttonDefs()[3].act(); e.preventDefault(); }
            else if (k >= '1' && k <= '6') { writeDown(parseInt(k, 10) - 1); e.preventDefault(); }
        }

        function pointerAt(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            const x = (clientX - rect.left) * (W / rect.width);
            const y = (clientY - rect.top) * (H / rect.height);

            if (y >= BTN_Y - 4 && y <= BTN_Y + BTN_H + 14) {
                const i = Math.floor((x - BTN_X0) / (BTN_W + BTN_GAP));
                if (i >= 0 && i < 4) buttonDefs()[i].act();
                return;
            }
            for (let i = 0; i < TILES_N; i++) {
                const r = tileRect(i);
                if (x >= r.x && x <= r.x + TILE_W && y >= r.y && y <= r.y + TILE_H) { writeDown(i); return; }
            }
            if (card && y >= CARD_Y && y <= CARD_Y + CARD_H) askWhy();
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
        document.addEventListener('DOMContentLoaded', initDiscard);
    } else {
        initDiscard();
    }
})();
