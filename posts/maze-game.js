// maze-game.js - The Maze the LLM Builds
// Walls drop in over time. REVIEW clears walls, AUTO scores more but speeds the LLM up.
// You lose when you have no adjacent empty cells.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initMaze() {
        const canvas = document.getElementById('mazeCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startMazeGame');
        const scoreEl = document.getElementById('mazeScore');
        const rateEl = document.getElementById('mazeRate');
        const verdictEl = document.getElementById('mazeVerdict');

        if (!canvas || !ctx || !startBtn || !scoreEl || !rateEl || !verdictEl) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initMaze, 200);
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = 300;
        const H = 400;
        const CELL = 20;
        const COLS = W / CELL;     // 15
        const ROWS = H / CELL;     // 20
        const HEADER_ROWS = 1;     // top strip for HUD

        const C_BG = '#0a0a0a';
        const C_GRID = 'rgba(244, 162, 97, 0.05)';
        const C_WALL = '#6b4226';
        const C_WALL_EDGE = '#a0612d';
        const C_PLAYER = '#f4a261';
        const C_REVIEW = '#2a9d8f';
        const C_REVIEW_EDGE = '#2ecc71';
        const C_AUTO = '#c0392b';
        const C_AUTO_EDGE = '#ff6b6b';
        const C_TEXT = '#ecf0f1';

        let running = false;
        let loopId = null;
        let lastTick = 0;
        let elapsed = 0;
        let score = 0;

        // Player position (grid coords)
        let player = { x: 7, y: 10 };

        // walls: Set of "x,y" strings
        let walls = new Set();
        // tokens: { x, y, type: 'review'|'auto', bornAt, ttl }
        let tokens = [];

        // LLM wall-spawn pacing
        let wallSpawnTimer = 0;
        let tokenSpawnTimer = 0;
        let llmRate = 1.0;        // multiplier on wall spawning. AUTO bumps it.

        let feedbackText = '';
        let feedbackColor = '';
        let feedbackTimer = 0;

        function key(x, y) { return x + ',' + y; }

        function inBoardsBoardCell(x, y) {
            return x >= 0 && x < COLS && y >= HEADER_ROWS && y < ROWS;
        }

        function isFree(x, y) {
            if (!inBoardsBoardCell(x, y)) return false;
            if (walls.has(key(x, y))) return false;
            return true;
        }

        function adjacentFreeCount(x, y) {
            let n = 0;
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (const [dx, dy] of dirs) {
                if (isFree(x + dx, y + dy)) n++;
            }
            return n;
        }

        function wallSpawnIntervalMs() {
            // Faster over time, faster again per llmRate tick
            const base = Math.max(280, 1000 - elapsed / 12);
            return base / llmRate;
        }

        function tokenSpawnIntervalMs() {
            // Tokens appear less often than walls but steadily
            return Math.max(1400, 2400 - elapsed / 20);
        }

        function maxWallsAllowed() {
            // Soft cap so the field stays playable; rises with time
            return Math.min(110, 25 + Math.floor(elapsed / 1500));
        }

        function pickEmptyCell() {
            // Avoid player + their immediate neighbors so spawns don't insta-trap
            const blocked = new Set();
            blocked.add(key(player.x, player.y));
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (const [dx, dy] of dirs) {
                blocked.add(key(player.x + dx, player.y + dy));
            }
            for (const t of tokens) blocked.add(key(t.x, t.y));

            const candidates = [];
            for (let x = 0; x < COLS; x++) {
                for (let y = HEADER_ROWS; y < ROWS; y++) {
                    const k = key(x, y);
                    if (walls.has(k) || blocked.has(k)) continue;
                    candidates.push({ x, y });
                }
            }
            if (!candidates.length) return null;
            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        function spawnWall() {
            if (walls.size >= maxWallsAllowed()) return;
            const cell = pickEmptyCell();
            if (!cell) return;
            walls.add(key(cell.x, cell.y));
        }

        function spawnToken() {
            if (tokens.length >= 3) return;
            const cell = pickEmptyCell();
            if (!cell) return;
            // Bias to REVIEW slightly more often than AUTO so the game is winnable
            const type = Math.random() < 0.58 ? 'review' : 'auto';
            tokens.push({
                x: cell.x,
                y: cell.y,
                type: type,
                bornAt: elapsed,
                ttl: 8500
            });
        }

        function clearNearbyWalls(cx, cy, radius) {
            let cleared = 0;
            const toRemove = [];
            for (const k of walls) {
                const [sx, sy] = k.split(',').map(Number);
                if (Math.abs(sx - cx) <= radius && Math.abs(sy - cy) <= radius) {
                    toRemove.push(k);
                }
            }
            // Cap the clear so REVIEW doesn't trivialize late game
            const cap = 5;
            for (let i = 0; i < Math.min(cap, toRemove.length); i++) {
                walls.delete(toRemove[i]);
                cleared++;
            }
            return cleared;
        }

        function showFeedback(text, color) {
            feedbackText = text;
            feedbackColor = color;
            feedbackTimer = 900;
        }

        function tryMove(dx, dy) {
            if (!running) return;
            const nx = player.x + dx;
            const ny = player.y + dy;
            if (!isFree(nx, ny)) return;
            player.x = nx;
            player.y = ny;

            // Pick up a token if present
            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].x === nx && tokens[i].y === ny) {
                    consumeToken(i);
                    break;
                }
            }

            checkTrapped();
        }

        function consumeToken(idx) {
            const t = tokens[idx];
            tokens.splice(idx, 1);
            if (t.type === 'review') {
                const cleared = clearNearbyWalls(player.x, player.y, 2);
                score += 3;
                llmRate = Math.max(1.0, llmRate - 0.05);
                showFeedback('REVIEW: -' + cleared + ' walls', C_REVIEW_EDGE);
            } else {
                score += 8;
                llmRate = Math.min(3.0, llmRate + 0.25);
                // Immediate dump of two walls as a consequence
                spawnWall();
                spawnWall();
                showFeedback('AUTO: +8, rate up', C_AUTO_EDGE);
            }
        }

        function checkTrapped() {
            if (adjacentFreeCount(player.x, player.y) === 0) {
                endGame('Boxed in. The maze closed.');
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

            ctx.fillStyle = '#f4a261';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                'WALLS ' + walls.size + '   TIME ' + Math.floor(elapsed / 1000) + 's',
                W / 2, CELL / 2
            );
        }

        function drawGrid() {
            ctx.strokeStyle = C_GRID;
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

        function drawWalls() {
            ctx.fillStyle = C_WALL;
            ctx.strokeStyle = C_WALL_EDGE;
            ctx.lineWidth = 1;
            for (const k of walls) {
                const [x, y] = k.split(',').map(Number);
                ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
                ctx.strokeRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
            }
        }

        function drawTokens() {
            for (const t of tokens) {
                const age = elapsed - t.bornAt;
                const fade = Math.max(0.3, Math.min(1, (t.ttl - age) / 1500));
                const isReview = t.type === 'review';
                const fill = isReview ? C_REVIEW : C_AUTO;
                const edge = isReview ? C_REVIEW_EDGE : C_AUTO_EDGE;
                const label = isReview ? 'REV' : 'AUTO';

                const pulse = 0.9 + 0.1 * Math.sin(elapsed / 150);
                ctx.globalAlpha = fade * pulse;
                ctx.fillStyle = fill;
                ctx.fillRect(t.x * CELL + 2, t.y * CELL + 2, CELL - 4, CELL - 4);
                ctx.strokeStyle = edge;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(t.x * CELL + 2, t.y * CELL + 2, CELL - 4, CELL - 4);

                ctx.globalAlpha = 1;
                ctx.fillStyle = C_TEXT;
                ctx.font = 'bold 7px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, t.x * CELL + CELL / 2, t.y * CELL + CELL / 2);
            }
        }

        function drawPlayer() {
            const cx = player.x * CELL + CELL / 2;
            const cy = player.y * CELL + CELL / 2;
            const r = CELL / 2 - 3;

            ctx.fillStyle = C_PLAYER;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();

            // Tiny eye dot so the player reads as a thing, not a token
            ctx.fillStyle = '#0d0d0d';
            ctx.beginPath();
            ctx.arc(cx + 2, cy - 2, 1.6, 0, Math.PI * 2);
            ctx.fill();
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
            const dt = lastTick ? timestamp - lastTick : 16.67;
            lastTick = timestamp;

            if (!running) return;

            elapsed += dt;
            wallSpawnTimer += dt;
            tokenSpawnTimer += dt;
            if (feedbackTimer > 0) feedbackTimer -= dt;

            // LLM rate decays slowly back toward baseline
            llmRate = Math.max(1.0, llmRate - dt * 0.00004);

            if (wallSpawnTimer >= wallSpawnIntervalMs()) {
                spawnWall();
                wallSpawnTimer = 0;
                // Check trap state after the LLM moves — you can be boxed in
                // without moving yourself if it places the last wall around you.
                if (adjacentFreeCount(player.x, player.y) === 0) {
                    endGame('Boxed in. The maze closed.');
                    return;
                }
            }

            if (tokenSpawnTimer >= tokenSpawnIntervalMs()) {
                spawnToken();
                tokenSpawnTimer = 0;
            }

            // Age out tokens
            for (let i = tokens.length - 1; i >= 0; i--) {
                if (elapsed - tokens[i].bornAt > tokens[i].ttl) tokens.splice(i, 1);
            }

            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            drawGrid();
            drawWalls();
            drawTokens();
            drawPlayer();
            drawHeader();
            drawFeedback();

            updateDisplays();
            loopId = requestAnimationFrame(drawFrame);
        }

        function updateDisplays() {
            scoreEl.textContent = 'Score: ' + score;
            rateEl.textContent = 'LLM rate: ' + llmRate.toFixed(1) + 'x';
            rateEl.style.color = llmRate >= 2.0 ? '#e63946' : '#e9c46a';
        }

        function startGame() {
            if (running) return;
            running = true;
            score = 0;
            elapsed = 0;
            wallSpawnTimer = 0;
            tokenSpawnTimer = 0;
            llmRate = 1.0;
            walls.clear();
            tokens = [];
            feedbackText = '';
            feedbackTimer = 0;
            lastTick = 0;
            player = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };

            verdictEl.textContent = '';
            startBtn.textContent = 'Running...';
            startBtn.disabled = true;

            loopId = requestAnimationFrame(drawFrame);
        }

        function endGame(reason) {
            running = false;
            if (loopId) cancelAnimationFrame(loopId);

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
            ctx.fillText('Final LLM rate: ' + llmRate.toFixed(1) + 'x', W / 2, H / 2 + 30);

            const seconds = elapsed / 1000;
            let msg;
            if (seconds >= 75) msg = 'You kept the loop in check.';
            else if (seconds >= 40) msg = 'Not bad. More REVIEW next run.';
            else msg = 'The terminal won.';

            ctx.fillStyle =
                seconds >= 75 ? '#2ecc71'
                : seconds >= 40 ? '#f4a261'
                : '#e63946';
            ctx.font = 'bold 13px Arial';
            ctx.fillText(msg, W / 2, H / 2 + 70);

            verdictEl.textContent = reason || '';
            startBtn.textContent = 'Restart';
            startBtn.disabled = false;
        }

        function drawIdle() {
            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 17px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('The Maze the LLM Builds', W / 2, 60);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('You move. The LLM lays walls.', W / 2, 92);
            ctx.fillText('Boxed in = game over.', W / 2, 110);

            const legend = [
                { c: C_REVIEW, e: C_REVIEW_EDGE, l: 'REV',  t: '+3, clears nearby walls' },
                { c: C_AUTO,   e: C_AUTO_EDGE,   l: 'AUTO', t: '+8, speeds the LLM up'   },
                { c: C_WALL,   e: C_WALL_EDGE,   l: '',     t: 'wall (laid by the LLM)'  }
            ];
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < legend.length; i++) {
                const y = 150 + i * 30;
                const x = W / 2 - 95;
                ctx.fillStyle = legend[i].c;
                ctx.fillRect(x, y - 9, 18, 18);
                ctx.strokeStyle = legend[i].e;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x, y - 9, 18, 18);

                if (legend[i].l) {
                    ctx.fillStyle = '#ecf0f1';
                    ctx.font = 'bold 7px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(legend[i].l, x + 9, y);
                }

                ctx.fillStyle = '#ccc';
                ctx.font = '11px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(legend[i].t, x + 28, y);
            }

            ctx.fillStyle = '#888';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Arrow keys / WASD — swipe on mobile.', W / 2, H - 44);
            ctx.fillText('Press Start to begin.', W / 2, H - 26);
        }

        function handleKey(e) {
            if (!running) return;
            const k = e.key;
            if (k === 'ArrowUp'    || k === 'w' || k === 'W') { tryMove(0, -1); e.preventDefault(); }
            else if (k === 'ArrowDown'  || k === 's' || k === 'S') { tryMove(0,  1); e.preventDefault(); }
            else if (k === 'ArrowLeft'  || k === 'a' || k === 'A') { tryMove(-1, 0); e.preventDefault(); }
            else if (k === 'ArrowRight' || k === 'd' || k === 'D') { tryMove(1,  0); e.preventDefault(); }
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
                tryMove(dx > 0 ? 1 : -1, 0);
            } else {
                tryMove(0, dy > 0 ? 1 : -1);
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
        document.addEventListener('DOMContentLoaded', initMaze);
    } else {
        initMaze();
    }
})();
