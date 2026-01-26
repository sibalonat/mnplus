// Polymorphism Game - Morph the Human
// Bauhaus-inspired body part morphing game

(function () {
    const MAX_RETRIES = 20;
    let retryCount = 0;
    let gameInitialized = false;

    function initGame() {
        if (gameInitialized) return;

        const canvas = document.getElementById('polymorphCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;

        if (!canvas || !ctx) {
            retryCount++;
            if (retryCount < MAX_RETRIES) {
                setTimeout(initGame, 200);
            }
            return;
        }

        gameInitialized = true;

        // Game state
        let selectedSection = 0;
        const totalSections = 8;

        // Body part variations (each section has multiple states)
        const bodyParts = {
            head: [
                { name: 'Round', width: 60, height: 60 },
                { name: 'Oval', width: 55, height: 70 },
                { name: 'Square', width: 65, height: 65 },
                { name: 'Wide', width: 75, height: 55 }
            ],
            eyes: [
                { name: 'Normal', size: 8, spacing: 20 },
                { name: 'Wide', size: 10, spacing: 30 },
                { name: 'Narrow', size: 6, spacing: 15 },
                { name: 'Large', size: 12, spacing: 20 }
            ],
            nose: [
                { name: 'Small', width: 8, height: 15 },
                { name: 'Wide', width: 15, height: 15 },
                { name: 'Long', width: 8, height: 25 },
                { name: 'Button', width: 10, height: 10 }
            ],
            mouth: [
                { name: 'Smile', width: 30, curve: 10 },
                { name: 'Neutral', width: 25, curve: 0 },
                { name: 'Wide', width: 40, curve: 8 },
                { name: 'Small', width: 20, curve: 5 }
            ],
            torso: [
                { name: 'Normal', width: 70, height: 80 },
                { name: 'Thin', width: 50, height: 85 },
                { name: 'Wide', width: 90, height: 75 },
                { name: 'Athletic', width: 75, height: 80 }
            ],
            arms: [
                { name: 'Normal', width: 12, length: 60 },
                { name: 'Thin', width: 8, length: 65 },
                { name: 'Muscular', width: 18, length: 55 },
                { name: 'Long', width: 12, length: 75 }
            ],
            legs: [
                { name: 'Normal', width: 15, length: 80 },
                { name: 'Thin', width: 10, length: 85 },
                { name: 'Muscular', width: 20, length: 75 },
                { name: 'Short', width: 15, length: 65 }
            ],
            feet: [
                { name: 'Normal', width: 25, height: 12 },
                { name: 'Small', width: 20, height: 10 },
                { name: 'Large', width: 30, height: 15 },
                { name: 'Wide', width: 35, height: 12 }
            ]
        };

        // Current selected variation for each body part
        let currentVariations = [0, 0, 0, 0, 0, 0, 0, 0];
        const partNames = ['head', 'eyes', 'nose', 'mouth', 'torso', 'arms', 'legs', 'feet'];

        // Bauhaus color palette
        const colors = {
            primary: '#e63946',
            secondary: '#1d3557',
            accent: '#f4a261',
            highlight: '#2a9d8f',
            background: '#f1faee'
        };

        function drawFigure() {
            // Clear canvas
            ctx.fillStyle = colors.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            let currentY = 60;

            // Draw head
            const head = bodyParts.head[currentVariations[0]];
            ctx.fillStyle = selectedSection === 0 ? colors.primary : colors.secondary;
            ctx.fillRect(centerX - head.width / 2, currentY, head.width, head.height);
            currentY += head.height + 5;

            // Draw eyes
            const eyes = bodyParts.eyes[currentVariations[1]];
            ctx.fillStyle = selectedSection === 1 ? colors.primary : colors.accent;
            ctx.fillRect(centerX - eyes.spacing / 2 - eyes.size, currentY, eyes.size, eyes.size);
            ctx.fillRect(centerX + eyes.spacing / 2, currentY, eyes.size, eyes.size);
            currentY += eyes.size + 5;

            // Draw nose
            const nose = bodyParts.nose[currentVariations[2]];
            ctx.fillStyle = selectedSection === 2 ? colors.primary : colors.secondary;
            ctx.fillRect(centerX - nose.width / 2, currentY, nose.width, nose.height);
            currentY += nose.height + 5;

            // Draw mouth
            const mouth = bodyParts.mouth[currentVariations[3]];
            ctx.fillStyle = selectedSection === 3 ? colors.primary : colors.accent;
            if (mouth.curve > 0) {
                ctx.beginPath();
                ctx.arc(centerX, currentY, mouth.width / 2, 0.2, Math.PI - 0.2);
                ctx.lineWidth = 4;
                ctx.strokeStyle = selectedSection === 3 ? colors.primary : colors.accent;
                ctx.stroke();
            } else {
                ctx.fillRect(centerX - mouth.width / 2, currentY, mouth.width, 4);
            }
            currentY += 15;

            // Draw torso
            const torso = bodyParts.torso[currentVariations[4]];
            ctx.fillStyle = selectedSection === 4 ? colors.primary : colors.highlight;
            ctx.fillRect(centerX - torso.width / 2, currentY, torso.width, torso.height);

            // Draw arms
            const arms = bodyParts.arms[currentVariations[5]];
            ctx.fillStyle = selectedSection === 5 ? colors.primary : colors.secondary;
            ctx.fillRect(centerX - torso.width / 2 - arms.width - 5, currentY + 10, arms.width, arms.length);
            ctx.fillRect(centerX + torso.width / 2 + 5, currentY + 10, arms.width, arms.length);

            currentY += torso.height + 5;

            // Draw legs
            const legs = bodyParts.legs[currentVariations[6]];
            ctx.fillStyle = selectedSection === 6 ? colors.primary : colors.secondary;
            ctx.fillRect(centerX - legs.width - 5, currentY, legs.width, legs.length);
            ctx.fillRect(centerX + 5, currentY, legs.width, legs.length);
            currentY += legs.length + 5;

            // Draw feet
            const feet = bodyParts.feet[currentVariations[7]];
            ctx.fillStyle = selectedSection === 7 ? colors.primary : colors.accent;
            ctx.fillRect(centerX - feet.width - 10, currentY, feet.width, feet.height);
            ctx.fillRect(centerX + 10, currentY, feet.width, feet.height);

            // Draw selection indicator
            drawSelectionLabels();
        }

        function drawSelectionLabels() {
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = colors.primary;
            ctx.textAlign = 'center';

            const currentPart = partNames[selectedSection];
            const currentVariation = bodyParts[currentPart][currentVariations[selectedSection]];

            ctx.fillText(`Selected: ${currentPart.toUpperCase()}`, centerX, 20);
            ctx.font = '12px Arial';
            ctx.fillText(`Style: ${currentVariation.name}`, centerX, 40);
            ctx.fillText('↑↓ to select part | ←→ to morph', centerX, canvas.height - 10);
        }

        function handleKeyPress(e) {
            const key = e.key;

            if (key === 'ArrowUp') {
                e.preventDefault();
                selectedSection = (selectedSection - 1 + totalSections) % totalSections;
                drawFigure();
            } else if (key === 'ArrowDown') {
                e.preventDefault();
                selectedSection = (selectedSection + 1) % totalSections;
                drawFigure();
            } else if (key === 'ArrowLeft') {
                e.preventDefault();
                const partName = partNames[selectedSection];
                const maxVariations = bodyParts[partName].length;
                currentVariations[selectedSection] = (currentVariations[selectedSection] - 1 + maxVariations) % maxVariations;
                drawFigure();
            } else if (key === 'ArrowRight') {
                e.preventDefault();
                const partName = partNames[selectedSection];
                const maxVariations = bodyParts[partName].length;
                currentVariations[selectedSection] = (currentVariations[selectedSection] + 1) % maxVariations;
                drawFigure();
            }
        }

        // Touch controls for mobile
        let touchStartY = 0;
        let touchStartX = 0;

        canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartY = touch.clientY;
            touchStartX = touch.clientX;
        });

        canvas.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            const deltaY = touch.clientY - touchStartY;
            const deltaX = touch.clientX - touchStartX;

            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 30) {
                if (deltaY > 0) {
                    selectedSection = (selectedSection + 1) % totalSections;
                } else {
                    selectedSection = (selectedSection - 1 + totalSections) % totalSections;
                }
            } else if (Math.abs(deltaX) > 30) {
                const partName = partNames[selectedSection];
                const maxVariations = bodyParts[partName].length;
                if (deltaX > 0) {
                    currentVariations[selectedSection] = (currentVariations[selectedSection] + 1) % maxVariations;
                } else {
                    currentVariations[selectedSection] = (currentVariations[selectedSection] - 1 + maxVariations) % maxVariations;
                }
            }
            drawFigure();
        });

        // Event listeners
        document.addEventListener('keydown', handleKeyPress);

        // Initial draw
        drawFigure();

        console.log('Polymorphism game initialized!');
    }

    // Start initialization attempts
    initGame();
})();
