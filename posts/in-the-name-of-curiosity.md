# In the Name of Curiosity

I have always been curious about technology - I could also say it might have been a bit of an addiction to it. I remember that when I was a kid, I was always eager to consume as much as I could.

I'm originally from Albania, and I was not born in the capital Tirana, but Rubik, a northern industrial town(kinse(AL) - or trying(EN)) in the north. Because I moved to Tirana when I was four(4), I can remember small recollections of that time.

## Early Memories

Maybe around 3, running down the slope of hill where my then apartment would be, and always trying to play the next thing that was popular at that time. Considering that I was born when communism was falling - or it was the hope - my perception of those toys was a very basic form of gravity racer cars, or how we called them from Rubik, "korroca me guzhineta".

I used to play with them. Other older kids would invite me to play, and I would. Later on I learned that my mother was not a big fan of me wanting to play with these cars, most likely because of security and because she worried for me that I might get hurt. But I remember I would come home joyful whenever I could play with these cars.

## The Spark

At that time, I remember two things were apparent to me: the fact that I was eager to participate and eager to learn what other people understood, and I didn't. When I was this age, I might have felt happy to know this, because I was always happy, running around and smiling. A small long hair blond boy will be a bald grown-up.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #1a1a1a; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #00d4ff; font-size: clamp(16px, 4vw, 20px);">Try the 90s Racing Game!</h4>
  <canvas id="raceGame" width="300" height="400" style="border: 3px solid #00d4ff; background: #222; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto;"></canvas>
  <p style="margin-top: 10px; color: #999; font-size: clamp(12px, 3vw, 14px);">Use Arrow Keys ← → or Touch to stay on track!</p>
  <button id="startGame" style="padding: 12px 30px; background: #00d4ff; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <p id="gameScore" style="margin-top: 10px; font-weight: bold; color: #ff6b6b; font-size: clamp(16px, 4vw, 18px);">Score: 0</p>
</div>

<script type="text/javascript" src="posts/race-game.js"></script>

But I assume I mustn't have been very happy, for example, when my mother or the older kids either didn't let me play with them, or didn't think I should have a say in their play time. I was three, but had a very strong opinion that I wanted to play - take the risk and own it.

## About This Blog

This experience will lead me to create blog posts here in this page called **arra.blog**. Arra, like array - a native type of data - but also nuts in my native language, Albanian.

When I started this, I wanted this to be my experience, to share it as I knew how to do this. I almost always consider myself able to find the nicest way to create a playful story. I'll try to do the same thing also in this case.

And while I listen to a song by Sextile, called Soggy Newport - a band that I'm listening to for the first time, and its history on KEXP that really makes me understand I have missed designing and writing.

I welcome you to this reading, and wish really that it will be worthwhile.

### The Architecture

The game is wrapped in an **Immediately Invoked Function Expression (IIFE)** to avoid polluting the global namespace:

```javascript
// filepath:
// race-game.js - Simple 90s Racing Game
(function () {
  "use strict";

  let gameInitialized = false;
  let retryCount = 0;
  const MAX_RETRIES = 20;

  function initRaceGame() {
    console.log("[Race Game] Initializing... Attempt:", retryCount + 1);

    const canvas = document.getElementById("raceGame");
    const ctx = canvas ? canvas.getContext("2d") : null;
    const startBtn = document.getElementById("startGame");
    const scoreDisplay = document.getElementById("gameScore");

    console.log("[Race Game] Elements check:", {
      canvas: !!canvas,
      ctx: !!ctx,
      startBtn: !!startBtn,
      scoreDisplay: !!scoreDisplay,
    });

    // If elements aren't found, retry
    if (!canvas || !ctx || !startBtn || !scoreDisplay) {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(initRaceGame, 200);
        return;
      }
      console.error("[Race Game] Failed to find elements after max retries");
      return;
    }

    // Only initialize once
    if (gameInitialized) {
      console.log("[Race Game] Already initialized, skipping");
      return;
    }

    console.log("[Race Game] Starting initialization...");

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
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#333";
      ctx.fillRect(roadLeft, 0, roadRight - roadLeft, canvas.height);
      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(carX, carY, 30, 50);
      ctx.fillStyle = "#3498db";
      ctx.fillRect(carX + 5, carY + 5, 20, 15);
    }

    // Keyboard controls
    function handleKeyDown(e) {
      if (e.key === "ArrowLeft") keys.left = true;
      if (e.key === "ArrowRight") keys.right = true;
    }

    function handleKeyUp(e) {
      if (e.key === "ArrowLeft") keys.left = false;
      if (e.key === "ArrowRight") keys.right = false;
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    function drawRoad() {
      ctx.fillStyle = "#333";
      ctx.fillRect(roadLeft, 0, roadRight - roadLeft, canvas.height);

      // Road lines
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        const y = (i * 80 + roadOffset) % canvas.height;
        ctx.beginPath();
        ctx.moveTo(150, y);
        ctx.lineTo(150, y + 40);
        ctx.stroke();
      }

      // Road edges
      ctx.strokeStyle = "#ff0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(roadLeft, 0);
      ctx.lineTo(roadLeft, canvas.height);
      ctx.moveTo(roadRight, 0);
      ctx.lineTo(roadRight, canvas.height);
      ctx.stroke();
    }

    function drawCar() {
      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(carX, carY, 30, 50);
      ctx.fillStyle = "#3498db";
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
      ctx.fillStyle = "#111";
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
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2);
      ctx.font = "20px Arial";
      ctx.fillText(
        `Final Score: ${Math.floor(score)}`,
        canvas.width / 2,
        canvas.height / 2 + 40
      );
      startBtn.textContent = "Play Again";
      startBtn.disabled = false;
    }

    function startGame() {
      console.log("[Race Game] Start button clicked!");

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
      startBtn.textContent = "Playing...";
      startBtn.disabled = true;

      console.log("[Race Game] Game loop starting...");
      // Start the game loop
      update();
    }

    startBtn.addEventListener("click", startGame);

    // Draw initial state
    drawInitial();

    gameInitialized = true;
    console.log("[Race Game] ✓ Initialized successfully!");
  }

  // Try to initialize immediately
  console.log("[Race Game] Script loaded, attempting init...");
  setTimeout(initRaceGame, 100);
})();
```
