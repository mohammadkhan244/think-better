import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic()

// ── CURATED LIBRARY (Option B — for common fallacies/biases) ──

const CURATED_SCENARIOS: Record<string, {
  scenario: string
  prompt: string
  reveal: string
  insight: string
}[]> = {
  'Survivorship Bias': [
    {
      scenario: 'A hedge fund manager points out that every investor in his network who bought Bitcoin in 2017 made money. He concludes Bitcoin is a reliable wealth-building asset.',
      prompt: 'What might this reasoning be leaving out?',
      reveal: 'This is Survivorship Bias. The investors who lost money on Bitcoin in 2017 are not in his network — or are not talking about it. The sample is self-selected by outcome, so the losses are invisible.',
      insight: 'You will see this pattern constantly in investing, hiring, and startup advice. Visible winners shape the story. Invisible losers don\'t.'
    },
    {
      scenario: 'A business school professor studied 50 successful CEOs and found they all worked 80-hour weeks. She concludes that working 80-hour weeks is a key driver of executive success.',
      prompt: 'What population is missing from this analysis?',
      reveal: 'The study only examined successful CEOs — it never looked at the far larger population of people who worked 80-hour weeks and did not become successful executives. The sample is defined by the outcome being studied.',
      insight: 'When someone studies only winners to find the formula for winning, the failures that followed the same formula are always invisible.'
    }
  ],
  'Hasty Generalization': [
    {
      scenario: 'A manager interviews three candidates from a particular university and finds them impressive. She decides to only recruit from that university going forward.',
      prompt: 'What assumption is this reasoning making about the sample?',
      reveal: 'Three candidates are not a representative sample of an entire university\'s graduates. The conclusion — only recruit from here — requires evidence about the population, not just three encounters.',
      insight: 'Small samples feel conclusive because the cases are vivid and recent. The pattern appears constantly in hiring, product decisions, and policy-making.'
    }
  ],
  'False Dichotomy': [
    {
      scenario: 'A startup advisor tells a founder: you are either building for growth or building for profit. You cannot do both at this stage.',
      prompt: 'What is this framing assuming about the available options?',
      reveal: 'This presents two options as if they are the only ones. Many companies have found paths that involve measured growth while maintaining profitability. The binary erases those possibilities without arguing against them.',
      insight: 'Binary framings are often used to create urgency or force a choice. The missing question is always: what else exists between these two poles?'
    }
  ],
  'Sunk Cost Fallacy': [
    {
      scenario: 'A product team has spent 18 months building a feature. User testing shows it does not solve the problem. The team lead argues they should ship it anyway because of how much work has gone into it.',
      prompt: 'What is this reasoning using to justify the decision?',
      reveal: 'The past investment — time and effort already spent — is being used to justify a future decision. But the work already done cannot be recovered regardless of what happens next. The only relevant question is whether shipping produces better outcomes than not shipping.',
      insight: 'Sunk cost reasoning is especially common in projects, relationships, and strategies where significant investment has already been made. The past cost feels like a reason. It isn\'t.'
    }
  ],
  'Appeal to Authority': [
    {
      scenario: 'A nutrition article argues that a particular diet is healthy because a famous cardiologist endorses it, without citing any studies or explaining the mechanism.',
      prompt: 'What is missing between the authority and the conclusion?',
      reveal: 'The authority\'s endorsement substitutes for the actual evidence. The mechanism — why this diet produces the claimed outcome — is never explained. An expert\'s opinion is a starting point for investigation, not a conclusion.',
      insight: 'Authority appeals are most common when the mechanism is complex or contested. The question to always ask: what is the actual evidence behind the expert\'s position?'
    }
  ],
  'Slippery Slope': [
    {
      scenario: 'A city council member argues against a proposed bike lane by saying it will lead to the removal of all parking, then all cars, then the destruction of local businesses.',
      prompt: 'What is missing between the first step and the final outcome?',
      reveal: 'Each step in the chain is asserted without evidence that it leads to the next. A slippery slope argument requires showing why each transition is likely — not just possible. Without that, the chain is speculation presented as inevitability.',
      insight: 'Slippery slope arguments are common in policy debates. The tell is a chain of consequences with no mechanism connecting them.'
    }
  ],
  'Fundamental Attribution Error': [
    {
      scenario: 'A manager notices that a remote employee is slower to respond to messages than office employees. She concludes the employee is less motivated and less committed to the job.',
      prompt: 'What situational factors is this explanation skipping over?',
      reveal: 'The explanation attributes the behavior to character — motivation, commitment — without examining situational factors like time zone differences, home environment, communication tools, or unclear expectations. The same behavior could have entirely structural causes.',
      insight: 'We attribute others\' behavior to who they are. We attribute our own behavior to our circumstances. This asymmetry appears constantly in management, hiring, and conflict.'
    }
  ],
  'Confirmation Bias': [
    {
      scenario: 'An investor who believes electric vehicles will dominate the market reads every positive EV news story carefully and skips past articles about EV adoption challenges and infrastructure problems.',
      prompt: 'What pattern is shaping which information gets attention?',
      reveal: 'The existing belief is filtering what gets read and retained. Confirming evidence gets processed deeply. Contradicting evidence gets skipped. The belief feels stronger over time not because the evidence is stronger but because the sample is self-selected.',
      insight: 'Confirmation bias is hardest to spot in yourself because the filtered information never feels absent — it just never arrives.'
    }
  ]
}

