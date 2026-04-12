import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export type Domain =
  | 'theological'
  | 'philosophical'
  | 'political'
  | 'personal'
  | 'business'
  | 'empirical'
  | 'cultural'
  | 'general'

export interface DomainResult {
  domain: Domain
  confidence: 'high' | 'medium' | 'low'
}

export async function detectDomain(text: string): Promise<DomainResult> {
  const prompt = `You are classifying the PRIMARY ARGUMENT being made in a text — not the vocabulary or topics mentioned.

Ask yourself: what is this text fundamentally trying to argue or establish?

Categories:
- empirical: arguing a scientific, medical, or data-driven claim
- philosophical: arguing a position in ethics, metaphysics, or epistemology
- theological: arguing about the nature of God, scripture interpretation, religious doctrine, or divine revelation. NOTE: a text that MENTIONS religion or religious history as evidence for a cultural argument is NOT theological.
- political: arguing for or against a policy, law, or political position
- cultural: arguing about social systems, cultural patterns, media, identity, power structures, or how society works. Essays about patriarchy, masculinity, kindness, dominance culture, media trends, or social norms belong here.
- business: arguing about strategy, markets, or organizational decisions
- personal: primarily sharing personal experience or reflection without a structural argument
- general: mixed or does not fit any category

CRITICAL RULES:
- Classify by the ARGUMENT being made, not by words present in the text
- A cultural essay that mentions religion, history, or etymology to support a social argument is CULTURAL, not theological
- A political essay that cites statistics is POLITICAL, not empirical
- When in doubt between cultural and political, ask: is it arguing for a specific policy (political) or describing how society works (cultural)?

Text:
"""
${text.slice(0, 1000)}
"""

Reply with ONLY this JSON, nothing else:
{"domain": "CATEGORY", "confidence": "high|medium|low"}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 60,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    const validDomains: Domain[] = [
      'theological', 'philosophical', 'political', 'personal',
      'business', 'empirical', 'cultural', 'general'
    ]
    const domain = validDomains.includes(parsed.domain) ? parsed.domain as Domain : 'general'
    const confidence = ['high', 'medium', 'low'].includes(parsed.confidence)
      ? parsed.confidence as 'high' | 'medium' | 'low'
      : 'medium'

    return { domain, confidence }
  } catch {
    return { domain: 'general', confidence: 'low' }
  }
}
