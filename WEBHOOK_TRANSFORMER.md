# Blog Subscription System (via Pipedream)

## The Problem
GitHub Pages is static and can't directly trigger GitHub Actions workflows from a form submission.

## Solution: Pipedream (Free, No Server Needed)

**Pipedream** receives form submissions from your blog and triggers GitHub Actions to add subscribers automatically (runs in ~100ms).

### Setup Steps (2 minutes)

#### 1. Create Pipedream Account
1. Go to https://pipedream.com (it's free)
2. Sign up with GitHub (easiest)

#### 2. Create New Workflow
1. Click **New → Workflow**
2. For trigger, search **HTTP / Webhook**
3. Select **New Request** (this creates a webhook endpoint)
4. Copy the webhook URL (looks like: `https://eo1234abcd.m.pipedream.net`)
5. The trigger will capture any POST requests sent to this URL

#### 3. Add Code Step to Transform and Send to GitHub
1. Click **+** below the trigger to add a step
2. Select **Run Node.js code** (or search for "code")
3. Paste this code:

```javascript
import axios from 'axios';

export default defineComponent({
  async run({ steps, $ }) {
    // Get email from blog form submission
    const payload = steps.trigger.event.body || steps.trigger.event;
    const email = payload.email;
    
    // Log the full payload for debugging
    console.log("Blog form payload:", JSON.stringify(steps.trigger.event, null, 2));
    
    if (!email) {
      throw new Error(`No email found in payload. Received: ${JSON.stringify(payload)}`);
    }
    
    console.log(`Processing subscription for: ${email}`);
    
    // Debug: Check if token is set (remove after debugging)
    console.log(`Token configured: ${!!process.env.WORKFLOW_TOKEN}`);
    
    // Trigger GitHub Actions workflow using WORKFLOW_TOKEN
    try {
      console.log('🚀 Calling GitHub API to trigger workflow...');
      
      const response = await axios.post(
        'https://api.github.com/repos/sibalonat/mnplus/dispatches',
        {
          event_type: 'formspark_submission',
          client_payload: { email }
        },
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${process.env.WORKFLOW_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Pipedream-Formspark-Bridge'
          }
        }
      );
      
      console.log(`✅ GitHub API response: ${response.status} ${response.statusText}`);
      console.log(`Response data:`, response.data);
      return { success: true, email, status: response.status };
    } catch (error) {
      console.error('❌ GitHub API error:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      throw error;
    }
  }
});
```

4. **Add GitHub Token as environment variable (CRITICAL STEP):**
   
   **Option A - In the code step itself (Recommended):**
   - In your Pipedream workflow, click on the code step
   - Look for **"+ Add connected account"** or **"Environment Variables"** section below the code editor
   - Click **"Add environment variable"**
   - Name: `WORKFLOW_TOKEN`
   - Value: Paste your GitHub Personal Access Token
   - Click **Save**
   
   **Option B - In workflow settings:**
   - Click the gear icon (⚙️) at the top of your workflow
   - Go to **Environment Variables** tab
   - Click **Add variable**
   - Name: `WORKFLOW_TOKEN`  
   - Value: Your GitHub token
   - Click **Save**
   
   **Create a new GitHub token if needed:**
   - Go to: https://github.com/settings/tokens
   - Click **Generate new token (classic)**
   - Name: `Pipedream Webhook`
   - Scopes: Check ✅ **`repo`** (full control)
   - Click **Generate token**
   - **Copy the token immediately** (starts with `ghp_` or `github_pat_`)
   - Paste it into Pipedream's `WORKFLOW_TOKEN` variable

5. **After adding the token:**
   - The error `{"test":"event"}` means you're using Pipedream's dummy test data
   - **Skip the test button** and go straight to Step 4 (Deploy)
   - Real testing happens in Step 6 after deploying and configuring Formspark webhook

#### 4. Deploy the Workflow
1. Click **Deploy** in top right corner
2. Workflow is now live and ready to receive webhooks!

