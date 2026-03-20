import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function generateQuestions(
  text: string,
  floaterScores: Record<string, { score: number; justification: string }>,
  detectedIssues: { name: string; definition: string }[]
): Promise<{
  defend: string[]
  challenge: string[]
  audit: string[]
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
Each question must be specific to the actual topic and claims in the text.
Do not use generic questions. Do not declare the claim true or false.

DEFEND QUESTIONS (3):
These are adversarial questions a hostile critic or opponent would use to attack this argument.
Frame them as direct challenges. Make them genuinely threatening to the argument's weak points.
The person reading these needs to have answers ready before presenting this argument.
Tone: pointed, specific, prosecutorial against the author's own position.

CHALLENGE QUESTIONS (3):
These are questions to put directly to whoever made this argument.
Each question should target a specific structural weakness, hidden assumption, or unsupported leap.
Sequenced by leverage — the most damaging question first.
Tone: interrogation tools, not conversation starters.

AUDIT QUESTIONS (3):
These are uncomfortable honest questions the author should ask themselves.
Not rhetorical. Not attacking. Genuinely open — the kind that reveal what the argument is protecting.
Tone: honest self-inquiry, the questions a trusted advisor would ask privately.

TEXT:
"""
${text.slice(0, 6000)}
"""

FLOATER WEAKNESSES:
${weakDimensions || 'None identified as weak.'}

DETECTED ISSUES:
${issuesList || 'None detected.'}

Return ONLY this exact JSON structure, nothing else:
{
  "defend": ["question 1", "question 2", "question 3"],
  "challenge": ["question 1", "question 2", "question 3"],
  "audit": ["question 1", "question 2", "question 3"]
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return {
      defend: parsed.defend || [],
      challenge: parsed.challenge || [],
      audit: parsed.audit || []
    }
  } catch {
    return {
      defend: ['What evidence would cause you to abandon this position?'],
      challenge: ['What specific data supports this claim?'],
      audit: ['Why does this conclusion feel obvious to me?']
    }
  }
}
