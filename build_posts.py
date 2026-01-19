#!/usr/bin/env python3
"""
Static Post Generator for arra.blog

Generates individual HTML files for each blog post organized by year/month.
This enables proper SEO meta tags for social media crawlers while maintaining
the dynamic markdown rendering for actual content.

Structure: posts/YYYY/MM/post-slug.html

Usage: python3 build_posts.py
"""

import json
import os
from pathlib import Path

# Configuration
BASE_URL = 'https://sibalonat.github.io/mnplus/'
METADATA_FILE = 'posts/posts-metadata.json'
TEMPLATE_FILE = 'post-template.html'
OUTPUT_DIR = 'posts'


def read_posts_metadata():
    """Read and parse the posts metadata."""
    try:
        with open(METADATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f'❌ Error reading posts metadata: {e}')
        exit(1)


def read_template():
    """Read the HTML template."""
    try:
        with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f'❌ Error reading template: {e}')
        exit(1)


def get_post_path(date, filename):
    """
    Generate the output path for a post based on its date.
    Format: posts/YYYY/MM/post-slug.html
    """
    year, month, _ = date.split('-')
    slug = filename.replace('.md', '')
    return os.path.join(OUTPUT_DIR, year, month, f'{slug}.html')


def get_post_url(date, filename):
    """Generate the URL path for a post."""
    year, month, _ = date.split('-')
    slug = filename.replace('.md', '')
    return f'{BASE_URL}posts/{year}/{month}/{slug}.html'


def fill_template(template, post):
    """Replace placeholders in template with post data."""
    slug = post['filename'].replace('.md', '')
    post_url = get_post_url(post['date'], post['filename'])
    image_url = BASE_URL + post.get('image', 'assets/default-share-image.png')
    description = post.get('excerpt', post['title'])
    author = post.get('author', 'arra.blog')
    category = post.get('category', 'blog')
    
    # Replace all placeholders
    html = template
    html = html.replace('{{POST_TITLE}}', post['title'])
    html = html.replace('{{POST_DESCRIPTION}}', description)
    html = html.replace('{{POST_AUTHOR}}', author)
    html = html.replace('{{POST_DATE}}', post['date'])
    html = html.replace('{{POST_URL}}', post_url)
    html = html.replace('{{POST_IMAGE}}', image_url)
    html = html.replace('{{POST_FILENAME}}', post['filename'])
    html = html.replace('{{POST_CATEGORY}}', category)
    
    return html


def generate_post(template, post):
    """Generate a single post HTML file."""
    output_path = get_post_path(post['date'], post['filename'])
    html = fill_template(template, post)
    
    # Ensure directory exists
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    # Write file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    return output_path


def build():
    """Main build function."""
    print('🚀 Building static post pages...\n')
    
    metadata = read_posts_metadata()
    template = read_template()
    posts = metadata.get('posts', [])
    
    if not posts:
        print('⚠️  No posts found in metadata')
        return
    
    print(f'📝 Found {len(posts)} post(s) to generate\n')
    
    # Track which HTML files should exist
    expected_files = set()
    for post in posts:
        output_path = get_post_path(post['date'], post['filename'])
        expected_files.add(output_path)
    
    # Find and delete orphaned HTML files
    deleted_count = 0
    posts_dir = Path(OUTPUT_DIR)
    if posts_dir.exists():
        for html_file in posts_dir.rglob('*.html'):
            # Skip if it's not in a YYYY/MM structure
            parts = html_file.parts
            if len(parts) >= 4 and parts[-3].isdigit() and parts[-2].isdigit():
                file_path = str(html_file)
                if file_path not in expected_files:
                    html_file.unlink()
                    print(f'🗑️  Deleted orphaned: {file_path}')
                    deleted_count += 1
    
    success_count = 0
    error_count = 0
    
    for post in posts:
        try:
            output_path = generate_post(template, post)
            print(f'✅ {post["title"]}')
            print(f'   → {output_path}\n')
            success_count += 1
        except Exception as e:
            print(f'❌ Failed to generate {post["filename"]}: {e}')
            error_count += 1
    
    print('\n' + '=' * 50)
    print('✨ Build complete!')
    print(f'   Success: {success_count}')
    if deleted_count > 0:
        print(f'   Deleted: {deleted_count}')
    if error_count > 0:
        print(f'   Errors: {error_count}')
    print('=' * 50)


if __name__ == '__main__':
    build()
