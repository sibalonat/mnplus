# How Polymorphism Morph to Anything

I have recently become a father of a young and beautiful little girl. My wife and I put much of our effort into trying to adapt as much to the new changes we are presented with, likely every day. Our aim is not to miss any of the important moments of this first year. While we were waiting for her to be born, I think I had assumed most of my free time would have disappeared, and in a sense it has.

And while that's the case, we try as much as we can to snatch back some of that time and work on our goals. During December, while we were preparing for our Christmas and New Year's Eve, my wife came up with a cool idea. It was to write a manifestation or wishes/hopes for this new year. I say it was a good idea because living in so much outspoken uncertainty, you should reflect on life choices and how mentally alert you are. And while I hoped for the best outcome financially as it has been in recent years, I couldn't stop thinking about the outcome as getting past the halfway mark of my thirties, and putting some perspective in front of me, while pivoting what choices I could choose for the paths where possible for me professionally.

One of these paths has been, for some time, how I understand my role as a software developer and the possible change I might have to take to stay relevant. And of course, part of this train of thinking is related to what the AI/ML that has been brought to software developers. We are trying to understand where we stand with this change.

And as much as I have tried to use it, I can't say that I'm always happy, but I often learn new things while using it. Sometimes, because I learn new things while not expecting to learn them, and figuring out that things were possible beyond the expectations of knowledge I previously had about software development. While I have asked myself whether I stand a chance in the future to find new gigs to work on, or if I have to resort to learning to be a better AI developer. While not many people know, I haven't graduated in Computer Science, but in Public Relations, and it has been my ability to change (polymorphism) that has allowed me to morph to any type of job I have done.

Part of our New Year's resolutions, my wife and I said to one another, was to write more, be more present, and try our best to communicate more effectively - or at least learn how to do that. For that reason, I started my blog arra.blog, as an attempt to express myself more as a human in a human world. When I had introduced arra.blog to LinkedIn, I was welcomed, and I felt an appreciation for doing that from people I knew, worked with before, and currently, and people that I had them as friends in LinkedIn but haven't had the chance to ever talk to them.

One of these people, Nensi, wrote in the comments that she thought that I had to implement a newsletter for the blog. When I read it, I thought: "Yes, that's a very good suggestion..." I was struggling to put things into perspective for a reason. When I created this blog, I assumed I would use GitHub Pages because of a joke I made at work that I would create a blog with GitHub Pages. And I think more people than not would know that GitHub Pages are mostly for documentation purposes (static), and not often used for dynamic content, such as blogs, and least for backend servers I assumed email service would require. And I was struggling to understand how to do this, but also not overcomplicate this, not move from one provider to the other(leave GitHub Pages), only because of a request for a new feature.

## The Solution

So I rolled my sleeves, opened VS Code, and started working with my Copilot to find a solution to this. The first suggestion was, as expected, to use a backend server to connect the email provider and manage the sending of notifications/emails of thanks, and you have a new post from arra.blog. I was like, "I know that, but I don't want this though." And I must have spent around 4 hours chatting, but eventually we got it right.

The implementation uses **Pipedream** as a webhook transformer that bridges the gap between a static GitHub Pages site and GitHub Actions:

1. **Subscription form** → Sends POST request with email to Pipedream endpoint
2. **Pipedream workflow** → Receives email, triggers GitHub API with `repository_dispatch` event
3. **GitHub Actions** → Workflow listens for dispatch event, adds email to `subscribers.json`
4. **Welcome email** → Automatically sent via Resend with Bauhaus-styled greeting
5. **Auto-commit** → Changes pushed back to repository
6. **New post notifications** → Separate workflow detects new posts, sends emails with excerpts via Resend

Key components:
- Pipedream webhook URL configured in `blog.js`
- Node.js code step in Pipedream with axios to call GitHub API
- GitHub Personal Access Token stored as `WORKFLOW_TOKEN` environment variable
- GitHub Actions workflow triggered by `repository_dispatch` event (type: `formspark_submission`)
- Python scripts: `send_welcome_email.py` for thanking new subscribers, `notify_subscribers.py` for new post alerts with excerpts
- All emails styled with Bauhaus design (geometric shapes, primary colors, minimalist layout)

## What You Need to Change to Make It Work

