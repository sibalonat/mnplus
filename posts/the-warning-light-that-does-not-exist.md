# The Warning Light That Does Not Exist

The first half of the holiday was the north, and the drive there was the one I wrote about two weeks ago — the family in the car, the audiobook about guardrails playing, the four hours on paper that turned into six. At some point that morning we left the highway and turned onto a road that is not very wide, the one that runs by Kukës and Pukë toward Malësia e Madhe, before it climbs into Tropojë and drops you at Bajram Curri.

There were places on that road that were extremely beautiful. I still think the Alps in Albania are among the most fascinating things this country has, and I say that as someone who had never really crossed them by car. You are there, driving, with your wife and your daughter in the back, nobody listening to anything anymore, and what you see is mostly nature — and now and then a house, usually abandoned. You get nostalgic for a time you think you know the when and the where of, without ever having been in it.

## The Car That Kept Passing Us

While I was driving we noticed, as always happens, a car that wanted to overtake us. I did not put up much resistance. I let them pass. They ended up travelling with us, more or less, all the way up to the peaks of Tropojë. Two Polish travellers who really liked taking pictures. We passed one another many times — they would stop for a photo, we would go by, we would stop for a view, they would go by — and every time we would wave.

Until the last time. We had pulled over, they went by again, and this time they were not waving to greet us. They were waving to tell me something. The tailpipe of my car — the *marmita*, as we call it here, the part at the very back where the smoke comes out — had detached.

It can happen. It was the first time for me, and I had faith that things would not turn bad. They did not. I drove very slowly to Bajram Curri, and for twenty-five euros a very good mechanic there, a man called Ismet, fixed it. What stays with me is that I did not know there was a problem. The Polish driver struggled with his English, but he had understood two things very clearly: that I had an issue, and that I could probably keep driving, just slowly. That was the whole diagnosis, and it was correct.

## The Light That Was Never Going to Come On

While I was turning this over in my head I caught myself assuming something. The car has some years on it now — it was produced in 2015 — but most of what is inside it is electronic, and most of those electronics exist to flag things when they break. So my first instinct was: why did it not tell me?

And then the more honest thought. It cannot, and I suppose it should not, flag everything. There is no sensor on the tailpipe. There was never going to be a light for this. I would have appreciated one, but the car was not wrong for not having it. What told me was a stranger in another car who had been looking at the underside of mine for the last thirty kilometres.

That is the part I kept coming back to for the rest of the drive: the thing that flags a problem is not always the thing that was built to flag problems.

## Trusting People Whose Reasoning You Cannot Follow

Which led me to the other argument, the one I am less comfortable with. Although I would like to, I do not spend any time understanding anything about cars. Only mechanics understand them. There are many people — former collaborators of mine, co-workers I have now — who I am sure know at least the general shape of fixing something on their own car. I do not. I rely, too much, on people whose train of thought I am not a hundred percent sure of, and whose way of fixing my car I could not check even if I watched them do it.

So I rely on suppliers. People who sell you not only the tailpipe, or the car, but the service to fix it when you need it. And with suppliers, trust is the whole product. Ismet was a supplier I had never met, in a town I had never been to, and I handed him the car because there was nothing else to hand it to.

Then the question that follows from that, and it is not really about cars. What happens when you do not have access to these suppliers? What should happen, for example, when I do not have access to Claude?

It is not that I cannot write the typed functions in Django by hand. I can. But there is a strong pressure now to use the AI tools, because once the tools exist nothing else is justified anymore. A feature that could take half a day cannot take three to five days — not because it is impossible to do by hand, but because everybody around you knows it could have taken half a day. The estimate has moved. The supplier has become the baseline.

## Idiocracy, Over Lunch

There was a discussion with my co-workers this week about *Idiocracy*, the film. The story, if you have not seen it, is of a society where the thoughtful people spend so long deciding whether to have children that they die without any, and at the other end of society, where things are more instinctive, people simply keep having them — until the world is overpopulated with people who cannot cultivate anything worth passing to the next generation, and any meaningful effort to do so has ended.

I am not a fan of the scenario, and not only for the obvious reasons. It is a story about deciding too slowly. And I know, from my own week, that deciding fast is useful, and that having tools is crucial to deciding fast. But I also know what I actually spend most of that fast-decision time on. I am validating whether something is over-engineered or over-scoped. That is the job now. You ask for one thing, and the AI — partly because of its own guardrails, which quietly narrow the scope of what you were thinking about — hands you back something that has grown. Something that was solid in the infrastructure comes back over-complicated, and the only way to deal with it is to remove features, with the hope that you keep a backlog good enough to remind you when one of them has to resurface.

So the film has it half right. Deciding too slowly is a way to disappear. But deciding fast with a tool that re-scopes your decision on the way back is not the opposite of that. It is a different road to the same place.

## Machine Hand, Human Oversight, Human in the Loop

