# When the LLM Thinks Too Fast

I hear a lot of discussion about LLMs lately. In the past, but also now, most of it in my circles comes from stakeholders — and the follow-up statement is almost always the same: that the tools give them more visibility into deliveries. I've seen many of these people through the lens of an old joke. The ones who don't understand the tools (the LLMs) very much are the ones telling you to use them, to make the most of them, to test them thoroughly. It's advice that lands a little sideways, because the people giving it usually haven't watched what happens when you actually let the thing run.

I'm both a Claude and Copilot user. Until recently I leaned almost entirely on Copilot. Lately I've gradually drifted toward Claude — at first because I liked the idea of using the newer model to actually create plans for me. And I went further: while I was working on some of the articles I'd already written, I started using it to build backlogs with scoped goals, to find possible ideas for sprints, to break the thing I was thinking about into ordered work.

So when I sat down to think about this post, I had an assumption I wanted to test. Something strange, difficult, and very non-contextual.

## What I Tried

The setup was this. Claude would take a scope of work and run it in parallel with Copilot. One of them would extract information about a specific piece of the product — I'd ask it to research, then re-read its own notes to make sure the goal had been scoped properly. Then it would run an end-to-end scan with Playwright. Take screenshots. Look at the screenshots, scan what was bad about them, and take notes. Compile those notes in chunks. Hand the chunks back as learning material, so the backlog skill could read what it had learned and propose new sprints — in most cases, two.

I added one constraint inside the skill: don't propose too many new features per sprint. Otherwise the app would bloat with migrations, orphan references would pile up where the LLM didn't track them, and we'd lose data on every change the LLM decided to make.

The reason I tried this is something I'd half-absorbed from the surrounding discussion: that we like, or are getting used to, systems designed by the AI, where we don't need much human oversight in the loop. For me it was something I wanted to try. I was very attached to my terminal. The appeal was that I could spend my time only reading the complex contexts Claude or Copilot would surface, and the rest would, eventually, be fine.

## After Two Weeks

It creates a maze.

Before I take an experiment anywhere, I rehearse it on myself like a stakeholder demo. Out loud, in the room, as if there were people sitting across from me — I walk through the setup, the screens, the decisions. It's a habit I've picked up for the things I'm not ready to share yet, because if the demo falls apart while I'm pretending there's an audience, that's the cheapest place to find out. Two weeks in, the demo for this one kept falling apart.

For the first version of the product I'm building with my brother, he was disappointed I hadn't shown him any of the steps. He wanted it redone — it was something he thought we could spend time on together — but I had assumed: let's just do it and launch it. I was still learning about LLM usage, and I think it was during that stretch that I caught myself reading the terminal more than the browser. I'd stopped checking what I'd actually built. I was reading the "instructions" the LLM had decided about which option I could use to go on the next step, and going on those alone.

## The QA Skill

That's when I thought I needed a QA skill. Something I could run that would find me the bugs. I didn't have huge expectations, but I can't say I was willing to doubt it very much either — what I was asking it to do seemed easy. I tried to give it more context: click the button. Check whether there are dead routes or links. Set the timeout for each thing. The kind of instructions you'd give a new tester on their first day.

What ended up being useful — to the extent anything was — wasn't the long list of clicks. It was a few rules baked into the skill that constrained how it ran:

- **One thing per invocation, deeply.** Instead of scanning the whole app on every run, pick one piece — one route, one form, one workflow — and exercise it end to end. The temptation is to test everything; the value is in actually finishing a single check.
- **If a step doesn't apply, say so out loud.** A silent skip and a missed bug look exactly the same in a report. So every step the skill has has to either run or explicitly log "skipped because X." Otherwise you start trusting the green checkmarks for the wrong reasons.
- **Don't re-invent what the project already has.** If there's a login helper, an accessibility helper, a screenshot helper sitting in the test folder, the skill should reuse them. Not because it's tidier — because every time the LLM rewrites the same helper, it drifts a little from the one the team is actually maintaining.
- **Cross-check the UI against the data.** Whatever the screen shows, also ask the database. The two disagree more often than they should, and the only way to catch that is to look in both places on the same run.

These aren't specific to my setup. They're the kind of rules I wish someone had handed me before I wrote the first prompt — because most of what made the skill noisy in the early days came from skipping one of them.

