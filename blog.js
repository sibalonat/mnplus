// Blog configuration
const BLOG_CONFIG = {
    postsDirectory: 'posts/',
    maxLatestPosts: 3,
    postsMetadata: 'posts/posts-metadata.json'
};

// State management
let currentPage = 'home';
let allPosts = [];

// Initialize the blog
document.addEventListener('DOMContentLoaded', async () => {
    await loadPosts();
    setupNavigation();
    setupBackButton();
    setupSubscriptionForm();
    showSection('home');
});

// Load posts metadata
async function loadPosts() {
    try {
        const response = await fetch(BLOG_CONFIG.postsMetadata);
        if (!response.ok) {
            throw new Error('Failed to load posts metadata');
        }
        const data = await response.json();
        allPosts = data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        displayLatestPosts();
    } catch (error) {
        console.error('Error loading posts:', error);
        displayErrorMessage();
    }
}

// Display the latest posts
function displayLatestPosts() {
    const postsContainer = document.getElementById('posts-container');
    const latestPosts = allPosts.slice(0, BLOG_CONFIG.maxLatestPosts);

    if (latestPosts.length === 0) {
        postsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">No posts available yet. Check back soon!</p>';
        return;
    }

    postsContainer.innerHTML = '';

    latestPosts.forEach((post, index) => {
        const postCard = createPostCard(post, index);
        postsContainer.appendChild(postCard);
    });
}

// Create a post card element
function createPostCard(post, index) {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const title = document.createElement('h3');
    title.textContent = post.title;

    const meta = document.createElement('div');
    meta.className = 'post-meta';
    meta.textContent = `${formatDate(post.date)} • ${post.author || 'Anonymous'}`;

    const excerpt = document.createElement('p');
    excerpt.className = 'post-excerpt';
    excerpt.textContent = post.excerpt || 'Click to read more...';

    const readMore = document.createElement('span');
    readMore.className = 'read-more';
    readMore.textContent = 'Read more →';

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(excerpt);
    card.appendChild(readMore);

    // Link to separate post page instead of inline loading
    card.addEventListener('click', () => {
        // Use static generated page organized by year/month
        const [year, month] = post.date.split('-');
        const postSlug = post.filename.replace('.md', '');
        window.location.href = `posts/${year}/${month}/${postSlug}.html`;
    });

    return card;
}

// Load and display a single post
async function loadPost(filename) {
    try {
        const response = await fetch(`${BLOG_CONFIG.postsDirectory}${filename}`);
        if (!response.ok) {
            throw new Error('Failed to load post');
        }
        const markdown = await response.text();
        const html = marked.parse(markdown);

        const postContent = document.getElementById('post-content');
        postContent.innerHTML = html;

        showSection('post');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading post:', error);
        alert('Failed to load the post. Please try again.');
    }
}

// Navigation setup
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');

            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            showSection(page);
        });
    });
}

// Show specific section
function showSection(section) {
    currentPage = section;

    // Hide all sections
    document.getElementById('home-section').style.display = 'none';
    document.getElementById('blog-section').classList.add('hidden');
    document.getElementById('post-view').classList.add('hidden');
    document.getElementById('about-section').classList.add('hidden');

    // Show requested section
    switch (section) {
        case 'home':
            document.getElementById('home-section').style.display = 'flex';
            document.getElementById('blog-section').classList.remove('hidden');
            break;
        case 'blog':
            document.getElementById('home-section').style.display = 'none';
            document.getElementById('blog-section').classList.remove('hidden');
            break;
        case 'post':
            document.getElementById('post-view').classList.remove('hidden');
            break;
        case 'about':
            document.getElementById('about-section').classList.remove('hidden');
            break;
    }
}

// Back button setup
function setupBackButton() {
    const backButton = document.getElementById('back-button');
    backButton.addEventListener('click', () => {
        showSection('blog');
        // Update nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === 'blog') {
                link.classList.add('active');
            }
        });
    });
}

// Display error message
function displayErrorMessage() {
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <p style="color: var(--text-light); margin-bottom: 20px;">Unable to load posts. Please make sure:</p>
            <ul style="list-style: none; color: var(--text-light);">
                <li>• The posts-metadata.json file exists in the posts/ directory</li>
                <li>• Your markdown files are properly configured</li>
                <li>• You're running this on a web server (not file://)</li>
            </ul>
        </div>
    `;
}

// Utility function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
}

// Add smooth scrolling for all links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href.length <= 1) return; // ignore invalid anchors
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

// Subscription Form Setup
function setupSubscriptionForm() {
    const form = document.getElementById('subscription-form');
    if (!form) return;

    const emailInput = document.getElementById('subscriber-email');
    const messageDiv = document.getElementById('subscription-message');
    const submitButton = form.querySelector('.subscribe-button');
    const buttonText = submitButton?.querySelector('.button-text');
    const buttonLoader = submitButton?.querySelector('.button-loader');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        if (submitButton) submitButton.disabled = true;
        buttonText?.classList.add('hidden');
        buttonLoader?.classList.remove('hidden');
        messageDiv.classList.add('hidden');

        try {
            // Use URLSearchParams for proper form encoding
            const params = new URLSearchParams();
            params.append('email', email);

            // no-cors mode works with localhost and GitHub Pages
            await fetch('https://getform.io/f/diw8galuow5', {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });

            // Response is opaque with no-cors; assume success if no throw
            showMessage('✓ Successfully subscribed! Thank you.', 'success');
            emailInput.value = '';
        } catch (error) {
            console.error('Subscription error:', error);
            showMessage('✗ Something went wrong. Please try again later.', 'error');
        } finally {
            if (submitButton) submitButton.disabled = false;
            buttonText?.classList.remove('hidden');
            buttonLoader?.classList.add('hidden');
        }
    });

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `subscription-message ${type}`;
        messageDiv.classList.remove('hidden');
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
