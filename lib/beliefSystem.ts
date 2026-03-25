import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic()

export interface BeliefSystemResult {
  coreAssumptions: string[]
  loadBearingBeliefs: string[]
  incentiveSystem: string
  speakerComparison: { speaker: string; coreBeliefs: string[] }[] | null
}

export async function extractBeliefSystem(
  text: string,
  hasSpeakers: boolean,
  speakers: string[]
): Promise<BeliefSystemResult> {

  const speakerInstruction = hasSpeakers && speakers.length > 1
    ? `The text contains multiple speakers: ${speakers.join(', ')}.
       For each speaker, identify their distinct underlying beliefs.
       Focus on where their belief systems diverge — that is usually
       where the real disagreement lives, beneath the stated topic.`
    : `Analyze the single argument or speaker present.`

  const prompt = `You are extracting the operating belief system
underneath a piece of text — not what is said, but what must be
believed for what is said to make sense.

${speakerInstruction}

WHAT TO EXTRACT:

1. CORE ASSUMPTIONS (3-5 items)
What does this argument treat as permanently, obviously true about
how the world works? These are never stated — they are the water
the fish does not notice. Examples: "expertise equals authority,"
"markets self-correct," "human nature is fixed."

2. LOAD-BEARING BELIEFS (2-3 items)
Which specific beliefs, if false, would cause this entire argument
to collapse? Not surface claims — the foundational ones underneath.
Frame each as: "This argument collapses if [belief] is false."

3. INCENTIVE SYSTEM (1 sentence)
Who benefits if this argument wins? What does the author gain —
materially, socially, or psychologically — from this position
being accepted as true?

4. SPEAKER COMPARISON (only if multiple speakers)
For each speaker, list 2-3 core beliefs. Then identify where their
belief systems actually diverge — the real disagreement beneath
the stated topic.

STRICT RULES:
- Do not restate what the argument says — extract what it assumes
- Core assumptions must be implicit, never explicitly stated
- Be specific to this text — no generic observations
- One sentence maximum per item
- Do not moralize or take sides

TEXT:
"""
${text.slice(0, 5000)}
"""

Return ONLY this exact JSON, nothing else. No markdown. No preamble:
{
  "coreAssumptions": [
    "Assumption one.",
    "Assumption two.",
    "Assumption three."
  ],
  "loadBearingBeliefs": [
    "This argument collapses if X is false.",
    "This argument collapses if Y is false."
  ],
  "incentiveSystem": "One sentence on who benefits and how.",
  "speakerComparison": null
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text'
      ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return {
      coreAssumptions: parsed.coreAssumptions || [],
      loadBearingBeliefs: parsed.loadBearingBeliefs || [],
      incentiveSystem: parsed.incentiveSystem || '',
      speakerComparison: parsed.speakerComparison || null
    }
  } catch {
    return {
      coreAssumptions: [],
      loadBearingBeliefs: [],
      incentiveSystem: '',
      speakerComparison: null
    }
  }
}
