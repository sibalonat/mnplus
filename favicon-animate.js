// Animated favicon using frame swapping
(function () {
    'use strict';

    const frames = [
        'favicon-frame1.png',  // [ ]
        'favicon-frame2.png',  // [+] fading
        'favicon-frame3.png',  // [+] full
        'favicon-frame3.png',  // [+] hold
        'favicon-frame2.png',  // [+] fading out
    ];

    let currentFrame = 0;

    function updateFavicon() {
        // Remove existing favicon
        const oldLink = document.querySelector("link[rel='icon']");
        if (oldLink) {
            oldLink.remove();
        }

        // Add new favicon
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = frames[currentFrame];
        document.head.appendChild(link);

        // Move to next frame
        currentFrame = (currentFrame + 1) % frames.length;
    }

    // Update every 400ms for smooth animation
    setInterval(updateFavicon, 400);

    // Set initial favicon
    updateFavicon();
})();
