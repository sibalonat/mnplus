# Formspark → GitHub Actions (via Pipedream)

## The Problem
Formspark sends webhooks in its own format, but GitHub's `repository_dispatch` API expects a specific format. We need a tiny transformer in between.

## Solution: Pipedream (Free, No Server Needed)

**Pipedream** is a free workflow automation platform. We'll use it as a tiny webhook transformer (runs in ~100ms).

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
export default defineComponent({
  async run({ steps, $ }) {
    // Formspark can send data in different formats, let's handle all cases
    const payload = steps.trigger.event.body || steps.trigger.event;
    
    // Try different ways Formspark might send the email
    const email = payload.email || 
                  payload.data?.email || 
                  payload.fields?.email ||
                  steps.trigger.event.email;
    
    // Log the full payload for debugging
    console.log("Full Formspark payload:", JSON.stringify(steps.trigger.event, null, 2));
    
    if (!email) {
      throw new Error(`No email found in payload. Received: ${JSON.stringify(payload)}`);
    }
    
    console.log(`Processing subscription for: ${email}`);
    
    // Trigger GitHub Actions workflow using WORKFLOW_TOKEN
    const response = await $.http.post({
      url: "https://api.github.com/repos/sibalonat/mnplus/dispatches",
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `Bearer ${process.env.WORKFLOW_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "Pipedream-Formspark-Bridge"
      },
      data: {
        event_type: "formspark_submission",
        client_payload: { 
          email: email 
        }
      }
    });
    
    console.log(`GitHub API response: ${response.status}`);
    return { success: true, email, status: response.status };
  }
});
```

4. Add GitHub Token as environment variable:
   - Click **Settings** (gear icon in code step or workflow settings)
   - Add environment variable: `WORKFLOW_TOKEN`
   - Value: Your existing GitHub workflow token
   - The token needs `repo` scope to trigger workflows

5. **IMPORTANT - Don't use Pipedream's test button yet:**
   - The error `{"test":"event"}` means you're using Pipedream's dummy test data
   - **Skip the test button** and go straight to Step 4 (Deploy)
   - Real testing happens in Step 6 after deploying and configuring Formspark webhook

#### 4. Deploy the Workflow
1. Click **Deploy** in top right corner
2. Workflow is now live and ready to receive webhooks!

#### 5. Configure Formspark Webhook
1. Go to Formspark dashboard at https://formspark.io
2. Select your form (ID: `tDYrxcCDn`)
3. Go to Settings → **Webhooks** or **Integrations**
4. Add new webhook:
   - **URL:** `https://eow6utunfmbmapo.m.pipedream.net`
   - **Method:** POST (should be default)
   - **Trigger:** On form submission
5. Click **Save**

#### 6. Test the Complete Flow (With Real Data!)
1. **Make sure workflow is deployed** (Step 4)

2. **Submit a real test from your blog:**
   - Open http://localhost:8060 (or your live site)
   - Go to About section
   - Enter a test email (like `test@example.com`)
   - Click **Subscribe**
   - You should see "✓ Successfully subscribed!" message

3. **Check Pipedream Inspector (This shows REAL Formspark data):**
   - Go to Pipedream dashboard → Your workflow → **Inspector** tab
   - Should see the incoming webhook request from Formspark (not the test data)
   - Click on it to see the full payload structure
   - The logs should show: `"Processing subscription for: test@example.com"`
   - Verify email was extracted correctly from the actual Formspark payload

4. **Check GitHub Actions:**
   - Go to your GitHub repo → **Actions** tab
   - Should see "Add Subscriber via Webhook" workflow running/completed
   - If successful, check `subscribers.json` for the new email

5. **If email extraction still fails:**
   - Look at the Pipedream logs showing the actual Formspark payload
   - The code tries multiple locations: `payload.email`, `payload.data.email`, `payload.fields.email`
   - If Formspark uses a different structure, we can adjust the code based on what you see

### Complete Flow
```
User subscribes on blog 
  ↓
Formspark receives form data
  ↓
Formspark sends webhook to Pipedream
  ↓
Pipedream code extracts email and calls GitHub API
  ↓
GitHub Actions workflow "formspark-webhook.yml" runs
  ↓
Email added to subscribers.json
  ↓
Changes committed automatically
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
   - **Check Pipedream logs:** Go to Pipedream dashboard → Your workflow → Inspector
     - Should see incoming webhook from Formspark
     - Should see outgoing request to GitHub API
   - **Check GitHub Actions:** Go to your repo → Actions tab
     - Should see "Add Subscriber via Webhook" workflow running
   - **Check subscribers.json:** Should have your email added

3. **Debugging:**
   - **Pipedream logs show email missing?** → Check Formspark payload format in Pipedream Inspector
   - **GitHub workflow not triggering?** → Verify GITHUB_TOKEN in Pipedream environment variables
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
