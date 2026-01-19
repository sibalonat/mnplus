# AI Coding Agent Instructions for arra.blog

## Project Overview

This is a **static blog site** deployed on GitHub Pages that dynamically renders Markdown posts client-side using vanilla JavaScript. The architecture uses a dual-page pattern: `index.html` for listing posts and `post.html` for individual post views.

**Key Design Philosophy**: Bauhaus-inspired minimalism with geometric animations. No build step, no framework - pure HTML/CSS/JS.

## Architecture & Data Flow

### Two-Page Architecture
1. **index.html** - Main landing page with hero section, latest posts grid (max 3), and about section
   - Uses `blog.js` for SPA-like navigation between home/blog/about sections
   - Posts are clickable cards that redirect to `post.html?post=filename.md`

2. **post.html** - Dedicated single-post viewer
   - Reads `?post=` query parameter to load specific Markdown files
   - Independently handles SEO meta tags and post rendering
   - Uses marked.js to parse Markdown → HTML

### Critical Data Source
- **posts/posts-metadata.json** - Single source of truth for all blog posts
  - Posts are sorted by `date` field (newest first) on load
  - Required fields: `filename`, `title`, `date`, `author`, `excerpt`
  - When adding new posts, ALWAYS update this file first

### Script Execution Pattern
Both `post.html` and markdown posts support embedded `<script>` tags. The `executeScripts()` function in `post.html` (lines 172-188) replaces innerHTML-inserted scripts to enable execution. 

**Interactive Post Pattern**: 
- Posts can embed HTML with `<script>` tags for interactive demos (see [posts/race-game.js](posts/race-game.js), [posts/pressure-game.js](posts/pressure-game.js))
- Scripts use retry logic (`MAX_RETRIES = 20`, 200ms intervals) to wait for DOM elements
- Game containers use responsive sizing: `max-width: min(400px, 90vw)` pattern
- Canvas elements and controls are embedded directly in Markdown as HTML blocks
- Use initialization guards (`gameInitialized` flag) to prevent duplicate setup

## Development Workflow

### Adding New Blog Posts
1. Create `.md` file in `posts/` directory
2. Add metadata entry to `posts/posts-metadata.json` (maintains sorted order by date)
3. No build step needed - refresh the page to see changes
4. For interactive posts: Create separate `.js` file and reference in Markdown via `<script src="posts/yourfile.js"></script>`

**Interactive Post Template**:
```markdown
## Your Interactive Section

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto;">
  <canvas id="yourCanvas" width="300" height="400"></canvas>
  <button id="yourButton">Start</button>
</div>

<script src="posts/your-game.js"></script>
```

### Testing Locally
⚠️ **MUST run a local web server** - cannot use `file://` protocol due to CORS restrictions with fetch()

```bash
# Quick server options:
python -m http.server 8000
# OR
npx serve
```

Then open `http://localhost:8000`

### Deployment
Hosted on GitHub Pages at `https://sibalonat.github.io/mnplus/`
- Deploys automatically on push to `main` branch
- Update `CNAME` if using custom domain

## Project-Specific Conventions

### CSS Architecture
- Uses CSS custom properties (`:root` variables in lines 1-12 of [styles.css](styles.css))
- Color scheme: `--primary-color` (red #e63946), `--secondary-color` (navy #1d3557), `--accent-yellow` (#f4a261)
- Animations triggered via CSS classes like `.fade-in` with `animation-delay` calculated in JS

### JavaScript Patterns
- **No frameworks/bundlers** - pure vanilla JS with ES6+ features
- Configuration object pattern: See `BLOG_CONFIG` in [blog.js](blog.js:3-7)
- Async/await for all fetch operations
- Error handling displays user-friendly messages (not console-only)

### SEO Implementation
Both HTML files include comprehensive meta tags:
- Open Graph for social media
- Twitter cards
- Canonical URLs (baseUrl: `https://sibalonat.github.io/mnplus/`)
- Dynamic updates in `post.html` via `updateSEOMeta()` function (lines 104-148)

### Favicon Animation
[favicon-animate.js](favicon-animate.js) cycles through 5 PNG frames every 400ms using frame-swapping technique. Requires corresponding `favicon-frame1.png` through `favicon-frame3.png` files.

### Assets Structure
- `assets/` directory contains social media and branding images
- Key files: `default-share-image.png` (used when posts don't specify custom images)
- Logo variants: SVG static and animated versions available

## Common Pitfalls

1. **Markdown posts not appearing**: Check `posts-metadata.json` syntax and date format (`YYYY-MM-DD`)
2. **Scripts in posts not running**: Markdown must include literal `<script>` tags (not markdown code blocks)
3. **Fetch errors**: Ensure local server is running, not viewing files directly
4. **Latest posts limit**: Only 3 posts shown on homepage (see `BLOG_CONFIG.maxLatestPosts`)
5. **Navigation state**: `index.html` uses section visibility toggling, not true routing
6. **Interactive elements timing**: Game scripts need retry logic because DOM elements may not be ready when script executes
7. **URL clean links**: Post URLs use slugs without `.md` extension (removed in `updateSEOMeta()` and `createPostCard()` functions)

## Key Files Reference

- [blog.js](blog.js) - Post loading, navigation, card rendering
- [post.html](post.html) - Single post viewer with SEO and script execution
- [styles.css](styles.css) - All styling (485 lines, includes animations)
- [posts/posts-metadata.json](posts/posts-metadata.json) - Post registry (update on every new post)
- [README.md](README.md) - Setup instructions for users

## External Dependencies

- **marked.js** (CDN: `https://cdn.jsdelivr.net/npm/marked/marked.min.js`) - Only external dependency, loaded in both HTML files for Markdown parsing
