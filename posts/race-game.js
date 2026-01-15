// race-game.js - Simple 90s Racing Game
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initRaceGame() {
        console.log('[Race Game] Initializing... Attempt:', retryCount + 1);

        const canvas = document.getElementById('raceGame');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startGame');
        const scoreDisplay = document.getElementById('gameScore');

        console.log('[Race Game] Elements check:', {
            canvas: !!canvas,
            ctx: !!ctx,
            startBtn: !!startBtn,
            scoreDisplay: !!scoreDisplay
        });

        // If elements aren't found, retry
        if (!canvas || !ctx || !startBtn || !scoreDisplay) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initRaceGame, 200);
                return;
            }
            console.error('[Race Game] Failed to find elements after max retries');
            return;
        }

        // Only initialize once
        if (gameInitialized) {
            console.log('[Race Game] Already initialized, skipping');
            return;
        }

        console.log('[Race Game] Starting initialization...');

        // GAME VARIABLES
        let gameRunning = false;
        let score = 0;
        let carX = 135;
        let carY = 320;
        let roadOffset = 0;
        let speed = 2;
        let gameLoop = null;

        const keys = { left: false, right: false };
        const roadLeft = 50;
        const roadRight = 250;

        // Draw initial state
        function drawInitial() {
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#333';
            ctx.fillRect(roadLeft, 0, roadRight - roadLeft, canvas.height);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(carX, carY, 30, 50);
            ctx.fillStyle = '#3498db';
            ctx.fillRect(carX + 5, carY + 5, 20, 15);
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

        function drawRoad() {
            ctx.fillStyle = '#333';
            ctx.fillRect(roadLeft, 0, roadRight - roadLeft, canvas.height);

            // Road lines
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            for (let i = 0; i < 10; i++) {
                const y = (i * 80 + roadOffset) % canvas.height;
                ctx.beginPath();
                ctx.moveTo(150, y);
                ctx.lineTo(150, y + 40);
                ctx.stroke();
            }

            // Road edges
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(roadLeft, 0);
            ctx.lineTo(roadLeft, canvas.height);
            ctx.moveTo(roadRight, 0);
            ctx.lineTo(roadRight, canvas.height);
            ctx.stroke();
        }

        function drawCar() {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(carX, carY, 30, 50);
            ctx.fillStyle = '#3498db';
            ctx.fillRect(carX + 5, carY + 5, 20, 15);
        }

        function update() {
            if (!gameRunning) return;

            // Move car
            if (keys.left && carX > roadLeft + 10) carX -= 3;
            if (keys.right && carX < roadRight - 40) carX += 3;

            // Check if car is on road
            if (carX < roadLeft || carX + 30 > roadRight) {
                gameOver();
                return;
            }

            // Update road
            roadOffset += speed;
            score += Math.floor(speed);
            speed += 0.001;

            scoreDisplay.textContent = `Score: ${Math.floor(score)}`;

            // Draw
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawRoad();
            drawCar();

            gameLoop = requestAnimationFrame(update);
        }

        function gameOver() {
            gameRunning = false;
            if (gameLoop) {
                cancelAnimationFrame(gameLoop);
                gameLoop = null;
            }
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
            ctx.font = '20px Arial';
            ctx.fillText(`Final Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 40);
            startBtn.textContent = 'Play Again';
            startBtn.disabled = false;
        }

        function startGame() {
            console.log('[Race Game] Start button clicked!');

            // Stop any existing game loop
            if (gameLoop) {
                cancelAnimationFrame(gameLoop);
                gameLoop = null;
            }

            gameRunning = true;
            score = 0;
            speed = 2;
            carX = 135;
            roadOffset = 0;
            startBtn.textContent = 'Playing...';
            startBtn.disabled = true;

            console.log('[Race Game] Game loop starting...');
            // Start the game loop
            update();
        }

        startBtn.addEventListener('click', startGame);

        // Draw initial state
        drawInitial();

        gameInitialized = true;
        console.log('[Race Game] ✓ Initialized successfully!');
    }

    // Try to initialize immediately
    console.log('[Race Game] Script loaded, attempting init...');
    setTimeout(initRaceGame, 100);
})();