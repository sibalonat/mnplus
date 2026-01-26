# Email Subscription System Setup Guide

## Overview

This blog now includes an email subscription system that automatically notifies subscribers when new posts are published. The system uses:

- **Frontend**: Bauhaus-styled subscription form (no external dependencies)
- **Webhook Handler**: Pipedream (free tier)
- **Email Sending**: Resend (free tier: 100 emails/day, 3,000/month)
- **Automation**: GitHub Actions

## Setup Instructions

### 1. Set Up Pipedream (Webhook Handler)

1. Go to [pipedream.com](https://pipedream.com) and create a free account
2. Create a new workflow with HTTP/Webhook trigger
3. Add a Node.js code step that triggers GitHub API (see [WEBHOOK_TRANSFORMER.md](WEBHOOK_TRANSFORMER.md) for complete code)
4. Copy your Pipedream webhook URL (looks like: `https://eow6utunfmbmapo.m.pipedream.net`)
5. Update `blog.js` line 235 with your webhook URL:
   ```javascript
   const response = await fetch('https://YOUR_PIPEDREAM_URL.m.pipedream.net', {
   ```
   Replace with your actual Pipedream webhook URL

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

When someone subscribes:

1. The form sends their email to your Pipedream webhook
2. Pipedream triggers GitHub Actions via `repository_dispatch` event
3. GitHub Actions workflow automatically adds the email to `subscribers.json`
4. Changes are committed and pushed automatically

**Fully automated** - no manual intervention needed!

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
2. Form submits to Pipedream webhook
3. Pipedream triggers GitHub Actions via `repository_dispatch`
4. GitHub Actions automatically adds email to `subscribers.json`
5. Subscriber is now in the system (fully automated)

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
