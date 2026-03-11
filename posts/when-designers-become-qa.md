# When Designers Become QA: The Hidden Cost of AI-Driven Workflows

In the past two years, it has been my assumption that there has been an increase of AI acceptance and a drive to better usage. In the company I'm currently working at, a cyber security company, the CEO has pushed and continuously pushes for better AI integrations. And that integration hasn't escaped the designer either.

I have taken notice that designers, in most cases, were professionals not much impacted by AI directly, or at least that was the assumption—because not many AI tools were introduced to their workflow. But same as developers that have to take a more business approach when building things, designers are more and more found in the QA and compliance context.

It is their job not just to make sure the design is according to their Figma file, but also that everything works according to a predefined user-flow. And that can pose a challenge, considering they have to research competitors, make screenshots of their dashboards, talk to stakeholders, and then prompt the newly added AI in Figma that based on design style components creates a mockup—and continuously steer the AI hallucinations to understand the purpose of the prompt. After often going back and forth with full stack developers such as myself, it is the role of designers to make sure of the QA.

## The Real Problem: A Designer Doing QA

Which is not something that can be considered easy as a field and workflow. Let me give you an example: a form that had multisteps, and one step had a continue button to go to the next step, but it wasn't displaying the errors for that step. The validation was working—you couldn't proceed—but there was no feedback to the user about what was wrong.

And this is where it gets tricky, because for a designer to catch this and know what to do about it, they would need to understand what data is expected to go through the pipeline and what in the same way is expected to come out. These two are not always tackled in the design handoff with software engineers. In most cases they come accidentally to see them fail, and failure to assess these types of issues gets even harder when the AI doesn't always know these rules for the QA either.

## The Memory Problem

The biggest pitfall of it, I think, comes from what is one of the pitfalls of the assumption of developers being replaced by AI—memory, or how much background do you have of what is out there.

I would assume, considering that we come from a technical background, that stakeholders in general rely on having fast results in order to raise funds, to sell, and eventually also make sure to have human-to-human relations that prevent them from selling something that cannot be achieved. For them memory is not an issue because they don't rely on it, because the other part of the chain allows them to make that assessment.

But the issue still remains that for a designer to do QA seems not entirely feasible—can't say fully, because it depends on the discipline one has. But you can't rely only on discipline, you have to rely on automation to make the testing more easy to perform.

I would assume that for a designer doing QA to make the right assessment of the passing or failing of a "contact form" would be to understand what data is expected, what validation rules exist, what error states should appear, how those errors are communicated. And these are things that live in the code, in the backend, in the system architecture—not in Figma.

### Try It: The Designer's Memory Challenge

Here's a simple game that illustrates this memory problem. You'll see design components numbered in order—memorize their positions. Then they shuffle, and you need to click them in the correct sequence. As you progress through 9 levels, the grid grows and the memorization time shrinks, just like real project pressures.

<div class="game-container" style="max-width: min(400px, 90vw); margin: 40px auto; text-align: center;">
  <div id="memoryScore" style="margin-bottom: 15px; font-size: 14px; color: #495057;">
    <strong>Level:</strong> 1/9 | <strong>Lives:</strong> ❤️❤️❤️ | <strong>Score:</strong> 0
  </div>
  <canvas id="memoryCanvas" width="400" height="400" style="border: 2px solid var(--secondary-color); border-radius: 4px; max-width: 100%; height: auto; background: #fff;"></canvas>
  <div id="memoryStatus" style="margin: 15px 0; font-size: 16px; font-weight: bold; color: var(--secondary-color); min-height: 24px;">
    Click 'Start Game' to begin!
  </div>
  <button id="startMemoryBtn" style="padding: 12px 32px; font-size: 16px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
    Start Game
  </button>
</div>

<script src="posts/memory-game.js"></script>

**The point?** If you struggled to remember 12 component positions after 2 seconds, imagine trying to remember dozens of validation rules, error states, and data flows across an entire application without documentation.

## What Can Be Done

It is early to say that AI can do that and remove it from human check, but what can be done is to always when creating a design also give some QA documentation for it to share with development, apart from the design that is becoming more and more the holy grail of selling points nowadays.

Because if the design is what wins the client, what sells the vision, then the design deliverable should also include test cases—explicit things to verify like "Continue button should display error messages below invalid fields" or "Email field should show 'Invalid email format' for malformed addresses." Not just the pretty mockup, but the rules about how it should actually work when things go wrong.

That way designers aren't left trying to reverse-engineer what the validation logic should be, and developers have clear acceptance criteria that can be automated. It's not about making designers into QA engineers, it's about acknowledging that design documentation needs to include testable requirements, and teams need frameworks that allow people to validate implementations systematically without needing to know every detail of the codebase.
