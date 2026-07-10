# Nobody Can Tell You Why

I have been solving programming challenges since 2022. At the beginning I had my doubts about it — lots of them. But I decided to give it a try while I was working on the e-commerce side of BMW, the company that designs and builds cars. A company that big, and one that had outsourced aggressively abroad, ends up with tools that are almost all custom-made. The only reason I got into the project at all was Vue — a framework I had embraced back in 2016 and have loved since. The project was very large, and most of it had to pass through Storybook prototyping before QA would look at it. Strange times for QA, when I think about it now. Cars need a showcase, so I also spent my days with polyfills — the tools that teach a browser context and custom behavior it does not natively have. And somewhere above my head it had been decided, among other decisions, that this same platform would carry the whole workflow. I remember that not because it was right or wrong, but because it was a decision humans took.

## A Human Looked at Every Line

Even though I was a JavaScript developer, the challenges made my head spin — and the difficulty was not even the hard part. At the end of every challenge sat a human reviewer who would look at the code and propose changes. The reviewer's whole world was the quality of the code: a local bias, a local explanation. You knew exactly why your solution was not good enough, because a person told you why, line by line. Consider how different that is from what we do now, in the agentic era, where the focus has drifted from the quality of the code to the quality of the outcome.

I would later come to miss that, which surprised me, because at the time it felt like childlike plays of power — who gets to say what clean means, whose style survives the review. The power play now is much larger, and strangely, the technical side matters less inside it. Accuracy is not where you compete anymore. You cannot out-define an ML system: it will tell you, flatly, that a property is idle at one hundred percent because nothing in the site ever calls it, and it will be right. What you cannot get back is the other part — the challenges you fought through are long gone, and what remains is deciding, and the human oversight that defines a process. The same way somebody decided that Storybook would be our QA gate back then, somebody decided that Claude Console would sit inside the workflow now. These are major shifts. And they are decisions that humans take.

## The Loan Nobody Can Explain

For a while now I have been working my way toward ISO/IEC 42001 — the certification standard for AI management systems — and stacking courses that could carry my knowledge into this field. While studying I have also been reading books around AI, and one of them is *Ethical Machines* by Reid Blackman. It is academic, and in the context of a business model you cannot exactly add a book as a requirement — but it is a good read for exactly this kind of writing.

In chapter three, on explicability, he describes a situation that has stayed with me. A person applies for a loan. The loan is rejected. Not only rejected — there is no one who can explain why. Not the loan officer, even if he wanted to, even if he might be legally obliged to hand over an assessment. You get nothing as an explanation, because the system now in place is the result of many layered choices: someone studied the patterns of users who might default, someone chose a model, someone decided what data would validate it, someone picked the metrics to watch while it runs. Every one of those choices had an owner. The rejection has none.

## Accuracy Does Not Owe You an Explanation

The thing I remember most from the book is the relation between accuracy and explanation in today's ML. Machine learning has this uncanny ability to catch patterns that would take us — if we were lucky — enormous effort to see. That creates a gap, because we tend to focus on understanding and explaining things through easy patterns, and ML does exactly the opposite. The more accurate it gets, the further its reasons drift from anything we could retell to another person.

I catch that gap in my own work. I sometimes find myself trying to understand the specific context of what Claude proposes to me, and I have difficulty — while knowing full well that the job description of a software developer now changes with a click of a mouse. *How many tokens did you put into the development of this?* Decisions are expected to be swift, on point, accurate, and respectful of the infrastructure that already exists. Even technical debt has changed its address: it has shifted from idle properties to memory. We cannot afford to be so casual anymore about properties that stay idle, about files nobody remembers the purpose of. The machine will find them all. It just will not explain us to ourselves along the way.

## Running the Company Like a Bet

All of this brings back the human oversight — and the pressure sitting on top of it. We are under enormous pressure to deliver, because if we deliver now, we can be big. And that carries the risk of running a company like a big bet. Some people are fine with that. Some people are not comfortable with it at all.

