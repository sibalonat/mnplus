# Formspark Webhook Configuration Guide

## Problem
When users submit the subscription form, it sends data to Formspark but doesn't automatically add them to `subscribers.json` in the repository.

## Solution
Use **Formspark's webhook feature** to trigger a GitHub Actions workflow that automatically adds subscribers.

---

## Setup Steps

### 1. Create a GitHub Personal Access Token

1. Go to GitHub: **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Name it: `Formspark Webhook Token`
4. Select scopes:
   - ✅ `repo` (full control - needed to trigger workflows)
5. Click **Generate token**
6. **Copy the token** (you won't see it again!)

### 2. Configure Formspark Webhook

1. Log into your Formspark account at https://formspark.io
2. Go to your form settings (the one with ID: `tDYrxcCDn`)
3. Navigate to **Webhooks** section
4. Click **Add Webhook**
5. Configure the webhook:

**Webhook URL:**
```
https://api.github.com/repos/sibalonat/mnplus/dispatches
```

**HTTP Method:** `POST`

**Headers:**
```json
{
  "Accept": "application/vnd.github.v3+json",
  "Authorization": "token YOUR_GITHUB_TOKEN_HERE",
  "Content-Type": "application/json"
}
```
*Replace `YOUR_GITHUB_TOKEN_HERE` with the token from Step 1*

**Payload (Body):**
```json
{
  "event_type": "formspark_submission",
  "client_payload": {
    "email": "{{email}}"
  }
}
```

**Trigger:** On successful form submission

6. **Test the webhook** using Formspark's test feature

---

## How It Works

### Flow Diagram
```
User fills form → Formspark receives data → Formspark webhook triggers GitHub API 
→ GitHub Actions workflow runs → Adds email to subscribers.json → Commits & pushes
```

### Workflow Process
1. User submits email via subscription form
2. Formspark stores the submission
3. Formspark webhook sends POST request to GitHub API with email
4. GitHub triggers `formspark-webhook.yml` workflow
5. Workflow:
   - Checks if email already exists (prevents duplicates)
   - Validates email format
   - Adds email to `subscribers.json`
   - Commits and pushes changes automatically
6. Subscriber is now in the list and will receive notifications

---

## Testing

### Test the Complete Flow

1. **Open your blog** in a browser (local or live)
2. **Navigate to About section**
3. **Enter a test email** (use your own email)
4. **Click Subscribe**
5. **Check GitHub Actions tab** in your repository
   - Should see a new workflow run: "Add Subscriber via Webhook"
6. **Check `subscribers.json`** - should have your email added
7. **Verify git history** - should see commit from github-actions[bot]

### Debugging

**If webhook doesn't trigger:**
- Check Formspark webhook logs (shows delivery status)
- Verify GitHub token has `repo` scope
- Ensure webhook URL is exactly: `https://api.github.com/repos/sibalonat/mnplus/dispatches`

**If workflow fails:**
- Go to **Actions** tab in GitHub repository
- Click on failed workflow run
- Check logs for error messages

**Check workflow manually:**
```bash
# Trigger manually to test (requires GitHub CLI)
gh workflow run formspark-webhook.yml
```

---

## Security Notes

⚠️ **Important:**
- Store the GitHub token in Formspark's webhook settings (not in code)
- Use a token with minimal permissions (only `repo` scope)
- Token is transmitted over HTTPS (secure)
- Consider rotating the token every 90 days

---

## Alternative: Manual Process (Backup)

If you prefer not to use webhooks, you can still add subscribers manually:

1. Check Formspark submissions dashboard
2. Copy email addresses
3. Run the "Add Subscriber" workflow manually in GitHub Actions:
   - Go to **Actions** tab
   - Select "Add Subscriber" workflow
   - Click "Run workflow"
   - Enter the email address

---

## Cost

- **Formspark Free Tier:** 50 submissions/month
- **GitHub Actions Free Tier:** 2,000 minutes/month
- **Cost:** $0 for normal blog traffic

---

## What Gets Created

After setup, when someone subscribes:

```json
// subscribers.json
{
  "subscribers": [
    {
      "email": "user@example.com",
      "subscribedAt": "2026-01-20"
    }
  ]
}
```

And they'll receive emails when you publish new posts (via the `notify-subscribers.yml` workflow).

---

## Questions?

- **Formspark Docs:** https://formspark.io/docs/features/webhooks
- **GitHub API Docs:** https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event
- **GitHub Actions Docs:** https://docs.github.com/en/actions
