import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function generateQuestions(
  text: string,
  floaterScores: Record<string, { score: number; justification: string }>,
  detectedIssues: { name: string; definition: string }[],
  mode: 'defend' | 'challenge' | 'audit' = 'audit'
): Promise<string[]> {
  const weakDimensions = Object.entries(floaterScores)
    .filter(([, v]) => v.score <= 5)
    .map(([k, v]) => `${k} (score ${v.score}): ${v.justification}`)
    .join('\n')

  const issuesList = detectedIssues
    .map(i => `- ${i.name}: ${i.definition}`)
    .join('\n')

  const modeInstructions = {
    defend: `You are a sharp adversarial critic preparing someone to DEFEND this argument. Generate 5–8 questions that a skeptic, opponent, or hostile interviewer would use to attack this argument. Frame each question as if the critic is asking it directly. The person reading these needs to have their answers ready BEFORE they present this argument. Make the questions pointed, specific, and genuinely threatening to the argument's weak points.`,
    challenge: `You are a strategic advisor helping someone CHALLENGE and dismantle this argument. Generate 5–8 questions the reader should PUT TO the person making this argument. Each question should target a specific structural weakness, hidden assumption, or unsupported leap. Frame questions as tools — precision instruments for exposing where the argument cannot hold under pressure.`,
    audit: `You are a Socratic reasoning coach helping someone AUDIT their own thinking. Generate 5–8 reflective questions the author should ask themselves. These questions don't attack — they illuminate. Each one should reveal a hidden assumption, an untested prerequisite, or a place where the reasoning depends on something the author may not have examined. Frame questions as honest self-inquiry, not criticism.`
  }

  const prompt = `${modeInstructions[mode]}

RULES:
- Questions must be specific to the actual topic and claims in the text — NOT generic
- Each question should target a real weakness from the detected issues or FLOATER gaps below
- Do not declare the claim true or false
- 5–8 questions maximum

TEXT:
"""
${text.slice(0, 6000)}
"""

FLOATER WEAKNESSES:
${weakDimensions || 'None identified as weak.'}

DETECTED ISSUES:
${issuesList || 'None detected.'}

Return ONLY a valid JSON array of question strings. No markdown, no preamble.
Example: ["Question one?", "Question two?"]`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }]
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '[]'

  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return ['What evidence would cause you to reconsider this conclusion?']
  }
}