// ── LLM-GENERATED SCENARIOS (Option A — for beliefs/incentives) ──

export async function generateBeliefTraining(
  text: string,
  coreAssumptions: string[],
  domain: string
): Promise<{
  scenario: string
  prompt: string
  reveal: string
  insight: string
}> {
  const targetAssumption = coreAssumptions[0] ||
    'a hidden assumption is being made'

  const llmPrompt = `You are a reasoning coach teaching someone to spot hidden assumptions in arguments.

The user just analyzed an argument in the domain of: ${domain}

The argument contained this hidden assumption:
"${targetAssumption}"

Create a SHORT training exercise that teaches the skill of spotting hidden assumptions — using a DIFFERENT real-world example from a DIFFERENT domain than the argument they analyzed.

The example must be:
- 2-3 sentences maximum
- From everyday life, business, or public discourse
- Something that contains the same TYPE of hidden assumption
- Not about the same topic as the argument they analyzed

Return ONLY this exact JSON, nothing else:
{
  "scenario": "2-3 sentence real-world example containing a hidden assumption",
  "prompt": "One question asking what assumption is being made (curious, not accusatory)",
  "reveal": "2-3 sentences explaining what the hidden assumption is and why it matters",
  "insight": "1 sentence generalizing where this type of assumption commonly appears"
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      temperature: 0.7,
      messages: [{ role: 'user', content: llmPrompt }]
    })
    const raw = response.content[0].type === 'text'
      ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return {
      scenario: 'A company decides to expand into a new market because their product works well in their current market.',
      prompt: 'What assumption is being made about the new market?',
      reveal: 'The argument assumes that what works in one context will work in another. But different markets have different customers, competition, regulations, and cultural norms. The success in one place does not transfer automatically.',
      insight: 'Context transfer assumptions appear constantly in business expansion, policy adoption, and applying personal experience to other people\'s situations.'
    }
  }
}

export async function generateIncentiveTraining(
  text: string,
  incentiveSystem: string,
  domain: string
): Promise<{
  scenario: string
  prompt: string
  reveal: string
  insight: string
}> {
  const llmPrompt = `You are a reasoning coach teaching someone to spot incentive structures underneath arguments.

The user just analyzed an argument in the domain of: ${domain}

The argument had this incentive structure:
"${incentiveSystem}"

Create a SHORT training exercise teaching the skill of spotting who benefits from an argument — using a DIFFERENT real-world example from a DIFFERENT domain.

The example must be:
- 2-3 sentences maximum
- Contain a clear but non-obvious incentive structure
- Not be about the same topic as the argument they analyzed
- Not be cartoonishly corrupt — the incentive should be subtle

Return ONLY this exact JSON, nothing else:
{
  "scenario": "2-3 sentence example where someone is making an argument that serves their interests",
  "prompt": "One question asking who benefits if this argument is accepted as true",
  "reveal": "2-3 sentences explaining the incentive structure and why it matters for evaluating the argument",
  "insight": "1 sentence on where this type of incentive pattern commonly appears"
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      temperature: 0.7,
      messages: [{ role: 'user', content: llmPrompt }]
    })
    const raw = response.content[0].type === 'text'
      ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return {
      scenario: 'A real estate agent tells a buyer that now is always a good time to buy property because prices always go up long term.',
      prompt: 'Who benefits if the buyer accepts this argument as true?',
      reveal: 'The agent earns a commission only when a sale occurs. Their financial incentive is to complete transactions, not to optimize the buyer\'s timing. The argument may be true, but the person making it benefits regardless of whether it is.',
      insight: 'Incentive structures are most invisible when the advice-giver appears to be a neutral expert. The question to always ask: what happens to them if I follow this advice?'
    }
  }
}

export function getCuratedScenario(patternName: string): {
  scenario: string
  prompt: string
  reveal: string
  insight: string
} | null {
  const scenarios = CURATED_SCENARIOS[patternName]
  if (!scenarios || scenarios.length === 0) return null
  return scenarios[Math.floor(Math.random() * scenarios.length)]
}
