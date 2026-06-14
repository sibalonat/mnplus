# Remember Long Enough, Forget Fast Enough

Working in a compliance space, I feel very lucky. I get to deal with the boring stuff — the parts most people hate, the parts that are hard to understand and harder to sit with. My job, more often than not, is to take those parts and make them more circular, more modular, more forgiving of the short attention span we now assume everyone is carrying around. Since I started leaning on LLMs for coding and research, I'd say my productivity has gone up something like twentyfold. I can focus on the small things — the details that usually get avoided, the ones that in the past would have been left until "a better time," or until a customer finally asked for the change. Now there is no better time. You run into something, and you fix it. It's that fast.

There are days, though, when I catch myself thinking the reason we *don't* fix certain things on the website isn't technical at all. It's pressure — the quiet pressure to take the human out of the loop, to let the system run a little further on its own. I notice it, and I don't always like what I notice.

## The Night Fable 5 Arrived

It was a Wednesday last week, around 1 AM, when Anthropic released Fable 5. I was still working. Two things came with the release. The first: the Max 5x plan would cover usage up to a point — I think it was the 22nd — and after that it moved to extra credit, and it would burn through tokens about twice as fast. The second was the feeling of being one of the first to actually taste the product. Three prompts ate 35% of my weekly tier, and 100% of a single session, in under an hour and three quarters. It was meant to be faster, and it was — fast enough that I assume an older model would have spent the whole night on the same work.

The next day I read that the model now had its own graph, and on it Fable 5 at medium effort looked more capable than 4.8, and maybe more cost-effective too. So I switched. It worked beautifully for a few days. Then it was gone — Claude Fable 5 was pulled from use by foreign nationals, whether they lived inside the US or outside it. One morning the thing I'd built a rhythm around simply wasn't there anymore. A limitation I hadn't chosen, arriving without warning.

## A Documentary About Forgetting

While I was turning this post over in my head, I decided to spend some time on memory — not software memory, the human kind. There's a strange pair of gifts here: the gift of remembering very well, and the gift of forgetting like a fish. It was a Deutsche Welle documentary that got me started.

A small preface: I'm someone who struggles to hold large contexts for very long. I lose the thread. And I've always been a little fascinated by people who don't — who can carry an entire structure in their head for days. I've had this quiet assumption that when an LLM goes looking for something, it searches differently each time, the way I do. Every time I'm asked to prepare a QA presentation, I find myself focusing on different things — never quite the same path twice.

The documentary followed a few people: a theater actor who has to memorize whole plays, a neurobiologist, and a handful of others. The thread running through it was that remembering and forgetting aren't the opposites you'd assume. The actor's entire craft is holding a text long enough to perform it — and then, just as crucially, letting it go fast enough to make room for the next play. Strengthen the memory so it lasts long enough; train the forgetting so it clears fast enough. The two approaches pull against each other, and you need both at once.

## Eighty Percent Is a Decision, Not a Failure

Imagine you're building a feature, and you set out to make it 100% complete. A month in, you realize that through automation it can really only reach about 80%. The missing 20% is the part that came from the original idea — the kind of depth we're taught to chase in academic writing, where you're rewarded for going as far down as the subject allows. But most real contexts aren't academic. They're short-spanned and resource-limited, and they ask for something else entirely.

That's the trap with "AI" as we use it now: it lives inside limited resources, always. Claude is built in a country that is enormously good at commerce, and at the same time bound to a hard condition — the data centers have to go up about as fast as Elon Musk can build them, which sets the ceiling on how many tokens any of us actually get to spend. So I can't help thinking the AI we lean on is a kind of functional trap. But it's only fair to add: it's a functional trap for the next generation, not for us — the people who were writing software before the LLM showed up. We still remember the shape of the problem underneath the answer. That memory *is* the 20%.

## The Loop Still Needs a Human

The longer I work this way, the more one thing holds true: the LLM genuinely helps with development, but you cannot assume it makes sense to let it run a loop on its own. Human oversight still matters — not because the machine needs us to babysit it, but because it's humans who decide on compliance, and humans who write the laws. The model can hold a great deal in context and recall it on command. It cannot decide what is *allowed*.

That's the part I keep coming back to. The model is the better memory. We're the better forgetting — the ones who know what to let go of, what's still our responsibility, and what was never the machine's to keep.

### Try It: Make Room

Here's the post as something you hold in your hands. Facts arrive one at a time, each a little symbol. You decide on each one: **HOLD** it, or **LET GO**. The catch is that your memory has only four slots, and whatever you hold slowly fades on its own — forgetting, whether you like it or not. Every few seconds a **RECALL** fires and asks you for one symbol; if you're still holding it, you score and the slot clears, because the memory did its job and made room for the next thing. If you hold a full memory and a new fact arrives, it **overflows** the oldest one. So you can't keep everything, and you can't keep nothing. The runs that win are the ones where you let go on purpose — early, while it still feels like you're giving something up.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #f4a261; font-size: clamp(16px, 4vw, 20px);">Make Room</h4>
  <canvas id="recallCanvas" width="300" height="400" style="border: 2px solid #f4a261; background: #0a0a0a; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto; cursor: pointer; touch-action: manipulation;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(244, 162, 97, 0.1); border-radius: 5px; border: 1px solid rgba(244, 162, 97, 0.3);">
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #2ecc71; font-size: clamp(11px, 2.8vw, 13px);">• → / D holds the incoming symbol (tap the right side on mobile)</p>
    <p style="margin: 5px 0; color: #e63946; font-size: clamp(11px, 2.8vw, 13px);">• ← / A lets it go (tap the left side on mobile)</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• A RECALL asks for one symbol — hold it to score and free the slot</p>
    <p style="margin: 5px 0; color: #457b9d; font-size: clamp(11px, 2.8vw, 13px);">• Only 4 slots, and held memories fade on their own</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Recall 15 before Integrity hits 0 — you can't keep everything</p>
  </div>
  <button id="startRecallGame" style="padding: 12px 30px; background: #f4a261; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <div style="display: flex; justify-content: space-around; margin-top: 15px; flex-wrap: wrap; gap: 10px;">
    <p id="recallScore" style="font-weight: bold; color: #e9c46a; font-size: clamp(16px, 4vw, 18px); margin: 0;">Recalled: 0</p>
    <p id="recallLoad" style="font-weight: bold; color: #e9c46a; font-size: clamp(14px, 3.5vw, 16px); margin: 0;">Load: 0%</p>
  </div>
  <p id="recallVerdict" style="color: #aaa; font-size: clamp(11px, 2.8vw, 13px); margin-top: 5px;"></p>
</div>

<script src="posts/remember-forget-game.js"></script>

**The point?** The game looks like it rewards holding, but it really rewards letting go. Hold everything and the overflow eats the memory you needed; hold nothing and the recall finds an empty shelf. The only way through is to keep a few things long enough to be useful, and forget the rest fast enough to stay open for what comes next. That's the same balance the actor trains, the same one I fail at when I try to make a feature 100% complete, and the same reason the loop still needs a human at the end of it. The model remembers. We decide what's worth keeping — and, just as important, what to put down so there's room for the next thing.
