// pitch-build-game.js — The Pitch & Build Balance
// Catch falling PITCH and BUILD tokens to keep the beam level.
// Too much pitch, you over-promise. Too much build, no one hears about it.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function init() {
        const canvas = document.getElementById('pitchBuildCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startPitchBuildGame');
        const scoreEl = document.getElementById('pitchBuildScore');
        const tiltEl = document.getElementById('pitchBuildTilt');
        const verdictEl = document.getElementById('pitchBuildVerdict');

        if (!canvas || !ctx || !startBtn || !scoreEl || !tiltEl) {
            if (retryCount++ < MAX_RETRIES) {
                setTimeout(init, 200);
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = canvas.width;   // 300
        const H = canvas.height;  // 400

        // Colors
        const C_PITCH = '#f4a261';
        const C_BUILD = '#457b9d';
        const C_BG = '#0a0a0a';
        const C_BEAM = '#e9c46a';
        const C_PADDLE = '#f1faee';
        const C_DANGER = '#e63946';

        // Word pools
        const PITCH_WORDS = ['DEMO', 'VISION', 'PITCH', 'NARRATIVE', 'ROADMAP', 'MVP', 'STORY', 'HYPE'];
        const BUILD_WORDS = ['TEST', 'REFACTOR', 'REVIEW', 'DEPLOY', 'HARDEN', 'QA', 'EDGE', 'TYPES'];

        // State
        let running = false;
        let loopId = null;
        let score = 0;
        let tilt = 0;            // -10 (full build) .. +10 (full pitch)
        const TILT_LIMIT = 8;
        const TILT_DECAY = 0.012; // pulls toward 0 over time (calmness)
        let tokens = [];
        let particles = [];
        let spawnTimer = 0;
        let spawnInterval = 55;
        let frame = 0;

        // Paddle
        const paddle = {
            w: 70,
            h: 10,
            x: W / 2 - 35,
            y: H - 70,
            vx: 0,
            speed: 4.5,
        };

        const keys = { left: false, right: false };

        // ---- Input ----
        function onKeyDown(e) {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                keys.left = true; e.preventDefault();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                keys.right = true; e.preventDefault();
            }
        }
        function onKeyUp(e) {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
            else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
        }
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        // Touch — drag paddle directly
        let touching = false;
        function paddleFromClientX(clientX) {
            const rect = canvas.getBoundingClientRect();
            const scale = canvas.width / rect.width;
            const cx = (clientX - rect.left) * scale;
            paddle.x = Math.max(0, Math.min(W - paddle.w, cx - paddle.w / 2));
        }
        canvas.addEventListener('touchstart', (e) => {
            touching = true;
            if (e.touches[0]) paddleFromClientX(e.touches[0].clientX);
            e.preventDefault();
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            if (touching && e.touches[0]) paddleFromClientX(e.touches[0].clientX);
            e.preventDefault();
        }, { passive: false });
        canvas.addEventListener('touchend', () => { touching = false; });

        // ---- Spawning ----
        function spawnToken() {
            // 50/50 type, but bias slightly toward whichever side balances tilt
            const bias = tilt > 3 ? 0.65 : tilt < -3 ? 0.35 : 0.5;
            const isBuild = Math.random() < bias;
            const word = isBuild
                ? BUILD_WORDS[Math.floor(Math.random() * BUILD_WORDS.length)]
                : PITCH_WORDS[Math.floor(Math.random() * PITCH_WORDS.length)];
            tokens.push({
                x: 20 + Math.random() * (W - 40),
                y: -20,
                vy: 1.4 + Math.random() * 1.2 + Math.min(2, frame / 1200),
                w: 60,
                h: 22,
                type: isBuild ? 'build' : 'pitch',
                word,
            });
        }

        function spawnParticles(x, y, color) {
            for (let i = 0; i < 8; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4 - 1,
                    life: 25,
                    color,
                });
            }
        }

        // ---- Update ----
        function update() {
            frame++;

            // Paddle
            if (!touching) {
                if (keys.left) paddle.vx -= 0.7;
                if (keys.right) paddle.vx += 0.7;
                paddle.vx *= 0.82;
                if (paddle.vx > paddle.speed) paddle.vx = paddle.speed;
                if (paddle.vx < -paddle.speed) paddle.vx = -paddle.speed;
                paddle.x += paddle.vx;
                if (paddle.x < 0) { paddle.x = 0; paddle.vx = 0; }
                if (paddle.x > W - paddle.w) { paddle.x = W - paddle.w; paddle.vx = 0; }
            }

            // Spawn
            spawnTimer++;
            if (spawnTimer >= spawnInterval) {
                spawnTimer = 0;
                spawnToken();
                if (spawnInterval > 28) spawnInterval -= 0.15;
            }

            // Tokens
            for (let i = tokens.length - 1; i >= 0; i--) {
                const t = tokens[i];
                t.y += t.vy;

                // collision with paddle
                if (
                    t.y + t.h >= paddle.y &&
                    t.y + t.h <= paddle.y + paddle.h + 4 &&
                    t.x + t.w >= paddle.x &&
                    t.x <= paddle.x + paddle.w
                ) {
                    if (t.type === 'pitch') {
                        tilt += 1;
                        score += 5;
                        spawnParticles(t.x + t.w / 2, t.y + t.h, C_PITCH);
                    } else {
                        tilt -= 1;
                        score += 5;
                        spawnParticles(t.x + t.w / 2, t.y + t.h, C_BUILD);
                    }
                    tokens.splice(i, 1);
                    continue;
                }

                // off screen — missed tokens are fine, small balance bonus
                if (t.y > H + 30) {
                    tokens.splice(i, 1);
                    score += 1;
                }
            }

            // Tilt natural decay toward 0
            if (tilt > 0) tilt = Math.max(0, tilt - TILT_DECAY);
            else if (tilt < 0) tilt = Math.min(0, tilt + TILT_DECAY);

            // Particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.15;
                p.life--;
                if (p.life <= 0) particles.splice(i, 1);
            }

            // Survival score
            if (frame % 12 === 0) score += 1;

            // Lose
            if (tilt >= TILT_LIMIT) return endGame('over-promised');
            if (tilt <= -TILT_LIMIT) return endGame('over-built');
        }

        // ---- Draw ----
        function drawGrid() {
            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            for (let x = 0; x < W; x += 30) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
            }
            for (let y = 0; y < H; y += 30) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
            }
        }

        function drawTokens() {
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (const t of tokens) {
                ctx.fillStyle = t.type === 'pitch' ? C_PITCH : C_BUILD;
                ctx.fillRect(t.x, t.y, t.w, t.h);
                ctx.fillStyle = '#0a0a0a';
                ctx.fillText(t.word, t.x + t.w / 2, t.y + t.h / 2 + 1);
            }
        }

        function drawPaddle() {
            ctx.fillStyle = C_PADDLE;
            ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
            // pivot mark
            ctx.fillStyle = C_DANGER;
            ctx.fillRect(paddle.x + paddle.w / 2 - 1, paddle.y - 4, 2, 4);
        }

        function drawBeam() {
            // Seesaw at bottom that visualizes tilt
            const cx = W / 2;
            const cy = H - 30;
            const len = 110;
            const angle = (tilt / TILT_LIMIT) * 0.5; // radians

            // pivot triangle
            ctx.fillStyle = C_BEAM;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx - 10, cy + 14);
            ctx.lineTo(cx + 10, cy + 14);
            ctx.closePath();
            ctx.fill();

            // beam
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            const danger = Math.abs(tilt) / TILT_LIMIT;
            const r = Math.round(73 + (230 - 73) * danger);
            const g = Math.round(196 - (196 - 57) * danger);
            const b = Math.round(106 - (106 - 70) * danger);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(-len, -3, len * 2, 6);

            // pans
            ctx.fillStyle = C_BUILD;
            ctx.fillRect(-len - 14, -3, 14, 14);
            ctx.fillStyle = C_PITCH;
            ctx.fillRect(len, -3, 14, 14);

            // labels
            ctx.fillStyle = '#0a0a0a';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('B', -len - 7, 4);
            ctx.fillText('P', len + 7, 4);
            ctx.restore();
        }

        function drawParticles() {
            for (const p of particles) {
                ctx.globalAlpha = Math.max(0, p.life / 25);
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
            }
            ctx.globalAlpha = 1;
        }

        function drawHUD() {
            // Tilt bar at top
            const barW = W - 40;
            const barX = 20;
            const barY = 14;
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(barX, barY, barW, 8);
            // center line
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(barX + barW / 2 - 1, barY - 2, 2, 12);
            // indicator
            const ratio = (tilt + TILT_LIMIT) / (TILT_LIMIT * 2);
            const ix = barX + Math.max(0, Math.min(barW, ratio * barW));
            ctx.fillStyle = tilt > 0 ? C_PITCH : C_BUILD;
            ctx.fillRect(ix - 3, barY - 2, 6, 12);

            ctx.fillStyle = C_BUILD;
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('BUILD', barX, barY + 22);
            ctx.fillStyle = C_PITCH;
            ctx.textAlign = 'right';
            ctx.fillText('PITCH', barX + barW, barY + 22);
        }

        function draw() {
            drawGrid();
            drawHUD();
            drawTokens();
            drawParticles();
            drawPaddle();
            drawBeam();
        }

        // ---- Loop ----
        function loop() {
            if (!running) return;
            update();
            draw();
            // updateUI
            scoreEl.textContent = `Score: ${score}`;
            const dir = tilt > 0.5 ? 'pitch heavy' : tilt < -0.5 ? 'build heavy' : 'balanced';
            tiltEl.textContent = `Beam: ${dir} (${tilt.toFixed(1)})`;
            if (verdictEl) verdictEl.textContent = '';
            loopId = requestAnimationFrame(loop);
        }

        function reset() {
            score = 0;
            tilt = 0;
            tokens = [];
            particles = [];
            spawnTimer = 0;
            spawnInterval = 55;
            frame = 0;
            paddle.x = W / 2 - paddle.w / 2;
            paddle.vx = 0;
        }

        function startGame() {
            if (running) return;
            reset();
            running = true;
            startBtn.textContent = 'Running...';
            startBtn.disabled = true;
            if (verdictEl) verdictEl.textContent = '';
            loop();
        }

        function endGame(reason) {
            running = false;
            if (loopId) cancelAnimationFrame(loopId);
            startBtn.textContent = 'Try Again';
            startBtn.disabled = false;
            const msg = reason === 'over-promised'
                ? 'Over-promised. The beam tipped to PITCH — nothing was built.'
                : 'Over-built. The beam tipped to BUILD — no one heard the pitch.';
            if (verdictEl) verdictEl.textContent = `${msg} Final score: ${score}`;
            // Final draw
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = C_DANGER;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(reason === 'over-promised' ? 'OVER-PROMISED' : 'OVER-BUILT', W / 2, H / 2 - 10);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 16);
        }

        startBtn.addEventListener('click', startGame);

        // Initial idle frame
        draw();
        scoreEl.textContent = 'Score: 0';
        tiltEl.textContent = 'Beam: balanced (0.0)';

        console.log('[Pitch & Build] initialized');
    }

    init();
})();
