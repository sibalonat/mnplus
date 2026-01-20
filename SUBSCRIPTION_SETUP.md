# Email Subscription System Setup Guide

## Overview

This blog now includes an email subscription system that automatically notifies subscribers when new posts are published. The system uses:

- **Frontend**: Bauhaus-styled subscription form (no external dependencies)
- **Email Collection**: Formspree (free tier)
- **Email Sending**: Resend (free tier: 100 emails/day, 3,000/month)
- **Automation**: GitHub Actions

## Setup Instructions

### 1. Set Up Formspree (Email Collection)

1. Go to [formspree.io](https://formspree.io) and create a free account
2. Create a new form
3. Copy your form ID (looks like: `xzbqwxyz`)
4. Update `blog.js` line 249 with your form ID:
   ```javascript
   const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
   ```
   Replace `YOUR_FORM_ID` with your actual Formspree form ID

### 2. Set Up Resend (Email Sending)

1. Go to [resend.com](https://resend.com) and create a free account
2. Verify your domain (or use their onboarding domain for testing)
3. Create an API key from the dashboard
4. Update `scripts/notify_subscribers.py` line 20 with your verified sender email:
   ```python
   FROM_EMAIL = 'blog@arra.blog'  # Update with your verified domain
   ```

### 3. Add Resend API Key to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `RESEND_API_KEY`
5. Value: Paste your Resend API key
6. Click **Add secret**

### 4. Manage Subscribers

When someone subscribes via Formspree:

1. You'll receive an email notification from Formspree
2. Manually add their email to `subscribers.json`:
   ```json
   {
     "subscribers": [
       {
         "email": "user@example.com",
         "subscribedAt": "2026-01-20"
       }
     ]
   }
   ```
3. Commit and push the updated `subscribers.json`

**Future Enhancement**: You can automate this by using Formspree's webhook feature to automatically add subscribers to the JSON file via GitHub API.

### 5. Testing the System

**Local Testing (Form UI):**
```bash
python3 -m http.server 8000
```
Then navigate to About section to see the subscription form.

**Testing Email Notifications:**
1. Add a test subscriber to `subscribers.json`
2. Add or modify a post in `posts/posts-metadata.json`
3. Commit and push to `main` branch
4. GitHub Actions will automatically detect the new post and send emails

## How It Works

### Subscription Flow
1. User fills out form on About page
2. Form submits to Formspree
3. You receive notification and manually add email to `subscribers.json`
4. Subscriber is now in the system

### Notification Flow
1. You add/update a post and commit to `main` branch
2. GitHub Actions detects changes to `posts-metadata.json`
3. Python script identifies new posts by comparing commits
4. Script reads `subscribers.json` for email list
5. Emails sent via Resend API with beautifully formatted HTML

### Email Template Features
- Bauhaus-inspired design matching blog aesthetic
- Post title, date, author, and excerpt
- Direct link to the new post
- Unsubscribe information in footer

## Cost Breakdown (All Free Tiers)

- **Formspree**: 50 submissions/month (free)
- **Resend**: 100 emails/day, 3,000/month (free)
- **GitHub Actions**: 2,000 minutes/month (free)

For a personal blog with modest traffic, you'll stay well within free tier limits.

## Customization

### Change Email Design
Edit the HTML template in `scripts/notify_subscribers.py` (lines 71-127)

### Modify Form Styling
Adjust `.subscription-section` styles in `styles.css` (lines 433-540)

### Add Unsubscribe Feature
Create a simple HTML page with a form that removes emails from `subscribers.json` via GitHub API or manual process.

## Troubleshooting

**Form not submitting:**
- Check that you replaced `YOUR_FORM_ID` in `blog.js`
- Verify Formspree account is active

**Emails not sending:**
- Check GitHub Actions logs: Repository → Actions tab
- Verify `RESEND_API_KEY` secret is set correctly
- Ensure sender email is verified in Resend

**Subscribers not receiving emails:**
- Verify email addresses in `subscribers.json` are valid
- Check Resend dashboard for delivery status
- Emails may be in spam folder (add SPF/DKIM records to your domain)

## Future Enhancements

1. **Automated Subscriber Management**: Use Formspree webhooks + GitHub API to auto-add subscribers
2. **Unsubscribe Links**: Generate unique tokens and create unsubscribe page
3. **Email Templates**: Create multiple templates for different post types
4. **Analytics**: Track open rates and click-through rates via Resend dashboard
5. **Double Opt-in**: Send confirmation email before adding to subscriber list

## Security Notes

- Never commit API keys to the repository (always use GitHub Secrets)
- Consider adding CAPTCHA to subscription form to prevent spam
- Regularly audit `subscribers.json` for invalid/bounced emails
- Follow GDPR/privacy regulations if you have EU subscribers

---

**Questions or issues?** Check the [Resend docs](https://resend.com/docs) or [Formspree docs](https://help.formspree.io/)
