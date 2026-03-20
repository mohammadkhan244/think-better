import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function generateAgency(
  text: string,
  floaterScores: Record<string, { score: number; justification: string }>,
  detectedIssues: { name: string; type: string; definition: string }[],
  mode: 'defend' | 'challenge' | 'audit' = 'audit'
): Promise<{ framing: string; bullets: string[] }> {

  const lowestDimensions = Object.entries(floaterScores)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 3)
    .map(([key, val]) => `${key} (score ${val.score}): ${val.justification}`)
    .join('\n')

  const detectedList = detectedIssues
    .map(i => `- ${i.name} (${i.type}): ${i.definition}`)
    .join('\n')

  const modeInstructions = {
    defend: `You are helping someone STRENGTHEN and DEFEND this argument before they publish or present it.
Your job: give them 3 specific, actionable patches — not general writing advice.
Each bullet must address something the detectors actually found.
Framing sentence tone: "Before you put this argument out, address these three things."
Bullets are concrete tasks: "Cite a specific study for the claim that...", "Address the alternative explanation that...", "Reframe the either/or as a spectrum by..."`,

    challenge: `You are giving someone a TACTICAL SEQUENCE for challenging this argument in conversation or writing.
Your job: tell them where to press first, second, third — in order of leverage.
Each bullet is a move, not a question. Specific to what was actually detected.
Framing sentence tone: "Here is where this argument is most vulnerable, and in what order to press it."
Bullets are tactical moves: "Open on the false cause — ask them to isolate the variable before accepting the correlation", "Then press the authority appeal — get them to name the study specifically", "Finally expose the false dichotomy — name the third option they excluded."`,

    audit: `You are helping someone sit with genuine uncertainty in their own thinking.
Your job: surface 3 things worth actually examining — not rhetorical, not threatening, genuinely open.
Each bullet should feel like an honest invitation, not an accusation.
Framing sentence tone: "Here is what this argument is actually resting on."
Bullets name the real stakes: "This argument assumes X is the only cause — that assumption does most of the work here", "The certainty in this claim outpaces the evidence cited — worth examining why that felt necessary", "The alternative explanation you didn't address is the one most likely to come back."`
  }

  const prompt = `${modeInstructions[mode]}

STRICT RULES:
- Only address what the detectors actually found. If a bias or fallacy was not detected, do not mention it.
- Do not give generic writing or thinking advice.
- Do not repeat the questions already asked.
- Each bullet must be specific to the actual content of the text.
- Maximum 3 bullets.
- The framing sentence is ONE line — not a paragraph.

TEXT:
"""
${text.slice(0, 4000)}
"""

LOWEST FLOATER DIMENSIONS:
${lowestDimensions}

DETECTED PATTERNS:
${detectedList || 'None detected.'}

Return ONLY a valid JSON object in this exact format, nothing else:
{
  "framing": "One sentence that sets up the three bullets.",
  "bullets": [
    "First specific action/insight.",
    "Second specific action/insight.",
    "Third specific action/insight."
  ]
}
No markdown. No preamble. Valid JSON only.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return {
      framing: parsed.framing || '',
      bullets: parsed.bullets || []
    }
  } catch {
    return {
      framing: 'Here is what this argument is resting on.',
      bullets: [
        'The weakest link in this argument is the evidence dimension — the core claims are asserted without sourcing.',
        'At least one alternative explanation is not addressed.',
        'The conclusion is stated with more certainty than the supporting points justify.'
      ]
    }
  }
}
