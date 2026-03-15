import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function generateQuestions(
  text: string,
  floaterScores: Record<string, { score: number; justification: string }>,
  detectedIssues: { name: string; definition: string }[]
): Promise<string[]> {
  const weakDimensions = Object.entries(floaterScores)
    .filter(([, v]) => v.score <= 5)
    .map(([k, v]) => `${k} (score ${v.score}): ${v.justification}`)
    .join('\n')

  const issuesList = detectedIssues
    .map(i => `- ${i.name}: ${i.definition}`)
    .join('\n')

  const prompt = `You are a Socratic reasoning coach. A piece of text has been analyzed for reasoning quality.

Your job: Generate 5–8 follow-up questions that would expose the specific gaps in this reasoning.

RULES:
- Questions must be specific to the actual topic and claims in the text — NOT generic
- Do not ask "have you considered the evidence?" — ask about the specific evidence or claim
- Each question should target a real weakness identified below
- Questions should help the reader think more clearly, not embarrass the author
- Do not declare the claim true or false

TEXT (first 1500 words):
"""
${text.slice(0, 6000)}
"""

FLOATER WEAKNESSES:
${weakDimensions || 'None identified as weak.'}

DETECTED REASONING ISSUES:
${issuesList || 'None detected.'}

Return ONLY a valid JSON array of question strings. No markdown, no preamble, no explanation.
Example format: ["Question one?", "Question two?"]`

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
