import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function generateQuestions(
  text: string,
  floaterScores: Record<string, { score: number; justification: string }>,
  detectedIssues: { name: string; definition: string }[]
): Promise<{
  defend: string[]
  challenge: string[]
  missing: string[]
}> {
  const weakDimensions = Object.entries(floaterScores)
    .filter(([, v]) => v.score <= 5)
    .map(([k, v]) => `${k} (score ${v.score}): ${v.justification}`)
    .join('\n')

  const issuesList = detectedIssues
    .map(i => `- ${i.name}: ${i.definition}`)
    .join('\n')

  const prompt = `You are a critical thinking coach analyzing an argument from three perspectives.
Generate exactly 3 questions for each of the three categories below.
Each question must be specific to the actual topic and claims in the text. Do not use generic questions. Do not declare the claim true or false.

DEFEND QUESTIONS (3):
These are adversarial questions a hostile critic or opponent would use to attack this argument. Frame them as direct challenges. Make them genuinely threatening to the argument's weak points. The person reading these needs to have answers ready before presenting this argument.
Tone: pointed, specific, prosecutorial against the author's own position.

CHALLENGE QUESTIONS (3):
These are questions to put directly to whoever made this argument.
Each question should target a specific structural weakness, hidden assumption, or unsupported leap. Sequenced by leverage — the most damaging question first.
Tone: interrogation tools, not conversation starters.

MISSING QUESTIONS (3):
These are not about what is wrong with the argument — they are about what the argument never thought to address. Surface the blind spots, absent perspectives, excluded variables, and unasked questions that sit entirely outside the argument's current frame.
Do NOT ask "have you considered X" style questions.
Instead ask questions that reveal what was never in the frame at all.
Examples of the right register:
- "This argument operates entirely within [assumption] — what would the analysis look like from outside that assumption?"
- "The argument never addresses [absent party/variable] — is that exclusion deliberate or a blind spot?"
- "What would someone who has lived through [relevant experience] see in this argument that the author cannot see from their current position?"
Tone: genuinely curious, not accusatory — these questions expand the frame rather than attack the argument.

TEXT:
"""
${text.slice(0, 4000)}
"""

FLOATER WEAKNESSES:
${weakDimensions || 'None identified as weak.'}

DETECTED ISSUES:
${issuesList || 'None detected.'}

Return ONLY this exact JSON structure, nothing else. No markdown. No preamble:
{
  "defend": ["question 1", "question 2", "question 3"],
  "challenge": ["question 1", "question 2", "question 3"],
  "missing": ["question 1", "question 2", "question 3"]
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return {
      defend: parsed.defend || [],
      challenge: parsed.challenge || [],
      missing: parsed.missing || []
    }
  } catch {
    return {
      defend: ['What evidence would cause you to abandon this position?'],
      challenge: ['What specific data supports this claim?'],
      missing: ['What perspective is entirely absent from this argument?']
    }
  }
}
