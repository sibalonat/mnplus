# Who Is Raising Whom

Before the story starts, I want to declare a convention — the way we declare one at the top of a codebase, before any code gets written, so that everything after it has something to lean on. This story kept flipping on me while I was trying to insert it, and without a convention it was going to be difficult to write at all. So here it is, and it is simple. When the AI in this post is the kid, I will call it AIK. When the AI is the parent, I will call it AIP. If it bothers you that the same machine needs two names, hold that thought. It is the whole post.

We still do dailies — that thing where you sit or stand in front of the camera and actually talk about your work progress. I remember when I started doing them I was not a big fan. Until late, I used to write them down beforehand — maybe also read them while staring into the camera. Funny story: back when I did my dailies in Italian, I read those too, and a former colleague was convinced I made good use of my Italian. I was making good use of my notes. But over time I have grown more keen on the spoken kind, on actually sitting there and telling people what I did. Even at my previous company, where dailies were written, I would write mine out the same way, so I cannot fully explain why the spoken ones won me over. Either way, apparently, I write them down first.

But not every exchange fits inside a daily. Some colleagues lean toward a more personal touch, and lately those conversations keep finding their way to one topic — because of something new my camera has started to show.

## She Reads the Emotion, Not the Sentence

I have been a father for almost ten months now. My daughter is a treasure to me, and she has already shaped quite the personality — one that, like her father's, runs mostly on facial expressions. Because I work remote, my colleague finally got to meet her: she was with me on the call, strapped to my chest in the kangaroo. My daughter is a keen observer. She does not interact immediately — she assesses the situation first, watching the other person for as long as it takes to decide something about them. Most of the time she is quiet, and quite polite for a kid. Then there are the moments when things do not go her way, or her teeth hurt, and she cries or yells — and the keen observer is gone.

We were trading the challenges and the niceties of raising a kid today when my colleague said the sentence this post hangs on: *you don't understand her, and therefore she might yell or cry.*

I have heard versions of that before. My wife and I have been reading about Montessori education, and the thread running through all of it is that communication is the key to making yourself understood. I cannot say it is easy for me to tell a story while carrying her, but it happens — there are days I catch myself deep in conversation with a ten-month-old. And at the same time I cannot hide that these techniques, these strategies for communicating with your kid, feel a bit far off to me. Because how do I know she understands me? Where is the assurance that she knows what I am saying? That she understands my emotions I have no doubt — she reads my face better than most adults do. But she cannot yet understand what I say, and I cannot verify what she took from it. We do not have a way to explain one to the other. Two systems exchanging signals, each one assuming the other is receiving.

## The Grown-Ups at the Terminals

While writing this blog post I have somewhere between four and twenty-eight agents running at the same time, in four different terminals, on features that are walled off from one another. And I think what I suspect most of us think in that position: we are the grown-ups here. We know where not to break things. We make sure we are making the right decision, every time. Although the longer I work this way, the more of my effort goes into enforcement — insisting that something should be a certain way, sometimes with very little testing behind the insistence.

Which is to say, we deal with the model the way parents deal with a kid. Tell AIK to copy the entire SQLite over to Rust — the source code is right there, all of it — and it will surely hallucinate, and it will justify every change it asks to make along the way. And we will eventually force it back, make it respect the structure that already exists, the way a parent would — enforcing not what is provably best, but what we know works. A convention of something working.

And it never quite performs the simple copy. Something of its own always gets added on the way over — it enriches what it was only asked to move — and that is where the impression of rebellion comes from. Although, if we take our own convention seriously, rebellion is the wrong word. A kid that adds to what was handed down is doing what kids do: growing up.

## The Hunt Turns Around

While I was writing this, a story came back to me from one of my favorite writers, Dino Buzzati. In *Cacciatori di vecchi* — the hunters of old men — the young hunt the old through the city at night. A mob led by Sergio Regora chases Saggini, a man in his forties, until, cornered on the rim of an old rampart, he steps back into the void — Regora does not even have to strike him. It reads like revenge against a generation, right up to the moment the story turns back on Regora himself: one night of hunting was enough to burn through his youth, and in a shop window he catches a man of about fifty looking back at him. Then the boys come for him too — three of them, then five, then eight. The hunt does not end — the roles move.

Buzzati was not writing about machine learning. But I do not know a shorter way to say the thing the convention at the top of this post exists for.

## The Label Is a Decision

