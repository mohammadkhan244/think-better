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

  const isMulti = hasSpeakers && speakers.length > 1

  const speakerInstruction = isMulti
    ? `The text contains multiple speakers: ${speakers.join(', ')}.
       Extract the SHARED belief system of the conversation (items 1-3),
       then for item 4 identify each speaker's DISTINCT core beliefs and
       where their belief systems actually diverge beneath the stated topic.`
    : `Analyze the single argument or speaker present.`

  const speakerComparisonTemplate = isMulti
    ? `[
    { "speaker": "${speakers[0]}", "coreBeliefs": ["Belief one.", "Belief two.", "Belief three."] },
    { "speaker": "${speakers[1]}", "coreBeliefs": ["Belief one.", "Belief two.", "Belief three."] }
  ]`
    : `null`

  const prompt = `You are extracting the operating belief system
underneath a piece of text — not what is said, but what must be
believed for what is said to make sense.

${speakerInstruction}

WHAT TO EXTRACT:

1. CORE ASSUMPTIONS (3-5 items)
What does this conversation treat as permanently, obviously true about
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

4. SPEAKER COMPARISON (required — populate for every speaker listed)
For each speaker, list exactly 3 core beliefs that are SPECIFIC to
that speaker — beliefs the other speaker does not clearly share.
These must be implicit, never explicitly stated. Focus on where
their worldviews actually differ beneath the surface topic.

STRICT RULES:
- Do not restate what the argument says — extract what it assumes
- Core assumptions must be implicit, never explicitly stated
- Be specific to this text — no generic observations
- One sentence maximum per item
- Do not moralize or take sides

TEXT:
"""
${text.slice(0, 10000)}
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
  "speakerComparison": ${speakerComparisonTemplate}
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: hasSpeakers && speakers.length > 1 ? 1200 : 700,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text'
      ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!parsed.coreAssumptions || parsed.coreAssumptions.length === 0) {
      throw new Error('Empty belief system returned')
    }

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
