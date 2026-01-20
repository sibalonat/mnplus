# Subscription Management Guide

## Current Setup

Your subscription form sends data to **Formspark** (`https://submit-form.com/tDYrxcCDn`). Formspark collects the submissions, but they need to be added to your repository manually or via automation.

---

## Option 1: Automated via Webhook Transformer (Recommended)

Since Formspark doesn't allow custom webhook payloads, use a free webhook transformer like **Pipedream**.

### Quick Setup (2 minutes)
See **[WEBHOOK_TRANSFORMER.md](WEBHOOK_TRANSFORMER.md)** for complete instructions.

**Summary:**
1. Create free Pipedream account
2. Create workflow: Formspark webhook → Transform data → GitHub API
3. Add Pipedream URL to Formspark webhook settings
4. Done! Subscribers auto-added when they submit form

---

## Option 2: Manual Process (Simple, No Extra Services)

---

## Option 2: Manual Process (Simple, No Extra Services)

**When someone subscribes:**
1. Formspark sends you an email notification with their email
2. Go to your GitHub repository → **Actions** tab
3. Select **"Add Subscriber (Manual)"** workflow
4. Click **"Run workflow"**
5. Enter the email address
6. Click **"Run workflow"** button
7. Done! Email added to `subscribers.json`

**Time:** ~30 seconds per subscriber

**Pros:** 
- ✅ No external services needed
- ✅ Full control
- ✅ Simple to understand

**Cons:**
- ❌ Requires manual action for each subscriber

---

## Checking New Subscribers

**Formspark Dashboard:**
1. Log into https://formspark.io
2. Go to your form dashboard
3. View submissions list
4. Copy email addresses of new subscribers

**Email Notifications:**
- Formspark sends email for each submission
- Check your inbox for new subscriber notifications

---

## Testing

---

## Testing

**Test the subscription form:**
1. Open your blog locally or on GitHub Pages
2. Navigate to About section  
3. Enter a test email
4. Click Subscribe
5. Check Formspark dashboard - should see the submission

**Test adding to repository:**
1. Go to GitHub → Actions → "Add Subscriber (Manual)"
2. Run workflow with test email
3. Check `subscribers.json` - should be updated
4. Future blog posts will notify this subscriber

---

## Recommendation

**For personal blogs:** Option 2 (Manual) is perfectly fine. Takes 30 seconds per new subscriber.

**For growing blogs:** Option 1 (Pipedream) automates everything. Set it up once, forget about it.

---

## Current Files

- **[formspark-webhook.yml](.github/workflows/formspark-webhook.yml)** - Workflow that receives webhook events (used with Option 1)
- **[add-subscribers.yml](.github/workflows/add-subscribers.yml)** - Manual workflow for Option 2
- **[WEBHOOK_TRANSFORMER.md](WEBHOOK_TRANSFORMER.md)** - Detailed Pipedream setup guide
