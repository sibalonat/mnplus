// laundry-game.js - The Fat of Relevance
// Snake where AI trims your body and tickets pile it on. Game over at 0, wall, or self.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initLaundry() {
        const canvas = document.getElementById('laundryCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startLaundryGame');
        const scoreDisplay = document.getElementById('laundryScore');
        const livesDisplay = document.getElementById('laundryLives');
        const verdictDisplay = document.getElementById('laundryVerdict');

        if (!canvas || !ctx || !startBtn || !scoreDisplay || !livesDisplay || !verdictDisplay) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initLaundry, 200);
                return;
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = 300;
        const H = 400;
        const CELL = 20;
        const COLS = W / CELL;       // 15
        const ROWS = H / CELL;       // 20
        const HEADER_ROWS = 1;       // top strip reserved for HUD

        const DIRS = {
            up:    { x: 0, y: -1 },
            down:  { x: 0, y: 1 },
            left:  { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };

        // Item catalog. delta = body-length change on consumption.
        const ITEM_TYPES = {
            ai:       { color: '#2a9d8f', edge: '#2ecc71', delta: -1, label: 'AI'  },
            superAi:  { color: '#9b59b6', edge: '#d6a3ff', delta: -2, label: 'LLM' },
            task:     { color: '#e76f51', edge: '#e74c3c', delta:  1, label: 'TKT' },
            superTsk: { color: '#c0392b', edge: '#ff8a8a', delta:  2, label: '!!!' }
        };

        let gameRunning = false;
        let score = 0;
        let snake = [];
        let direction = DIRS.right;
        let nextDirection = DIRS.right;
        let pendingGrowth = 0;
        let items = [];
        let gameLoop = null;
        let lastTick = 0;
        let stepAccumulator = 0;
        let spawnTimer = 0;
        let elapsed = 0;
        let feedbackText = '';
        let feedbackColor = '';
        let feedbackTimer = 0;

        function currentStepInterval() {
            // Slightly faster over time but capped so the game stays readable
            return Math.max(95, 150 - Math.floor(elapsed / 6000) * 5);
        }

        function currentDensityCap() {
            // Denser field over time
            return Math.min(14, 3 + Math.floor(elapsed / 4000));
        }

        function currentSpawnInterval() {
            return Math.max(350, 1400 - elapsed / 30);
        }

        function pickItemType() {
            // Early game: mostly single items. Late game: more "super" risk on both sides.
            const superBoost = Math.min(18, elapsed / 2000);
            const weights = [
                ['ai',       38],
                ['task',     38],
                ['superAi',   8 + superBoost],
                ['superTsk',  8 + superBoost]
            ];
            const total = weights.reduce((s, w) => s + w[1], 0);
            let r = Math.random() * total;
            for (const [name, w] of weights) {
                r -= w;
                if (r <= 0) return name;
            }
            return 'ai';
        }

        function spawnItem() {
            const occupied = new Set();
            for (const s of snake) occupied.add(s.x + ',' + s.y);
            for (const it of items) occupied.add(it.x + ',' + it.y);
            const free = [];
            for (let x = 0; x < COLS; x++) {
                for (let y = HEADER_ROWS; y < ROWS; y++) {
                    if (!occupied.has(x + ',' + y)) free.push({ x, y });
                }
            }
            if (!free.length) return;
            const cell = free[Math.floor(Math.random() * free.length)];
            items.push({
                x: cell.x,
                y: cell.y,
                type: pickItemType(),
                bornAt: elapsed,
                ttl: 9000
            });
        }

        function showFeedback(text, color) {
            feedbackText = text;
            feedbackColor = color;
            feedbackTimer = 800;
        }

        function stepSnake() {
            direction = nextDirection;
            const head = snake[0];
            const newHead = { x: head.x + direction.x, y: head.y + direction.y };

            // Walls wrap. Keep the HUD strip out of play by clamping the top wrap to HEADER_ROWS.
            if (newHead.x < 0) newHead.x = COLS - 1;
            else if (newHead.x >= COLS) newHead.x = 0;
            if (newHead.y < HEADER_ROWS) newHead.y = ROWS - 1;
            else if (newHead.y >= ROWS) newHead.y = HEADER_ROWS;

            // Detect item at the destination cell
            let consumedIdx = -1;
            let delta = 0;
            for (let i = 0; i < items.length; i++) {
                if (items[i].x === newHead.x && items[i].y === newHead.y) {
                    consumedIdx = i;
                    delta = ITEM_TYPES[items[i].type].delta;
                    break;
                }
            }

            // Self-collision. Tail cell will free up this tick unless we're growing.
            const willKeepTail = pendingGrowth > 0 || delta > 0;
            const checkUntil = willKeepTail ? snake.length : snake.length - 1;
            for (let i = 0; i < checkUntil; i++) {
                if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
                    endGame('Tangled in your own backlog.');
                    return;
                }
            }

            snake.unshift(newHead);

            if (consumedIdx >= 0) {
                const it = items[consumedIdx];
                const meta = ITEM_TYPES[it.type];
                items.splice(consumedIdx, 1);

                if (delta > 0) {
                    score += 2;
                    pendingGrowth += delta - 1; // head-without-pop this tick = +1 already
                    showFeedback('+' + delta + ' ' + meta.label + ' piled on.', meta.edge);
                } else if (delta < 0) {
                    score += 8;
                    for (let k = 0; k < 1 + (-delta); k++) {
                        if (snake.length > 0) snake.pop();
                    }
                    showFeedback(meta.label + ' took ' + (-delta) + '.', meta.edge);
                } else {
                    snake.pop();
                }
            } else {
                if (pendingGrowth > 0) pendingGrowth--;
                else snake.pop();
            }

            if (snake.length <= 0) {
                endGame('Over-automated. You vanished.');
                return;
            }
        }

        function drawHeader() {
            ctx.fillStyle = 'rgba(244, 162, 97, 0.08)';
            ctx.fillRect(0, 0, W, CELL);
            ctx.strokeStyle = 'rgba(244, 162, 97, 0.3)';
            ctx.beginPath();
            ctx.moveTo(0, CELL);
            ctx.lineTo(W, CELL);
            ctx.stroke();

            ctx.fillStyle = snake.length <= 1 ? '#e74c3c' : '#f4a261';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                'BODY ' + snake.length + '   TIME ' + Math.floor(elapsed / 1000) + 's',
                W / 2, CELL / 2
            );
        }

        function drawGrid() {
            ctx.strokeStyle = 'rgba(244, 162, 97, 0.05)';
            ctx.lineWidth = 1;
            for (let x = 1; x < COLS; x++) {
                ctx.beginPath();
                ctx.moveTo(x * CELL, CELL);
                ctx.lineTo(x * CELL, H);
                ctx.stroke();
            }
            for (let y = HEADER_ROWS + 1; y < ROWS; y++) {
                ctx.beginPath();
                ctx.moveTo(0, y * CELL);
                ctx.lineTo(W, y * CELL);
                ctx.stroke();
            }
        }

        function drawItems() {
            for (const it of items) {
                const meta = ITEM_TYPES[it.type];
                const age = elapsed - it.bornAt;
                const fade = Math.max(0.25, Math.min(1, (it.ttl - age) / 1200));
                const isSuper = it.type === 'superAi' || it.type === 'superTsk';

                // Pulse on super items so "double risk" reads visually
                const pulse = isSuper ? 0.85 + 0.15 * Math.sin(elapsed / 120) : 1;

                ctx.globalAlpha = fade * pulse;
                ctx.fillStyle = meta.color;
                ctx.fillRect(it.x * CELL + 2, it.y * CELL + 2, CELL - 4, CELL - 4);

                ctx.strokeStyle = meta.edge;
                ctx.lineWidth = isSuper ? 2 : 1;
                ctx.strokeRect(it.x * CELL + 2, it.y * CELL + 2, CELL - 4, CELL - 4);

                ctx.globalAlpha = 1;
                ctx.fillStyle = '#ecf0f1';
                ctx.font = 'bold 8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(meta.label, it.x * CELL + CELL / 2, it.y * CELL + CELL / 2);
            }
        }

        function drawSnake() {
            for (let i = 0; i < snake.length; i++) {
                const s = snake[i];
                const isHead = i === 0;
                const critical = snake.length <= 1;

                ctx.fillStyle = isHead
                    ? (critical ? '#e74c3c' : '#f4a261')
                    : (critical ? '#c0392b' : '#e9c46a');
                ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);

                if (isHead) {
                    ctx.fillStyle = '#0d0d0d';
                    const eyeOffset = 5;
                    const eyeSize = 3;
                    // Eyes oriented by facing direction
                    const cx = s.x * CELL + CELL / 2;
                    const cy = s.y * CELL + CELL / 2;
                    let e1x, e1y, e2x, e2y;
                    if (direction === DIRS.right) {
                        e1x = cx + 2; e1y = cy - eyeOffset;
                        e2x = cx + 2; e2y = cy + eyeOffset - eyeSize;
                    } else if (direction === DIRS.left) {
                        e1x = cx - 5; e1y = cy - eyeOffset;
                        e2x = cx - 5; e2y = cy + eyeOffset - eyeSize;
                    } else if (direction === DIRS.up) {
                        e1x = cx - eyeOffset; e1y = cy - 5;
                        e2x = cx + eyeOffset - eyeSize; e2y = cy - 5;
                    } else {
                        e1x = cx - eyeOffset; e1y = cy + 2;
                        e2x = cx + eyeOffset - eyeSize; e2y = cy + 2;
                    }
                    ctx.fillRect(e1x, e1y, eyeSize, eyeSize);
                    ctx.fillRect(e2x, e2y, eyeSize, eyeSize);
                }
            }
        }

        function drawFeedback() {
            if (feedbackTimer > 0 && feedbackText) {
                ctx.globalAlpha = Math.min(1, feedbackTimer / 300);
                ctx.fillStyle = feedbackColor;
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(feedbackText, W / 2, H - 12);
                ctx.globalAlpha = 1;
            }
        }

        function drawFrame(timestamp) {
            const dt = lastTick ? timestamp - lastTick : 16.67;
            lastTick = timestamp;

            if (!gameRunning) return;

            elapsed += dt;
            spawnTimer += dt;
            stepAccumulator += dt;

            const step = currentStepInterval();
            while (stepAccumulator >= step) {
                stepAccumulator -= step;
                stepSnake();
                if (!gameRunning) return;
            }

            if (spawnTimer >= currentSpawnInterval() && items.length < currentDensityCap()) {
                spawnItem();
                spawnTimer = 0;
            }

            for (let i = items.length - 1; i >= 0; i--) {
                if (elapsed - items[i].bornAt > items[i].ttl) items.splice(i, 1);
            }

            if (feedbackTimer > 0) feedbackTimer -= dt;

            ctx.fillStyle = '#0d0d0d';
            ctx.fillRect(0, 0, W, H);

            drawGrid();
            drawItems();
            drawSnake();
            drawHeader();
            drawFeedback();

            updateDisplays();
            gameLoop = requestAnimationFrame(drawFrame);
        }

        function updateDisplays() {
            scoreDisplay.textContent = 'Score: ' + score;
            livesDisplay.textContent = 'Body: ' + snake.length;
            livesDisplay.style.color = snake.length <= 1 ? '#e74c3c' : '#e9c46a';
        }

        function startGame() {
            if (gameRunning) return;
            gameRunning = true;
            score = 0;
            elapsed = 0;
            spawnTimer = 0;
            stepAccumulator = 0;
            items = [];
            pendingGrowth = 0;
            feedbackText = '';
            feedbackTimer = 0;
            lastTick = 0;

            const midY = Math.floor(ROWS / 2);
            snake = [
                { x: 5, y: midY },
                { x: 4, y: midY },
                { x: 3, y: midY }
            ];
            direction = DIRS.right;
            nextDirection = DIRS.right;

            verdictDisplay.textContent = '';
            startBtn.textContent = 'Running...';
            startBtn.disabled = true;

            gameLoop = requestAnimationFrame(drawFrame);
        }

        function endGame(reason) {
            gameRunning = false;
            if (gameLoop) cancelAnimationFrame(gameLoop);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('GAME OVER', W / 2, H / 2 - 70);

            ctx.font = '13px Arial';
            ctx.fillStyle = '#f4a261';
            ctx.fillText(reason || '', W / 2, H / 2 - 42);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = '16px Arial';
            ctx.fillText('Score: ' + score, W / 2, H / 2 - 10);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Survived ' + Math.floor(elapsed / 1000) + 's', W / 2, H / 2 + 12);
            ctx.fillText('Final body: ' + snake.length, W / 2, H / 2 + 30);

            const seconds = elapsed / 1000;
            let msg;
            if (snake.length === 0) msg = 'AI did all your laundry. And you.';
            else if (seconds >= 60) msg = 'You kept your balance.';
            else if (seconds >= 30) msg = 'Not bad. Delegate more.';
            else msg = 'Drowning in tickets.';

            ctx.fillStyle =
                snake.length === 0 ? '#e74c3c'
                : seconds >= 60 ? '#2ecc71'
                : '#f4a261';
            ctx.font = 'bold 13px Arial';
            ctx.fillText(msg, W / 2, H / 2 + 70);

            verdictDisplay.textContent = reason || '';
            startBtn.textContent = 'Restart';
            startBtn.disabled = false;
        }

        function drawIdle() {
            ctx.fillStyle = '#0d0d0d';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 17px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('The Fat of Relevance', W / 2, 60);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('You start as 3 segments.', W / 2, 92);
            ctx.fillText('AI trims you. Tickets pile you up.', W / 2, 110);

            const legend = [
                { c: '#2a9d8f', e: '#2ecc71', l: 'AI',  t: '-1 segment'       },
                { c: '#9b59b6', e: '#d6a3ff', l: 'LLM', t: '-2 (risky trim)'  },
                { c: '#e76f51', e: '#e74c3c', l: 'TKT', t: '+1 segment'       },
                { c: '#c0392b', e: '#ff8a8a', l: '!!!', t: '+2 (crush)'       }
            ];
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < legend.length; i++) {
                const y = 145 + i * 28;
                const x = W / 2 - 85;
                ctx.fillStyle = legend[i].c;
                ctx.fillRect(x, y - 9, 18, 18);
                ctx.strokeStyle = legend[i].e;
                ctx.lineWidth = (i === 1 || i === 3) ? 2 : 1;
                ctx.strokeRect(x, y - 9, 18, 18);

                ctx.fillStyle = '#ecf0f1';
                ctx.font = 'bold 8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(legend[i].l, x + 9, y);

                ctx.fillStyle = '#ccc';
                ctx.font = '11px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(legend[i].t, x + 28, y);
            }

            ctx.fillStyle = '#888';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Arrow keys / WASD — swipe on mobile.', W / 2, H - 44);
            ctx.fillText('Walls wrap. Lose at 0 body or self.', W / 2, H - 26);
        }

        function handleKey(e) {
            if (!gameRunning) return;
            const k = e.key;
            if ((k === 'ArrowUp'    || k === 'w' || k === 'W') && direction !== DIRS.down)  { nextDirection = DIRS.up;    e.preventDefault(); }
            else if ((k === 'ArrowDown'  || k === 's' || k === 'S') && direction !== DIRS.up)    { nextDirection = DIRS.down;  e.preventDefault(); }
            else if ((k === 'ArrowLeft'  || k === 'a' || k === 'A') && direction !== DIRS.right) { nextDirection = DIRS.left;  e.preventDefault(); }
            else if ((k === 'ArrowRight' || k === 'd' || k === 'D') && direction !== DIRS.left)  { nextDirection = DIRS.right; e.preventDefault(); }
        }

        let touchStart = null;
        function handleTouchStart(e) {
            if (!e.touches.length) return;
            touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        function handleTouchEnd(e) {
            if (!touchStart || !e.changedTouches.length) return;
            const dx = e.changedTouches[0].clientX - touchStart.x;
            const dy = e.changedTouches[0].clientY - touchStart.y;
            touchStart = null;
            if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && direction !== DIRS.left)  nextDirection = DIRS.right;
                else if (dx < 0 && direction !== DIRS.right) nextDirection = DIRS.left;
            } else {
                if (dy > 0 && direction !== DIRS.up)   nextDirection = DIRS.down;
                else if (dy < 0 && direction !== DIRS.down) nextDirection = DIRS.up;
            }
        }

        startBtn.addEventListener('click', startGame);
        document.addEventListener('keydown', handleKey);
        canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

        drawIdle();
        updateDisplays();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLaundry);
    } else {
        initLaundry();
    }
})();
