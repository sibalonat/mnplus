// pressure-game.js - Pressure Physics Simulator
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initPressureGame() {
        console.log('[Pressure Game] Initializing... Attempt:', retryCount + 1);

        const canvas = document.getElementById('pressureGame');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startPressureGame');
        const scoreDisplay = document.getElementById('pressureScore');

        console.log('[Pressure Game] Elements check:', {
            canvas: !!canvas,
            ctx: !!ctx,
            startBtn: !!startBtn,
            scoreDisplay: !!scoreDisplay
        });

        // If elements aren't found, retry
        if (!canvas || !ctx || !startBtn || !scoreDisplay) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initPressureGame, 200);
                return;
            }
            console.error('[Pressure Game] Failed to find elements after max retries');
            return;
        }

        // Only initialize once
        if (gameInitialized) {
            console.log('[Pressure Game] Already initialized, skipping');
            return;
        }

        console.log('[Pressure Game] Starting initialization...');

        // GAME CONSTANTS
        const GRAVITY = 0.3;
        const PRESSURE_FORCE = 8;
        const LATERAL_FORCE = 2.5;
        const DAMPING = 0.98;
        const CIRCLE_RADIUS = 15;
        const TARGET_ZONE_WIDTH = 60;
        const TARGET_ZONE_X = (canvas.width - TARGET_ZONE_WIDTH) / 2;

        // GAME VARIABLES
        let gameRunning = false;
        let score = 0;
        let gameLoop = null;
        let timeInZone = 0;

        const keys = { left: false, right: false };

        // Two circles
        const circles = [
            {
                x: 100,
                y: 100,
                vx: 0,
                vy: 0,
                color: '#ff6b6b',
                inZone: false
            },
            {
                x: 200,
                y: 100,
                vx: 0,
                vy: 0,
                color: '#4ecdc4',
                inZone: false
            }
        ];

        // Draw initial state
        function drawInitial() {
            // Background
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Target zone
            ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
            ctx.fillRect(TARGET_ZONE_X, 0, TARGET_ZONE_WIDTH, canvas.height);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(TARGET_ZONE_X, 0, TARGET_ZONE_WIDTH, canvas.height);
            ctx.setLineDash([]);

            // Target zone label
            ctx.fillStyle = '#00ff88';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('TARGET', canvas.width / 2, 20);

            // Ground pressure indicators
            drawPressureIndicators(0, 0);

            // Circles
            circles.forEach(circle => {
                ctx.fillStyle = circle.color;
                ctx.beginPath();
                ctx.arc(circle.x, circle.y, CIRCLE_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        }

        // Draw pressure indicators at the bottom
        function drawPressureIndicators(leftPressure, rightPressure) {
            const bottomY = canvas.height - 10;

            // Left pressure indicator
            if (leftPressure > 0) {
                ctx.fillStyle = `rgba(255, 107, 107, ${leftPressure})`;
                ctx.fillRect(20, bottomY - leftPressure * 30, 60, leftPressure * 30);
            }
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            ctx.strokeRect(20, bottomY - 30, 60, 30);
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('LEFT', 50, bottomY + 15);

            // Right pressure indicator
            if (rightPressure > 0) {
                ctx.fillStyle = `rgba(78, 205, 196, ${rightPressure})`;
                ctx.fillRect(canvas.width - 80, bottomY - rightPressure * 30, 60, rightPressure * 30);
            }
            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width - 80, bottomY - 30, 60, 30);
            ctx.fillStyle = '#4ecdc4';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('RIGHT', canvas.width - 50, bottomY + 15);
        }

        // Keyboard controls
        function handleKeyDown(e) {
            if (e.key === 'ArrowLeft') keys.left = true;
            if (e.key === 'ArrowRight') keys.right = true;
        }

        function handleKeyUp(e) {
            if (e.key === 'ArrowLeft') keys.left = false;
            if (e.key === 'ArrowRight') keys.right = false;
        }

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Check if circle is in target zone
        function isInTargetZone(circle) {
            return circle.x >= TARGET_ZONE_X + CIRCLE_RADIUS &&
                circle.x <= TARGET_ZONE_X + TARGET_ZONE_WIDTH - CIRCLE_RADIUS;
        }

        // Update physics
        function updatePhysics() {
            circles.forEach(circle => {
                // Apply gravity
                circle.vy += GRAVITY;

                // Apply pressure forces
                if (keys.left) {
                    circle.vy -= PRESSURE_FORCE * 0.3;
                    // Push to the right
                    circle.vx += LATERAL_FORCE;
                }
                if (keys.right) {
                    circle.vy -= PRESSURE_FORCE * 0.3;
                    // Push to the left
                    circle.vx -= LATERAL_FORCE;
                }

                // Apply damping (air resistance)
                circle.vx *= DAMPING;
                circle.vy *= DAMPING;

                // Update position
                circle.x += circle.vx;
                circle.y += circle.vy;

                // Boundary collisions
                if (circle.x < CIRCLE_RADIUS) {
                    circle.x = CIRCLE_RADIUS;
                    circle.vx *= -0.5;
                }
                if (circle.x > canvas.width - CIRCLE_RADIUS) {
                    circle.x = canvas.width - CIRCLE_RADIUS;
                    circle.vx *= -0.5;
                }
                if (circle.y > canvas.height - CIRCLE_RADIUS) {
                    circle.y = canvas.height - CIRCLE_RADIUS;
                    circle.vy *= -0.3;
                }
                if (circle.y < CIRCLE_RADIUS) {
                    circle.y = CIRCLE_RADIUS;
                    circle.vy *= -0.3;
                }

                // Check if in target zone
                circle.inZone = isInTargetZone(circle);
            });

            // Score if both circles in zone
            if (circles[0].inZone && circles[1].inZone) {
                timeInZone++;
                score += 10;
            } else {
                timeInZone = 0;
            }
        }

        // Draw everything
        function draw() {
            // Background
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Target zone
            const zoneAlpha = (circles[0].inZone && circles[1].inZone) ? 0.3 : 0.1;
            ctx.fillStyle = `rgba(0, 255, 136, ${zoneAlpha})`;
            ctx.fillRect(TARGET_ZONE_X, 0, TARGET_ZONE_WIDTH, canvas.height);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(TARGET_ZONE_X, 0, TARGET_ZONE_WIDTH, canvas.height);
            ctx.setLineDash([]);

            // Target zone label
            ctx.fillStyle = '#00ff88';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('TARGET', canvas.width / 2, 20);

            // Pressure indicators
            const leftPressure = keys.left ? 1 : 0;
            const rightPressure = keys.right ? 1 : 0;
            drawPressureIndicators(leftPressure, rightPressure);

            // Draw circles
            circles.forEach(circle => {
                // Glow effect if in zone
                if (circle.inZone) {
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = circle.color;
                }

                ctx.fillStyle = circle.color;
                ctx.beginPath();
                ctx.arc(circle.x, circle.y, CIRCLE_RADIUS, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = circle.inZone ? '#fff' : '#666';
                ctx.lineWidth = circle.inZone ? 3 : 2;
                ctx.stroke();

                ctx.shadowBlur = 0;

                // Velocity vectors (debug visualization)
                if (Math.abs(circle.vx) > 0.5 || Math.abs(circle.vy) > 0.5) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(circle.x, circle.y);
                    ctx.lineTo(circle.x + circle.vx * 3, circle.y + circle.vy * 3);
                    ctx.stroke();
                }
            });

            // Combo indicator
            if (timeInZone > 0) {
                ctx.fillStyle = '#00ff88';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`COMBO: ${Math.floor(timeInZone / 10)}`, canvas.width / 2, 50);
            }
        }

        // Main game loop
        function update() {
            if (!gameRunning) return;

            updatePhysics();
            draw();

            scoreDisplay.textContent = `Score: ${score}`;

            gameLoop = requestAnimationFrame(update);
        }

        // Start game
        function startGame() {
            console.log('[Pressure Game] Start button clicked!');

            // Stop any existing game loop
            if (gameLoop) {
                cancelAnimationFrame(gameLoop);
                gameLoop = null;
            }

            gameRunning = true;
            score = 0;
            timeInZone = 0;

            // Reset circles to starting positions
            circles[0].x = 100;
            circles[0].y = 100;
            circles[0].vx = 0;
            circles[0].vy = 0;

            circles[1].x = 200;
            circles[1].y = 100;
            circles[1].vx = 0;
            circles[1].vy = 0;

            startBtn.textContent = 'Running...';
            startBtn.disabled = true;

            console.log('[Pressure Game] Simulation starting...');
            update();
        }

        // Reset game
        function resetGame() {
            gameRunning = false;
            if (gameLoop) {
                cancelAnimationFrame(gameLoop);
                gameLoop = null;
            }
            startBtn.textContent = 'Start Simulation';
            startBtn.disabled = false;
        }

        startBtn.addEventListener('click', startGame);

        // Draw initial state
        drawInitial();

        gameInitialized = true;
        console.log('[Pressure Game] ✓ Initialized successfully!');
    }

    // Try to initialize immediately
    console.log('[Pressure Game] Script loaded, attempting init...');
    setTimeout(initPressureGame, 100);
})();