#### 5. Update Blog Form (Already Done!)
The form in `blog.js` now submits directly to Pipedream:
```javascript
fetch('https://eow6utunfmbmapo.m.pipedream.net', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: email })
})
```

**Test the endpoint:**
```bash
# Run this in your terminal to test the endpoint directly
curl -X POST https://eow6utunfmbmapo.m.pipedream.net \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

After running this, check your Pipedream workflow - you should see an event appear with the email.

#### 6. Test the Complete Flow (With Real Data!)
1. **Make sure workflow is deployed** (Step 4)

2. **Submit a real test from your blog:**
   - Open http://localhost:8060 (or your live site)
   - Go to About section
   - Enter a test email (like `test@example.com`)
   - Click **Subscribe**
   - You should see "✓ Successfully subscribed!" message

3. **Check Pipedream Events:**
   - Go to Pipedream dashboard → Your workflow
   - Look at the **event/execution list** (shows recent requests)
   - Click on the most recent event to see details
   - The logs should show: `"Processing subscription for: test@example.com"`
   - Should see `✅ GitHub API response: 204` (success)

4. **Check GitHub Actions:**
   - Go to your GitHub repo → **Actions** tab
   - Should see "Add Subscriber via Webhook" workflow running/completed
   - If successful, check `subscribers.json` for the new email

5. **Verify subscriber was added:**
   - Go to your repository on GitHub
   - Check if `subscribers.json` exists (or was updated)
   - Should contain the test email address

### Complete Flow
```
User fills subscription form on blog
  ↓
blog.js sends email to Pipedream
  ↓
Pipedream extracts email and calls GitHub API (repository_dispatch)
  ↓
GitHub Actions workflow "formspark-webhook.yml" triggered
  ↓
Workflow adds email to subscribers.json
  ↓
Changes committed and pushed automatically
  ↓
Subscriber will receive emails when new posts are published
```

---

## Creating GitHub Personal Access Token

You'll need this for Pipedream to trigger GitHub Actions:

1. Go to GitHub: **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Name: `Pipedream Webhook Token`
4. Expiration: Choose your preference (recommend 90 days)
5. Select scope: ✅ **`repo`** (full control of private repositories)
6. Click **Generate token**
7. **Copy the token** immediately (you won't see it again!)
8. Paste it into Pipedream's `GITHUB_TOKEN` environment variable

---

## Testing the Complete Setup
---

## Testing the Complete Setup

1. **Test in Pipedream first:**
   - In your Pipedream workflow, click **Generate Test Event**
   - Or use Pipedream's built-in test with sample data:
     ```json
     {
       "email": "test@example.com"
     }
     ```
   - Check the logs - should see "Processing subscription for: test@example.com"

2. **Test with real form submission:**
   - Open your blog (local or live)
   - Go to About section
   - Enter your email
   - Click Subscribe
   - **Check Pipedream logs:** Go to Pipedream dashboard → Your workflow → View recent events
     - Click on the event to see incoming webhook from Formspark
     - Should see outgoing request to GitHub API in the logs
   - **Check GitHub Actions:** Go to your repo → Actions tab
     - Should see "Add Subscriber via Webhook" workflow running
   - **Check subscribers.json:** Should have your email added

3. **Debugging:**
   - **Pipedream logs show email missing?** → Check Formspark payload format in the event details (expand the trigger step)
   - **GitHub workflow not triggering?** → Verify WORKFLOW_TOKEN in Pipedream environment variables
   - **Workflow runs but fails?** → Check GitHub Actions logs for error details

---

## Cost & Limits
- **Pipedream Free Tier**: 100,000 invocations/month
- **GitHub Actions**: 2,000 minutes/month  
- **More than enough** for a personal blog (even with 100 subscribers/month)

---

## Why This Solution Works
- ✅ No server to maintain
- ✅ No code in your repository
- ✅ Free forever for personal blogs
- ✅ Real-time subscriber addition (takes ~2 seconds)
- ✅ Easy to debug with Pipedream's logs
- ✅ Can modify the transformation logic anytime in Pipedream
