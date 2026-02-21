// burrow-game.js - Tunnel Connection Game
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initBurrowGame() {
        console.log('[Burrow Game] Initializing... Attempt:', retryCount + 1);

        const canvas = document.getElementById('burrowGame');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startBurrowGame');
        const scoreDisplay = document.getElementById('burrowScore');

        console.log('[Burrow Game] Elements check:', {
            canvas: !!canvas,
            ctx: !!ctx,
            startBtn: !!startBtn,
            scoreDisplay: !!scoreDisplay
        });

        // If elements aren't found, retry
        if (!canvas || !ctx || !startBtn || !scoreDisplay) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initBurrowGame, 200);
                return;
            }
            console.error('[Burrow Game] Failed to find elements after max retries');
            return;
        }

        // Only initialize once
        if (gameInitialized) {
            console.log('[Burrow Game] Already initialized, skipping');
            return;
        }

        console.log('[Burrow Game] Starting initialization...');
        gameInitialized = true;

        // GAME VARIABLES
        let gameRunning = false;
        let score = 0;
        let selectedRow = 1; // 0 = top, 1 = middle, 2 = bottom
        let selectedCol = 1; // 0 = left, 1 = middle, 2 = right
        let tunnels = []; // Active tunnels to connect
        let gameLoop = null;
        let spawnTimer = 0;
        let missedTunnels = 0;
        const maxMissed = 5;

        const keys = { up: false, down: false, left: false, right: false, space: false };

        // Grid configuration
        const gridCols = 3;
        const gridRows = 3;
        const cellWidth = 90;
        const cellHeight = 120;
        const startX = 15;
        const startY = 20;

        // Tunnel object
        class Tunnel {
            constructor(row, col) {
                this.row = row;
                this.col = col;
                this.age = 0;
                this.maxAge = 120; // frames before disappearing
                this.connected = false;
            }

            update() {
                this.age++;
                return this.age < this.maxAge && !this.connected;
            }

            draw(ctx) {
                const x = startX + this.col * cellWidth;
                const y = startY + this.row * cellHeight;

                // Progress indicator
                const progress = this.age / this.maxAge;

                // Burrow hole
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.ellipse(x + 45, y + 90, 35, 20, 0, 0, Math.PI * 2);
                ctx.fill();

                // Tunnel/cloudflared icon popping out
                const popHeight = Math.sin(this.age * 0.1) * 5;

                // Tunnel body
                ctx.fillStyle = progress > 0.7 ? '#e74c3c' : '#3498db';
                ctx.fillRect(x + 25, y + 50 + popHeight, 40, 40);

                // Cloudflare orange accent
                ctx.fillStyle = '#f4a261';
                ctx.fillRect(x + 30, y + 55 + popHeight, 30, 8);

                // Timer bar
                ctx.fillStyle = '#ecf0f1';
                ctx.fillRect(x + 15, y + 100, 60, 4);
                ctx.fillStyle = progress > 0.7 ? '#e74c3c' : '#2ecc71';
                ctx.fillRect(x + 15, y + 100, 60 * (1 - progress), 4);
            }

            isExpired() {
                return this.age >= this.maxAge;
            }
        }

        // Draw grid
        function drawGrid() {
            ctx.strokeStyle = '#34495e';
            ctx.lineWidth = 1;

            for (let row = 0; row < gridRows; row++) {
                for (let col = 0; col < gridCols; col++) {
                    const x = startX + col * cellWidth;
                    const y = startY + row * cellHeight;

                    // Cell border
                    ctx.strokeRect(x, y, cellWidth, cellHeight);

                    // Position label
                    ctx.fillStyle = '#7f8c8d';
                    ctx.font = '10px monospace';
                    const label = `${col},${row}`;
                    ctx.fillText(label, x + 5, y + 15);
                }
            }
        }

        // Draw selector
        function drawSelector() {
            const x = startX + selectedCol * cellWidth;
            const y = startY + selectedRow * cellHeight;

            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);

            // Arrow indicator
            ctx.fillStyle = '#f39c12';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('►', x + cellWidth - 25, y + 25);
        }

        // Draw scene
        function draw() {
            // Background
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid
            drawGrid();

            // Tunnels
            tunnels.forEach(tunnel => tunnel.draw(ctx));

            // Selector
            drawSelector();

            // Instructions
            ctx.fillStyle = '#ecf0f1';
            ctx.font = '12px monospace';
            ctx.fillText('Arrow keys to move', 10, canvas.height - 40);
            ctx.fillText('SPACE to connect', 10, canvas.height - 20);

            // Missed counter
            ctx.fillStyle = missedTunnels > 3 ? '#e74c3c' : '#95a5a6';
            ctx.fillText(`Missed: ${missedTunnels}/${maxMissed}`, canvas.width - 100, canvas.height - 20);
        }

        // Spawn tunnel
        function spawnTunnel() {
            const row = Math.floor(Math.random() * gridRows);
            const col = Math.floor(Math.random() * gridCols);

            // Don't spawn if there's already one in this position
            const exists = tunnels.some(t => t.row === row && t.col === col);
            if (!exists) {
                tunnels.push(new Tunnel(row, col));
            }
        }

        // Update game state
        function update() {
            if (!gameRunning) return;

            spawnTimer++;
            if (spawnTimer > 80) { // Spawn every ~1.3 seconds
                spawnTunnel();
                spawnTimer = 0;
            }

            // Update tunnels
            tunnels = tunnels.filter(tunnel => {
                const alive = tunnel.update();
                if (tunnel.isExpired() && !tunnel.connected) {
                    missedTunnels++;
                }
                return alive;
            });

            // Handle connection attempt
            if (keys.space) {
                keys.space = false; // Prevent holding
                const tunnel = tunnels.find(t =>
                    t.row === selectedRow &&
                    t.col === selectedCol &&
                    !t.connected
                );

                if (tunnel) {
                    tunnel.connected = true;
                    score += 10;
                    scoreDisplay.textContent = `Score: ${score}`;
                }
            }

            // Check game over
            if (missedTunnels >= maxMissed) {
                gameRunning = false;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#e74c3c';
                ctx.font = 'bold 24px monospace';
                ctx.fillText('TUNNELS DOWN!', 60, 180);
                ctx.fillStyle = '#ecf0f1';
                ctx.font = '16px monospace';
                ctx.fillText(`Final Score: ${score}`, 80, 220);
            }

            draw();
        }

        // Keyboard controls
        function handleKeyDown(e) {
            if (!gameRunning) return;

            if (e.key === 'ArrowUp' && selectedRow > 0) {
                selectedRow--;
                e.preventDefault();
            }
            if (e.key === 'ArrowDown' && selectedRow < gridRows - 1) {
                selectedRow++;
                e.preventDefault();
            }
            if (e.key === 'ArrowLeft' && selectedCol > 0) {
                selectedCol--;
                e.preventDefault();
            }
            if (e.key === 'ArrowRight' && selectedCol < gridCols - 1) {
                selectedCol++;
                e.preventDefault();
            }
            if (e.key === ' ') {
                keys.space = true;
                e.preventDefault();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        // Start game
        startBtn.addEventListener('click', () => {
            if (gameRunning) return;

            gameRunning = true;
            score = 0;
            missedTunnels = 0;
            tunnels = [];
            selectedRow = 1;
            selectedCol = 1;
            spawnTimer = 0;

            scoreDisplay.textContent = `Score: ${score}`;

            if (gameLoop) cancelAnimationFrame(gameLoop);

            function loop() {
                update();
                if (gameRunning) {
                    gameLoop = requestAnimationFrame(loop);
                }
            }
            loop();
        });

        // Draw initial state
        draw();
        console.log('[Burrow Game] Initialization complete');
    }

    // Start initialization
    initBurrowGame();
})();
