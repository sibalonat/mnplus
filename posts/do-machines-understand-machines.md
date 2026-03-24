# Do Machines Understand Machines

I started blogging here at Arra on January 10 of this year. The initial drive came from something I had done back in 2021 — a commitment to myself that I would do one thing every day for six months. That one thing was design.

Today when I introduce myself, I say software developer. But there was a time when I ran an online magazine, and I remember being deeply interested in design — I liked to play artistically with it. Throughout my career as a developer I've worked with designers, but I've only written once about how I see them. That was last month, when I argued that designers today feel the same pressure developers do — to deliver more, to stay relevant. That the current moment has pushed designers closer to QA than to creative flow. And that this alignment with data, where nothing can exist without a purpose for being there, has made designers more prone to understand developers and developers more prone to understand designers.

But what if we didn't need to do that?

## The Promise of Stitch

I can't help but write about this. Last week the entire internet was buzzing about a new tool from Google called Stitch. The promise — and what everybody was saying — was simple: since you're a developer, and you build frontend, and you know some things about UI/UX, why don't you just prompt the entire platform out? Des-vibe it.

And sometimes, because of how people complain about coming up with ideas, it seems to make sense. It's easier to ask AI to make a design based on the requirements you give it. You know the data ops well, you might give it all the context it needs, and just say at the end — "make it so that it sells hard."

> **Helper Note**: Google Stitch is a generative UI design tool announced in March 2026 that allows users to describe interfaces in natural language and receive full design mockups, including style guides and component systems. It positions itself as a bridge between development thinking and design output — aimed particularly at developers who understand requirements but lack traditional design training.

## So I Tried It

I asked Stitch to design a platform me and my brother are building together. I described the product and the vibe — modern and futuristic. One of Stitch's selling points is that it creates a design style guide alongside the mockup. I asked it to, and it did.

I can't assume it was a final version. But my brother, who would be the initial user of it, liked it.

## The Honest Assessment

Later, after my brother left, I asked Anthropic's Claude to give me an honest assessment — and not to sugar the response — about whether the style guide was worth it.

The response:

> _About 30% of the ideas in the document are good design principles disguised in theatrical language. The other 70% is visual spectacle that will hurt usability, performance, and adoption. Take the layering system, the spacing philosophy, and the dark-mode color discipline. Drop the glassmorphism, the neon glows, the display fonts, and the dogmatic "no borders" rule._

And there it is. The machine understood the requirements I gave it. It produced something that looked like a design. It even organized it into a style guide with principles and rules. But when another machine assessed it honestly, the verdict was that most of it was spectacle — things that look impressive but hurt the product.

## The Question

This is the part that keeps me thinking. Stitch understood what I asked for. Claude understood what Stitch produced. Both machines processed language, context, and intent. But neither of them understood the product the way a designer sitting across the table would — someone who asks "why?" before asking "how does it look?"

The 30% that was good? Those were universal design principles — spacing, layering, color discipline. Things that exist in every design textbook. The 70% that was spectacle? That was the machine doing what machines do well — pattern-matching on the word "futuristic" and giving me every visual trope associated with it.

A designer would have filtered that. A designer would have known that "futuristic" for a product that needs adoption means clean and intuitive, not neon glows and glassmorphism. That filtering — that understanding of what the user actually needs versus what the prompt literally says — is still a human skill.

## What This Means

I wrote last month that the pressure on designers has made them more aligned with developers. But tools like Stitch suggest a different future — one where the developer doesn't need the designer at all. Where you skip the handoff, the Figma file, the back-and-forth, and just prompt your way to a UI.

The problem is that what you skip is also the judgment. The part where someone who has spent years thinking about how people interact with interfaces tells you that your "futuristic" vision will hurt adoption. That your neon glows will fatigue users. That your "no borders" dogma will make your forms unreadable.

### Try It: The Design Filter

Here's the challenge from the post turned into a game. Design decisions rise toward production — 70% spectacle, 30% good principles, matching Claude's assessment. Tap the spectacle to reject it. Let the good principles ship. Can you filter better than a machine?

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #00d4ff; font-size: clamp(16px, 4vw, 20px);">The Design Filter</h4>
  <canvas id="designFilterCanvas" width="300" height="400" style="border: 2px solid #00d4ff; background: #0d0d0d; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto; cursor: pointer;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(0, 212, 255, 0.1); border-radius: 5px; border: 1px solid rgba(0, 212, 255, 0.3);">
    <p style="margin: 5px 0; color: #00d4ff; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Tap visual spectacle to REJECT it (+10 pts)</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Let good design principles ship through (+5 pts)</p>
    <p style="margin: 5px 0; color: #ff6b6b; font-size: clamp(11px, 2.8vw, 13px);">• Don't let spectacle reach production! (-15 pts, -1 life)</p>
    <p style="margin: 5px 0; color: #ff6b6b; font-size: clamp(11px, 2.8vw, 13px);">• Don't reject good principles! (-10 pts, -1 life)</p>
  </div>
  <button id="startDesignFilter" style="padding: 12px 30px; background: #00d4ff; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <div style="display: flex; justify-content: space-around; margin-top: 15px;">
    <p id="designScore" style="font-weight: bold; color: #00ff88; font-size: clamp(16px, 4vw, 18px);">Score: 0</p>
    <p id="designLives" style="font-weight: bold; color: #00ff88; font-size: clamp(16px, 4vw, 18px);">Lives: 3</p>
  </div>
  <p id="designVerdict" style="color: #aaa; font-size: clamp(11px, 2.8vw, 13px); margin-top: 5px;"></p>
</div>

<script src="posts/design-filter-game.js"></script>

**The point?** The game spawns decisions at the same 70/30 ratio Claude identified. If you struggle to filter the spectacle from the substance under pressure, imagine an AI doing it without any sense of who the end user actually is.

Machines can understand machines. They can process each other's outputs, assess them, even critique them. But understanding the human on the other side of the screen — that's still something we need each other for.
