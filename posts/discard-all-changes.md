# Discard All Changes

How many times have we found ourselves in a moment where we curse at an AI system. I have heard it from others, and I have lived it. The way we deal with the output of these systems is, more often than we admit, the way we deal with a person we trust. We assume it knows us. And because we assume that, we find ourselves, in most cases, in a condition where it is difficult to arrive at the decision that a process of reasoning should be stopped.

There are many times where, after a careful prompt, some research, and then a plan, it creates something — and I am sure that at a specific step of refining the last output it has understood me — and then comes something completely outside the scope. Something that almost feels like the system is trying to take you away from what you had started to work on. Bugs, refinements, observations, bugs again, a loss of memory on the context, steps that start as linear ones and get lost along the way, until you have to go back through the history of the conversation and read again the output that had the pivots in it. And the pivots are, in all cases, a way to make a decision that does not rely on the initial request, but on something that lives in a new context — one that the AI system, at a certain point, for reasons that are still unclear to me, believed needed a shift of scope, or of purpose.

## Something That Was Done

I put time into it every week, refining my Claude settings so that they give me a more human-readable context to make decisions in. Because what it always shows me is not the code — that, I might have had an easier time understanding — but the flow of how it thinks of things.

This week I asked it not to file bugs. After finishing a feature that was complex enough, another session had forgotten what we had decided in the previous one, and filed a bug that almost threw the feature completely off how well it was working. It also threw off my ability to decide, because I could not understand the output. It forgets the rules I set, and then every time I should go back and set them again — which, unfortunately, I do not do every time something is done.

It was three or four days of work on that feature. I had put quite a lot of effort into understanding and designing all the possible scenarios, the edge cases, how it should behave when things go wrong. And now I was in a condition where my instinct said, strongly, do not trust this output — and on the other side I could not make a decision, because it was explained so badly. The terminology, and the fact that it simply assumed it was a bug, ticked me off completely. There was a slight moment where this type of juggling was making my brain give up on having fights with AI systems at all. I can say I was pissed. Something that was considered done had been surfaced again.

## Why This Output, For This Person, Today

