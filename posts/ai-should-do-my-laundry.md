# AI Should Do My Laundry

For most companies today, coming up with a new product isn't the hard part. The hard part is translating everything into actionable flows.

I like the word flow. It describes what's happening in this AI era better than any other word I can think of. A flow is a line — but a line that can adapt, that's polymorphic, that bends without breaking. And that's exactly what this moment demands: constant cycles, each one testing the impact of the last.

As a software developer, the news that developers are getting rehired feels like good news. But only because the flip side is that people in general might not stay relevant. Many people I know feel that pressure. It translates into more work — and the strange thing is, more work can also be empowering.

## Just Enjoy It, Man

I'm building a product with my brother. Once a week, late in the evening, we meet to check progress. This time I was sharing some of those thoughts about relevance, about having a reason to get up in the morning, and his response was the same it always is:

"Just enjoy it, man."

He says it because with LLMs today, a lot of the work has become easy. You can pull off in an afternoon things that would have taken a week before. But what he doesn't always see is the new shape of the challenge. Developers don't just write code anymore — we've been pushed toward the business side. And that turns out to be a much bigger cliff.

## Where I Actually Struggle

In the last year the company I worked for struggled a lot. I've struggled too. And where I struggle most is the business priorities — the kind that decide what even gets built.

For a long time the answer was "just ship a minimal MVP." Clean. Simple. But the questions underneath that answer are the hard part:

- What are the mockups?
- What are the design choices?
- Who is the target audience?
- When do we deliver?
- What do the user journeys look like?

When I don't have the time to register on ten competing platforms and take notes on how they handle their forms, all of this becomes weight on my shoulders. You end up having to defend design choices you're only half sure about — what fields to put on a signup form, what order to ask questions in, what the first screen should even say.

That's why product owners and product managers exist. People who talk to the client, people who bring perspective. You'd open Jira or ClickUp, you'd have a Kanban board for the current sprint and a long backlog you could shuffle items out of into it. Great, when the company has the budget for those roles.

But what if it doesn't? There are countless startups without funding. This work — creating priorities, managing sprints, ordering the backlog — might be one of the most important reasons startups fail. Because you have to have a plan.

## The Accident That Started It

I came across this accidentally. I was doing something for the ResilientX TPRM platform — the Third-Party Risk Management product. While I was using Claude to fix a feature, it wrote a small backlog of next steps inside the chat message. Just a few lines, structured, numbered.

At first it was just that — a side comment in the conversation. But then I tried turning it into a skill. Something I could run on any project. Something that would scan the code, the TODOs, the git history, the routes, the tests, and propose a sprint. Not randomly — purposefully.

And once you add structure to it, the skill stops being a toy. Items get IDs. They get a business value score. They get effort estimates. They get a one-line "why this matters" that would have taken a product manager an hour to write. They get grouped into sprints with an actual business theme, not just "whatever we pull next."

## The Shape It Takes

There's another project my brother and I work on — `eu_comply`, for the EU AI Act. I installed the skill there and ran it. What comes back is not a list. It's a sprint. With a theme, a one-line business goal, and items ordered by value instead of whim:

```markdown
### Sprint 19 — Italian-First SME Demo Path
_Business goal: an Italian SME prospect can log in → land on an
Italian dashboard → register an AI system → classify risk → download
an audit-ready ZIP without hunting for a language picker._

| #          | Item                                  | Effort | BV   |
| ---------- | ------------------------------------- | ------ | ---- |
| I18N-3     | Auto-detect locale from the browser   | XS     | 5/10 |
| I18N-it-3  | Risk Wizard: full Italian pass        | L      | 8/10 |
| I18N-it-5  | SME jargon tooltips (Annex III, FRIA) | M      | 7/10 |
```

The codes aren't decorative. They're how you talk to yourself a week later without losing the thread. The BV score isn't decorative either — it's the thing that decides the order. And the one-line business goal at the top is what a good PM would have written on a whiteboard.

The part that surprised me was the pushback. The skill runs a research-first gate on anything that touches an external regulator, so you don't waste a sprint building against an API that doesn't exist yet. Items that fail the gate go to a Watch List, not a sprint. I wouldn't have thought to add that. A good PM would have.

This is the work my brother tells me to stop worrying about. He's right — because now I don't have to.

## The Part That's Actually Hard

The point isn't that AI writes a perfect backlog. It doesn't. Some items are wrong, some are duplicates, some miss context only a human has. You still read the proposal, strike the bad ones, promote the watch-list items when the time is right.

But the first draft is already there. The blank page problem — the single biggest friction in planning — is gone. The shift from "what should we even do next?" to "is this the right order?" is a shift from invention to judgment. And judgment is the easier of the two.

That's why the title of this post is what it is. AI should do my laundry. Not the coding, not the product decisions, not the conversations with the people I'm building for. But the tedious sorting, the fold-and-stack work of turning a codebase into a sprint — yes, that. Let it do that part. Then I can actually listen to my brother and enjoy the rest.

### Try It: The Fat of Relevance

The anxiety in this post — that AI relieves you, but might relieve you right out of the frame — turned into a snake. You start as three segments. Green **AI** items trim your body by one, purple **LLM** items trim by two. Red **TKT** items add one, dark-red **!!!** items slap two more onto you. Eat the balance wrong and you either drown in backlog or vanish entirely at zero. The field gets denser as time goes on, and the double-effect items keep getting louder — just like real work.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #f4a261; font-size: clamp(16px, 4vw, 20px);">The Fat of Relevance</h4>
  <canvas id="laundryCanvas" width="300" height="400" style="border: 2px solid #f4a261; background: #0a0a0a; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto; cursor: pointer;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(244, 162, 97, 0.1); border-radius: 5px; border: 1px solid rgba(244, 162, 97, 0.3);">
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Arrow keys / WASD on desktop, swipe on mobile</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• AI / LLM trim you (−1, −2). TKT / !!! grow you (+1, +2)</p>
    <p style="margin: 5px 0; color: #e76f51; font-size: clamp(11px, 2.8vw, 13px);">• Walls wrap. Game over at 0 body or eating yourself</p>
  </div>
  <button id="startLaundryGame" style="padding: 12px 30px; background: #f4a261; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <div style="display: flex; justify-content: space-around; margin-top: 15px;">
    <p id="laundryScore" style="font-weight: bold; color: #e9c46a; font-size: clamp(16px, 4vw, 18px);">Score: 0</p>
    <p id="laundryLives" style="font-weight: bold; color: #e9c46a; font-size: clamp(16px, 4vw, 18px);">Body: 3</p>
  </div>
  <p id="laundryVerdict" style="color: #aaa; font-size: clamp(11px, 2.8vw, 13px); margin-top: 5px;"></p>
</div>

<script src="posts/laundry-game.js"></script>

**The point?** Letting AI trim the tedious parts is the whole goal — but only up to a point. Too little delegation and the tickets pile past what you can carry. Too much and there's nothing left to be relevant about. The thinking is knowing which one you're closer to right now.
