import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic()

export interface DefaultNarrativeResult {
  narrative: string
  loadBearing: string
  whoBenefits: string
  ifItBreaksUpside: string
  ifItBreaksDownside: string
}

export async function extractDefaultNarrative(
  text: string,
  domain: string
): Promise<DefaultNarrativeResult> {

  const prompt = `You are identifying the single most invisible cultural or institutional narrative operating underneath an argument.

NOT the individual's beliefs — those are extracted elsewhere.
NOT what the argument says — what the argument assumes is just reality.

This is the myth the author would never think to question — not because they're wrong, but because it reads as background reality. It predates this argument. It will outlast it. The author is swimming in it without knowing water exists.

DOMAIN: ${domain}

ARGUMENT:
"""
${text.slice(0, 2500)}
"""

Find the ONE deepest cultural narrative. It should:
- Feel like something no one in this argument's world would think to name
- Be older and larger than the argument itself
- Read as common sense to people inside it
- Sound surprising or even obvious-once-named to people outside it

Examples of the register you're looking for:
- "Productivity is a moral virtue, not a design choice"
- "Exceptional outcomes require exceptional individuals"
- "Growth is the natural state of healthy systems"
- "The future is something that happens to us, not something we collectively author"
- "Expertise is the right to be trusted without explaining yourself"

Return ONLY this exact JSON. No markdown. No preamble:
{
  "narrative": "One sentence naming the cultural myth — sharp, surprising, true",
  "loadBearing": "One sentence: what would have to be false for this narrative to collapse entirely",
  "whoBenefits": "One sentence: which institutional, cultural, or economic actors benefit most from this narrative staying invisible and unexamined",
  "ifItBreaksUpside": "One sentence: what becomes newly possible if this narrative is named and questioned",
  "ifItBreaksDownside": "One sentence: what gets genuinely destabilized or lost if this narrative collapses"
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text'
      ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!parsed.narrative) throw new Error('Empty narrative returned')

    return {
      narrative: parsed.narrative,
      loadBearing: parsed.loadBearing,
      whoBenefits: parsed.whoBenefits,
      ifItBreaksUpside: parsed.ifItBreaksUpside,
      ifItBreaksDownside: parsed.ifItBreaksDownside
    }
  } catch {
    return {
      narrative: 'The current conditions are natural rather than constructed.',
      loadBearing: 'This narrative collapses if current arrangements can be shown to have authors, dates, and beneficiaries.',
      whoBenefits: 'Those whose position depends on present arrangements feeling inevitable rather than chosen.',
      ifItBreaksUpside: 'The conditions become negotiable — open to redesign rather than adaptation.',
      ifItBreaksDownside: 'The stability that comes from shared assumptions about reality gets disrupted.'
    }
  }
}
