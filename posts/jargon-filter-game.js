// jargon-filter-game.js - The Jargon Filter Game
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initJargonGame() {
        console.log('[Jargon Game] Initializing... Attempt:', retryCount + 1);

        const canvas = document.getElementById('jargonGame');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startJargonGame');
        const scoreDisplay = document.getElementById('jargonScore');
        const livesDisplay = document.getElementById('jargonLives');

        console.log('[Jargon Game] Elements check:', {
            canvas: !!canvas,
            ctx: !!ctx,
            startBtn: !!startBtn,
            scoreDisplay: !!scoreDisplay,
            livesDisplay: !!livesDisplay
        });

        // If elements aren't found, retry
        if (!canvas || !ctx || !startBtn || !scoreDisplay || !livesDisplay) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initJargonGame, 200);
                return;
            }
            console.error('[Jargon Game] Failed to find elements after max retries');
            return;
        }

        // Only initialize once
        if (gameInitialized) {
            console.log('[Jargon Game] Already initialized, skipping');
            return;
        }

        console.log('[Jargon Game] Starting initialization...');
        gameInitialized = true;

        // GAME VARIABLES
        let gameRunning = false;
        let score = 0;
        let lives = 3;
        let gameTime = 0;
        let maxGameTime = 60; // 60 seconds
        let gameLoop = null;
        let terms = [];
        let nextTermSpawn = 0;
        let spawnInterval = 2000; // milliseconds
        let lastTimestamp = 0;

        // Term definitions
        const JARGON_TERMS = [
            'Quantum Hermeneutics',
            'Transgressive Differentiability',
            'Post-structural Algorithms',
            'Deconstructive Polymorphism',
            'Rhizomatic API Gateway',
            'Nomadic Code Singularity',
            'Hypertext Deconstruction',
            'Performative Iteration',
            'Morphological Syntax Tree',
            'Non-linear Blockchain',
            'Paradigmatic Recursion',
            'Semiotic Git Workflow',
            'Liminal State Management',
            'Postmodern REST Protocol'
        ];

        const REAL_TERMS = [
            'Machine Learning',
            'Polymorphism',
            'API Endpoint',
            'Git Repository',
            'Neural Network',
            'Async/Await',
            'DOM Manipulation',
            'Binary Search',
            'Hash Table',
            'Dependency Injection',
            'Microservices',
            'TypeScript',
            'React Component',
            'SQL Query'
        ];

        class Term {
            constructor(text, isJargon) {
                this.text = text;
                this.isJargon = isJargon;
                this.x = Math.random() * (canvas.width - 150) + 25;
                this.y = canvas.height + 50;
                this.speed = 0.5 + Math.random() * 0.5;
                this.width = 140;
                this.height = 40;
                this.rotation = (Math.random() - 0.5) * 0.1;
                this.marked = false;
                this.markTime = 0;
            }

            update(deltaTime) {
                this.y -= this.speed * deltaTime / 16.67;
            }

            draw(ctx) {
                ctx.save();
                ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                ctx.rotate(this.rotation);

                // Card background
                if (this.marked) {
                    ctx.fillStyle = this.isJargon ? '#27ae60' : '#e74c3c';
                } else {
                    ctx.fillStyle = '#2c3e50';
                }
                ctx.strokeStyle = '#ecf0f1';
                ctx.lineWidth = 2;
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

                // Text
                ctx.fillStyle = '#ecf0f1';
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Wrap text if too long
                const words = this.text.split(' ');
                if (words.length > 2) {
                    ctx.fillText(words.slice(0, 2).join(' '), 0, -5);
                    ctx.fillText(words.slice(2).join(' '), 0, 8);
                } else {
                    ctx.fillText(this.text, 0, 0);
                }

                // REJECTED stamp
                if (this.marked) {
                    ctx.font = 'bold 16px Arial';
                    ctx.fillStyle = this.isJargon ? '#27ae60' : '#e74c3c';
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.strokeText('REJECTED', 0, 0);
                    ctx.fillText('REJECTED', 0, 0);
                }

                ctx.restore();
            }

            contains(x, y) {
                return x >= this.x && x <= this.x + this.width &&
                    y >= this.y && y <= this.y + this.height;
            }
        }

        function spawnTerm() {
            const isJargon = Math.random() < 0.5;
            const termList = isJargon ? JARGON_TERMS : REAL_TERMS;
            const text = termList[Math.floor(Math.random() * termList.length)];
            terms.push(new Term(text, isJargon));
        }

        function drawGame() {
            // Background
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Acceptance line (danger zone at top)
            ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.fillRect(0, 0, canvas.width, 50);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 50);
            ctx.lineTo(canvas.width, 50);
            ctx.stroke();

            // Draw terms
            terms.forEach(term => term.draw(ctx));

            // Time bar
            const timeBarWidth = (gameTime / maxGameTime) * canvas.width;
            ctx.fillStyle = gameTime > maxGameTime * 0.8 ? '#e74c3c' : '#3498db';
            ctx.fillRect(0, canvas.height - 10, canvas.width - timeBarWidth, 10);
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(canvas.width - timeBarWidth, canvas.height - 10, timeBarWidth, 10);
        }

        function updateGame(timestamp) {
            if (!gameRunning) return;

            const deltaTime = lastTimestamp ? timestamp - lastTimestamp : 16.67;
            lastTimestamp = timestamp;

            gameTime += deltaTime / 1000;

            // Check if game over (time)
            if (gameTime >= maxGameTime) {
                endGame();
                return;
            }

            // Check if game over (lives)
            if (lives <= 0) {
                endGame();
                return;
            }

            // Spawn new terms
            if (timestamp > nextTermSpawn) {
                spawnTerm();
                nextTermSpawn = timestamp + spawnInterval;

                // Increase difficulty
                if (spawnInterval > 800) {
                    spawnInterval -= 50;
                }
            }

            // Update terms
            for (let i = terms.length - 1; i >= 0; i--) {
                const term = terms[i];
                term.update(deltaTime);

                // Remove marked terms after animation
                if (term.marked) {
                    term.markTime += deltaTime;
                    if (term.markTime > 500) {
                        terms.splice(i, 1);
                    }
                    continue;
                }

                // Check if term reached acceptance line
                if (term.y < 50) {
                    if (term.isJargon) {
                        // Jargon passed through - lose life
                        lives--;
                        score -= 20;
                        updateDisplays();
                    } else {
                        // Real term passed through - good!
                        score += 5;
                    }
                    terms.splice(i, 1);
                }

                // Remove terms that went off screen
                if (term.y < -100) {
                    terms.splice(i, 1);
                }
            }

            drawGame();
            gameLoop = requestAnimationFrame(updateGame);
        }

        function handleClick(e) {
            if (!gameRunning) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check if clicked on any term
            for (let i = terms.length - 1; i >= 0; i--) {
                const term = terms[i];
                if (!term.marked && term.contains(x, y)) {
                    term.marked = true;

                    if (term.isJargon) {
                        // Correctly rejected jargon
                        score += 10;
                    } else {
                        // Wrongly rejected real term
                        score -= 15;
                        lives--;
                    }
                    updateDisplays();
                    break;
                }
            }
        }

        function updateDisplays() {
            scoreDisplay.textContent = `Score: ${score}`;
            livesDisplay.textContent = `Lives: ${lives}`;

            if (lives <= 0) {
                livesDisplay.style.color = '#e74c3c';
            }
        }

        function startGame() {
            if (gameRunning) return;

            // Reset game state
            gameRunning = true;
            score = 0;
            lives = 3;
            gameTime = 0;
            terms = [];
            nextTermSpawn = 0;
            spawnInterval = 2000;
            lastTimestamp = 0;

            updateDisplays();
            startBtn.textContent = 'Game Running...';
            startBtn.disabled = true;
            livesDisplay.style.color = '#00ff88';

            gameLoop = requestAnimationFrame(updateGame);
        }

        function endGame() {
            gameRunning = false;
            if (gameLoop) {
                cancelAnimationFrame(gameLoop);
            }

            // Draw final screen
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

            ctx.font = '18px Arial';
            ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);

            let message = '';
            if (score > 200) message = 'Expert Reviewer! 🏆';
            else if (score > 100) message = 'Good Job! 👍';
            else if (score > 0) message = 'Keep Practicing! 📚';
            else message = 'Need More Coffee? ☕';

            ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 40);

            startBtn.textContent = 'Play Again';
            startBtn.disabled = false;
        }

        // Event listeners
        startBtn.addEventListener('click', startGame);
        canvas.addEventListener('click', handleClick);

        // Draw initial state
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('The Jargon Filter', canvas.width / 2, canvas.height / 2 - 40);

        ctx.font = '14px Arial';
        ctx.fillText('Click nonsensical jargon', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Let real terms pass through', canvas.width / 2, canvas.height / 2 + 25);
        ctx.fillText('Click START to begin!', canvas.width / 2, canvas.height / 2 + 60);

        updateDisplays();

        console.log('[Jargon Game] Initialization complete');
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initJargonGame);
    } else {
        initJargonGame();
    }
})();