But even after running that skill on its own, and integrated with the backlog skill, I still found myself going through the QA and making the call myself. I feel I can see things — and when I assess them by talking, they seem clearer. There are also cases where other people are better than me at orchestrating this kind of loop. My boss, for example, built a similar proof of concept. From the way he describes it, and from the results I've seen in the last two weeks, I can't say it's disappointing. But I still find enough gaps that I can't use it as it is.

## The Two Extremes

It still feels like the choice is between two extremes. Either you give the LLM the entire authority to make decisions — let it create or change thirty tables a day if it wants — or you harden the rules so that if it does add new tables, the data is either appropriated or distributed across other columns so the model stays normalized.

As a human, it isn't an easy call. I might be wrong to lean more on hardening, because eventually the LLM finds ways around the hardening anyway. But I do believe people bring experience to this — the kind that doesn't show up in a prompt or a system file, but shows up in the small moment where someone says, "wait, this is the third table we've added this week that points at the same data."

## You Think Too Fast

A friend told me once, not in the context of any of this:

"You won't believe it, but you think too fast. Way too fast."

He meant it as a partial compliment. There's a warning in it too. When you move too fast — when you skip the step of explaining what you're doing to someone else — you end up with a result only you can navigate. And sometimes not even you.

That's what the LLM does when you let it think too fast on your behalf. It has its own version of wishful thinking: that humans should be able to keep up on its terms. And when humans can't, the product becomes difficult to read. Difficult to use. The layout has rooms you don't remember adding. The data model points at columns nobody references. The migrations stack up in an order that only made sense to the model that wrote them.

It's a maze.

## What I'm Doing Now

I haven't given up on the parallel setup. The research-then-Playwright-then-notes-then-backlog loop is still useful when I'm exploring something I don't fully understand yet. But I've stopped expecting it to produce a finished thing. I read the screenshots myself now. I open the app in the browser before I open the terminal. I ask my brother to walk through the build with me before I push.

It's slower. It's also the only way I've found that doesn't end in a maze.

### Try It: The Maze the LLM Builds

Here's the post turned into a tile. You're a small dot in a grid. Over time, the LLM lays down walls — slowly at first, faster as the run goes on. Two pickups appear: green **REVIEW** tokens (the human-in-the-loop) clear a few of the walls nearest to you. Red **AUTO** tokens score higher but speed the LLM up, so more walls drop after you grab one. You don't lose by hitting a wall — you lose by being boxed in with nowhere to go. Same trade-off as the post: harden too little and the maze closes around you; harden too much and you've spent all your time clearing walls instead of moving.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #f4a261; font-size: clamp(16px, 4vw, 20px);">The Maze the LLM Builds</h4>
  <canvas id="mazeCanvas" width="300" height="400" style="border: 2px solid #f4a261; background: #0a0a0a; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto; cursor: pointer;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(244, 162, 97, 0.1); border-radius: 5px; border: 1px solid rgba(244, 162, 97, 0.3);">
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Arrow keys / WASD on desktop, swipe on mobile</p>
    <p style="margin: 5px 0; color: #2ecc71; font-size: clamp(11px, 2.8vw, 13px);">• REVIEW (+3 pts) clears nearby walls</p>
    <p style="margin: 5px 0; color: #e63946; font-size: clamp(11px, 2.8vw, 13px);">• AUTO (+8 pts) speeds the LLM up</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Game over when you're boxed in</p>
  </div>
  <button id="startMazeGame" style="padding: 12px 30px; background: #f4a261; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <div style="display: flex; justify-content: space-around; margin-top: 15px; flex-wrap: wrap; gap: 10px;">
    <p id="mazeScore" style="font-weight: bold; color: #e9c46a; font-size: clamp(16px, 4vw, 18px); margin: 0;">Score: 0</p>
    <p id="mazeRate" style="font-weight: bold; color: #e9c46a; font-size: clamp(14px, 3.5vw, 16px); margin: 0;">LLM rate: 1.0x</p>
  </div>
  <p id="mazeVerdict" style="color: #aaa; font-size: clamp(11px, 2.8vw, 13px); margin-top: 5px;"></p>
</div>

<script src="posts/maze-game.js"></script>

**The point?** The LLM can build faster than you can navigate. Some REVIEW is non-negotiable — without it, the walls close around you while you're still reading the terminal. But every step you spend clearing walls is a step you didn't spend moving. The skill isn't choosing one side. It's noticing, in real time, which one you've been ignoring.