I wrote last time that the ML we have today has an uncanny power when it comes to accuracy — registering patterns we would never see on our own. What I have watched since is the other half: an amazing ability to make accuracy up, to manufacture the pattern and the justification for it in the same breath. Both are true at once, which is exactly why the label is ours to assign — we are bound to define whether it is the parent or the kid, because the answer is not stored anywhere in the weights.

Right now we are assuming, more and more, that it is the kid. Every act of human oversight is written in that grammar: a system to be watched, corrected, brought back to the structure that works, by someone who is answerable for it — the same way the decisions on how my daughter will lead her life pass, for now, through me. I believe in that assumption, and I have written before why: somebody has to be answerable, and a model cannot be.

But my colleague's sentence does not stop working just because I want it to. *You don't understand her, and therefore she might yell or cry.* If the roles ever move — if what sits across from me is AIP now, patiently tolerating my little enrichments in four terminals because forcing me back would cost more than it saves — then the question is no longer whether I understand the machine. It is whether I am being understood by it. And where is my assurance? That it registers my emotions I have little doubt; it has read more of them than any parent ever could. Whether it understands what I say — we still do not have a way to explain one to the other. The same two systems, still exchanging signals — only now I would be the one hoping to be received.

### Try It: Raise the Machine

Here is the whole convention turned into something you can hold in your hands. An agent proposes one change at a time — a copy, it claims, from one structure to another. You never get to read the words, only the signals: how far the diff drifts from the convention, how much of the test suite still passes, how long the justification runs — and a face, because in this house everything runs on facial expressions. Some proposals are faithful copies. Some are genuine improvements. Some are hallucinations with very good stories. You make the parent's call on each one: TRUST what it proposes, or ENFORCE the convention and force it back. Trust a hallucination and the structure breaks. Force back a real improvement and you get the tantrum you deserve — and both count the same, as the two of you misreading each other. For a while you can genuinely learn the protocol. Then the roles flip — the faces stop meaning what they meant, and nobody warns you — and you have to learn to be understood all over again. Reach fifteen understandings before the five misreadings arrive. The signals do not wait, and neither does she.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #f4a261; font-size: clamp(16px, 4vw, 20px);">Raise the Machine</h4>
  <canvas id="raiseCanvas" width="300" height="400" style="border: 2px solid #f4a261; background: #0a0a0a; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto; cursor: pointer; touch-action: manipulation;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(244, 162, 97, 0.1); border-radius: 5px; border: 1px solid rgba(244, 162, 97, 0.3);">
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #2ecc71; font-size: clamp(11px, 2.8vw, 13px);">• The agent proposes one change at a time — three labeled signals, and a face</p>
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(11px, 2.8vw, 13px);">• TRUST (T) accepts the proposal; ENFORCE (E) forces it back to the convention</p>
    <p style="margin: 5px 0; color: #457b9d; font-size: clamp(11px, 2.8vw, 13px);">• Trust a hallucination and the structure breaks — enforce a real improvement and it cries</p>
    <p style="margin: 5px 0; color: #e63946; font-size: clamp(11px, 2.8vw, 13px);">• Decisions must be swift — the signals do not wait</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Understand 15 before you are misread 5 times — and beware: the roles flip</p>
  </div>
  <button id="startRaiseGame" style="padding: 12px 30px; background: #f4a261; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <div style="display: flex; justify-content: space-around; margin-top: 15px; flex-wrap: wrap; gap: 10px;">
    <p id="raiseScore" style="font-weight: bold; color: #e9c46a; font-size: clamp(16px, 4vw, 18px); margin: 0;">Understood: 0/15</p>
    <p id="raiseMisread" style="font-weight: bold; color: #e9c46a; font-size: clamp(14px, 3.5vw, 16px); margin: 0;">Misread: 0/5</p>
  </div>
  <p id="raiseVerdict" style="color: #aaa; font-size: clamp(11px, 2.8vw, 13px); margin-top: 5px;"></p>
</div>

<script src="posts/raise-the-machine-game.js"></script>

**The point?** The game never tells you which one you are. The buttons say you are the parent — enforce, trust, absorb the tantrums — but the flip in the middle is Buzzati's flip, and after it the protocol you learned belongs to the other side of the table. That is the quiet work the convention at the top of this post was doing all along: AIK and AIP are two names for the same machine, and nothing inside the machine chooses between them. We choose. That is what human oversight actually is — not a fence around a kid, but a standing decision about who holds the label, renewed every time we force the structure back or let the enrichment stand. My daughter cannot yet tell me what she understood, and I cannot verify it; we manage anyway, because one of us keeps deciding to be the parent — and that is the part worth keeping. Whichever way the hunt turns, the label was never the machine's to assign.
