#!/usr/bin/env python3
"""
Script to send welcome email to new subscribers.
Called by GitHub Actions when a new subscriber is added.
"""

import json
import os
import sys
import requests

# Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
BASE_URL = 'https://sibalonat.github.io/mnplus'
FROM_EMAIL = 'onboarding@resend.dev'  # Resend's test domain - works immediately

def send_welcome_email(to_email):
    """Send welcome email to new subscriber using Resend API."""
    if not RESEND_API_KEY:
        print("❌ Error: RESEND_API_KEY not set in environment")
        print("   Make sure the RESEND_API_KEY secret is configured in GitHub repository settings")
        return False
    
    print(f"📧 Preparing welcome email for: {to_email}")
    print(f"   From: arra.blog <{FROM_EMAIL}>")
    print(f"   Using Resend API endpoint: https://api.resend.com/emails")
    
    # Email content with Bauhaus styling
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
                background: #fff;
            }}
            .header {{
                border-left: 6px solid #e63946;
                padding-left: 20px;
                margin-bottom: 30px;
            }}
            .welcome-box {{
                background: #f1faee;
                padding: 30px;
                border: 3px solid #1d3557;
                margin: 20px 0;
            }}
            .welcome-title {{
                font-size: 28px;
                font-weight: 900;
                color: #1d3557;
                margin-bottom: 15px;
            }}
            .button {{
                display: inline-block;
                padding: 15px 35px;
                background: #e63946;
                color: white;
                text-decoration: none;
                font-weight: 700;
                border: 3px solid #000;
                margin-top: 20px;
            }}
            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #eee;
                font-size: 12px;
                color: #666;
            }}
            .feature-box {{
                background: #fff;
                border-left: 4px solid #f4a261;
                padding: 15px 20px;
                margin: 15px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>[arra.blog]</h1>
            <p>Breaking problems into elements</p>
        </div>
        
        <div class="welcome-box">
            <div class="welcome-title">Welcome! 🎉</div>
            <p>Thank you for subscribing to [arra.blog]!</p>
            <p>You're now part of a community that explores technology, curiosity, and the art of breaking complex problems into manageable elements.</p>
        </div>
        
        <h2 style="color: #1d3557;">What to Expect</h2>
        
        <div class="feature-box">
            <strong>📝 Thoughtful Posts</strong>
            <p style="margin: 5px 0 0 0; color: #666;">
                Essays on software development, polymorphism in life and code, and the intersection of technology and human experience.
            </p>
        </div>
        
        <div class="feature-box">
            <strong>🎮 Interactive Demos</strong>
            <p style="margin: 5px 0 0 0; color: #666;">
                Engaging games and visualizations built with vanilla JavaScript—no frameworks, just pure creativity.
            </p>
        </div>
        
        <div class="feature-box">
            <strong>🎨 Bauhaus Design</strong>
            <p style="margin: 5px 0 0 0; color: #666;">
                Minimalist aesthetics inspired by Bauhaus and Constructivism—clean, geometric, and functional.
            </p>
        </div>
        
        <p style="margin-top: 30px;">Whenever a new post is published, you'll receive an email notification with an excerpt. No spam, just quality content.</p>
        
        <a href="{BASE_URL}" class="button">Visit [arra.blog] →</a>
        
        <div class="footer">
            <p>You're receiving this because you subscribed to [arra.blog]</p>
            <p>If this wasn't you, you can safely ignore this email.</p>
            <p>© 2026 [arra.blog] — Breaking problems into elements</p>
        </div>
    </body>
    </html>
    """
    
    # Plain text version for email clients that don't support HTML
    text_content = f"""
Welcome to [arra.blog]!

Thank you for subscribing! You're now part of a community that explores technology, curiosity, and the art of breaking complex problems into manageable elements.

What to Expect:
- Thoughtful posts on software development and technology
- Interactive demos and games built with vanilla JavaScript
- Bauhaus-inspired minimalist design

Whenever a new post is published, you'll receive an email notification with an excerpt.

Visit the blog: {BASE_URL}

---
You're receiving this because you subscribed to [arra.blog]
© 2026 [arra.blog] — Breaking problems into elements
    """
    
    # Send via Resend
    try:
        response = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {RESEND_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'from': f'arra.blog <{FROM_EMAIL}>',
                'to': [to_email],
                'subject': 'Welcome to [arra.blog]! 🎉',
                'html': html_content,
                'text': text_content
            }
        )
        
        if response.status_code == 200:
            print(f"✅ Welcome email sent successfully to {to_email}")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Failed to send email: HTTP {response.status_code}")
            print(f"   Response body: {response.text}")
            print(f"   Check your Resend API key and account status at https://resend.com/")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error while sending email: {e}")
        print(f"   Check your internet connection and Resend API status")
        return False
    except Exception as e:
        print(f"❌ Unexpected error sending email: {type(e).__name__}: {e}")
        return False

if __name__ == '__main__':
    # Get email from command line argument or environment variable
    email = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('EMAIL')
    
    if not email:
        print("Error: No email provided")
        print("Usage: python3 send_welcome_email.py <email>")
        sys.exit(1)
    
    success = send_welcome_email(email)
    sys.exit(0 if success else 1)
