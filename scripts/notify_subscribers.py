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
from datetime import datetime, timezone

try:
    from zoneinfo import ZoneInfo
    BLOG_TZ = ZoneInfo('Europe/Tirane')
except Exception:
    BLOG_TZ = timezone.utc

# Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
BASE_URL = 'https://sibalonat.github.io/mnplus'
# NOTE: Resend requires a verified domain. Use 'onboarding@resend.dev' for testing
# or your verified domain (e.g., 'blog@yourdomain.com')
FROM_EMAIL = 'new@arra.blog'
SUBSCRIBERS_FILE = 'subscribers.json'
METADATA_FILE = 'posts/posts-metadata.json'

def blog_today():
    """Current date (YYYY-MM-DD) where the blog lives — publication dates are local."""
    return datetime.now(BLOG_TZ).strftime('%Y-%m-%d')

def get_changed_posts():
    """Detect new or modified posts by comparing with previous commit."""
    try:
        # Get the diff of posts-metadata.json
        diff_output = subprocess.check_output(
            ['git', 'diff', 'HEAD~1', 'HEAD', METADATA_FILE],
            text=True
        )
        
        print("Git diff output:")
        print(diff_output)
        print("=" * 60)
        
        # Load current metadata
        with open(METADATA_FILE, 'r') as f:
            metadata = json.load(f)
        
        # Find all new posts in the diff
        new_posts = []
        
        if metadata.get('posts'):
            for post in metadata['posts']:
                filename = post['filename']
                # Check if this post was added (look for the filename in added lines)
                # More robust check: look for lines like '+            "filename": "...'
                added_filename_pattern = f'+            "filename": "{filename}"'
                
                if added_filename_pattern in diff_output:
                    # Scheduled posts wait for their publication date;
                    # the daily scheduled workflow run picks them up then.
                    if post.get('date', '') > blog_today():
                        print(f"⏳ Scheduled post: {post['title']} — will notify on {post['date']}")
                        continue
                    print(f"✓ Detected new post: {post['title']}")
                    new_posts.append(post)

        return new_posts
    except subprocess.CalledProcessError as e:
        print(f"Git command failed: {e}")
        print(f"Return code: {e.returncode}")
        return []
    except Exception as e:
        print(f"Error detecting changes: {e}")
        import traceback
        traceback.print_exc()
        return []

def first_added_date(filename):
    """Date (YYYY-MM-DD) of the commit that first added this post to the metadata."""
    try:
        out = subprocess.check_output(
            ['git', 'log', '--format=%cs', '-S', f'"filename": "{filename}"',
             '--', METADATA_FILE],
            text=True
        ).strip().splitlines()
        # oldest matching commit is the one that introduced the entry
        return out[-1] if out else None
    except subprocess.CalledProcessError as e:
        print(f"Git command failed: {e}")
        return None

def get_scheduled_posts():
    """Posts whose publication date is today and that were pushed before today.

    Posts pushed on their publication date are announced by the push-triggered
    run, so only earlier-pushed (scheduled) posts are picked up here.
    """
    today = blog_today()
    print(f"Scheduled check for {today}")

    with open(METADATA_FILE, 'r') as f:
        metadata = json.load(f)

    due_posts = []
    for post in metadata.get('posts', []):
        if post.get('date') != today:
            continue
        added_on = first_added_date(post['filename'])
        print(f"🔎 {post['title']}: dated {post['date']}, added to metadata on {added_on}")
        if added_on and added_on < today:
            print(f"✓ Releasing scheduled post: {post['title']}")
            due_posts.append(post)
        else:
            print("   ↳ pushed today — the push-triggered run already covers it.")

    return due_posts

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

def main(scheduled=False):
    """Main function to detect new posts and notify subscribers."""
    print("="*60)
    print("Blog Post Email Notification System")
    print(f"Mode: {'scheduled release' if scheduled else 'push diff'}")
    print("="*60)
    print("Checking for new posts...\n")

    # Check if API key is set
    if not RESEND_API_KEY:
        print("❌ ERROR: RESEND_API_KEY environment variable not set!")
        print("   Please configure the secret in GitHub repository settings.")
        sys.exit(1)

    new_posts = get_scheduled_posts() if scheduled else get_changed_posts()

    if not new_posts:
        if scheduled:
            print("ℹ️  No scheduled posts due today.")
        else:
            print("ℹ️  No new posts detected in this commit.")
            print("   This is normal if the commit doesn't add new posts.")
        return
    
    print(f"✅ Found {len(new_posts)} new post(s) to notify about!\n")
    
    subscribers = load_subscribers()
    
    if not subscribers:
        print("⚠️  No subscribers found in subscribers.json")
        print("   Subscribers will be notified once they sign up.")
        return
    
    print(f"📧 Notifying {len(subscribers)} subscriber(s)...\n")
    print("-"*60)
    
    for post in new_posts:
        print(f"\n📝 Post: {post['title']}")
        print(f"   Date: {post['date']}")
        print(f"   Author: {post['author']}")
        print()
        
        success_count = 0
        failed_count = 0
        
        for subscriber in subscribers:
            email = subscriber.get('email')
            if email:
                if send_email_via_resend(email, post):
                    success_count += 1
                else:
                    failed_count += 1
        
        print()
        print("-"*60)
        print(f"📊 Results: {success_count} sent, {failed_count} failed out of {len(subscribers)} total")
        
        if failed_count > 0:
            print("⚠️  Some emails failed. Check Resend dashboard and API key configuration.")
            sys.exit(1)

if __name__ == '__main__':
    # Scheduled mode: release posts whose publication date arrived today
    if len(sys.argv) > 1 and sys.argv[1] == '--scheduled':
        main(scheduled=True)
    # Check if we're in test mode (manual run with --test flag)
    elif len(sys.argv) > 1 and sys.argv[1] == '--test':
        print("🧪 TEST MODE: Sending notification for the latest post\n")
        print("="*60)
        
        if not RESEND_API_KEY:
            print("❌ ERROR: RESEND_API_KEY environment variable not set!")
            print("   Set it with: export RESEND_API_KEY='your-api-key'")
            sys.exit(1)
        
        # Load metadata and get the latest post
        try:
            with open(METADATA_FILE, 'r') as f:
                metadata = json.load(f)
            
            if not metadata.get('posts'):
                print("❌ No posts found in metadata")
                sys.exit(1)
            
            latest_post = metadata['posts'][0]
            print(f"📝 Latest post: {latest_post['title']}")
            print(f"   Date: {latest_post['date']}")
            print(f"   Author: {latest_post['author']}\n")
            
            subscribers = load_subscribers()
            if not subscribers:
                print("⚠️  No subscribers found")
                sys.exit(0)
            
            print(f"📧 Sending test email to {len(subscribers)} subscriber(s)...\n")
            
            for subscriber in subscribers:
                email = subscriber.get('email')
                if email:
                    send_email_via_resend(email, latest_post)
            
            print("\n✅ Test complete!")
        except Exception as e:
            print(f"❌ Test failed: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
    else:
        main()
