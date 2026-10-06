# Close Enough to Switch It Off

I had decided that this time the post would be about proximity. I am a person who likes to think about metaphysical concepts, about how things have originated, and I like proximity next to difference, because the two have maybe similar parts of understanding. I perceive both as a way to create things. Difference is what makes two things out of one. Proximity is what puts them close enough for something to happen between them.

When I think myself into the role of the developer, I see myself sitting in front of my workstation — maybe not so much writing code by hand, nor sketching structures on a whiteboard, nor on any board as a matter of fact. I am more a person who thinks: is this easy enough to be used. I have never considered myself a great developer. I do not even like to talk about the differences between programming languages. What I am good at is trying new things, to be sure that I push the limits. It is a process of learning, and I enjoy that.

## What Is My Role, Then

But now, with AI, I find myself wondering what the role is that I have. It has been months that I am trying to learn and to certify — CompTIA first, and more recently COBIT, the framework for how an organisation governs its IT — because I see that cyber is becoming, yet again, a major issue.

The thing is, I often think of protecting as a way to build more secure systems. But sometimes, and this seems more relevant, you have to adapt to the old ways of doing things, since those in fact provide a proven way to protect an organisation. And that comes down to one question, especially when you deal with cyber protection in the times of AI: why is something written down as an Excel file easier for some organisations than a full-fledged platform.

It comes down to monitoring.

## A Single Excel File

