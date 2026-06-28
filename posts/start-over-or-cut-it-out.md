# Start Over, or Cut It Out

This is maybe the fourth time in my life that I have engaged in a public discussion at all, and over these six months of writing I have learned that public discourse keeps moving without needing me to push it. It changes whether or not you are an active part of it. More than once I have caught myself assuming a topic would already be irrelevant by the time I hit publish. In some cases I rewrote the post to keep up. In others I just orphaned it — left it sitting there, never put in the effort to rewire it, so it never saw the light of being read.

The LLM and AI discussion is as active as it has ever been. But for better or worse, it is still stuck more or less where it started: whether we should be hopeful about our future, or scared of it. That is a strange place to be stuck, because the thing we keep arguing over is, by most measures, better than me and better than most humans at the one task we keep testing it on — remembering. And that is exactly what makes it hard. It produces this constant sense of ambiguity, where things seem to be going to hell and going great at the same time.

I see it most clearly through friends. Some of them posted, not long ago, that they were hiring software developers; some of those are still in business, and some have gone out of business. Friends who struggled to find work for a long time have suddenly thrust themselves into a new environment, mostly because they can now write a better email, a better message, and that turned out to be enough of a door. Friends who used to work in accounting now talk about compliance as a shift toward the business side. There are too many of these at once for any single story to win, and the whole pile-up gets quietly repackaged as hope — as a signal that we are ready for the next investment into something AI-related.

## Why I Started, and Who Stayed

When I started this blog, the honest reasons were small. I wanted to be a little more visible on LinkedIn, and my wife had started writing a blog of her own. Most of my hours went into the things I was building and into playing with my daughter, and on the surface all of it seemed to be working well. But I remember the unease — how fast everything was changing, and the feeling, as a new father, that I needed to stay relevant to the market and to the world a while longer.

I did not have much expectation going in. From 2013 to 2018 I ran a project that did reasonably well, an online magazine I had created, and out of that I formed a stubborn assumption: that reading more rather than less is a casual thing. You find the good reads when you least expect them, sideways, not because someone optimized a funnel to put them in front of you.

So to the roughly two thousand of you who have stayed with this blog over the last six months — thank you. I mean that more plainly than I usually allow myself to write. I am grateful you managed to find the posts you read, even though I made it almost impossible to find them. I never wired up the orphans. I rarely cross-linked. Whatever path brought you here was mostly yours, not mine, and that you arrived anyway is the part I did not plan for and the part I keep.

## It Understands Context Better Than I Do

Things are faster now, and I have had to admit something that is a little uncomfortable. Even across a language barrier, the LLM understands context much better than I do as a human — at least when the content is primarily in English. So maybe it understands humans better than I assumed it could. The open question I keep circling is the next one: can it understand code better than humans?

We built up an assumption, over the years, that writing code is about writing *good* code — clean, correct, well-shaped, the kind of thing you could be proud to leave behind you. But more and more the real work is the context, and whether, sitting inside that context, the thing can make a surgical change without tearing something else. Good code is necessary. It is no longer the part that decides whether you make it.

## The Feature With Deep Roots

I have written a couple of times here that I am building a product for my brother. Once a week we meet and talk through what matters for the week ahead. I take notes, I organize them, and I hand the shape of it to Claude to make the changes. There are stretches where he and I go back and forth — what I know to be good practice on one side, what he actually wants on the other. I put some restrictions on what is possible. Then I change my mind, because if it is AI building out the requirements my brother has, it makes less and less sense for me to keep digging in, and the disagreement ends up costing more than it saves.

The last time, I did not have the time to meet him, so he tried the platform on his own. He came back and said that a feature we had spent something like 1.2 months building was useless — that it did not make sense to him at all. The trouble is that feature had deep roots. Making surgical cuts to code like that means doing it by hand and then testing it a lot, far more than feels proportionate. I do not always have time for that, and I cannot pretend my brother is keen to do it either.

This is the second time we have done one of these cuts. The technical debt keeps piling up, because I cannot trace the entire web of references the feature reaches into, and I am fairly sure the AI is lazy about this kind of work too — these operations take much more than a single prompt to actually fix, and a single prompt is what they tend to get. You trace it, you cut a clean leaf, and a hidden reference you never saw springs up somewhere below. The root was deeper than the part you could reach.

## The Tempting Rewrite Button

