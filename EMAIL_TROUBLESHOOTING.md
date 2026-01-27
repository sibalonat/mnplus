# Email Notification System - Troubleshooting Guide

## Overview

The blog has two types of email notifications:
1. **Welcome emails** - Sent immediately when a new subscriber joins
2. **Post notification emails** - Sent when a new blog post is published

## Issues Found and Fixed

### Welcome Email Issues ✅

#### Problem 1: Manual workflow missing welcome email step
**Fixed**: The `add-subscribers.yml` workflow now includes a welcome email step that triggers when adding new subscribers manually.

#### Problem 2: Webhook workflow had weak error reporting  
**Fixed**: Improved error messages in both workflows and the `send_welcome_email.py` script to provide clearer diagnostics when emails fail.

### Post Notification Issues

### 1. **Invalid Sender Email Address** ❌
**Problem**: The script was using `marninikolli@gmail.com` as the sender email.

**Why it fails**: Resend requires a verified domain to send emails. You cannot use Gmail, Yahoo, or other public email addresses without verifying your domain ownership.

**Solution**: Changed to `onboarding@resend.dev` (Resend's test domain) or you can use your own verified domain.

### 2. **Weak Post Detection Logic** ❌
**Problem**: The original script only checked if the latest post's filename appeared in the git diff, which could miss posts or have false positives.

**Solution**: Now checks for the specific pattern `+ "filename": "..."` in the diff to accurately detect newly added posts.

### 3. **Poor Error Messages** ❌
**Problem**: Script didn't provide helpful feedback when things went wrong.

**Solution**: Added comprehensive logging with emojis for better visibility and clearer error messages.

## How to Test Locally

### Testing Welcome Emails

#### Option 1: Direct script execution
```bash
# Set your Resend API key
export RESEND_API_KEY='re_your_api_key_here'

# Send a welcome email to a test address
python3 scripts/send_welcome_email.py test@example.com
```

Expected output if successful:
```
📧 Preparing welcome email for: test@example.com
   From: arra.blog <marninikolli@gmail.com>
   Using Resend API endpoint: https://api.resend.com/emails
✅ Welcome email sent successfully to test@example.com
   Response: {'id': 'abc123...'}
```

#### Option 2: Test via GitHub Actions (Manual)
1. Go to GitHub Actions tab
2. Select "Add Subscriber (Manual)" workflow
3. Click "Run workflow"
4. Enter email and select "add" action
5. Check workflow logs to see if welcome email was sent

### Testing Post Notification Emails

### Option 1: Test Mode (Recommended)
Send a test email for the latest post without requiring a git commit:

```bash
# Set your Resend API key
export RESEND_API_KEY='re_your_api_key_here'

# Run in test mode
python3 scripts/notify_subscribers.py --test
```

This will:
- Load the latest post from `posts-metadata.json`
- Send test emails to all subscribers in `subscribers.json`
- Show detailed output of what's happening

### Option 2: Simulate Git Workflow
Test the actual git diff detection:

```bash
export RESEND_API_KEY='re_your_api_key_here'

# Make a change to posts-metadata.json (add a new post)
# Then commit it
git add posts/posts-metadata.json
git commit -m "Test: Add new post"

# Run the script (it will compare HEAD vs HEAD~1)
python3 scripts/notify_subscribers.py
```

## Resend Configuration

### Using Resend's Test Domain (Current Setup)
- **From Email**: `onboarding@resend.dev`
- **Limitations**: 
  - Can only send to the email address associated with your Resend account
  - Good for testing but not for production
- **No setup required** - works immediately

### Using Your Own Domain (Recommended for Production)
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Add your domain (e.g., `arra.blog`)
4. Add the DNS records shown (MX, TXT for SPF, DKIM)
5. Wait for verification (usually a few minutes)
6. Update `FROM_EMAIL` in the script:
   ```python
   FROM_EMAIL = 'blog@arra.blog'  # or any address on your domain
   ```

## GitHub Actions Configuration

The workflow is in `.github/workflows/notify-subscribers.yml` and requires:

### Required Secrets
1. **RESEND_API_KEY**: Your Resend API key
   - Get it from: https://resend.com/api-keys
   - Add in: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

### Workflow Triggers
The workflow runs automatically when:
- You push to the `main` branch
- AND the commit modifies:
  - `posts/posts-metadata.json` (primary trigger)
  - OR any `posts/**/*.md` file

### Checking Workflow Runs
1. Go to your GitHub repository
2. Click the "Actions" tab
3. Look for "Notify Subscribers of New Posts" workflow
4. Click on recent runs to see logs

## Common Issues and Solutions

### Welcome Email Issues

#### Issue: Welcome email not sent when manually adding subscriber
**Cause**: Missing welcome email step in workflow (now fixed)

**Solution**: 
- Pull latest changes: `git pull origin main`
- The workflow now includes a welcome email step
- Re-run the "Add Subscriber (Manual)" workflow if you need to send delayed welcome emails

#### Issue: Welcome email fails with "RESEND_API_KEY not set"
**Cause**: Secret not configured in GitHub repository

**Solution**:
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `RESEND_API_KEY`
4. Value: Your Resend API key from https://resend.com/api-keys
5. Click "Add secret"

#### Issue: Welcome email sent but subscriber never receives it
**Cause**: Email might be in spam or sender domain not verified

**Solutions**:
- Check spam/junk folder
- If using custom domain, verify DNS records are set up correctly in Resend dashboard
- Test with Resend's test domain (`onboarding@resend.dev`) which only works for your Resend account owner's email
- Check Resend dashboard logs at https://resend.com/emails for delivery status

### Post Notification Issues

### Issue: "No new posts detected"
**Cause**: The git diff doesn't show any new posts in `posts-metadata.json`

**Solutions**:
- Make sure you committed changes to `posts-metadata.json` with the new post
- Verify the post is added as the first entry (newest posts go at the top)
- Check the git diff manually: `git diff HEAD~1 HEAD posts/posts-metadata.json`

### Issue: "Failed to send email" with 403 error
**Cause**: Using an unverified email domain

**Solutions**:
- Use `onboarding@resend.dev` for testing
- Verify your custom domain in Resend dashboard
- Check that your RESEND_API_KEY is valid

### Issue: "No subscribers found"
**Cause**: `subscribers.json` is empty or doesn't exist

**Solutions**:
- This is normal if nobody has subscribed yet
- You can manually add test subscribers:
  ```json
  {
    "subscribers": [
      {
        "email": "your-test-email@gmail.com",
        "subscribedAt": "2026-01-26"
      }
    ]
  }
  ```

### Issue: Emails go to spam
**Cause**: Using Resend's test domain or not warming up your domain

**Solutions**:
- Use a verified custom domain
- Add SPF, DKIM, and DMARC records
- Gradually increase sending volume (warm-up period)
- Ask test subscribers to mark as "Not Spam"

## Testing Checklist

Before adding a new post:

- [ ] Verify `RESEND_API_KEY` is set in GitHub Secrets
- [ ] Test locally with `--test` flag
- [ ] Check that `FROM_EMAIL` is either `onboarding@resend.dev` or a verified domain
- [ ] Ensure `subscribers.json` has at least one subscriber
- [ ] Add new post entry to `posts-metadata.json` as the FIRST item
- [ ] Commit and push to `main` branch
- [ ] Check GitHub Actions tab for workflow run
- [ ] Verify email received in inbox

## Email Template

The emails sent include:
- Bauhaus-inspired design matching your blog's aesthetic
- Post title, date, and author
- Excerpt from the post
- Link to read the full post
- Unsubscribe notice (currently informational)

## Rate Limits

### Resend Free Tier
- **100 emails/day**
- **3,000 emails/month**
- This is generous for a personal blog

If you exceed limits:
- Emails will fail with a 429 error
- Upgrade to paid plan or wait for limit reset

## Next Steps

1. **Verify your domain** (if you haven't already)
2. **Test the script locally** using `--test` mode
3. **Add a test post** and verify emails are sent
4. **Add unsubscribe functionality** (future enhancement)
5. **Consider adding email analytics** (Resend provides open/click tracking)

## Support

- Resend Documentation: https://resend.com/docs
- Resend Support: support@resend.com
- GitHub Actions Docs: https://docs.github.com/actions