While I was studying COBIT I came across [a case study from 2016](https://www.isaca.org/resources/news-and-trends/industry-news/2016/implementing-cobit-5-at-entso-e). It is about ENTSO-E, the network of the operators who run the electricity transmission of Europe — forty-two of them at the time, from thirty-five countries. If there is a group of people in Europe who are close to a switch, in the most literal sense, it is the members of this one. They started in 2014 to put their IT under the framework, in a pragmatic way, process by process, and at some point the article describes the dashboard they built to plan and monitor the progress of all of it. The sentence is this:

> The dashboard is completely managed in a single Excel-file.

I should be fair to them. It is not the grid that sits in that file. It is the dashboard of their IT governance — which process is where, which actions are open, who follows up — and the rest of the tools sit on the intranet, some as Excel files and some as lists. But I stopped at that sentence anyway. A single Excel file.

## The Winnable Bet

We have long lived with the assumption that platforms were created to actually do the work for us. So we aim to have fewer people doing the job, because we are convinced — sometimes more than business continuity would tell us is the case — that it is a winnable bet. And for many years, I am sure, through all the platforms that we use, we have aimed for the shortcut. A way to bypass the process, because that cool and shiny feature would bring us more revenue.

But then you see a lot of cases where the approach of IT and cybersecurity to frameworks like ISO 27001, and to the audits that come with them, is done with Excel files. At least the evidence that they provide looks like this. And I cannot hide that, even though it is a great approach to being aware of the risks, it really becomes an issue when we deal with "switching off" a system to protect the infrastructure. Because these approaches rely, at least in millennial minds, on an outdated mindset.

## Wrong and Easy, or Correct and Difficult

I work in the compliance space, especially with the questionnaires that are sent to vendors, to assess whether they are compliant for the organisation when it comes to EU regulation. And I sometimes think about the plain fact of it — that an organisation has many suppliers, and each one of them can be asked to fill in a compliance form. Sure, each organisation could build a different form. But just the assumption that this is so difficult for whoever does not have a strong IT literacy makes managers think: could this not be easier.

I mean, the form works, because of some automation. But then you kind of ask the question — this literacy, for these people, how long does it take them to get used to these tools? It is not easy. And I would assume that, working in the compliance space, you either do it wrong and easy, or correct and really difficult sometimes.

The Excel file, I think, is what people reach for when correct has become too difficult. Everybody already knows how to open it.

## Human in the Loop, Human Validation, Scope Shifting

And this is where proximity comes back. I think working in the compliance space teaches you to make things easier, and that is always relevant. Because even though we are talking more and more about AI monitoring, we are still defining the roles that this monitoring has in everyday work. Is it human in the loop, is it human validation, is it scope shifting.

For the last one, the CompTIA exam guide I study from has an example that stays with me: an alert on one desktop that, once somebody investigates, turns out to be a data breach. The scope has shifted. What you were watching is now bigger than what you were asked to watch.

I have started to read those names as distances: how far the person stands from the thing that is running.

There is a struggle to understand monitoring, as far as I can tell, because the thing is that we should be able to "switch off" the system, or check the threshold of each system, in real time. And sure enough, we are not yet close enough to the experience to truly make decisions that properly impact the flow of protecting, and of making sure that operations continue.

So I go back to that single Excel file, and to the one thing it gets right. It is not good because it is old, and the millennial mind still does not like it. What it gets right is that it keeps the person close. Often the one who writes the cell is the one who knows what is in it, and from "I see it" to "I write it down" there is one click. The platform sees every system at once, and that is real — I would not give it back. But it sees them from far away, a little late, and often the switch sits behind a request, and the request behind an approval.

The file keeps the person close, but it has no switch. The platform has the switch, but it keeps the person far. We need both in the same place.

Human oversight, I think, is a distance before it is a role. It is the number of steps between the person who feels that something is going off and the switch — and whether that person, when they get there, is allowed to pull it.

So we have to start thinking. When we monitor, when we look at the frameworks, at the AI research, when we feel that something is going off — do we have the right tools to measure and to flag the incident, so that someone can pull the switch? And is that someone close enough?

I am back at the workstation, then, with the same question I had as a developer. Is this easy enough to be used. Only now I am asking it about the switch.

### Try It: One Row at a Time

Here is what both in the same place could look like, more or less: a single sheet with a switch on every row. Five systems, one on each row — **MAIL**, **PAYROLL**, **VENDORS**, **BACKUPS**, **THE AGENT** — and you, the green box around one row, the way a cell is selected in a sheet. Every system has a reading that moves, and a reading that passes 100 is an incident. On the row where you stand you see the number live, you see whether it is rising faster or slowing down, and the switch is right there: **one press and it is off**. Every other row gives you only a light — green, amber, red — and the further the row is from you, the older that light is. Four rows away, you are looking at what was true almost four seconds ago. Some readings climb and come back on their own; that is noise, and a system you switch off for noise is a system that is not running. Some climb slowly at first and then faster, and those do not come back. You can **walk** to a row, which takes time, or you can **send a request** to switch it off from where you are, which takes longer, goes one at a time, and is decided on a light you already know is old. Three incidents end the shift. When it is over, look at how far away you were standing.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #f4a261; font-size: clamp(16px, 4vw, 20px);">One Row at a Time</h4>
  <canvas id="switchCanvas" width="300" height="400" style="border: 2px solid #f4a261; background: #0a0a0a; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto; cursor: pointer; touch-action: manipulation;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(244, 162, 97, 0.1); border-radius: 5px; border: 1px solid rgba(244, 162, 97, 0.3);">
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• W / S, or tap a row, to walk to it — you stand on one row at a time</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• SPACE, or tap its switch, to switch off the row you are on — at once</p>
    <p style="margin: 5px 0; color: #457b9d; font-size: clamp(11px, 2.8vw, 13px);">• 1–5, or tap the switch of a far row, to send a request — slow, and one at a time</p>
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(11px, 2.8vw, 13px);">• On your row you read the number: rising faster is real, rising and slowing is noise</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Everywhere else there is only a light, and the further the row, the older the light</p>
    <p style="margin: 5px 0; color: #e63946; font-size: clamp(11px, 2.8vw, 13px);">• A reading that passes 100 is an incident — three end the shift</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• A system you switch off for nothing is a system that is not running</p>
  </div>
  <button id="startSwitchGame" style="padding: 12px 30px; background: #f4a261; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <div style="display: flex; justify-content: space-around; margin-top: 15px; flex-wrap: wrap; gap: 10px;">
    <p id="switchScore" style="font-weight: bold; color: #e9c46a; font-size: clamp(16px, 4vw, 18px); margin: 0;">Output: 0</p>
    <p id="switchIncidents" style="font-weight: bold; color: #e9c46a; font-size: clamp(14px, 3.5vw, 16px); margin: 0;">Incidents: 0/3</p>
  </div>
  <p id="switchVerdict" style="color: #aaa; font-size: clamp(11px, 2.8vw, 13px); margin-top: 5px;"></p>
</div>

<script src="posts/switch-game.js"></script>

**The point?** The first shift goes the way the platform promised. You stand somewhere in the middle, you watch five lights, and for a while five lights are enough. It takes longer to learn how old a light is. An amber one on the far row looks exactly like an amber one next to you, and it is only when you walk over that you find the number already at ninety — or find that it was noise, and that the row you left behind has started climbing. So you send a request instead, because walking means leaving your row, and the request goes through on a system that was fine, or it arrives after the incident and gets counted as late. By the third shift you stop trying to see everything. You pick the rows you will stand near, you accept that the others are older than they look, and you keep the switch for the moments when you can read the number yourself. That is what I took from the sentence about the single Excel file: it is not a better tool than the platform, it is a shorter distance, and it still has no switch. The frameworks, the thresholds, the names we give to the monitoring — human in the loop, human validation, scope shifting — are worth less with every step between the person who notices and the switch. Count the steps. And if you are the one building the thing, ask the question I ask from my workstation: is it easy enough to be used, by the person standing next to it, at the moment it matters.
