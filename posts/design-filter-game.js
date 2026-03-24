// design-filter-game.js - The Design Filter Game
// Sort design decisions: good principles vs visual spectacle
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initDesignFilter() {
        const canvas = document.getElementById('designFilterCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startDesignFilter');
        const scoreDisplay = document.getElementById('designScore');
        const livesDisplay = document.getElementById('designLives');
        const verdictDisplay = document.getElementById('designVerdict');

        if (!canvas || !ctx || !startBtn || !scoreDisplay || !livesDisplay || !verdictDisplay) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initDesignFilter, 200);
                return;
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        // Scale for high-DPI
        const W = 300;
        const H = 400;

        let gameRunning = false;
        let score = 0;
        let lives = 3;
        let goodCount = 0;
        let spectacleCount = 0;
        let totalJudged = 0;
        let cards = [];
        let gameLoop = null;
        let lastTimestamp = 0;
        let spawnTimer = 0;
        let spawnInterval = 2200;
        let feedbackText = '';
        let feedbackColor = '';
        let feedbackTimer = 0;

        // Good design principles (the 30% — keep these)
        const GOOD_PRINCIPLES = [
            'Consistent spacing system',
            '8px grid alignment',
            'Dark-mode color discipline',
            'Clear visual hierarchy',
            'Accessible contrast ratios',
            'Logical layering system',
            'Responsive breakpoints',
            'Readable body font',
            'Whitespace as structure',
            'Purposeful color palette',
            'Component reusability',
            'Clear call-to-action',
            'Predictable navigation',
            'Meaningful micro-interactions',
            'Content-first layout',
        ];

        // Visual spectacle (the 70% — reject these)
        const SPECTACLE = [
            'Neon glow on everything',
            'Glassmorphism layers',
            'Display fonts for body text',
            'Dogmatic "no borders" rule',
            'Parallax on every scroll',
            'Animated gradient background',
            'Blur filter on all cards',
            'Auto-playing hero video',
            'Floating particle effects',
            'Text over busy images',
            'Infinite scroll everywhere',
            'Custom cursor animation',
            'Bouncing page transitions',
            '3D tilt on hover cards',
            'Rainbow loading spinner',
            'Morphing blob shapes',
            'Kinetic typography header',
            'Full-page modal splash',
        ];

        class Card {
            constructor(text, isSpectacle) {
                this.text = text;
                this.isSpectacle = isSpectacle;
                this.width = 260;
                this.height = 48;
                this.x = (W - this.width) / 2 + (Math.random() - 0.5) * 20;
                this.y = H + 10;
                this.speed = 0.35 + Math.random() * 0.25;
                this.rejected = false;
                this.kept = false;
                this.fadeTimer = 0;
                this.alpha = 1;
            }

            update(dt) {
                this.y -= this.speed * dt / 16.67;

                if (this.rejected || this.kept) {
                    this.fadeTimer += dt;
                    this.alpha = Math.max(0, 1 - this.fadeTimer / 400);
                }
            }

            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;

                // Card background
                let bg;
                if (this.rejected) {
                    bg = this.isSpectacle ? '#27ae60' : '#e74c3c';
                } else if (this.kept) {
                    bg = !this.isSpectacle ? '#27ae60' : '#e74c3c';
                } else {
                    bg = this.isSpectacle ? '#3d1a4a' : '#1a3d4a';
                }

                // Rounded rect
                const r = 6;
                ctx.fillStyle = bg;
                ctx.beginPath();
                ctx.moveTo(this.x + r, this.y);
                ctx.lineTo(this.x + this.width - r, this.y);
                ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + r);
                ctx.lineTo(this.x + this.width, this.y + this.height - r);
                ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - r, this.y + this.height);
                ctx.lineTo(this.x + r, this.y + this.height);
                ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - r);
                ctx.lineTo(this.x, this.y + r);
                ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
                ctx.closePath();
                ctx.fill();

                // Border
                ctx.strokeStyle = this.isSpectacle ? 'rgba(180, 80, 220, 0.5)' : 'rgba(80, 180, 220, 0.5)';
                if (this.rejected || this.kept) {
                    ctx.strokeStyle = bg === '#27ae60' ? '#2ecc71' : '#e74c3c';
                }
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Text
                ctx.fillStyle = '#ecf0f1';
                ctx.font = '12px Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);

                // Stamp
                if (this.rejected) {
                    ctx.font = 'bold 14px Arial';
                    ctx.fillStyle = this.isSpectacle ? '#2ecc71' : '#ff6b6b';
                    ctx.fillText(this.isSpectacle ? '✓ REJECTED' : '✗ WRONG!', this.x + this.width / 2, this.y + this.height / 2);
                } else if (this.kept) {
                    ctx.font = 'bold 14px Arial';
                    ctx.fillStyle = !this.isSpectacle ? '#2ecc71' : '#ff6b6b';
                    ctx.fillText(!this.isSpectacle ? '✓ KEPT' : '✗ MISSED!', this.x + this.width / 2, this.y + this.height / 2);
                }

                ctx.restore();
            }

            contains(px, py) {
                return px >= this.x && px <= this.x + this.width &&
                    py >= this.y && py <= this.y + this.height;
            }
        }

        function spawnCard() {
            // 70% chance spectacle, 30% chance good — matching the article's ratio
            const isSpectacle = Math.random() < 0.7;
            const list = isSpectacle ? SPECTACLE : GOOD_PRINCIPLES;
            const text = list[Math.floor(Math.random() * list.length)];
            cards.push(new Card(text, isSpectacle));
        }

        function showFeedback(text, color) {
            feedbackText = text;
            feedbackColor = color;
            feedbackTimer = 1000;
        }

        function drawGame(timestamp) {
            const dt = lastTimestamp ? timestamp - lastTimestamp : 16.67;
            lastTimestamp = timestamp;

            if (!gameRunning) return;

            spawnTimer += dt;
            if (spawnTimer >= spawnInterval) {
                spawnCard();
                spawnTimer = 0;
                if (spawnInterval > 1000) spawnInterval -= 30;
            }

            // Update feedback
            if (feedbackTimer > 0) feedbackTimer -= dt;

            // Background
            ctx.fillStyle = '#0d0d0d';
            ctx.fillRect(0, 0, W, H);

            // "Ship it" line at top (danger zone)
            ctx.fillStyle = 'rgba(231, 76, 60, 0.15)';
            ctx.fillRect(0, 0, W, 55);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(0, 55);
            ctx.lineTo(W, 55);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⬆ SHIPPED TO PRODUCTION ⬆', W / 2, 20);

            // Instruction at bottom
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '10px Arial';
            ctx.fillText('TAP spectacle to reject • Let good principles ship', W / 2, H - 8);

            // Update and draw cards
            for (let i = cards.length - 1; i >= 0; i--) {
                const card = cards[i];
                card.update(dt);
                card.draw(ctx);

                // Remove faded cards
                if (card.alpha <= 0) {
                    cards.splice(i, 1);
                    continue;
                }

                // Card reached the top (shipped)
                if (!card.rejected && !card.kept && card.y < 55) {
                    card.kept = true;
                    totalJudged++;
                    if (card.isSpectacle) {
                        // Spectacle shipped — bad
                        lives--;
                        score -= 15;
                        spectacleCount++;
                        showFeedback('Spectacle shipped! -15', '#e74c3c');
                    } else {
                        // Good principle shipped — good
                        score += 5;
                        goodCount++;
                        showFeedback('Good principle shipped! +5', '#2ecc71');
                    }
                    updateDisplays();
                    if (lives <= 0) { endGame(); return; }
                }

                // Card went off top
                if (card.y < -80) {
                    cards.splice(i, 1);
                }
            }

            // Feedback text
            if (feedbackTimer > 0 && feedbackText) {
                ctx.globalAlpha = Math.min(1, feedbackTimer / 300);
                ctx.fillStyle = feedbackColor;
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(feedbackText, W / 2, H / 2);
                ctx.globalAlpha = 1;
            }

            gameLoop = requestAnimationFrame(drawGame);
        }

        function getScaleCoords(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = W / rect.width;
            const scaleY = H / rect.height;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        }

        function handleClick(e) {
            e.preventDefault();
            if (!gameRunning) return;

            const { x, y } = getScaleCoords(e);

            for (let i = cards.length - 1; i >= 0; i--) {
                const card = cards[i];
                if (!card.rejected && !card.kept && card.contains(x, y)) {
                    card.rejected = true;
                    totalJudged++;
                    if (card.isSpectacle) {
                        score += 10;
                        spectacleCount++;
                        showFeedback('Spectacle rejected! +10', '#2ecc71');
                    } else {
                        score -= 10;
                        lives--;
                        goodCount++;
                        showFeedback('That was good design! -10', '#e74c3c');
                    }
                    updateDisplays();
                    if (lives <= 0) { endGame(); return; }
                    break;
                }
            }
        }

        function updateDisplays() {
            scoreDisplay.textContent = 'Score: ' + score;
            livesDisplay.textContent = 'Lives: ' + lives;
            livesDisplay.style.color = lives <= 1 ? '#e74c3c' : '#00ff88';
        }

        function getVerdict() {
            if (totalJudged === 0) return '';
            const spectacleRatio = Math.round((spectacleCount / totalJudged) * 100);
            const goodRatio = 100 - spectacleRatio;
            return goodRatio + '% good / ' + spectacleRatio + '% spectacle';
        }

        function startGame() {
            if (gameRunning) return;

            gameRunning = true;
            score = 0;
            lives = 3;
            goodCount = 0;
            spectacleCount = 0;
            totalJudged = 0;
            cards = [];
            spawnTimer = 0;
            spawnInterval = 2200;
            lastTimestamp = 0;
            feedbackText = '';
            feedbackTimer = 0;

            updateDisplays();
            verdictDisplay.textContent = '';
            startBtn.textContent = 'Playing...';
            startBtn.disabled = true;

            gameLoop = requestAnimationFrame(drawGame);
        }

        function endGame() {
            gameRunning = false;
            if (gameLoop) cancelAnimationFrame(gameLoop);

            // Final screen
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('REVIEW COMPLETE', W / 2, H / 2 - 60);

            ctx.font = '16px Arial';
            ctx.fillText('Score: ' + score, W / 2, H / 2 - 20);

            ctx.font = '13px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Your verdict: ' + getVerdict(), W / 2, H / 2 + 10);

            let msg;
            if (score >= 100) msg = 'Claude-level taste!';
            else if (score >= 50) msg = 'Solid design instinct.';
            else if (score >= 0) msg = 'More spectacle slipped through.';
            else msg = 'The neon glows won this round.';

            ctx.fillStyle = score >= 50 ? '#2ecc71' : '#e74c3c';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(msg, W / 2, H / 2 + 45);

            verdictDisplay.textContent = getVerdict();
            startBtn.textContent = 'Play Again';
            startBtn.disabled = false;
        }

        // Draw idle screen
        function drawIdle() {
            ctx.fillStyle = '#0d0d0d';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('The Design Filter', W / 2, H / 2 - 50);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Design decisions rise toward production.', W / 2, H / 2 - 15);
            ctx.fillText('Tap SPECTACLE to reject it.', W / 2, H / 2 + 10);
            ctx.fillText('Let good principles ship through.', W / 2, H / 2 + 35);

            ctx.fillStyle = '#e74c3c';
            ctx.font = '11px Arial';
            ctx.fillText('70% spectacle, 30% good — just like the real thing.', W / 2, H / 2 + 70);
        }

        startBtn.addEventListener('click', startGame);
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('touchstart', handleClick, { passive: false });

        drawIdle();
        updateDisplays();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDesignFilter);
    } else {
        initDesignFilter();
    }
})();