And then the question I have been circling for a few posts now. Where do you place a decision like this: in the machine's hand, under human oversight, or with a human in the loop?

The car is the honest version of the answer. The machine's hand covers what it was built to sense, and it does that better than I ever will — I would not want to read the oil pressure myself. The human in the loop was Ismet, with the car on the lift, doing the thing I could not check. And human oversight was two people in a different car who had no authority over mine, no sensor, no manual, and just enough English to say: *there is a problem, keep driving, slowly*.

The risk is in what happens when we cannot do that anymore. Not when the light fails to come on — it was never going to — but when nobody is left outside the system to notice what it does not sense. If I can no longer write the function by hand, then I cannot tell whether what came back is a fix or a new, more expensive kind of detached part. And if everyone I work with is in the same position, then the supplier's reasoning is the only reasoning there is, and trust stops being a choice. It becomes the only option on the menu, which is exactly the situation I wrote about the last time.

Human oversight is not a warning light. It is the willingness to keep looking under the car — or to wave at someone else's — when nothing on the dashboard has asked you to.

We made it, by the way, and the tailpipe stayed on all the way back down to Vlora. I still do not know what Ismet did. I know it cost twenty-five euros, and I know who told me to stop.

### Try It: The Light That Never Comes On

Here is that road, turned into something you can hold in your hands. You are driving the last hundred and twenty kilometres to Bajram Curri, with a **daylight** bar that does not wait for you. Things break as you go. Some of them light up on the dashboard — **ENGINE**, **OIL**, **BATTERY**, **TEMP** — and some of those lights are sensor errors that will clear on their own if you leave them alone. Other things break with no light at all: a tailpipe, a wheel bolt, a brake line. There is no sensor for them and there never will be. The only way you find out is that the car begins to rattle, faintly, and a second car keeps overtaking you. Most of the time it waves to say hello. Once in a while it waves to say something else. **Pull over** and a mechanic checks the car: every real fault is fixed for twenty-five euros, but every stop costs you daylight whether there was anything to find or not. Or **dismiss** a light and keep driving, trusting the road over the machine — if the light was real, it will come back and insist. Every real fault you carry does damage you cannot see until the car begins to smoke. Reach the town before dark without being stranded, and then look at what you paid — and how many of the things that broke ever had a light for them.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #f4a261; font-size: clamp(16px, 4vw, 20px);">The Light That Never Comes On</h4>
  <canvas id="warningCanvas" width="300" height="400" style="border: 2px solid #f4a261; background: #0a0a0a; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto; cursor: pointer; touch-action: manipulation;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(244, 162, 97, 0.1); border-radius: 5px; border: 1px solid rgba(244, 162, 97, 0.3);">
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• SPACE / S, or tap the road, to pull over and have the car checked</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• D / X, or tap a lit dashboard light, to dismiss it and keep driving</p>
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(11px, 2.8vw, 13px);">• A dashboard light is a real fault — or a sensor error that clears on its own</p>
    <p style="margin: 5px 0; color: #457b9d; font-size: clamp(11px, 2.8vw, 13px);">• Some faults have no light at all: watch for the rattle, and for the car that waves</p>
    <p style="margin: 5px 0; color: #e63946; font-size: clamp(11px, 2.8vw, 13px);">• Every real fault you carry does hidden damage — smoke means it is late</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Every stop fixes what is real for 25€ each, and costs daylight either way — reach 120 km before dark</p>
  </div>
  <button id="startWarningGame" style="padding: 12px 30px; background: #f4a261; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <div style="display: flex; justify-content: space-around; margin-top: 15px; flex-wrap: wrap; gap: 10px;">
    <p id="warningScore" style="font-weight: bold; color: #e9c46a; font-size: clamp(16px, 4vw, 18px); margin: 0;">Distance: 0/120 km</p>
    <p id="warningPaid" style="font-weight: bold; color: #e9c46a; font-size: clamp(14px, 3.5vw, 16px); margin: 0;">Paid: 0€</p>
  </div>
  <p id="warningVerdict" style="color: #aaa; font-size: clamp(11px, 2.8vw, 13px); margin-top: 5px;"></p>
</div>

<script src="posts/warning-light-game.js"></script>

**The point?** The first runs go the way my drive went. You learn the dashboard fast, because the dashboard is built to be learned: a light comes on, you stop or you dismiss it, and either way you were told. What you do not learn fast is the wave. The other car passes you a dozen times saying hello, and by the time it says something else you have stopped looking at it, because nothing on the screen has asked you to. Then the car starts to smoke over a part that never had a light, and every euro you paid for the lights that did come on turns out to have been the cheap part of the trip. That is what I could not stop thinking about between Tropojë and Bajram Curri: the machine flags what it was built to flag, the supplier fixes what you cannot check, and the only thing standing outside both of them was a stranger who kept looking at the underside of my car when he had no reason to. Keep being that stranger for someone. And keep enough of the mechanic in yourself to know, when the light does come on, whether the fix that came back is a fix.
