// Animated favicon that alternates between [] and [+]
(function () {
    let isOpen = false;
    let link = document.querySelector("link[rel~='icon']");

    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }

    function animateFavicon() {
        if (isOpen) {
            link.href = 'favicon-closed.svg';
        } else {
            link.href = 'favicon-open.svg';
        }
        isOpen = !isOpen;
    }

    // Animate every 2 seconds
    setInterval(animateFavicon, 2000);

    // Start with open state
    link.href = 'favicon-open.svg';
})();
