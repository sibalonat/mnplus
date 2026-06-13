# Our Limitations Give More Than They Take

When I was 23, I read about a correspondence between an aspiring artist, Peter Emslie, and the famous cartoonist Al Hirschfeld. Emslie wrote to him; Hirschfeld received the letter and wrote back. Somewhere in that reply was a line that struck me then and that I find more and more relevant today: "Limitations, accepted in the right way, are the only value when it comes to creating art." I was quite young, and what also struck me was something he said later — how impressed he was that people try their best to push their limitations further ahead, instead of making use of them. I was young, and I wanted to explore every possible way to push my limitations without ever trying to understand them. Freedom, as I thought of it at that time, was the only benefit of creating art, and not the other way around. It wasn't until later that I faced the fact that freedom to pursue freedom was in fact a limitation by itself. The thing is, sometimes that is not very obvious, and sometimes that limitation really hits hard at the base core of how you think of your own worth.

## When AI Promised a Worry-Free World

But returning to today. Over the years I have read a lot about LLMs, and about freedom in economics as well. One thing you notice every time you read about these two things is the tendency to think so far ahead — so far that it makes today's living irrelevant. When AI was introduced, I remember thinking it would let us live in a more worry-free world, where things would be easy, and the "machines" would be more capable than us of determining what was best for us. I can't hide that at that time I was enthusiastic — I was 24. But later on, and especially now, human oversight is continuously doubted. You can say it starts with big tech, which decides it is better to pay for an AI subscription than to keep a human overseeing it, because you have a roadmap — one that, in simple terms, says one of three things: make me rich, hit my adversaries, or keep my current "stronghold."

## A War Is Also a Disruption Now

It's not uncommon to hear, almost every day, that supply-chain attacks are happening on a daily basis. And once you consider that critical infrastructure is not only the people who work there but also their equipment, it has made most countries aware that a definition of a war today is also to use cyber attacks intentionally. Before 2020 this might not have been as relevant as it is now, but today, thinking about wars means also thinking about disruptions of critical infrastructure.

## The Vulnerabilities I'm Not Allowed to Ignore

Me as a developer — and sometimes as a person who thinks about the role we as developers have — I think the way we make ourselves more resilient toward the next big disruption is to use AI, but to prevent it from having complete freeway to do what it wants. Every action should be intentional. I remember when I started seeing Dependabot on GitHub flag vulnerabilities in the code. That is a crucial thing now; it's not really a matter of choice anymore. The project my brother and I are working on uses Django, and every week I get flagged through CI actions about vulnerabilities. It would be reckless to leave these vulnerabilities unresolved, even though resolving them is a burden on my time — time I would otherwise spend on features. But I should be aware that a software developer is a profession that has a direct impact on business risk and cyber resilience. It's knowing those limitations that makes us more relevant, and not only the new shiny features.

## A Limitation You Can Install

Dependabot and CI are the nets that catch me after the fact — they flag a vulnerability once the code is already pushed. But the idea I keep coming back to is that every action should be intentional, and the most intentional place to check code is before it ever leaves my machine. That is what a pre-commit hook is: a small, self-imposed limitation that refuses to let a commit through until it has been checked.

On the Django project my brother and I work on, this is the version I run. You drop a `.pre-commit-config.yaml` at the root of the repo:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.9
    hooks:
      - id: ruff          # lint the code
      - id: ruff-format   # format it the same way every time

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: detect-private-key        # never commit a key
      - id: check-added-large-files   # no accidental 200MB blob
      - id: end-of-file-fixer

  - repo: local
    hooks:
      - id: pip-audit
        name: pip-audit (known CVEs in dependencies)
        entry: pip-audit
        language: system
        pass_filenames: false