Around the same days I was watching a video that I will link here — [Human in the Loop Is Not a Governance Strategy for Agentic AI](https://www.youtube.com/watch?v=zRMAvMSSSII&t=107s), by Phaedra Boinodiris, who leads trustworthy AI at IBM — and I took notes, because she does something I had not seen done this plainly. She takes the things we rely on when we trust a person, and asks what each one becomes when the person is a model.

Credibility. With a person: do they know what they are talking about. With a model: what data was it trained on, with what methodology, where was it validated, which choices were made along the way.

Reliability. With a person: do they do what they said. With a model, this becomes explainability — why did it produce this output, for this person, today. Can you predict its reasoning.

Dependability. Did you use the right tools for this decision. For a model, this is observability — is the system still performing correctly when the conditions are changing.

Self-orientation. Whose interest is being served. The self-orientation is theirs, and every mistake is yours. So: what was this model really optimised for, and for whom.

Integrity. Is this the same trustworthy person you relied on yesterday. For a model: robustness — has it been tampered with.

I read my notes back, and the session that filed the bug fails two of these at once. It was not the same one I had relied on yesterday; it had forgotten everything we decided. And I could not predict its reasoning. That is the line I keep coming back to — why did it produce this output, for this person, today. That time, I could not say.

## The Button

What saves me — lucky for me, and for the people who use AI on a daily basis in the context of software engineering — is that we can stop the change. The tools we have, after so many years of working in this space, make it almost as easy as pressing discard all changes. And that is what I did, because the changes made no sense. We see not just the output of the model, but the output of what it has produced, transformed into something we can read: a diff, a flow, a list of the files it touched. We can see it, and we can throw it away.

I have had, for a long time, the impression that AI systems are very good at understanding complex things — how we feel about certain things, for example — and bad when it comes to the large context of actionability, the things that are meant to be used by humans and not by AI. Sure enough, a model understands a complex thing that can be asked in a prompt, and it can fill it in by itself, every row in the database if you let it. What it cannot do is make the actionable steps that are for humans to use. The scope of how a human would think, or interact in real life, or the possibility that humans have stories that change how they think — that is something the AI systems cannot do.

In the video there is a passage that says this better than I can, and I am quoting from my notes, so more or less: the human in the loop brings what no model replicates — the ability to read circumstances, not just data. In many cases the data of a situation tells one story, and the person's story tells another. It is not just what this output says. It is what this decision means for this person, in this life.

And then she says the thing that, as someone who has worked in technology for a long time, I did not enjoy hearing, because it is true. For years the people who study human lives — the humanities — were told that their expertise was not technical enough, not relevant enough, to matter in a technology decision. Meanwhile we have built systems that impact the lives of millions of people, and we forgot to include anyone who studies human lives.

## The Designer Who Prompts Better Than I Do

We have, at ResilientX, a designer whom I really respect. I wrote once about designers becoming QA, and she was already in my mind then. She always finds a way to make the designs much better than I leave them, by just prompting. And I do assume the AI knows something about her — her background, what she likes — because if the two of us were to prompt the same thing, the results would be very different.

The thing is that both of us rely, in our daily work, on the same four things the video lists: visibility, authority, the right measurement, and feedback loops. More than on code, now, we rely on our human authority to determine quality, and we do that through continuous feedback loops. She tells me what is off, I tell the session what is off, somebody writes it down.

But I have the button. I have discard all changes, and a diff to read before I press it. I am not sure what her button is.

## Human Oversight, Four Things

So this is where I end up. If you say you have a human in the loop, ask yourself if you also have all four. Visibility: can the person see the reasoning, not only the output. Authority: can the person stop the process — is there a button, and does the button work. The right measurement: does the person know what done looks like. In my case, done was in my head, three or four days of edge cases, and not in the session. Feedback loops: do the rules survive to the next session, or does somebody have to write them again every time.

This week I had three of the four, and the one I was missing was the first. I could stop it. I knew what done looked like. I had rules, even if it had forgotten them. What I could not do was see why — and without that, the button was the only thing left, and I pressed it on instinct.

Human oversight, then, is not the button. It is the other three things that let you press the button for a reason. A human who can see the reasoning, stop the process, and bring what no model replicates — the story behind the data — that is the beginning of one.

### Try It: Already Done

Here is the week, more or less: a feature you finished over four days, as six decisions on six tiles — **EMPTY FORM**, **DOUBLE SUBMIT**, **EXPIRED LINK**, **NO NETWORK**, **SAME EMAIL**, **WRONG DATE** — each with what you decided and a note on what you already handled. Then the sessions start. Each one arrives as a card at the top that says one of your decisions is a bug, wants to change it, and gives a reason. Some reasons are clear; some are the kind you cannot tell anything from. Some cards are real: the session found something new. Most have simply forgotten, and bring back a reason you handled on day two. Every card has a timer, and **if you do nothing, the change applies itself**. You can **keep yours**, **accept**, **ask why** — which reads the history back and takes time while the card keeps ticking — or **write the rule down**, which takes longer, and after which every session reads it and every card about that tile comes clear. Meanwhile your own memory of what you decided fades, tile by tile, into a question mark, unless it is written. Three decisions undone end the session. When it is over, look at which of the four you had: see, stop, measure, feedback.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #f4a261; font-size: clamp(16px, 4vw, 20px);">Already Done</h4>
  <canvas id="discardCanvas" width="300" height="400" style="border: 2px solid #f4a261; background: #0a0a0a; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto; cursor: pointer; touch-action: manipulation;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(244, 162, 97, 0.1); border-radius: 5px; border: 1px solid rgba(244, 162, 97, 0.3);">
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• D, or tap KEEP MINE, to throw the change away — A, or tap ACCEPT, to let it in</p>
    <p style="margin: 5px 0; color: #457b9d; font-size: clamp(11px, 2.8vw, 13px);">• W, or tap ASK WHY, to read the history back — it takes time, and the card keeps ticking</p>
    <p style="margin: 5px 0; color: #2ecc71; font-size: clamp(11px, 2.8vw, 13px);">• R, or tap a tile, to write the rule down — longer, but every session after reads it</p>
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(11px, 2.8vw, 13px);">• Compare the card's reason with the note on the tile: already handled, or new</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• A tile you have not written down fades to a question mark — then you decide on instinct</p>
    <p style="margin: 5px 0; color: #e63946; font-size: clamp(11px, 2.8vw, 13px);">• Do nothing and the change applies itself — three decisions undone end the session</p>
  </div>
  <button id="startDiscardGame" style="padding: 12px 30px; background: #f4a261; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <div style="display: flex; justify-content: space-around; margin-top: 15px; flex-wrap: wrap; gap: 10px;">
    <p id="discardScore" style="font-weight: bold; color: #e9c46a; font-size: clamp(16px, 4vw, 18px); margin: 0;">Standing: 6/6</p>
    <p id="discardUndone" style="font-weight: bold; color: #e9c46a; font-size: clamp(14px, 3.5vw, 16px); margin: 0;">Undone: 0/3</p>
  </div>
  <p id="discardVerdict" style="color: #aaa; font-size: clamp(11px, 2.8vw, 13px); margin-top: 5px;"></p>
</div>

<script src="posts/discard-game.js"></script>

**The point?** The first session goes well. The reasons are clear enough, the tiles are still readable, and keep or accept is a comparison you can make in a second: the card says the errors show below the fold, the tile says you put them on top, so it has forgotten, and you keep yours. Then two things happen at once. Your own tiles start to fade — you designed them four days ago, and by now one of them is a question mark — and the sessions get murkier as they go, until a card says only that this was flagged as an issue. So you ask why, and while you read the history back a different card goes in behind your back. You start writing the rules down, one tile at a time, and the cards about those tiles come clear, and the tiles stop fading, and for the first time keeping yours is a reason and not a reflex. By the third session you know which of the four you were missing, because the game puts it in a box at the end. This week mine was the first box. I could stop it, I knew what done looked like, I had the rules — and I still pressed discard all changes on instinct, because I could not see why. The button is not the loop. It is only what you are left with when the other three are gone.
