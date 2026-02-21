# [arra.blog]

**Breaking problems into elements**

A minimal, dynamic blog built with vanilla HTML, CSS, and JavaScript that renders Markdown blog posts. Inspired by Bauhaus and Constructivism design principles.

## Features

- ✨ **Minimal Animations**: Subtle geometric animations with Bauhaus-inspired shapes
- 📝 **Markdown Blog Posts**: Write posts in Markdown format
- 🔄 **Dynamic Rendering**: Posts are fetched and rendered client-side using JavaScript
- 📱 **Responsive Design**: Works on all device sizes
- 🎨 **Bauhaus-Inspired Design**: Bold typography, geometric shapes, and primary colors
- 🚀 **Fast Loading**: Lightweight with no heavy dependencies
- 📚 **Latest Posts**: Automatically displays the 3 most recent posts

## Live Demo

Visit the live site at: `https://yourusername.github.io/gitpages`

## How It Works

1. Blog posts are written in Markdown (`.md` files) in the `posts/` directory
2. Post metadata is stored in `posts/posts-metadata.json`
3. JavaScript fetches the metadata and displays the latest 3 posts
4. When a post is clicked, the Markdown file is fetched and rendered to HTML using [marked.js](https://marked.js.org/)
5. Minimal geometric animations enhance the user experience with Bauhaus design principles

## Setup Instructions

### 1. Fork or Clone This Repository

```bash
git clone https://github.com/yourusername/gitpages.git
cd gitpages
```

### 2. Enable GitHub Pages

1. Go to your repository settings on GitHub
2. Navigate to **Pages** section
3. Under **Source**, select the `main` branch
4. Click **Save**
5. Your site will be available at `https://yourusername.github.io/gitpages`

### 3. Customize Your Blog

Edit the following files:

- **`index.html`**: Change the site title and navigation
- **`styles.css`**: Modify colors, fonts, and animations
- **About section**: Update the "About Me" content in `index.html`

### 4. Add Your Own Posts

#### Create a new Markdown file

Create a new `.md` file in the `posts/` directory:

```markdown
# Your Post Title

**Published on January 12, 2026**

Your content here...

## Subheading

More content with **formatting**.
```

#### Update posts-metadata.json

Add your post information to `posts/posts-metadata.json`:

```json
{
  "posts": [
    {
      "filename": "your-post.md",
      "title": "Your Post Title",
      "date": "2026-01-12",
      "author": "Your Name",
      "excerpt": "A brief description of your post."
    }
  ]
}
```

**Note**: Posts are sorted by date (newest first), so make sure to use the format `YYYY-MM-DD`.

#### Build the static pages (Optional - Automated via GitHub Actions)

The repository includes a GitHub Action that automatically generates static HTML pages when you push changes. However, you can also build locally:

```bash
python3 build_posts.py
```

This creates static HTML files at `posts/YYYY/MM/post-slug.html` with proper meta tags for social media sharing.

**The GitHub Action will automatically:**

- Run when you push new posts or update metadata
- Generate the static HTML files
- Commit and push them back to your repository

You only need to commit your `.md` file and `posts-metadata.json` changes!

### 5. Testing Locally

**Important**: You MUST run a local web server (not `file://` protocol) due to CORS restrictions:

```bash
# Build posts first (generates static HTML with SEO tags)
python3 build_posts.py

# Start local server
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Project Structure

```
gitpages/
├── index.html              # Main HTML file
├── styles.css              # All styling and animations
├── blog.js                 # JavaScript for blog functionality
├── posts/                  # Blog posts directory
│   ├── posts-metadata.json # Post metadata
│   ├── post-1.md          # Blog post 1
│   ├── post-2.md          # Blog post 2
│   └── ...                # More posts
└── README.md              # This file
```

## Technologies Used

- **HTML5**: Structure
- **CSS3**: Styling and minimal Bauhaus-inspired animations
- **JavaScript (ES6+)**: Dynamic functionality
- **Marked.js**: Markdown parser (loaded via CDN)
- **GitHub Pages**: Hosting
- **Design**: Inspired by Bauhaus and Constructivism movements

## Customization

### Change Colors

Edit the CSS variables in `styles.css`. Current Bauhaus-inspired palette:

```css
:root {
  --primary-color: #e63946; /* Red */
  --secondary-color: #1d3557; /* Navy */
  --accent-yellow: #f4a261; /* Yellow */
  --text-color: #0a0a0a; /* Black */
  /* ... */
}
```

### Modify Animations

Edit the animation keyframes in `styles.css` for more or less movement:

```css
@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(20px, 30px) rotate(45deg);
  }
}
```

### Change Number of Displayed Posts

Edit `BLOG_CONFIG` in `blog.js`:

```javascript
const BLOG_CONFIG = {
  postsDirectory: "posts/",
  maxLatestPosts: 3, // Change this number
  postsMetadata: "posts/posts-metadata.json",
};
```

````

### Change Number of Displayed Posts

Edit `BLOG_CONFIG` in `blog.js`:

```javascript
const BLOG_CONFIG = {
  postsDirectory: "posts/",
  maxLatestPosts: 5, // Change this number
  postsMetadata: "posts/posts-metadata.json",
};
````

## Local Development

To test locally, you need a web server (JavaScript fetch won't work with `file://` protocol):

### Using Python

```bash
# Python 3
python -m http.server 8010

# Then visit http://localhost:8000
```

### Using Node.js

```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server

# Visit http://localhost:8080
```

### Using VS Code

Install the "Live Server" extension and click "Go Live" in the bottom right.

## Markdown Support

All standard Markdown features are supported:

- Headers
- **Bold** and _italic_ text
- Lists (ordered and unordered)
- Links and images
- Code blocks with syntax highlighting
- Blockquotes
- Horizontal rules

## Browser Support

Works in all modern browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Contributing

Feel free to fork this project and customize it for your own use!

## License

MIT License - feel free to use this for your own blog!

## Credits

- Markdown parsing: [Marked.js](https://marked.js.org/)
- Hosting: [GitHub Pages](https://pages.github.com/)

## Questions?

Open an issue on GitHub or customize the "About" section to add your contact information.

---

**Happy blogging!** 📝✨
