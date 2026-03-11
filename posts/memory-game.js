(function () {
  'use strict';

  const MAX_RETRIES = 20;
  const RETRY_INTERVAL = 200;
  let retryCount = 0;
  let gameInitialized = false;

  function initGame() {
    if (gameInitialized) return;

    const canvas = document.getElementById('memoryCanvas');
    const startBtn = document.getElementById('startMemoryBtn');
    const statusDiv = document.getElementById('memoryStatus');
    const scoreDiv = document.getElementById('memoryScore');

    if (!canvas || !startBtn || !statusDiv || !scoreDiv) {
      retryCount++;
      if (retryCount < MAX_RETRIES) {
        setTimeout(initGame, RETRY_INTERVAL);
      }
      return;
    }

    gameInitialized = true;
    const ctx = canvas.getContext('2d');

    // Game state
    let gameState = {
      level: 1,
      phase: 'idle', // idle, memorize, shuffle, play, levelComplete, gameOver
      items: [],
      clickSequence: [],
      lives: 3,
      score: 0,
      memorizeTime: 5000,
      memorizeTimer: 0,
      playStartTime: 0,
      currentGridSize: { rows: 2, cols: 2 },
    };

    // Story snippets from the article
    const storyTexts = {
      1: "Let's start simple. Just like a basic form design...",
      2: "Getting more complex. Remember the validation states?",
      3: "Level 3 complete! 'These two are not always tackled in the design handoff...'",
      4: "Halfway there. The grid grows, just like project complexity.",
      5: "Keeping up? 'For them memory is not an issue because they don't rely on it...'",
      6: "Level 6! Now imagine this with error states, user flows, edge cases...",
      7: "Almost there. 'But you can't rely only on discipline...'",
      8: "One more level! Feel the pressure?",
      9: "Final challenge. This is why designers need QA documentation!"
    };

    // Icon definitions (Bauhaus style shapes with labels)
    const iconTypes = [
      { name: 'Figma', shape: 'circle', color: '#e63946' },
      { name: 'Form', shape: 'square', color: '#1d3557' },
      { name: 'Button', shape: 'triangle', color: '#f4a261' },
      { name: 'Input', shape: 'rect', color: '#2a9d8f' },
      { name: 'Validate', shape: 'diamond', color: '#e76f51' },
      { name: 'Error', shape: 'cross', color: '#d62828' },
      { name: 'Flow', shape: 'arrow', color: '#457b9d' },
      { name: 'User', shape: 'pentagon', color: '#6a4c93' },
      { name: 'Alert', shape: 'hexagon', color: '#ffb703' },
      { name: 'State', shape: 'star', color: '#06ffa5' },
      { name: 'Check', shape: 'check', color: '#06d6a0' },
      { name: 'Link', shape: 'chain', color: '#118ab2' },
    ];

    // Get grid size based on level
    function getGridSize(level) {
      if (level <= 3) return { rows: 2, cols: 2 }; // 4 items
      if (level <= 6) return { rows: 3, cols: 3 }; // 9 items
      return { rows: 3, cols: 4 }; // 12 items
    }

    // Get memorize time based on level (longer for early levels, progressively shorter)
    function getMemorizeTime(level) {
      if (level === 1) return 6000; // 6 seconds for first level
      if (level === 2) return 5000; // 5 seconds
      if (level === 3) return 4500; // 4.5 seconds
      if (level <= 5) return 3500; // 3.5 seconds
      if (level <= 7) return 2500; // 2.5 seconds
      return 2000; // 2 seconds for final levels
    }

    // Initialize items for current level
    function initializeLevel() {
      const gridSize = getGridSize(gameState.level);
      gameState.currentGridSize = gridSize;
      const totalItems = gridSize.rows * gridSize.cols;

      // Create items with sequential numbers
      gameState.items = [];
      for (let i = 0; i < totalItems; i++) {
        gameState.items.push({
          id: i,
          number: i + 1,
          icon: iconTypes[i % iconTypes.length],
          originalIndex: i,
          currentIndex: i,
          clicked: false,
        });
      }

      gameState.clickSequence = [];
      gameState.memorizeTime = getMemorizeTime(gameState.level);
      gameState.memorizeTimer = gameState.memorizeTime;
      gameState.phase = 'memorize';

      // Show story text for this level
      const storyText = storyTexts[gameState.level];
      if (storyText) {
        statusDiv.innerHTML = `<div style="color: var(--primary-color); margin-bottom: 8px;">${storyText}</div>` +
          `<div>Memorize the positions! Time: ${(gameState.memorizeTimer / 1000).toFixed(1)}s</div>`;
      } else {
        statusDiv.textContent = `Level ${gameState.level} - Memorize the positions! Time: ${(gameState.memorizeTimer / 1000).toFixed(1)}s`;
      }

      updateScore();
      drawGame();

      // Countdown timer animation
      const startTime = Date.now();
      const timerInterval = setInterval(() => {
        if (gameState.phase !== 'memorize') {
          clearInterval(timerInterval);
          return;
        }

        const elapsed = Date.now() - startTime;
        gameState.memorizeTimer = Math.max(0, gameState.memorizeTime - elapsed);

        statusDiv.innerHTML = `<div style="color: var(--primary-color); margin-bottom: 8px;">${storyTexts[gameState.level] || ''}</div>` +
          `<div>Memorize! Time: <span style="color: ${gameState.memorizeTimer < 1000 ? 'var(--primary-color)' : 'inherit'}; font-weight: bold;">${(gameState.memorizeTimer / 1000).toFixed(1)}s</span></div>`;

        if (gameState.memorizeTimer <= 0) {
          clearInterval(timerInterval);
        }
      }, 100);

      // Auto-advance to shuffle phase
      setTimeout(() => {
        if (gameState.phase === 'memorize') {
          shuffleItems();
        }
      }, gameState.memorizeTime);
    }

    // Shuffle items
    function shuffleItems() {
      gameState.phase = 'shuffle';
      statusDiv.innerHTML = '<div style="font-size: 20px; animation: pulse 0.5s infinite;">🔀 Shuffling...</div>';

      // Fisher-Yates shuffle
      for (let i = gameState.items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = gameState.items[i].currentIndex;
        gameState.items[i].currentIndex = gameState.items[j].currentIndex;
        gameState.items[j].currentIndex = temp;
      }

      // Sort by current index for rendering
      gameState.items.sort((a, b) => a.currentIndex - b.currentIndex);

      setTimeout(() => {
        gameState.phase = 'play';
        gameState.playStartTime = Date.now();
        statusDiv.innerHTML = `<div>Click in order: <span style="color: var(--primary-color); font-size: 20px; font-weight: bold;">${gameState.clickSequence.length + 1}</span></div>` +
          `<div style="font-size: 14px; margin-top: 4px;">Lives: ${'❤️'.repeat(gameState.lives)}</div>`;
        drawGame();
      }, 800);

      drawGame();
    }

    // Draw icon shapes
    function drawIcon(x, y, size, icon) {
      ctx.fillStyle = icon.color;
      ctx.strokeStyle = icon.color;
      ctx.lineWidth = 2;

      const cx = x + size / 2;
      const cy = y + size / 2;
      const radius = size * 0.35;

      ctx.beginPath();
      switch (icon.shape) {
        case 'circle':
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'square':
          ctx.fillRect(x + size * 0.15, y + size * 0.15, size * 0.7, size * 0.7);
          break;
        case 'triangle':
          ctx.moveTo(cx, cy - radius);
          ctx.lineTo(cx - radius, cy + radius);
          ctx.lineTo(cx + radius, cy + radius);
          ctx.closePath();
          ctx.fill();
          break;
        case 'rect':
          ctx.fillRect(x + size * 0.1, y + size * 0.25, size * 0.8, size * 0.5);
          break;
        case 'diamond':
          ctx.moveTo(cx, cy - radius);
          ctx.lineTo(cx + radius, cy);
          ctx.lineTo(cx, cy + radius);
          ctx.lineTo(cx - radius, cy);
          ctx.closePath();
          ctx.fill();
          break;
        case 'cross':
          ctx.lineWidth = 4;
          ctx.moveTo(cx - radius * 0.7, cy - radius * 0.7);
          ctx.lineTo(cx + radius * 0.7, cy + radius * 0.7);
          ctx.moveTo(cx + radius * 0.7, cy - radius * 0.7);
          ctx.lineTo(cx - radius * 0.7, cy + radius * 0.7);
          ctx.stroke();
          break;
        case 'arrow':
          ctx.lineWidth = 3;
          ctx.moveTo(cx - radius, cy);
          ctx.lineTo(cx + radius * 0.5, cy);
          ctx.moveTo(cx + radius * 0.5, cy);
          ctx.lineTo(cx + radius * 0.2, cy - radius * 0.4);
          ctx.moveTo(cx + radius * 0.5, cy);
          ctx.lineTo(cx + radius * 0.2, cy + radius * 0.4);
          ctx.stroke();
          break;
        case 'pentagon':
          for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const px = cx + radius * Math.cos(angle);
            const py = cy + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          break;
        case 'hexagon':
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const px = cx + radius * Math.cos(angle);
            const py = cy + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          break;
        case 'star':
          for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
            const r = i % 2 === 0 ? radius : radius * 0.4;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          break;
        case 'check':
          ctx.lineWidth = 4;
          ctx.moveTo(cx - radius * 0.5, cy);
          ctx.lineTo(cx - radius * 0.1, cy + radius * 0.5);
          ctx.lineTo(cx + radius * 0.6, cy - radius * 0.5);
          ctx.stroke();
          break;
        case 'chain':
          ctx.lineWidth = 3;
          ctx.arc(cx - radius * 0.4, cy, radius * 0.4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx + radius * 0.4, cy, radius * 0.4, 0, Math.PI * 2);
          ctx.stroke();
          break;
      }
    }

    // Draw game
    function drawGame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { rows, cols } = gameState.currentGridSize;
      const cellSize = Math.min(canvas.width / cols, canvas.height / rows);
      const offsetX = (canvas.width - cellSize * cols) / 2;
      const offsetY = (canvas.height - cellSize * rows) / 2;

      gameState.items.forEach((item, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = offsetX + col * cellSize;
        const y = offsetY + row * cellSize;

        // Draw cell background with gradient for clicked items
        if (item.clicked) {
          const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
          gradient.addColorStop(0, '#d1e7dd');
          gradient.addColorStop(1, '#a3cfbb');
          ctx.fillStyle = gradient;
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);

          // Add checkmark
          ctx.strokeStyle = '#0f5132';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + cellSize * 0.3, y + cellSize * 0.5);
          ctx.lineTo(x + cellSize * 0.45, y + cellSize * 0.65);
          ctx.lineTo(x + cellSize * 0.7, y + cellSize * 0.35);
          ctx.stroke();
        } else {
          ctx.fillStyle = gameState.phase === 'memorize' ? '#fff9e6' : '#f8f9fa';
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        }

        // Border
        ctx.strokeStyle = item.clicked ? '#0f5132' : '#dee2e6';
        ctx.lineWidth = item.clicked ? 3 : 2;
        ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);

        // Don't draw icon content for clicked items to show they're done
        if (item.clicked) return;

        // Draw icon
        drawIcon(x, y, cellSize, item.icon);

        // Draw number (only in memorize phase) with shadow for emphasis
        if (gameState.phase === 'memorize') {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = '#000';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(item.number, x + cellSize / 2, y + cellSize - 5);
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        // Draw icon name
        ctx.fillStyle = '#495057';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(item.icon.name, x + cellSize / 2, y + 5);
      });
    }

    // Update score display
    function updateScore() {
      const progress = (gameState.level / 9) * 100;
      scoreDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap;">
          <div><strong>Level:</strong> ${gameState.level}/9</div>
          <div><strong>Lives:</strong> ${'❤️'.repeat(gameState.lives)}${'💔'.repeat(3 - gameState.lives)}</div>
          <div><strong>Score:</strong> ${gameState.score}</div>
        </div>
        <div style="width: 100%; height: 4px; background: #dee2e6; border-radius: 2px; margin-top: 8px; overflow: hidden;">
          <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, var(--primary-color), var(--accent-yellow)); transition: width 0.3s;"></div>
        </div>
      `;
    }

    // Handle click
    function handleClick(e) {
      if (gameState.phase !== 'play') return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const { rows, cols } = gameState.currentGridSize;
      const cellSize = Math.min(canvas.width / cols, canvas.height / rows);
      const offsetX = (canvas.width - cellSize * cols) / 2;
      const offsetY = (canvas.height - cellSize * rows) / 2;

      const col = Math.floor((x - offsetX) / cellSize);
      const row = Math.floor((y - offsetY) / cellSize);
      const index = row * cols + col;

      if (index < 0 || index >= gameState.items.length) return;

      const clickedItem = gameState.items[index];
      if (clickedItem.clicked) return;

      const expectedNumber = gameState.clickSequence.length + 1;

      if (clickedItem.number === expectedNumber) {
        // Correct click - animate
        clickedItem.clicked = true;
        gameState.clickSequence.push(clickedItem.number);

        // Calculate time bonus
        const timeSpent = Date.now() - gameState.playStartTime;
        const timeBonus = Math.max(0, Math.floor((10000 - timeSpent) / 1000));
        gameState.score += (10 * gameState.level) + timeBonus;

        // Flash green
        const itemRow = Math.floor(index / cols);
        const itemCol = index % cols;
        const itemX = offsetX + itemCol * cellSize;
        const itemY = offsetY + itemRow * cellSize;
        ctx.fillStyle = 'rgba(25, 135, 84, 0.4)';
        ctx.fillRect(itemX + 2, itemY + 2, cellSize - 4, cellSize - 4);
        setTimeout(() => drawGame(), 150);

        if (gameState.clickSequence.length === gameState.items.length) {
          // Level complete
          gameState.phase = 'levelComplete';
          const elapsedTime = ((Date.now() - gameState.playStartTime) / 1000).toFixed(1);

          if (gameState.level === 9) {
            statusDiv.innerHTML = `<div style="font-size: 24px; color: var(--primary-color);">🎉 Perfect Memory!</div>` +
              `<div style="margin-top: 8px;">You completed all 9 levels!</div>` +
              `<div>Final Score: <strong>${gameState.score}</strong></div>`;
            gameState.phase = 'gameOver';
          } else {
            statusDiv.innerHTML = `<div style="color: #0f5132; font-size: 18px;">✅ Level ${gameState.level} Complete!</div>` +
              `<div style="margin-top: 8px;">Time: ${elapsedTime}s | Score: ${gameState.score}</div>` +
              `<div style="margin-top: 8px; font-size: 14px;">Click Start to continue to Level ${gameState.level + 1}</div>`;
            gameState.level++;
            startBtn.textContent = `Start Level ${gameState.level}`;
          }
        } else {
          statusDiv.innerHTML = `<div style="color: #0f5132;">✓ Correct! Next: <span style="color: var(--primary-color); font-size: 20px; font-weight: bold;">${expectedNumber + 1}</span></div>` +
            `<div style="font-size: 14px; margin-top: 4px;">Lives: ${'❤️'.repeat(gameState.lives)}</div>`;
        }
      } else {
        // Wrong click - animate
        gameState.lives--;

        // Flash red on clicked item
        const itemRow = Math.floor(index / cols);
        const itemCol = index % cols;
        const itemX = offsetX + itemCol * cellSize;
        const itemY = offsetY + itemRow * cellSize;
        ctx.fillStyle = 'rgba(220, 53, 69, 0.5)';
        ctx.fillRect(itemX + 2, itemY + 2, cellSize - 4, cellSize - 4);

        // Draw X mark
        ctx.strokeStyle = '#842029';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(itemX + cellSize * 0.3, itemY + cellSize * 0.3);
        ctx.lineTo(itemX + cellSize * 0.7, itemY + cellSize * 0.7);
        ctx.moveTo(itemX + cellSize * 0.7, itemY + cellSize * 0.3);
        ctx.lineTo(itemX + cellSize * 0.3, itemY + cellSize * 0.7);
        ctx.stroke();

        setTimeout(() => drawGame(), 400);

        if (gameState.lives <= 0) {
          gameState.phase = 'gameOver';
          statusDiv.innerHTML = `<div style="color: var(--primary-color); font-size: 20px;">💭 Game Over</div>` +
            `<div style="margin-top: 8px;">Memory overload at Level ${gameState.level}!</div>` +
            `<div>Final Score: <strong>${gameState.score}</strong></div>` +
            `<div style="margin-top: 8px; font-size: 14px; font-style: italic;">"Design QA requires documentation, not just memory"</div>`;
          startBtn.textContent = 'Play Again';
        } else {
          statusDiv.innerHTML = `<div style="color: #842029;">✗ Wrong! Expected: ${expectedNumber}</div>` +
            `<div style="font-size: 14px; margin-top: 4px;">Lives: ${'❤️'.repeat(gameState.lives)}${'💔'.repeat(3 - gameState.lives)}</div>`;
        }
      }

      updateScore();
      drawGame();
    }

    // Start button handler
    startBtn.addEventListener('click', () => {
      if (gameState.phase === 'idle' || gameState.phase === 'levelComplete') {
        initializeLevel();
        startBtn.textContent = `Restart Level ${gameState.level}`;
      } else if (gameState.phase === 'gameOver') {
        // Reset game
        gameState = {
          level: 1,
          phase: 'idle',
          items: [],
          clickSequence: [],
          lives: 3,
          score: 0,
          memorizeTime: 5000,
          memorizeTimer: 0,
          playStartTime: 0,
          currentGridSize: { rows: 2, cols: 2 },
        };
        startBtn.textContent = 'Start Game';
        statusDiv.innerHTML = "<div style='color: var(--secondary-color);'>Click 'Start Game' to test your memory!</div>";
        updateScore();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGame();
      }
    });

    canvas.addEventListener('click', handleClick);

    // Add pulse animation style
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);

    // Initial draw
    drawGame();
    statusDiv.innerHTML = "<div style='color: var(--secondary-color);'>Click 'Start Game' to test your memory!</div>";
    updateScore();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
})();
