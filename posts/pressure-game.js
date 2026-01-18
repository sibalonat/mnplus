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
        const restartBtn = document.getElementById('restartPressureGame');
        const scoreDisplay = document.getElementById('pressureScore');

        console.log('[Pressure Game] Elements check:', {
            canvas: !!canvas,
            ctx: !!ctx,
            startBtn: !!startBtn,
            restartBtn: !!restartBtn,
            scoreDisplay: !!scoreDisplay
        });

        // If elements aren't found, retry
        if (!canvas || !ctx || !startBtn || !restartBtn || !scoreDisplay) {
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
        const PRESSURE_FORCE = 20; // Strong pressure for good reach
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
        const MAX_UPWARD_VELOCITY = -18; // High cap for strong upward movement
        const PRESSURE_RADIUS = 150; // Larger pressure effect radius
        const PRESSURE_INNER_RADIUS = 100; // Full strength within this radius
        const CIRCLE_DELETE_TIME = 20000; // 20 seconds in milliseconds
        const COLLISION_STIFFNESS = 0.8; // How hard circles push each other
        const MAX_POLE_CAPACITY = Math.floor(POLE_HEIGHT / (CIRCLE_RADIUS * 2)); // Max circles that fit in pole

        let circlesInPole = [];
        let gameRunning = false;
        let gameLoop = null;
        let nextCircleColor = 0; // Track color for new circles

        const keys = { left: false, right: false };

        // Available colors for new circles (excluding initial colors)
        const CIRCLE_COLORS = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#a78bfa', '#fb923c', '#22d3ee', '#f472b6', '#84cc16'];

        // Two circles starting above buttons
        const circles = [
            {
                x: BUTTON_LEFT_X,
                y: START_Y,
                vx: 0,
                vy: 0,
                color: '#ff6b6b',
                inPole: false,
                locked: false,
                mass: 1
            },
            {
                x: BUTTON_RIGHT_X,
                y: START_Y,
                vx: 0,
                vy: 0,
                color: '#4ecdc4',
                inPole: false,
                locked: false,
                mass: 1
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

        // Spawn new circle at random position
        function spawnCircle() {
            // Get next color
            const color = CIRCLE_COLORS[nextCircleColor % CIRCLE_COLORS.length];
            nextCircleColor++;

            // Random position in lower half of screen, avoiding edges
            const x = CIRCLE_RADIUS + 20 + Math.random() * (canvas.width - CIRCLE_RADIUS * 2 - 40);
            const y = canvas.height / 2 + Math.random() * (canvas.height / 2 - CIRCLE_RADIUS - 50);

            return {
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                color: color,
                inPole: false,
                locked: false,
                mass: 1
            };
        }

        // Calculate distance between two points
        function distance(x1, y1, x2, y2) {
            return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        }

        // Handle circle-to-circle collisions (no overlap)
        function handleCircleCollisions() {
            for (let i = 0; i < circles.length; i++) {
                for (let j = i + 1; j < circles.length; j++) {
                    const c1 = circles[i];
                    const c2 = circles[j];

                    if (c1.locked || c2.locked) continue;

                    const dist = distance(c1.x, c1.y, c2.x, c2.y);
                    const minDist = CIRCLE_RADIUS * 2;

                    if (dist < minDist) {
                        // Circles are overlapping, push them apart
                        const overlap = minDist - dist;
                        const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);

                        // Push apart based on mass (equal mass = equal push)
                        const totalMass = c1.mass + c2.mass;
                        const push1 = overlap * (c2.mass / totalMass);
                        const push2 = overlap * (c1.mass / totalMass);

                        c1.x -= Math.cos(angle) * push1;
                        c1.y -= Math.sin(angle) * push1;
                        c2.x += Math.cos(angle) * push2;
                        c2.y += Math.sin(angle) * push2;

                        // Apply collision response to velocities
                        const dvx = c2.vx - c1.vx;
                        const dvy = c2.vy - c1.vy;
                        const dotProduct = (dvx * Math.cos(angle) + dvy * Math.sin(angle));

                        if (dotProduct < 0) continue; // Moving apart already

                        const impulse = (2 * dotProduct) / totalMass;

                        c1.vx += impulse * c2.mass * Math.cos(angle) * COLLISION_STIFFNESS;
                        c1.vy += impulse * c2.mass * Math.sin(angle) * COLLISION_STIFFNESS;
                        c2.vx -= impulse * c1.mass * Math.cos(angle) * COLLISION_STIFFNESS;
                        c2.vy -= impulse * c1.mass * Math.sin(angle) * COLLISION_STIFFNESS;
                    }
                }
            }
        }

        // Handle collisions between active circles and pole circles
        function handlePoleCircleCollisions() {
            for (let i = 0; i < circles.length; i++) {
                const activeCircle = circles[i];
                if (activeCircle.locked) continue;

                // Allow circles to pass through pole circles if they're near pole entrance and moving up
                const isNearPoleEntrance = activeCircle.y <= POLE_Y + POLE_HEIGHT + CIRCLE_RADIUS * 3 &&
                    activeCircle.y >= POLE_Y + POLE_HEIGHT - CIRCLE_RADIUS;
                const isMovingUpward = activeCircle.vy < 0;
                const isInPoleHorizontally = activeCircle.x >= POLE_X && activeCircle.x <= POLE_X + POLE_WIDTH;

                if (isNearPoleEntrance && isMovingUpward && isInPoleHorizontally) {
                    continue; // Allow passage when entering from below
                }

                for (let j = 0; j < circlesInPole.length; j++) {
                    const poleCircle = circlesInPole[j];

                    const dist = distance(activeCircle.x, activeCircle.y, poleCircle.x, poleCircle.y);
                    const minDist = CIRCLE_RADIUS * 2;

                    if (dist < minDist) {
                        // Push the active circle away
                        const overlap = minDist - dist;
                        const angle = Math.atan2(activeCircle.y - poleCircle.y, activeCircle.x - poleCircle.x);

                        activeCircle.x += Math.cos(angle) * overlap;
                        activeCircle.y += Math.sin(angle) * overlap;

                        // Bounce effect
                        activeCircle.vx += Math.cos(angle) * 2;
                        activeCircle.vy += Math.sin(angle) * 2;
                    }
                }
            }
        }

        // Update physics
        function updatePhysics() {
            for (let i = circles.length - 1; i >= 0; i--) {
                const circle = circles[i];

                if (circle.locked) continue;

                // Apply gravity (water gravity - slower)
                circle.vy += GRAVITY;

                // Apply localized pressure forces based on proximity to buttons
                const distToLeft = distance(circle.x, circle.y, BUTTON_LEFT_X, canvas.height);
                const distToRight = distance(circle.x, circle.y, BUTTON_RIGHT_X, canvas.height);

                if (keys.left && distToLeft < PRESSURE_RADIUS) {
                    // Non-linear pressure: full strength until INNER_RADIUS, then falloff
                    let strength;
                    if (distToLeft < PRESSURE_INNER_RADIUS) {
                        strength = 1.0; // Full strength in inner zone
                    } else {
                        // Gradual falloff from inner radius to outer radius
                        const falloffDist = distToLeft - PRESSURE_INNER_RADIUS;
                        const falloffRange = PRESSURE_RADIUS - PRESSURE_INNER_RADIUS;
                        strength = 1.0 - (falloffDist / falloffRange);
                    }
                    circle.vy -= PRESSURE_FORCE * 0.5 * strength;
                    // Push to the right based on proximity
                    circle.vx += LATERAL_FORCE * strength;
                }

                if (keys.right && distToRight < PRESSURE_RADIUS) {
                    // Non-linear pressure: full strength until INNER_RADIUS, then falloff
                    let strength;
                    if (distToRight < PRESSURE_INNER_RADIUS) {
                        strength = 1.0; // Full strength in inner zone
                    } else {
                        // Gradual falloff from inner radius to outer radius
                        const falloffDist = distToRight - PRESSURE_INNER_RADIUS;
                        const falloffRange = PRESSURE_RADIUS - PRESSURE_INNER_RADIUS;
                        strength = 1.0 - (falloffDist / falloffRange);
                    }
                    circle.vy -= PRESSURE_FORCE * 0.5 * strength;
                    // Push to the left based on proximity
                    circle.vx -= LATERAL_FORCE * strength;
                }

                // Cap upward velocity to prevent circles from flying off
                if (circle.vy < MAX_UPWARD_VELOCITY) {
                    circle.vy = MAX_UPWARD_VELOCITY;
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
            }

            // Check for pole entry BEFORE collision handling
            for (let i = circles.length - 1; i >= 0; i--) {
                const circle = circles[i];
                if (circle.locked) continue;

                // Check if circle entered the pole (more lenient check)
                if (isInPoleZone(circle) && circle.vy < 0) { // Only enter if moving upward
                    // Check if there's space in the pole
                    if (circlesInPole.length < MAX_POLE_CAPACITY) {
                        circle.inPole = true;

                        // Find position in pole (stack from bottom, account for existing circles)
                        let targetY = POLE_Y + POLE_HEIGHT - CIRCLE_RADIUS;

                        // Push existing circles up if needed
                        for (let j = circlesInPole.length - 1; j >= 0; j--) {
                            const existingCircle = circlesInPole[j];
                            if (existingCircle.y > targetY - CIRCLE_RADIUS * 2) {
                                existingCircle.y -= CIRCLE_RADIUS * 2; // Push up
                                targetY = existingCircle.y - CIRCLE_RADIUS * 2;
                            }
                        }

                        // Lock circle in pole and position it
                        circle.locked = true;
                        circle.x = POLE_X + POLE_WIDTH / 2;
                        circle.y = targetY;
                        circle.vx = 0;
                        circle.vy = 0;
                        circle.enteredTime = Date.now(); // Track when it entered

                        // Add to pole array and remove from active circles
                        circlesInPole.push(circle);
                        circles.splice(i, 1);

                        // Spawn a new circle
                        circles.push(spawnCircle());

                        // Update score display
                        scoreDisplay.textContent = `Circles in Pole: ${circlesInPole.length}`;
                    } else {
                        // Pole is full, bounce the circle back down
                        circle.vy = Math.abs(circle.vy) * 0.5; // Reverse direction and dampen
                        circle.y = POLE_Y + POLE_HEIGHT + CIRCLE_RADIUS + 2; // Push below pole entrance
                    }
                }
            }

            // Handle circle collisions
            handleCircleCollisions();
            handlePoleCircleCollisions();

            // Remove circles that have been in pole for more than 1 minute
            const currentTime = Date.now();
            for (let i = circlesInPole.length - 1; i >= 0; i--) {
                const circle = circlesInPole[i];
                if (currentTime - circle.enteredTime > CIRCLE_DELETE_TIME) {
                    circlesInPole.splice(i, 1);

                    // Reposition remaining circles to fill the gap
                    for (let j = 0; j < circlesInPole.length; j++) {
                        circlesInPole[j].y = POLE_Y + POLE_HEIGHT - CIRCLE_RADIUS - (j * CIRCLE_RADIUS * 2);
                    }

                    // Update score
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
            circlesInPole.forEach((circle, index) => {
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

                // Draw timer for each circle in pole
                const timeElapsed = Date.now() - circle.enteredTime;
                const timeRemaining = CIRCLE_DELETE_TIME - timeElapsed;
                const secondsRemaining = Math.ceil(timeRemaining / 1000);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(secondsRemaining + 's', circle.x, circle.y + 4);
            });

            // Score indicator
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`In Pole: ${circlesInPole.length}`, 10, 20);

            // Active circles count
            ctx.fillStyle = '#fff';
            ctx.fillText(`Active: ${circles.length}`, 10, 40);
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
            nextCircleColor = 0;

            // Reset circles to starting positions above buttons
            circles.length = 0;
            circles.push({
                x: BUTTON_LEFT_X,
                y: START_Y,
                vx: 0,
                vy: 0,
                color: CIRCLE_COLORS[0],
                inPole: false,
                locked: false,
                mass: 1
            });
            circles.push({
                x: BUTTON_RIGHT_X,
                y: START_Y,
                vx: 0,
                vy: 0,
                color: CIRCLE_COLORS[1],
                inPole: false,
                locked: false,
                mass: 1
            });
            nextCircleColor = 2;

            startBtn.style.display = 'none';
            restartBtn.style.display = 'inline-block';

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

            // Reset all game state
            circles.length = 0;
            circlesInPole = [];
            nextCircleColor = 0;
            keys.left = false;
            keys.right = false;

            // Reset initial circles
            circles.push({
                x: BUTTON_LEFT_X,
                y: START_Y,
                vx: 0,
                vy: 0,
                color: CIRCLE_COLORS[0],
                inPole: false,
                locked: false,
                mass: 1
            });
            circles.push({
                x: BUTTON_RIGHT_X,
                y: START_Y,
                vx: 0,
                vy: 0,
                color: CIRCLE_COLORS[1],
                inPole: false,
                locked: false,
                mass: 1
            });
            nextCircleColor = 2;

            // Update UI
            scoreDisplay.textContent = 'Circles in Pole: 0';
            drawInitial();

            // Start game again
            startGame();
        }

        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', resetGame);

        // Draw initial state
        drawInitial();

        gameInitialized = true;
        console.log('[Pressure Game] ✓ Initialized successfully!');
    }

    // Try to initialize immediately
    console.log('[Pressure Game] Script loaded, attempting init...');
    setTimeout(initPressureGame, 100);
})();
