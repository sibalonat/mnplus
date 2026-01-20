#!/usr/bin/env python3
"""
Script to detect new blog posts and send email notifications to subscribers.
This runs automatically via GitHub Actions when posts-metadata.json changes.
"""

import json
import os
import subprocess
import sys
import requests
from datetime import datetime

# Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
BASE_URL = 'https://sibalonat.github.io/mnplus'
FROM_EMAIL = 'marninikolli@gmail.com' 
SUBSCRIBERS_FILE = 'subscribers.json'
METADATA_FILE = 'posts/posts-metadata.json'

def get_changed_posts():
    """Detect new or modified posts by comparing with previous commit."""
    try:
        # Get the diff of posts-metadata.json
        diff_output = subprocess.check_output(
            ['git', 'diff', 'HEAD~1', 'HEAD', METADATA_FILE],
            text=True
        )
        
        # Load current metadata
        with open(METADATA_FILE, 'r') as f:
            metadata = json.load(f)
        
        # Get the latest post (assuming sorted by date, newest first)
        if metadata.get('posts'):
            latest_post = metadata['posts'][0]
            
            # Check if this post was added in the latest commit
            if f'"{latest_post["filename"]}"' in diff_output and '+' in diff_output:
                return [latest_post]
        
        return []
    except Exception as e:
        print(f"Error detecting changes: {e}")
        return []

def load_subscribers():
    """Load subscriber emails from JSON file."""
    try:
        with open(SUBSCRIBERS_FILE, 'r') as f:
            data = json.load(f)
            return data.get('subscribers', [])
    except FileNotFoundError:
        print(f"Warning: {SUBSCRIBERS_FILE} not found")
        return []
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {SUBSCRIBERS_FILE}")
        return []

def send_email_via_resend(to_email, post):
    """Send notification email using Resend API."""
    if not RESEND_API_KEY:
        print("Error: RESEND_API_KEY not set in environment")
        return False
    
    # Build post URL
    post_date = datetime.strptime(post['date'], '%Y-%m-%d')
    year = post_date.strftime('%Y')
    month = post_date.strftime('%m')
    slug = post['filename'].replace('.md', '')
    post_url = f"{BASE_URL}/posts/{year}/{month}/{slug}.html"
    
    # Email content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #0a0a0a;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                border-left: 6px solid #e63946;
                padding-left: 20px;
                margin-bottom: 30px;
            }}
            .post-title {{
                font-size: 24px;
                font-weight: 900;
                margin-bottom: 10px;
            }}
            .post-excerpt {{
                color: #666;
                margin-bottom: 20px;
            }}
            .read-button {{
                display: inline-block;
                padding: 15px 35px;
                background: #e63946;
                color: white;
                text-decoration: none;
                font-weight: 700;
                border: 3px solid #000;
            }}
            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #eee;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>[arra.blog]</h1>
            <p>Breaking problems into elements</p>
        </div>
        
        <p>Hi there! 👋</p>
        <p>A new post has been published on [arra.blog]:</p>
        
        <div style="background: #f5f5f5; padding: 30px; border: 3px solid #000; margin: 20px 0;">
            <div class="post-title">{post['title']}</div>
            <p style="color: #666; margin-bottom: 15px;">
                {post['date']} • {post['author']}
            </p>
            <div class="post-excerpt">{post['excerpt']}</div>
            <a href="{post_url}" class="read-button">Read Post →</a>
        </div>
        
        <div class="footer">
            <p>You're receiving this because you subscribed to [arra.blog]</p>
            <p>© 2026 [arra.blog] — Breaking problems into elements</p>
        </div>
    </body>
    </html>
    """
    
    # Send via Resend
    response = requests.post(
        'https://api.resend.com/emails',
        headers={
            'Authorization': f'Bearer {RESEND_API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'from': FROM_EMAIL,
            'to': to_email,
            'subject': f"New post: {post['title']}",
            'html': html_content
        }
    )
    
    if response.status_code == 200:
        print(f"✓ Email sent to {to_email}")
        return True
    else:
        print(f"✗ Failed to send to {to_email}: {response.text}")
        return False

def main():
    """Main function to detect new posts and notify subscribers."""
    print("Checking for new posts...")
    
    new_posts = get_changed_posts()
    
    if not new_posts:
        print("No new posts detected.")
        return
    
    print(f"Found {len(new_posts)} new post(s)")
    
    subscribers = load_subscribers()
    
    if not subscribers:
        print("No subscribers found.")
        return
    
    print(f"Notifying {len(subscribers)} subscriber(s)...")
    
    for post in new_posts:
        print(f"\nNotifying about: {post['title']}")
        success_count = 0
        
        for subscriber in subscribers:
            email = subscriber.get('email')
            if email and send_email_via_resend(email, post):
                success_count += 1
        
        print(f"\nSuccessfully notified {success_count}/{len(subscribers)} subscribers")

if __name__ == '__main__':
    main()
