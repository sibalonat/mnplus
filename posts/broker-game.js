// broker-game.js - Information Broker: A Falldown Game
// Navigate through AI statements - false ones crack, true ones hold
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initBrokerGame() {
        console.log('[Broker Game] Initializing... Attempt:', retryCount + 1);

        const canvas = document.getElementById('brokerGame');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startBrokerGame');
        const scoreDisplay = document.getElementById('brokerScore');

        if (!canvas || !ctx || !startBtn || !scoreDisplay) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initBrokerGame, 200);
                return;
            }
            console.error('[Broker Game] Failed to find elements after max retries');
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = canvas.width;   // 300
        const H = canvas.height;  // 400

        // --- Constants ---
        const GRAVITY = 0.22;
        const MOVE_ACCEL = 0.6;
        const MAX_HSPEED = 4.5;
        const FRICTION = 0.82;
        const BALL_R = 7;
        const PLAT_H = 14;
        const PLAT_SPACING = 115;   // ~3 platforms visible
        const PLAT_W_MIN = 90;
        const PLAT_W_MAX = 160;
        const SCROLL_BASE = 0.55;

        // --- State ---
        let gameRunning = false;
        let gameLoop = null;
        let score = 0;
        let level = 1;
        let scrollSpeed = SCROLL_BASE;
        let platforms = [];
        let ball = {};
        let keys = { left: false, right: false };
        let particles = [];
        let falseFound = 0;

        // True AI statements — solid ground (factual)
        const TRUE_STATEMENTS = [
            'LLMs predict next tokens',
            'AI needs training data',
            'Neural nets use weights',
            'GPT is a transformer',
            'AI can hallucinate facts',
            'Models have context limits',
            'Training uses backprop',
            'AI lacks consciousness',
            'Bias lives in training data',
            'Prompts shape AI output',
            'Models compress patterns',
            'Fine-tuning adapts models',
            'Output is probabilistic',
            'Embeddings encode meaning',
            'AI mimics understanding',
            'Attention drives transformers',
            'Tokenizers split text',
            'Loss function guides training',
            'Overfitting is a real risk',
            'Data quality matters most',
        ];

        // False AI statements — no solid ground (sound convincing but wrong)
        const FALSE_STATEMENTS = [
            'AI fully understands context',
            'LLMs store facts like a DB',
            'AI will replace all coders',
            'Models truly reason logically',
            'AI has live internet access',
            'Bigger models always win',
            'AI code is always bug-free',
            'AI understands your intent',
            'Models learn during chats',
            'AI output is always factual',
            'AI knows what it ignores',
            'Models have real memory',
            'AI verifies its own claims',
            'LLMs understand causation',
            'AI creativity matches ours',
            'AI reads between the lines',
            'Models improve with every use',
            'AI opinions are objective',
            'LLMs can feel uncertainty',
            'AI replaces critical thinking',
        ];

        // --- Helpers ---
        function resetBall() {
            ball = { x: W / 2, y: 40, vx: 0, vy: 0, onPlatform: null };
        }

        function createPlatform(y) {
            // Each row: one single platform bar
            // Either no text (solid safe ground) or false AI text (cracks)
            var isFalse = Math.random() < 0.4;
            var text = '';
            if (isFalse) {
                text = FALSE_STATEMENTS[Math.floor(Math.random() * FALSE_STATEMENTS.length)];
            }
            var platW = PLAT_W_MIN + Math.random() * (PLAT_W_MAX - PLAT_W_MIN);
            platW = Math.min(platW, W - 20);
            var platX = 10 + Math.random() * (W - platW - 20);

            return {
                y: y,
                x: platX,
                w: platW,
                text: text,
                isFalse: isFalse,
                cracked: false,
                crackTime: 0,
                opacity: 1,
            };
        }

        function initPlatforms() {
            platforms = [];
            for (let i = 1; i <= 5; i++) {
                platforms.push(createPlatform(80 + i * PLAT_SPACING));
            }
        }

        function spawnParticles(x, y) {
            for (let i = 0; i < 10; i++) {
                particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 4,
                    life: 25 + Math.random() * 20,
                    maxLife: 45,
                });
            }
        }

        // --- Input ---
        function handleKeyDown(e) {
            if (e.key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
            if (e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
        }
        function handleKeyUp(e) {
            if (e.key === 'ArrowLeft') keys.left = false;
            if (e.key === 'ArrowRight') keys.right = false;
        }

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Touch: tap left half = go left, right half = go right
        canvas.addEventListener('touchstart', function (e) {
            e.preventDefault();
            var touch = e.touches[0];
            var rect = canvas.getBoundingClientRect();
            var x = (touch.clientX - rect.left) / rect.width * W;
            if (x < W / 2) keys.left = true;
            else keys.right = true;
        }, { passive: false });
        canvas.addEventListener('touchend', function (e) {
            e.preventDefault();
            keys.left = false;
            keys.right = false;
        }, { passive: false });

        // --- Game Loop ---
        function update() {
            if (!gameRunning) return;

            // Physics
            if (keys.left) ball.vx -= MOVE_ACCEL;
            if (keys.right) ball.vx += MOVE_ACCEL;
            ball.vx = Math.max(-MAX_HSPEED, Math.min(MAX_HSPEED, ball.vx));
            if (!keys.left && !keys.right) ball.vx *= FRICTION;

            ball.vy += GRAVITY;
            ball.x += ball.vx;
            ball.y += ball.vy;

            // Wrap horizontal
            if (ball.x < -BALL_R) ball.x = W + BALL_R;
            if (ball.x > W + BALL_R) ball.x = -BALL_R;

            // Floor — game over if you fall to the bottom
            if (ball.y + BALL_R > H) {
                endGame();
                return;
            }

            // Scroll platforms upward
            for (var i = 0; i < platforms.length; i++) {
                var p = platforms[i];
                p.y -= scrollSpeed;

                if (p.cracked) {
                    p.crackTime++;
                    if (p.crackTime > 12) {
                        p.opacity = Math.max(0, p.opacity - 0.06);
                    }
                }
            }

            // Collision: ball vs platforms
            ball.onPlatform = null;

            for (var i = 0; i < platforms.length; i++) {
                var p = platforms[i];
                if (p.cracked && p.opacity <= 0) continue;

                // Check if ball is horizontally over this platform
                var onPlat = ball.x + BALL_R > p.x && ball.x - BALL_R < p.x + p.w;

                // Ball landing on platform from above
                if (onPlat &&
                    ball.vy >= 0 &&
                    ball.y + BALL_R >= p.y &&
                    ball.y + BALL_R <= p.y + PLAT_H + ball.vy + 2) {

                    if (p.isFalse && !p.cracked) {
                        // FALSE statement — cracks! No solid ground.
                        p.cracked = true;
                        spawnParticles(ball.x, p.y);
                        score += 8;
                        falseFound++;
                        // Ball falls through with a slight bump
                        ball.vy = 1;
                    } else if (!p.cracked) {
                        // Safe platform — solid ground
                        ball.y = p.y - BALL_R;
                        ball.vy = 0;
                        ball.onPlatform = p;
                    }
                }
            }

            // If sitting on a platform, ride upward with it
            if (ball.onPlatform) {
                var p = ball.onPlatform;
                ball.y = p.y - BALL_R;

                // Check if ball walked off the edge
                var onPlat = ball.x + BALL_R > p.x && ball.x - BALL_R < p.x + p.w;
                if (!onPlat) {
                    ball.onPlatform = null;
                    ball.vy = 0.5;
                }
            }

            // Ceiling check — game over
            if (ball.y - BALL_R <= 2) {
                endGame();
                return;
            }

            // Remove off-screen platforms & spawn new ones
            platforms = platforms.filter(function (p) { return p.y > -PLAT_H * 2; });

            var maxY = 0;
            for (var i = 0; i < platforms.length; i++) {
                if (platforms[i].y > maxY) maxY = platforms[i].y;
            }
            while (maxY < H + PLAT_SPACING) {
                maxY += PLAT_SPACING;
                platforms.push(createPlatform(maxY));
            }

            // Update particles
            particles = particles.filter(function (pt) {
                pt.x += pt.vx;
                pt.y += pt.vy;
                pt.vy += 0.1;
                pt.life--;
                return pt.life > 0;
            });

            // Scoring & difficulty
            score += 0.04;
            var newLevel = Math.floor(score / 60) + 1;
            if (newLevel > level) {
                level = newLevel;
                scrollSpeed = SCROLL_BASE + level * 0.12;
            }

            scoreDisplay.textContent = 'Score: ' + Math.floor(score);

            draw();
            gameLoop = requestAnimationFrame(update);
        }

        // --- Drawing ---
        function draw() {
            // Background
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, W, H);

            // Ceiling danger zone
            var dangerGrad = ctx.createLinearGradient(0, 0, 0, 25);
            dangerGrad.addColorStop(0, 'rgba(230, 57, 70, 0.3)');
            dangerGrad.addColorStop(1, 'rgba(230, 57, 70, 0)');
            ctx.fillStyle = dangerGrad;
            ctx.fillRect(0, 0, W, 25);

            ctx.strokeStyle = '#e63946';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(0, 1);
            ctx.lineTo(W, 1);
            ctx.stroke();
            ctx.setLineDash([]);

            // Platforms
            for (var i = 0; i < platforms.length; i++) {
                drawPlatform(platforms[i]);
            }

            // Particles
            for (var i = 0; i < particles.length; i++) {
                var pt = particles[i];
                ctx.globalAlpha = pt.life / pt.maxLife;
                ctx.fillStyle = '#e63946';
                ctx.fillRect(pt.x - 2, pt.y - 2, 4, 3);
            }
            ctx.globalAlpha = 1;

            // Ball
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
            var grad = ctx.createRadialGradient(
                ball.x - 2, ball.y - 2, 1,
                ball.x, ball.y, BALL_R
            );
            grad.addColorStop(0, '#ffd166');
            grad.addColorStop(1, '#f4a261');
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = '#e76f51';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // HUD
            ctx.fillStyle = '#555';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('Level ' + level, W - 5, H - 5);

            ctx.textAlign = 'left';
            ctx.fillText('Cracked: ' + falseFound, 5, H - 5);
        }

        function drawPlatform(p) {
            if (p.opacity <= 0) return;

            ctx.globalAlpha = p.opacity;

            if (p.cracked) {
                ctx.fillStyle = '#e63946';
                var drift = p.crackTime * 0.6;

                // Left half drifts left, right half drifts right
                var halfW = p.w / 2;
                ctx.fillRect(p.x - drift, p.y + drift * 0.2, halfW, PLAT_H);
                ctx.fillRect(p.x + halfW + drift, p.y + drift * 0.2, halfW, PLAT_H);
            } else {
                // Solid bar
                ctx.fillStyle = p.isFalse ? '#457b9d' : '#457b9d';
                ctx.fillRect(p.x, p.y, p.w, PLAT_H);

                // Subtle top edge
                ctx.fillStyle = '#5a94b8';
                ctx.fillRect(p.x, p.y, p.w, 2);
            }

            // Text label (only false statements have text)
            if (p.text && p.w > 35) {
                ctx.fillStyle = p.cracked ? '#ff9999' : '#c8dbe8';
                ctx.font = '8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x + p.w / 2, p.y + 10, p.w - 6);
            }

            ctx.globalAlpha = 1;
        }

        // --- Screens ---
        function drawInitial() {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#457b9d';
            ctx.font = 'bold 15px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Information Broker', W / 2, H / 2 - 50);

            ctx.fillStyle = '#f4a261';
            ctx.beginPath();
            ctx.arc(W / 2, H / 2 - 20, BALL_R, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#999';
            ctx.font = '10px monospace';
            ctx.fillText('\u2190 \u2192  to move the ball', W / 2, H / 2 + 8);
            ctx.fillText('Land on solid platforms to survive', W / 2, H / 2 + 24);
            ctx.fillText('False AI claims crack on contact', W / 2, H / 2 + 42);
            ctx.fillStyle = '#e63946';
            ctx.fillText("Don't hit the ceiling or the floor!", W / 2, H / 2 + 60);
        }

        function endGame() {
            gameRunning = false;
            if (gameLoop) {
                cancelAnimationFrame(gameLoop);
                gameLoop = null;
            }

            ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#e63946';
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', W / 2, H / 2 - 30);

            ctx.fillStyle = '#ffd166';
            ctx.font = '16px monospace';
            ctx.fillText('Score: ' + Math.floor(score), W / 2, H / 2 + 5);

            ctx.fillStyle = '#aaa';
            ctx.font = '11px monospace';
            ctx.fillText('Level ' + level + '  \u2022  ' + falseFound + ' false claims cracked', W / 2, H / 2 + 30);

            if (falseFound >= 5) {
                ctx.fillStyle = '#4ecdc4';
                ctx.fillText('Good broker instincts!', W / 2, H / 2 + 55);
            } else {
                ctx.fillStyle = '#e0e0e0';
                ctx.fillText('Who is your information broker?', W / 2, H / 2 + 55);
            }

            startBtn.textContent = 'Play Again';
            startBtn.disabled = false;
        }

        function startGame() {
            if (gameLoop) {
                cancelAnimationFrame(gameLoop);
                gameLoop = null;
            }

            score = 0;
            level = 1;
            falseFound = 0;
            scrollSpeed = SCROLL_BASE;
            particles = [];
            keys = { left: false, right: false };
            resetBall();
            initPlatforms();

            gameRunning = true;
            startBtn.textContent = 'Playing...';
            startBtn.disabled = true;

            update();
        }

        startBtn.addEventListener('click', startGame);
        drawInitial();

        console.log('[Broker Game] \u2713 Initialized successfully!');
    }

    setTimeout(initBrokerGame, 100);
})();