So it starts to feel almost safer to throw the whole thing out and do a complete rewrite — a fresh application with only the features you actually want. It is close to comfort, the idea of starting anew: keep the things you like, remove the rest. But the same question comes straight back the moment you reach for it. Is it really certain the rewrite does not pile up its own technical debt? That it actually leaves the code sane again, rather than just moving the mess somewhere you cannot see yet?

We have reached a point where things change so fast that the effort might not even be relevant by the time it is done. There is another challenge underneath that one. Having two years of building behind this product, much of it from before AI existed, poses its own problems — and the sharpest of them is that we still do not really understand what an LLM can actually contribute on a very large code context. Not a file or a function, but the whole tangled thing at once. Start over, or cut it out — both look like a decision you can hand off. Neither one is. Somebody has to sit with the reference you could not trace and decide whether it stays or goes.

## The Human Stays in the Loop

The European Union has, in its own way, put money and law behind exactly this instinct — human oversight of decision-making — through GDPR:

> The data subject shall have the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects concerning him or her or similarly significantly affects him or her.

The reasoning underneath it is not anti-technology. It is that AI cannot be held accountable when automation reaches into people's profiling and their rights. Someone has to be answerable, and a model cannot be. The same way I cannot fully trace every reference inside two years of accumulated code, we cannot let automation run unaccountable over a person's life and call the result final. The human stays in the loop to decide what to keep, what to cut, and what was never the machine's call to make in the first place.

### Try It: Cut or Rebuild

Here is the whole dilemma turned into something you can hold in your hands. A codebase is drawn as a tree of nodes, and the one at the top is the unwanted feature — the one my brother said made no sense — with roots reaching deep down into everything beneath it. You remove it the honest way, from the leaves up, cutting only the nodes that nothing else still references, tracing the thing by hand the way you actually have to. The cuts you think are clean rarely are, and you will feel that the moment a new leaf shows up where you thought you were finished. While you work, a DEBT meter climbs the longer the half-cut code sits there exposed. And off to the side sits the tempting REWRITE button, which wipes the whole tangle and hands you a fresh, smaller start — except it never lowers your debt. It adds to it, and the cost compounds a little more each time you reach for it. You win by cutting enough features cleanly before the debt overtakes you.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #f4a261; font-size: clamp(16px, 4vw, 20px);">Cut or Rebuild</h4>
  <canvas id="cutCanvas" width="300" height="400" style="border: 2px solid #f4a261; background: #0a0a0a; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto; cursor: pointer; touch-action: manipulation;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(244, 162, 97, 0.1); border-radius: 5px; border: 1px solid rgba(244, 162, 97, 0.3);">
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #2ecc71; font-size: clamp(11px, 2.8vw, 13px);">• Tap a glowing leaf — a node with nothing below it — to cut it cleanly</p>
    <p style="margin: 5px 0; color: #457b9d; font-size: clamp(11px, 2.8vw, 13px);">• You can't cut a node other code still references; trace from the leaves up</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Clean cuts can reveal hidden references — deep roots grow back</p>
    <p style="margin: 5px 0; color: #e63946; font-size: clamp(11px, 2.8vw, 13px);">• The REWRITE bar (or R) wipes it all, but the debt only compounds</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Clean 6 features before Debt hits 100 — you can't rewrite your way out</p>
  </div>
  <button id="startCutGame" style="padding: 12px 30px; background: #f4a261; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <div style="display: flex; justify-content: space-around; margin-top: 15px; flex-wrap: wrap; gap: 10px;">
    <p id="cutScore" style="font-weight: bold; color: #e9c46a; font-size: clamp(16px, 4vw, 18px); margin: 0;">Cleaned: 0</p>
    <p id="cutDebt" style="font-weight: bold; color: #e9c46a; font-size: clamp(14px, 3.5vw, 16px); margin: 0;">Debt: 0%</p>
  </div>
  <p id="cutVerdict" style="color: #aaa; font-size: clamp(11px, 2.8vw, 13px); margin-top: 5px;"></p>
</div>

<script src="posts/cut-or-rebuild-game.js"></script>

**The point?** The game is a bet that the REWRITE button is lying to you, and it is. Starting over feels like sanity returning, but the debt does not reset — it follows you, and it grows for having been deferred. The only way through is the slow one: trace by hand, accept the references you cannot see all at once, keep cutting anyway. That is the same fork I keep sitting at with my brother's product, and the same one GDPR is pointing at from the other end. You cannot trace every reference, and you cannot rewrite your way out of that, because the rewrite carries its own roots you just cannot see yet. Start over or cut it out — either way, a human is the one who has to decide what to keep, what to cut, and what was never the machine's to keep at all.
