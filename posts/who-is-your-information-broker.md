# Who Is Your Information Broker

By now, if you've been reading these posts, it's already clear that I use AI for my daily tasks. It has done at least two things for me — it has positioned me as someone who pays more attention to details and has a more critical mindset. But at the same time, it's strange, because more and more I find myself struggling to understand whether things will stay like this in the years to come. Whether I'll still be able to look at a block of code and remember what it means. Whether I'll still love coding and making sure it respects the structure I want, rather than always building non-stop without thinking.

There are moments where I understand that AI is here to stay, and any other way of seeing it would be considered old-fashioned. But I can't help believing that there's something we never assumed a programmer would want to talk about — and yet here I am, doing exactly that: the data brokerage of AIs.

## Two AIs, Both Wrong

It happened less than two weeks ago. At work, we use AI for code reviewing, code writing, code quality checks, code planning, and more. It's our ability to give proper instructions through files and levels of criticality that enforces these rules. Most times it doesn't follow them, and we have to enforce through prompting — but this is also where human reviews come into place and are so important, because it's difficult not to trust AI. I can't say it's the fault of only the media or public discussion, or maybe that sometimes this attention to detail fails. Can't say for sure.

We have an AI provider that reviews our code and makes sure it's compliant. In most cases, because I want to make sure the code is strictly typed with as little overhead as possible when it comes to memory usage, I check whether or not the suggestions are actually valid. So I took some of the suggestions and I was verifying them — checking with the AI coder, but also reviewing the database to find the gaps a block of code might have.

There are cases where one AI understands the other AI. But it might be that both are wrong.

Because in further inspection of the code and the database, I noticed that a proposal first made by the AI reviewer — and then confirmed by the AI coder — were both wrong. The reviewer suggested a change that looked reasonable on the surface. The coder implemented it without questioning. And both missed the actual data structure underneath.

## The Co-Worker Filter

It was only through a conversation with a fellow co-worker — someone I discuss code quality with probably on a daily basis — that the issue became obvious. His stance was simple: when it's AI code reviewers, he avoids trusting them. That's not ignorance. That's someone who knows the infrastructure of data very well and has seen enough false positives to know when a machine is guessing.

There are cases where anyone getting onboarded to a project might doubt statements like that. You think, surely the AI must know — it analyzed the entire codebase, it flagged the issue, it even explained the reasoning. But knowing the codebase and understanding the codebase are not the same thing.

## The Market Research Test

Whenever I tend to doubt things like that, I always remember something that happens when you ask an AI to do market research. Your first assumption is that this chatbot will actually know the ins and outs of the platform you're researching. That it has gone through the documentation, the dashboards, the data models, the user flows. That it understands.

But it doesn't. And the way you find out is to ask the obvious: who is your information broker?

How do you know that this dashboard works like this? You're making an assumption. How do you know this supply chain in your code has this property that gets used on the frontend instead of another? Where does your confidence come from?

The answer, if you push hard enough, is always some variation of: I'm inferring based on patterns I've seen in training data. Which is another way of saying — I don't actually know. I'm making an educated guess based on things that looked similar.

## The Confusion That Keeps Me Learning

It is that confusion — the gap between what AI appears to know and what it actually knows — that has changed the way I think about learning. Maybe I'm not learning how to write code anymore, not in the traditional sense of memorizing syntax or patterns. But I'm actively learning where AI does things wrong. Where it fills gaps with confidence instead of knowledge. Where it presents an inference as a fact.

And I think that's a skill that doesn't get talked about enough. We talk about prompt engineering, about AI-assisted development, about productivity gains. But we don't talk enough about the discipline of asking: where did this come from? What's the source? Why should I believe this output over what I can verify myself?

Because when two AIs agree on something wrong, and the only thing that catches it is a human who knows the data — that tells you something. It tells you that the most important skill in an AI-assisted workflow isn't knowing how to use AI. It's knowing when not to trust it.

And the way you get there is by always asking: who is your information broker?

### Try It: The Information Broker

Here's the question from the post turned into a game. A classic falldown — platforms are AI statements rising toward the ceiling, and a ball that gravity pulls down. True statements are solid ground: land on them, ride them up, then navigate to a gap before you hit the ceiling. False statements crack on contact — because claims without foundation can't hold anything up. Use arrow keys to move, fall through the gaps, and see how long you survive. Can you tell which information has solid ground?

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center; padding: min(20px, 5vw); background: #0d0d0d; border-radius: 10px; box-sizing: border-box;">
  <h4 style="margin-bottom: 15px; color: #457b9d; font-size: clamp(16px, 4vw, 20px);">The Information Broker</h4>
  <canvas id="brokerGame" width="300" height="400" style="border: 2px solid #457b9d; background: #0a0a0a; display: block; margin: 0 auto; max-width: 100%; height: auto; width: auto;"></canvas>
  <div style="margin-top: 15px; padding: 10px; background: rgba(69, 123, 157, 0.1); border-radius: 5px; border: 1px solid rgba(69, 123, 157, 0.3);">
    <p style="margin: 5px 0; color: #457b9d; font-size: clamp(12px, 3vw, 14px); font-weight: bold;">How to Play:</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• ← → arrow keys (or tap left/right) to move the ball</p>
    <p style="margin: 5px 0; color: #ccc; font-size: clamp(11px, 2.8vw, 13px);">• Land on solid platforms (no text) to survive</p>
    <p style="margin: 5px 0; color: #e63946; font-size: clamp(11px, 2.8vw, 13px);">• Platforms with false AI statements crack on contact (+8 pts)</p>
    <p style="margin: 5px 0; color: #e63946; font-size: clamp(11px, 2.8vw, 13px);">• Don't hit the ceiling or the floor!</p>
  </div>
  <button id="startBrokerGame" style="padding: 12px 30px; background: #457b9d; color: #fff; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px); min-height: 44px; touch-action: manipulation;">Start Game</button>
  <p id="brokerScore" style="font-weight: bold; color: #ffd166; font-size: clamp(16px, 4vw, 18px); margin-top: 10px;">Score: 0</p>
</div>

<script src="posts/broker-game.js"></script>

**The point?** Every platform looks the same until you land on it. The false ones crack because there's nothing underneath — just like AI claims that sound authoritative but have no real source behind them. In the game and in real life, the skill isn't avoiding all platforms. It's knowing which ground to trust.
