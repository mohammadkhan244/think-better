import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function generateAgency(
  text: string,
  floaterScores: Record<string, { score: number; justification: string }>,
  detectedIssues: { name: string; type: string; definition: string }[]
): Promise<{ framing: string; bullets: string[] }> {

  const lowestDimensions = Object.entries(floaterScores)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 3)
    .map(([key, val]) => `${key} (score ${val.score}): ${val.justification}`)
    .join('\n')

  const detectedList = detectedIssues
    .map(i => `- ${i.name} (${i.type}): ${i.definition}`)
    .join('\n')

  const prompt = `You are a critical thinking analyst.
Identify the 3 most important things this argument is actually resting on.
Only address what the detectors actually found — do not invent issues.
Do not give generic writing advice.
Each bullet names a specific load-bearing assumption or structural weakness
and what it means for the argument's credibility.

TEXT:
"""
${text.slice(0, 2500)}
"""

LOWEST FLOATER DIMENSIONS:
${lowestDimensions}

DETECTED PATTERNS:
${detectedList || 'None detected.'}

Return ONLY this exact JSON, nothing else:
{
  "framing": "One sentence: what this argument is fundamentally resting on.",
  "bullets": [
    "First load-bearing assumption or structural weakness and why it matters.",
    "Second load-bearing assumption or structural weakness and why it matters.",
    "Third load-bearing assumption or structural weakness and why it matters."
  ]
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
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