We are a product of our time. I am a millennial, but I sometimes think I might as well be Gen-Z, given my asserted approach to risk. CEOs now make big shifts because the condition of their future rests on a promise: that this might be the only window in which they can make enough to live a decent life. I am not sure I do not believe that myself. I am still a millennial with a daughter I love very much, but among all the doubts we face, I do trust that the time now is to push forward as much as you can. The future is not exactly bright — but at least there is hope that something is at the end of the tunnel.

### Try It: Explain the Machine

Here is the loan office from chapter three, turned into something you can hold in your hands — except this time you are not the applicant. You are the loan officer, the one who is supposed to have an answer. The black box has already decided every application; your only way to hand the applicant a why is to have seen the pattern yourself. Before the stamp lands, you make the call: will it approve, or will it reject? Three features are labeled and honest — income, history, debt — and for a while you can genuinely learn the rule, the easy pattern we humans build. But there is a fourth row on every application, the pattern only the model sees, and it fires on a quarter of the cases. When you match the box, the applicant leaves knowing why. When it surprises you, they leave with nothing, and the gap grows. And twice per game the model retrains overnight — someone clicked the mouse — the accuracy stays fine, and the pattern you spent ten applicants learning quietly dies. Give fifteen whys before the gap hits six. You can get good at this game. You cannot get perfect, and the ceiling is the whole point.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #f4a261; font-size: clamp(16px, 4vw, 20px);">Explain the Machine</h4>
  <canvas id="whyCanvas" width="300" height="400" style="border: 2px solid #f4a261; background: #0a0a0a; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto; cursor: pointer; touch-action: manipulation;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(244, 162, 97, 0.1); border-radius: 5px; border: 1px solid rgba(244, 162, 97, 0.3);">
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #2ecc71; font-size: clamp(11px, 2.8vw, 13px);">• Each applicant shows three labeled features — and one pattern only the model sees</p>
    <p style="margin: 5px 0; color: #f4a261; font-size: clamp(11px, 2.8vw, 13px);">• Before the box stamps, call its verdict: REJECT (R) or APPROVE (A)</p>
    <p style="margin: 5px 0; color: #457b9d; font-size: clamp(11px, 2.8vw, 13px);">• Match the box and you have a why to give — get surprised and the gap grows</p>
    <p style="margin: 5px 0; color: #e63946; font-size: clamp(11px, 2.8vw, 13px);">• Decisions must be swift — hesitate and the applicant leaves with nothing</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Give 15 whys before the gap hits 6 — and beware: the model retrains overnight</p>
  </div>
  <button id="startWhyGame" style="padding: 12px 30px; background: #f4a261; color: #000; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <div style="display: flex; justify-content: space-around; margin-top: 15px; flex-wrap: wrap; gap: 10px;">
    <p id="whyScore" style="font-weight: bold; color: #e9c46a; font-size: clamp(16px, 4vw, 18px); margin: 0;">Whys: 0/15</p>
    <p id="whyGap" style="font-weight: bold; color: #e9c46a; font-size: clamp(14px, 3.5vw, 16px); margin: 0;">Gap: 0/6</p>
  </div>
  <p id="whyVerdict" style="color: #aaa; font-size: clamp(11px, 2.8vw, 13px); margin-top: 5px;"></p>
</div>

<script src="posts/explain-the-machine-game.js"></script>

**The point?** The game is rigged the same way the chapter is. The labeled features are real, the rule is genuinely learnable, and for a stretch you feel yourself getting good — that is the easy pattern we humans build, the local explanation I used to get from a reviewer line by line. Then the hidden feature fires, or someone retrains the model with a click, and your why collapses while the box's accuracy does not move at all. That is the gap between accuracy and explanation: the machine wins the first one outright, and the second one it cannot even enter. You cannot out-predict it, the same way you cannot out-define it — but the applicant across the desk is not asking the box, they are asking you. Storybook then, Claude Console now; the tools keep changing, the shifts keep getting bigger, the whys keep getting scarcer. The one thing that has not moved is who owes the explanation. Somebody at the desk still has to be able to say why — and that somebody was never going to be the box.