If you want to replicate this setup for your own GitHub Pages blog, here are the specific configurations you'll need to update:

### 1. Pipedream Webhook Setup
- Create a free Pipedream account and set up a new workflow
- In the workflow, add a Node.js code step that receives the email and calls the GitHub API
- Configure the `repository_dispatch` event with your repository owner and name
- Store your GitHub Personal Access Token as an environment variable (`WORKFLOW_TOKEN`)
- Copy your Pipedream webhook URL and update it in `blog.js` (the form submission endpoint)

### 2. GitHub Secrets Configuration
You'll need to add these secrets in **Settings → Secrets and variables → Actions**:
- `RESEND_API_KEY` - Your Resend API key for sending emails (get from Resend dashboard after domain verification)
- `WORKFLOW_TOKEN` - GitHub Personal Access Token with `workflow` scope (for Pipedream to trigger actions)

### 3. Domain and Email Infrastructure Setup

For my implementation, I needed to configure proper email sending capabilities for the blog. Here's the complete setup I used:

**Domain Management:**
- Moved nameservers from my cloud hosting provider to **Cloudflare** for better DNS management
- Configured all domain records (A, CNAME, TXT) through Cloudflare's dashboard

**Email Forwarding with ImprovMX:**
- Set up **ImprovMX** (free tier) to forward emails from `new@arra.blog` to my personal email
- Added MX records in Cloudflare pointing to ImprovMX servers
- This allows me to receive replies without managing a full email server

**Transactional Email with Resend:**
- Sign up for a free Resend account (100 emails/day, 3,000/month)
- Added Resend's DNS records (SPF, DKIM, DMARC) in Cloudflare for domain verification
- Verified `arra.blog` domain in Resend dashboard
- Created an API key from Resend dashboard
- Updated `scripts/send_welcome_email.py` and `scripts/notify_subscribers.py` with verified sender email

**Why this setup works:**
- **Cloudflare** centralizes all DNS management (no need to switch between providers)
- **ImprovMX** handles incoming email forwarding (replies from subscribers)
- **Resend** handles outgoing transactional emails (welcome emails, post notifications)
- All SMTP/DNS records managed in one place through Cloudflare

### 4. Repository-Specific Values
In your forked/cloned repository, update:
- `blog.js`: Replace Pipedream webhook URL with yours
- `scripts/notify_subscribers.py`: Update `FROM_EMAIL` with your verified domain
- GitHub Actions workflows: Verify owner/repo names match your setup
- `build_posts.py`: Update `BASE_URL` to match your GitHub Pages URL

### 5. Subscriber Management
Create a `subscribers.json` file in your repo root:
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

The Pipedream workflow automatically adds subscribers when the form is submitted. The workflow:
1. Receives the email from your subscription form
2. Triggers GitHub Actions via `repository_dispatch` event
3. Python script adds the email to `subscribers.json`
4. Changes are automatically committed back to the repository

No manual subscriber management needed!

And while the first proposals were to create a backend server for the email providers to connect and send the notifications, the new approach is much simpler. It made me understand and learn new things. Although AI is putting too much pressure on us, as software developers, it is also allowing us to be architects, to not worry about petty things but focus on the important aspects for building, the joy and help it brings our users to use the systems we create.

## Interactive Demo: Polymorphism in Action

Just like the concept of polymorphism in software development—where one interface can morph into different implementations—this interactive game lets you experience morphing in a visual way. Each body part can transform into different variations, demonstrating how the same structure can take multiple forms.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #f1faee; border: 3px solid #1d3557; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #1d3557; font-size: clamp(16px, 4vw, 20px);">Morph the Human</h4>
  <canvas id="polymorphCanvas" width="300" height="500" style="border: 2px solid #e63946; background: #f1faee; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto;"></canvas>
  <p style="margin-top: 15px; color: #1d3557; font-size: clamp(12px, 3vw, 14px); line-height: 1.6;">
    <strong>↑↓</strong> Select body part<br>
    <strong>←→</strong> Morph the selected part<br>
    <em>Touch: Swipe to control</em>
  </p>
</div>

<script src="posts/polymorphism-game.js"></script>

The game uses Bauhaus design principles—geometric shapes, primary colors, and functional minimalism—to represent the human form. Each section can transform into different variations, just like how polymorphism allows objects to take multiple forms while maintaining the same interface.
