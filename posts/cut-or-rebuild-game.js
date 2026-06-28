// cut-or-rebuild-game.js - Cut or Rebuild
// A codebase is a tree. The red ROOT at the top is the unwanted feature; its
// children are the references that spread through the code. Remove it from the
// LEAVES UP: you can only safely cut a node with no remaining children. Each
// clean cut may reveal a hidden reference (DEEP ROOTS) and sprout a new leaf,
// so the work grows back as you chip away. DEBT rises over time, faster the
// more half-cut code rots on the board. REWRITE wipes everything for a clean
// slate, but the debt penalty compounds every time and never counts as cleaned.
// Clean 6 features before debt hits 100 — surgery beats the rebuild crutch.
(function () {
    'use strict';

    let gameInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 20;

    function initCut() {
        const canvas = document.getElementById('cutCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const startBtn = document.getElementById('startCutGame');
        const scoreEl = document.getElementById('cutScore');
        const debtEl = document.getElementById('cutDebt');
        const verdictEl = document.getElementById('cutVerdict');

        if (!canvas || !ctx || !startBtn || !scoreEl || !debtEl || !verdictEl) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(initCut, 200);
            }
            return;
        }

        if (gameInitialized) return;
        gameInitialized = true;

        const W = 300;
        const H = 400;
        const HEADER_H = 40;
        const REWRITE_H = 42;
        const PLAY_TOP = HEADER_H + 6;
        const PLAY_BOTTOM = H - REWRITE_H - 6;

        const TARGET = 6;                                  // features to clean to win
        const NODE_R = 11;
        const TAP_R = NODE_R + 8;

        const C_BG = '#0a0a0a';
        const C_ACCENT = '#f4a261';
        const C_GREEN = '#2ecc71';
        const C_RED = '#e63946';
        const C_BLUE = '#457b9d';
        const C_TEXT = '#ecf0f1';

        let running = false;
        let loopId = null;
        let lastTick = 0;
        let elapsed = 0;

        // tree: nodes keyed by id. node = { id, parent, x, y, root, born }
        let nodes = [];
        let nextId = 0;
        let treeLevel = 0;                                 // grows each cleaned feature
        let rootId = -1;

        let cleaned = 0;
        let debt = 0;                                      // 0..100
        let rewrites = 0;

        let celebrateTimer = 0;
        let shakeTimer = 0;
        let feedbackText = '';
        let feedbackColor = '';
        let feedbackTimer = 0;

        // animations: nodes fading out after a cut { id, x, y, root, t }
        let dying = [];

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

        function showFeedback(text, color) {
            feedbackText = text;
            feedbackColor = color;
            feedbackTimer = 1100;
        }

        function nodeById(id) {
            for (let i = 0; i < nodes.length; i++) if (nodes[i].id === id) return nodes[i];
            return null;
        }

        function childrenOf(id) {
            const out = [];
            for (let i = 0; i < nodes.length; i++) if (nodes[i].parent === id) out.push(nodes[i]);
            return out;
        }

        function isLeaf(node) {
            return childrenOf(node.id).length === 0;
        }

        // Build a tree of a given depth. Root is the unwanted feature (red).
        // A clean slate still has a (small) unwanted feature to remove, so the
        // board stays playable and the CLEANED target remains reachable.
        function buildTree(depth) {
            nodes = [];
            nextId = 0;
            rootId = -1;

            const root = { id: nextId++, parent: -1, root: true, born: elapsed };
            nodes.push(root);
            rootId = root.id;

            // breadth grows with depth; each level branches 1-3
            let frontier = [root];
            for (let d = 0; d < depth; d++) {
                const next = [];
                for (let f = 0; f < frontier.length; f++) {
                    const branches = 1 + Math.floor(Math.random() * (d === 0 ? 2 : 2.4));
                    for (let b = 0; b < branches; b++) {
                        const c = { id: nextId++, parent: frontier[f].id, root: false, born: elapsed };
                        nodes.push(c);
                        next.push(c);
                    }
                }
                frontier = next;
                if (nodes.length > 26) break;              // keep it sane on a small canvas
            }
            layout();
        }

        // Position nodes top-to-bottom by depth level, spread horizontally per level.
        function depthOf(node) {
            let d = 0;
            let cur = node;
            const guard = 60;
            let g = 0;
            while (cur.parent !== -1 && g++ < guard) {
                cur = nodeById(cur.parent);
                if (!cur) break;
                d++;
            }
            return d;
        }

        function layout() {
            if (nodes.length === 0) return;
            // group by depth
            const levels = {};
            let maxD = 0;
            for (let i = 0; i < nodes.length; i++) {
                const d = depthOf(nodes[i]);
                nodes[i]._d = d;
                if (!levels[d]) levels[d] = [];
                levels[d].push(nodes[i]);
                if (d > maxD) maxD = d;
            }
            const usableH = PLAY_BOTTOM - PLAY_TOP;
            const rowGap = maxD > 0 ? usableH / (maxD + 1) : usableH / 2;
            for (let d = 0; d <= maxD; d++) {
                const row = levels[d] || [];
                const y = PLAY_TOP + rowGap * (d + 0.5);
                const slotW = W / (row.length + 1);
                for (let i = 0; i < row.length; i++) {
                    row[i].x = slotW * (i + 1);
                    row[i].y = clamp(y, PLAY_TOP + NODE_R, PLAY_BOTTOM - NODE_R);
                }
            }
        }

        function sproutChance() {
            // Deeper / larger trees fight back harder.
            const base = 0.22;
            const sizeBonus = Math.min(0.18, nodes.length * 0.012);
            return clamp(base + sizeBonus, 0.22, 0.42);
        }

        function sproutHiddenReference() {
            // pick a random surviving node, add a leaf under it
            if (nodes.length === 0) return;
            const host = nodes[Math.floor(Math.random() * nodes.length)];
            nodes.push({ id: nextId++, parent: host.id, root: false, born: elapsed });
            layout();
            showFeedback('deep root revealed', C_BLUE);
            shakeTimer = 220;
        }

        function cutNode(node) {
            // remove (must be leaf — caller checks)
            dying.push({ id: -1, x: node.x, y: node.y, root: node.root, t: 380 });
            const idx = nodes.indexOf(node);
            if (idx >= 0) nodes.splice(idx, 1);

            if (node.root) {
                // root removed -> whole feature cleaned (root is last because leaves-up)
                cleaned++;
                celebrateTimer = 900;
                showFeedback('feature removed — clean', C_GREEN);
                if (cleaned >= TARGET) { endGame('Every feature came out clean.', true); return; }
                treeLevel++;
                buildTree(3 + Math.floor(treeLevel / 2));
                return;
            }

            // clean surgical cut
            showFeedback('clean cut', C_GREEN);
            layout();

            // deep roots: chance to reveal a hidden reference
            if (Math.random() < sproutChance()) {
                sproutHiddenReference();
            }
        }

        function tryCutAt(node) {
            if (!node) return;
            if (!isLeaf(node)) {
                showFeedback('still referenced', C_ACCENT);
                shakeTimer = 200;
                return;
            }
            cutNode(node);
        }

        function doRewrite() {
            if (!running) return;
            const penalty = 12 + rewrites * 6;             // 12, 18, 24, ...
            rewrites++;
            debt = clamp(debt + penalty, 0, 100);
            showFeedback('REWRITE — debt +' + penalty, C_RED);
            shakeTimer = 420;
            buildTree(2);                                  // smaller fresh feature, no credit
            if (debt >= 100) { endGame('Rewrote your way into the ground.', false); }
        }

        function debtRate() {
            // base creep + rot proportional to nodes still on the board
            return 0.0016 + nodes.length * 0.00055;
        }

        function update(dt) {
            elapsed += dt;
            if (feedbackTimer > 0) feedbackTimer -= dt;
            if (shakeTimer > 0) shakeTimer -= dt;
            if (celebrateTimer > 0) celebrateTimer -= dt;

            for (let i = dying.length - 1; i >= 0; i--) {
                dying[i].t -= dt;
                if (dying[i].t <= 0) dying.splice(i, 1);
            }

            debt = clamp(debt + dt * debtRate(), 0, 100);
            if (debt >= 100) { endGame('Debt swallowed the whole codebase.', false); return; }

            // Safety: never leave the player with an empty, unwinnable board.
            if (nodes.length === 0) {
                treeLevel++;
                buildTree(3 + Math.floor(treeLevel / 2));
            }
        }

        // ---- drawing ----

        function drawEdges() {
            ctx.lineWidth = 1.5;
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                if (n.parent === -1) continue;
                const p = nodeById(n.parent);
                if (!p) continue;
                ctx.strokeStyle = 'rgba(69, 123, 157, 0.5)';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(n.x, n.y);
                ctx.stroke();
            }
        }

        function drawNode(n) {
            const leaf = isLeaf(n);
            let r = NODE_R;
            if (n.root) {
                const pulse = 1 + 0.12 * Math.sin(elapsed / 220);
                r = NODE_R * 1.25 * pulse;
            }
            // body
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            if (n.root) {
                ctx.fillStyle = C_RED;
            } else if (leaf) {
                ctx.fillStyle = '#2a9d8f';
            } else {
                ctx.fillStyle = 'rgba(69, 123, 157, 0.35)';
            }
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = n.root ? '#ff6b75' : leaf ? C_GREEN : C_BLUE;
            ctx.stroke();

            // leaf cut hint ring
            if (leaf && !n.root) {
                ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(elapsed / 300));
                ctx.beginPath();
                ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(46, 204, 113, 0.6)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }

        function drawDying() {
            for (let i = 0; i < dying.length; i++) {
                const d = dying[i];
                const t = clamp(d.t / 380, 0, 1);
                ctx.globalAlpha = t * 0.8;
                ctx.beginPath();
                ctx.arc(d.x, d.y, NODE_R + (1 - t) * 8, 0, Math.PI * 2);
                ctx.strokeStyle = d.root ? C_RED : C_GREEN;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }

        function drawTree(shakeX, shakeY) {
            ctx.save();
            ctx.translate(shakeX, shakeY);
            drawEdges();
            for (let i = 0; i < nodes.length; i++) drawNode(nodes[i]);
            drawDying();
            ctx.restore();
        }

        function drawHeader() {
            ctx.fillStyle = 'rgba(13, 13, 13, 0.95)';
            ctx.fillRect(0, 0, W, HEADER_H);
            ctx.strokeStyle = 'rgba(244, 162, 97, 0.3)';
            ctx.beginPath();
            ctx.moveTo(0, HEADER_H);
            ctx.lineTo(W, HEADER_H);
            ctx.stroke();

            // debt bar
            const barX = 8, barY = 6, barW = W - 16, barH = 8;
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(barX, barY, barW, barH);
            const dx = debt / 100;
            ctx.fillStyle = debt >= 85 ? C_RED : debt >= 60 ? C_ACCENT : C_GREEN;
            ctx.fillRect(barX, barY, barW * dx, barH);
            ctx.strokeStyle = 'rgba(244,162,97,0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);

            ctx.fillStyle = C_TEXT;
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('CLEANED ' + cleaned + '/' + TARGET, 8, HEADER_H - 9);
            ctx.textAlign = 'center';
            ctx.fillText('NODES ' + nodes.length, W / 2, HEADER_H - 9);
            ctx.textAlign = 'right';
            ctx.fillStyle = debt >= 85 ? C_RED : C_TEXT;
            ctx.fillText('DEBT ' + Math.round(debt), W - 8, HEADER_H - 9);
        }

        function drawRewriteBar() {
            const y = H - REWRITE_H;
            const flash = celebrateTimer > 0 ? 0 : 1;
            ctx.fillStyle = 'rgba(230, 57, 70, 0.16)';
            ctx.fillRect(0, y, W, REWRITE_H);
            ctx.strokeStyle = 'rgba(230, 57, 70, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();

            const nextPen = 12 + rewrites * 6;
            ctx.globalAlpha = flash;
            ctx.fillStyle = C_RED;
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('REWRITE  (debt +' + nextPen + ')', W / 2, y + REWRITE_H / 2 - 4);
            ctx.fillStyle = '#c98';
            ctx.font = '8px Arial';
            ctx.fillText('clean slate, never cleaned  —  tap / R', W / 2, y + REWRITE_H / 2 + 11);
            ctx.globalAlpha = 1;
        }

        function drawCelebrate() {
            if (celebrateTimer <= 0) return;
            ctx.globalAlpha = Math.min(0.85, celebrateTimer / 500);
            ctx.fillStyle = 'rgba(46, 204, 113, 0.12)';
            ctx.fillRect(0, HEADER_H, W, H - HEADER_H - REWRITE_H);
            ctx.globalAlpha = 1;
        }

        function drawFeedback() {
            if (feedbackTimer > 0 && feedbackText) {
                ctx.globalAlpha = Math.min(1, feedbackTimer / 350);
                ctx.fillStyle = feedbackColor;
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(feedbackText, W / 2, H - REWRITE_H - 8);
                ctx.globalAlpha = 1;
            }
        }

        function drawFrame(timestamp) {
            const dt = lastTick ? Math.min(60, timestamp - lastTick) : 16.67;
            lastTick = timestamp;

            if (!running) return;

            update(dt);
            if (!running) return;

            let shakeX = 0, shakeY = 0;
            if (shakeTimer > 0) {
                const mag = Math.min(5, shakeTimer / 90);
                shakeX = Math.sin(elapsed / 23) * mag;
                shakeY = Math.sin(elapsed / 17) * mag;
            }

            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            drawCelebrate();
            drawTree(shakeX, shakeY);
            drawHeader();
            drawRewriteBar();
            drawFeedback();

            updateDisplays();
            loopId = requestAnimationFrame(drawFrame);
        }

        function updateDisplays() {
            scoreEl.textContent = 'Cleaned: ' + cleaned;
            const d = Math.round(debt);
            debtEl.textContent = 'Debt: ' + d + '%';
            debtEl.style.color = d >= 85 ? '#e63946' : d >= 60 ? '#f4a261' : '#2ecc71';
        }

        function startGame() {
            if (running) return;
            running = true;
            elapsed = 0;
            cleaned = 0;
            debt = 0;
            rewrites = 0;
            treeLevel = 0;
            dying = [];
            celebrateTimer = 0;
            shakeTimer = 0;
            feedbackText = '';
            feedbackTimer = 0;
            lastTick = 0;
            buildTree(3);

            verdictEl.textContent = '';
            startBtn.textContent = 'Cutting...';
            startBtn.disabled = true;

            loopId = requestAnimationFrame(drawFrame);
        }

        function endGame(reason, won) {
            running = false;
            if (loopId) cancelAnimationFrame(loopId);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(won ? 'SANE AGAIN' : 'DROWNED IN DEBT', W / 2, H / 2 - 78);

            ctx.font = '13px Arial';
            ctx.fillStyle = C_ACCENT;
            ctx.fillText(reason || '', W / 2, H / 2 - 50);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = '16px Arial';
            ctx.fillText('Cleaned ' + cleaned + '/' + TARGET, W / 2, H / 2 - 18);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Survived ' + Math.floor(elapsed / 1000) + 's', W / 2, H / 2 + 4);
            ctx.fillText('Rewrites used: ' + rewrites, W / 2, H / 2 + 22);
            ctx.fillText('Final debt: ' + Math.round(debt) + '%', W / 2, H / 2 + 40);

            let msg, col;
            if (won) {
                msg = rewrites === 0 ? 'All surgery, no crutch. Clean.' : 'You cut more than you rebuilt.';
                col = '#2ecc71';
            } else if (rewrites >= 3) {
                msg = 'The rewrite never paid it down.';
                col = '#e63946';
            } else {
                msg = 'Roots ran deeper than the cuts.';
                col = '#f4a261';
            }
            ctx.fillStyle = col;
            ctx.font = 'bold 13px Arial';
            ctx.fillText(msg, W / 2, H / 2 + 74);

            verdictEl.textContent = reason || '';
            startBtn.textContent = 'Again';
            startBtn.disabled = false;
        }

        function drawIdle() {
            ctx.fillStyle = C_BG;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 17px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('Cut or Rebuild', W / 2, 52);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Remove the feature from the leaves up.', W / 2, 76);

            const legend = [
                { c: C_GREEN, l: 'CUT', t: 'tap a leaf (no children) to remove' },
                { c: C_BLUE, l: 'DEEP ROOTS', t: 'cuts can reveal hidden references' },
                { c: C_RED, l: 'REWRITE', t: 'wipe all — debt compounds, no credit' },
                { c: C_ACCENT, l: 'DEBT', t: 'creeps up, faster with more nodes' }
            ];
            ctx.textBaseline = 'middle';
            for (let i = 0; i < legend.length; i++) {
                const y = 116 + i * 32;
                const x = W / 2 - 118;
                ctx.beginPath();
                ctx.arc(x + 8, y, 8, 0, Math.PI * 2);
                ctx.fillStyle = legend[i].c;
                ctx.fill();

                ctx.fillStyle = '#ecf0f1';
                ctx.font = 'bold 9px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(legend[i].l, x + 24, y - 4);
                ctx.fillStyle = '#bbb';
                ctx.font = '9px Arial';
                ctx.fillText(legend[i].t, x + 24, y + 7);
            }

            ctx.fillStyle = '#888';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Red root = the unwanted feature.', W / 2, H - 42);
            ctx.fillText('Clean ' + TARGET + ' features before debt hits 100.', W / 2, H - 26);
        }

        function canvasPoint(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            const x = (clientX - rect.left) * (canvas.width / rect.width);
            const y = (clientY - rect.top) * (canvas.height / rect.height);
            return { x: x, y: y };
        }

        function handlePoint(clientX, clientY) {
            if (!running) return;
            const p = canvasPoint(clientX, clientY);

            // hit-test the bottom REWRITE bar first
            if (p.y >= H - REWRITE_H) {
                doRewrite();
                return;
            }

            // nearest node within tap radius
            let best = null;
            let bestD = Infinity;
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                const dx = n.x - p.x;
                const dy = n.y - p.y;
                const d2 = dx * dx + dy * dy;
                const reach = (n.root ? TAP_R + 4 : TAP_R);
                if (d2 <= reach * reach && d2 < bestD) {
                    best = n;
                    bestD = d2;
                }
            }
            if (best) tryCutAt(best);
        }

        function handleKey(e) {
            if (!running) return;
            const k = e.key;
            if (k === 'r' || k === 'R') { doRewrite(); e.preventDefault(); }
        }

        function handleClick(e) {
            if (!running) return;
            handlePoint(e.clientX, e.clientY);
        }

        function handleTouch(e) {
            if (!running) return;
            if (!e.touches.length && !e.changedTouches.length) return;
            const t = e.touches.length ? e.touches[0] : e.changedTouches[0];
            handlePoint(t.clientX, t.clientY);
            e.preventDefault();
        }

        startBtn.addEventListener('click', startGame);
        document.addEventListener('keydown', handleKey);
        canvas.addEventListener('mousedown', handleClick);
        canvas.addEventListener('touchstart', handleTouch, { passive: false });

        drawIdle();
        updateDisplays();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCut);
    } else {
        initCut();
    }
})();