```

Then you install it once, and let `pre-commit` keep the versions current for you:

```bash
pip install pre-commit pip-audit
pre-commit install          # wires it into .git/hooks/pre-commit
pre-commit autoupdate       # pin each hook to its latest release
pre-commit run --all-files  # run it now, not just on the next commit
```

From that point on, `git commit` stops and runs the checks first. The one that matters most to me is `pip-audit` — it is the local cousin of Dependabot, scanning my dependencies for known CVEs before they ever reach CI. The `detect-private-key` hook has saved me from myself more than once.

It is a few seconds of friction on every commit. And that is exactly the trade I am arguing for: the limitation does not slow the work down so much as it keeps the work honest. The hook says no, and most of the time the no is the point.

## Sane and Safe

In the company I work for, we also try to spin up new things, but one time during a conversation the CEO mentioned: "Making sure that our software is sane and safe, is the most important thing." I completely agree with that statement. And the more I sit with it, the more it sounds like what Hirschfeld meant about art — that the limitation isn't in the way of the value; it is the value.

### Try It: The Tower You Can Still Stand On

Here's the post as something you build with your own hands. You stack a tower upward, one block at a time, and every block is a choice. Green **ANCHOR** blocks are slow and only add one floor — and they bolt down everything beneath them. Red **FREEWAY** blocks snap up three floors at once and feel incredible: the tower shoots toward the top of the canvas while the green ones are still settling. Then watch the **Exposure** meter. Every FREEWAY block pushes it up, and when it crosses a threshold the tower shakes — a **BREACH** — and everything sitting above your last ANCHOR slides off into the dark. Gold **FLAG** markers blink on the structure; clear one with an ANCHOR in time and you bank integrity, ignore it and Exposure climbs faster. I built it this way on purpose, because the first few runs you will do what I did with the LLM: take the free height, love how fast it goes up, and then lose all of it in one shake. The run where you finally win is the slow one — the one where you keep stopping to place the block that gives you almost nothing.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #f4a261; font-size: clamp(16px, 4vw, 20px);">The Tower You Can Still Stand On</h4>
  <canvas id="limitationsCanvas" width="300" height="400" style="border: 2px solid #f4a261; background: #0a0a0a; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto; cursor: pointer; touch-action: manipulation;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(244, 162, 97, 0.1); border-radius: 5px; border: 1px solid rgba(244, 162, 97, 0.3);">
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #2ecc71; font-size: clamp(11px, 2.8vw, 13px);">• ← / A places an ANCHOR (tap the left side on mobile)</p>
    <p style="margin: 5px 0; color: #e63946; font-size: clamp(11px, 2.8vw, 13px);">• → / D places FREEWAY (tap the right side on mobile)</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• ANCHOR locks everything below it; FREEWAY adds fast, exposed height</p>
    <p style="margin: 5px 0; color: #457b9d; font-size: clamp(11px, 2.8vw, 13px);">• A BREACH knocks off everything above your last ANCHOR</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Game over when Integrity hits 0 — or anchor your way to the top</p>
  </div>
  <button id="startLimitationsGame" style="padding: 12px 30px; background: #f4a261; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <div style="display: flex; justify-content: space-around; margin-top: 15px; flex-wrap: wrap; gap: 10px;">
    <p id="limitationsScore" style="font-weight: bold; color: #e9c46a; font-size: clamp(16px, 4vw, 18px); margin: 0;">Anchored: 0</p>
    <p id="limitationsExposure" style="font-weight: bold; color: #e9c46a; font-size: clamp(14px, 3.5vw, 16px); margin: 0;">Exposure: 0%</p>
  </div>
  <p id="limitationsVerdict" style="color: #aaa; font-size: clamp(11px, 2.8vw, 13px); margin-top: 5px;"></p>
</div>

<script src="posts/limitations-give-more-game.js"></script>

**The point?** The whole game is a bet that the block that gives you the least is the one keeping you alive — and it is. The ANCHOR scores low, places slow, and feels like a tax on momentum; the FREEWAY block feels like all upside right up until the breach, when it turns out it was never yours to keep. That's the thing I kept getting wrong: I read the FREEWAY height as progress because it was visible, and the anchored height as cost because it was slow. But only one of them survived contact with the world. Our limitations — the oversight, the patch, the flag we stop to clear, the rule that every action should be intentional — don't subtract from what we build. They're the only part of it that's still standing after the shake. They give more than they take. You just have to play one collapse to believe it.
