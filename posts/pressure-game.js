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
        const GRAVITY = 0.08; // Slower gravity for water simulation
        const PRESSURE_FORCE = 5;
        const LATERAL_FORCE = 1.8;
        const DAMPING = 0.95; // More damping for water resistance
        const CIRCLE_RADIUS = 15;
        const POLE_WIDTH = 70;
        const POLE_HEIGHT = 100; // Pole at the top
        const POLE_X = (canvas.width - POLE_WIDTH) / 2;
        const POLE_Y = 0; // Start at top
        const BUTTON_LEFT_X = 50; // Position above left button
        const BUTTON_RIGHT_X = canvas.width - 50; // Position above right button
        const START_Y = canvas.height - 50; // Circles start near bottom

        let circlesInPole = [];
        let gameRunning = false;
        let gameLoop = null;

        const keys = { left: false, right: false };

        // Two circles starting above buttons
        const circles = [
            {
                x: BUTTON_LEFT_X,
                y: START_Y,
                vx: 0,
                vy: 0,
                color: '#ff6b6b',
                inPole: false,
                locked: false
            },
            {
                x: BUTTON_RIGHT_X,
                y: START_Y,
                vx: 0,
                vy: 0,
                color: '#4ecdc4',
                inPole: false,
                locked: false
            }
        ];

        // Draw initial state
        function drawInitial() {
            // Background - ocean theme
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw water effect
            ctx.fillStyle = 'rgba(0, 100, 150, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw pole at top
            drawPole();

            // Ground pressure indicators
            drawPressureIndicators(0, 0);

            // Circles
            circles.forEach(circle => {
                if (!circle.locked) {
                    ctx.fillStyle = circle.color;
                    ctx.beginPath();
                    ctx.arc(circle.x, circle.y, CIRCLE_RADIUS, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            // Locked circles in pole
            circlesInPole.forEach(circle => {
                ctx.fillStyle = circle.color;
                ctx.beginPath();
                ctx.arc(circle.x, circle.y, CIRCLE_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 3;
                ctx.stroke();
            });
        }

        // Draw the pole at the top
        function drawPole() {
            // Pole container
            ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
            ctx.fillRect(POLE_X, POLE_Y, POLE_WIDTH, POLE_HEIGHT);

            // Pole walls
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 3;
            ctx.strokeRect(POLE_X, POLE_Y, POLE_WIDTH, POLE_HEIGHT);

            // Pole opening at bottom
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(POLE_X, POLE_Y + POLE_HEIGHT);
            ctx.lineTo(POLE_X + POLE_WIDTH, POLE_Y + POLE_HEIGHT);
            ctx.stroke();

            // Label
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GOAL', POLE_X + POLE_WIDTH / 2, POLE_Y + POLE_HEIGHT + 15);
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

        // Check if circle is in pole zone
        function isInPoleZone(circle) {
            return circle.x >= POLE_X + CIRCLE_RADIUS &&
                circle.x <= POLE_X + POLE_WIDTH - CIRCLE_RADIUS &&
                circle.y >= POLE_Y &&
                circle.y <= POLE_Y + POLE_HEIGHT;
        }

        // Check collision with pole walls (can't pass through)
        function checkPoleCollision(circle) {
            const poleLeft = POLE_X;
            const poleRight = POLE_X + POLE_WIDTH;
            const poleBottom = POLE_Y + POLE_HEIGHT;

            // If circle is near pole opening and not inside
            if (circle.y < poleBottom + CIRCLE_RADIUS &&
                circle.y > POLE_Y - CIRCLE_RADIUS) {

                // Bounce off left wall
                if (circle.x + CIRCLE_RADIUS > poleLeft &&
                    circle.x < poleLeft &&
                    !isInPoleZone(circle)) {
                    circle.x = poleLeft - CIRCLE_RADIUS;
                    circle.vx *= -0.6;
                }

                // Bounce off right wall
                if (circle.x - CIRCLE_RADIUS < poleRight &&
                    circle.x > poleRight &&
                    !isInPoleZone(circle)) {
                    circle.x = poleRight + CIRCLE_RADIUS;
                    circle.vx *= -0.6;
                }
            }
        }

        // Spawn new circle at button position
        function spawnCircle(buttonSide) {
            const x = buttonSide === 'left' ? BUTTON_LEFT_X : BUTTON_RIGHT_X;
            const color = buttonSide === 'left' ? '#ff6b6b' : '#4ecdc4';

            return {
                x: x,
                y: START_Y,
                vx: 0,
                vy: 0,
                color: color,
                inPole: false,
                locked: false
            };
        }

        // Update physics
        function updatePhysics() {
            for (let i = circles.length - 1; i >= 0; i--) {
                const circle = circles[i];

                if (circle.locked) continue;

                // Apply gravity (water gravity - slower)
                circle.vy += GRAVITY;

                // Apply pressure forces
                if (keys.left) {
                    circle.vy -= PRESSURE_FORCE * 0.2;
                    // Push to the right
                    circle.vx += LATERAL_FORCE;
                }
                if (keys.right) {
                    circle.vy -= PRESSURE_FORCE * 0.2;
                    // Push to the left
                    circle.vx -= LATERAL_FORCE;
                }

                // Apply damping (water resistance)
                circle.vx *= DAMPING;
                circle.vy *= DAMPING;

                // Update position
                circle.x += circle.vx;
                circle.y += circle.vy;

                // Check pole collision first
                checkPoleCollision(circle);

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

                // Check if circle entered the pole
                if (isInPoleZone(circle)) {
                    circle.inPole = true;

                    // Lock circle in pole and position it
                    const stackPosition = circlesInPole.length;
                    circle.locked = true;
                    circle.x = POLE_X + POLE_WIDTH / 2;
                    circle.y = POLE_Y + POLE_HEIGHT - CIRCLE_RADIUS - (stackPosition * CIRCLE_RADIUS * 2);
                    circle.vx = 0;
                    circle.vy = 0;

                    // Add to pole array and remove from active circles
                    circlesInPole.push(circle);
                    circles.splice(i, 1);

                    // Update score display
                    scoreDisplay.textContent = `Circles in Pole: ${circlesInPole.length}`;
                }
            }
        }

        // Draw function
        function draw() {
            // Background - ocean theme
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Water effect
            ctx.fillStyle = 'rgba(0, 100, 150, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw pole
            drawPole();

            // Pressure indicators
            const leftPressure = keys.left ? 1 : 0;
            const rightPressure = keys.right ? 1 : 0;
            drawPressureIndicators(leftPressure, rightPressure);

            // Draw active circles
            circles.forEach(circle => {
                if (!circle.locked) {
                    // Glow effect when moving fast
                    if (Math.abs(circle.vy) > 1) {
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = circle.color;
                    }

                    ctx.fillStyle = circle.color;
                    ctx.beginPath();
                    ctx.arc(circle.x, circle.y, CIRCLE_RADIUS, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.shadowBlur = 0;

                    // Velocity vectors
                    if (Math.abs(circle.vx) > 0.5 || Math.abs(circle.vy) > 0.5) {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(circle.x, circle.y);
                        ctx.lineTo(circle.x + circle.vx * 4, circle.y + circle.vy * 4);
                        ctx.stroke();
                    }
                }
            });

            // Draw locked circles in pole
            circlesInPole.forEach(circle => {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00ff88';

                ctx.fillStyle = circle.color;
                ctx.beginPath();
                ctx.arc(circle.x, circle.y, CIRCLE_RADIUS, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.shadowBlur = 0;
            });

            // Score indicator
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`In Pole: ${circlesInPole.length}`, 10, 20);
        }

        // Main game loop
        function update() {
            if (!gameRunning) return;

            updatePhysics();
            draw();

            gameLoop = requestAnimationFrame(update);
        }

        // Start game
        function startGame() {
            console.log('[Pressure Game] Start button clicked!');

            gameRunning = true;
            circlesInPole = [];

            // Reset circles to starting positions above buttons
            circles.length = 0;
            circles.push(spawnCircle('left'));
            circles.push(spawnCircle('right'));

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
