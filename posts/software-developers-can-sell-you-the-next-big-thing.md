# Software Developers Can Sell You the Next Big Thing

There is a statement going around about productivity right now — that thanks to AI it has almost doubled compared to when we were managing the pipeline of deliveries as developers. Scoping the plan for sprints, planning deliverables in time and scope, collaborating on initial PRs where we'd discuss the best approach, then handing off to maybe somebody who'd be the DevOps. There are no such things now.

I've spent most of my career, except for two cases, in startup environments. And it has always had the same approach to deliverables. Make it as fast as you can, until we figure out who's going to sell it to the first users.

## The Surprise of a Technical CEO

Software developers have been at the forefront of all the biggest new shiny things, tech-related. I can say my boss is a former developer, and a CEO. I can't hide it, but I always feel surprised when someone coming from tech, someone who previously wrote code, can sell a product.

I had always assumed that you have to dumb it down for non-technical people, so that it's understandable. And those features that before didn't make sense — the ones your boss proposed to you as deliverables — it's not because he was aiming to sell something a startup team couldn't deliver. It was because both parties couldn't create conventions around what was being said.

So having a CEO that is good at sales, and likely also very good at strategy, is very lucky.

## The Terminology Person

ResilientX, the company I'm currently working at, operates in the compliance space. And as it grows, it tries to position itself closer and closer to SME and enterprise customers. The catch is that compliance doesn't mean the same thing to both. An SME wants to know what to do this quarter so they don't get fined. An enterprise wants a control framework that maps to their existing audit trail. Same product, two different vocabularies.

This is where the CEO becomes the person the team relies on. Not for the architecture — for the sprint priorities and for the terminology. He's the one who decides whether a feature gets called "risk register," "obligations tracker," or something else entirely, depending on who's on the other side of the call. And it matters, because in compliance the wrong word doesn't just confuse the buyer — it lowers the perceived stakes. Compliance has fines attached to it. If your terminology makes the feature sound like a checklist, it gets bought as a checklist. If it makes it sound like the thing standing between the customer and a regulator, it gets bought as that.

I've watched him take a feature we'd internally been calling "evidence upload" — a fairly mechanical CRUD screen — and reframe it on a call as the audit-ready trail the customer would hand over the day a regulator showed up. Same screen. Same database table. The room went from polite nodding to actually leaning forward. And the team didn't have to build anything new for that to happen. He just gave it the name it deserved.

That's the part I find hard to do as a developer. I describe the screen. He describes the day the regulator shows up.

## What Overseeing Actually Looks Like

I've heard a lot of people say that the role of the software developer has moved from building to overseeing. Like a manager making sure things comply to a specific outcome. Less about writing code, more about making sure that before we add a new feature, the existing ones don't leak.

A concrete version of that, from a recent sprint: instead of shipping a new module, we spent the week hunting down the three places a null could leak through a serializer and end up in a customer-facing report. No new feature. No demo. Just three test cases, two refactors, and a quieter inbox the week after.

That's what overseeing looks like in practice. It's not a job title — it's the choice to spend a sprint on what's already there instead of what hasn't been promised yet. Which sounds boring. Which is why it usually doesn't happen unless someone defends it.

The other coworkers are keen on data integrity, and although I'm a fan of multitasking, I've learned there's a real need to keep features that touch different parts of the data model on separate tracks. A "small" change to how one model serializes can quietly reshape another report that nobody is looking at right now but somebody will look at the day they have to defend a number to a regulator. Hardening sprints exist because the cost of finding that out late is much higher than the cost of finding it out on purpose.

## Why a Technical Pitch Lands Differently

But it could be — as it always gets said about being a manager — that it's more about the sales pitch and how good you can present something. It's fascinating to see somebody coming from technical ground be good at sales.

I think the reason a technical pitch lands differently is that it carries an implicit guarantee. When the CEO reframes "evidence upload" as the audit-ready trail, the customer hears it and on some level trusts that the person saying it knows whether the thing on the other end can actually hold up under audit. They're not selling a vision into a vacuum. They're selling something they know is one or two engineering decisions away from being true. That confidence reads, even if it never gets said.

Which is also why it's such a hard thing to imitate. You can't fake the part where you know the system can survive what you're promising. You either know, or you're hoping.

I wish I could understand more how the shift happens — from being the person who describes the screen to being the person who describes the day the regulator shows up. Whether it's possible to do all of these things and still be a software developer that can actually sell. Not the structure of the code, but something that you imagine happening.

I can't hide that when I was younger, or when I started working as a software developer, I would promise much more than I could deliver. Sometimes I feel now I under-promise, because I know I can do more.

### Try It: The Pitch & Build Balance

Here's the tension from the post turned into a seesaw. Gold **PITCH** tokens fall from one side, blue **BUILD** tokens from the other. Catch them on the paddle to add weight to either pan of the beam at the bottom. Catch too many pitch tokens and you over-promise — the beam tips and nothing got built. Catch too many build tokens and you over-build — the beam tips the other way and nobody hears the story. The skill isn't catching everything. It's knowing which side you're already leaning toward, and letting the rest fall.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #f4a261; font-size: clamp(16px, 4vw, 20px);">The Pitch &amp; Build Balance</h4>
  <canvas id="pitchBuildCanvas" width="300" height="400" style="border: 2px solid #f4a261; background: #0a0a0a; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto; touch-action: none;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(244, 162, 97, 0.1); border-radius: 5px; border: 1px solid rgba(244, 162, 97, 0.3);">
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• ← → arrow keys (or drag on mobile) to move the paddle</p>
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(11px, 2.8vw, 13px);">• Gold PITCH tokens tilt the beam right (+1)</p>
    <p style="margin: 5px 0; color: #457b9d; font-size: clamp(11px, 2.8vw, 13px);">• Blue BUILD tokens tilt the beam left (−1)</p>
    <p style="margin: 5px 0; color: #e63946; font-size: clamp(11px, 2.8vw, 13px);">• Tip the beam too far either way and you lose</p>
  </div>
  <button id="startPitchBuildGame" style="padding: 12px 30px; background: #f4a261; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <div style="display: flex; justify-content: space-around; margin-top: 15px; flex-wrap: wrap; gap: 10px;">
    <p id="pitchBuildScore" style="font-weight: bold; color: #e9c46a; font-size: clamp(16px, 4vw, 18px); margin: 0;">Score: 0</p>
    <p id="pitchBuildTilt" style="font-weight: bold; color: #e9c46a; font-size: clamp(14px, 3.5vw, 16px); margin: 0;">Beam: balanced (0.0)</p>
  </div>
  <p id="pitchBuildVerdict" style="color: #aaa; font-size: clamp(11px, 2.8vw, 13px); margin-top: 8px;"></p>
</div>

<script src="posts/pitch-build-game.js"></script>

**The point?** A technical CEO who can sell isn't doing two jobs at once — they're keeping the beam level. Drift too far toward pitch and you've sold something nobody can ship. Drift too far toward build and you've shipped something nobody bought. The shift from building to overseeing is mostly the discipline of watching that meter at the top.
