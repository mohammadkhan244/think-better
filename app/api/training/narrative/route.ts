import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { narrative, domain } = await req.json()

  const prompt = `You are a reasoning coach teaching someone to spot default narratives — the cultural stories that feel like background reality rather than constructed assumptions.

The user's argument contained this default narrative:
"${narrative}"

Create a SHORT training exercise using a COMPLETELY DIFFERENT real-world example from a DIFFERENT domain that contains the same TYPE of invisible cultural narrative.

The example must:
- Be 2-3 sentences
- Contain a narrative that reads as "just how things are"
- Be from a domain unrelated to: ${domain}
- Feel immediately recognizable once named

Return ONLY this exact JSON, nothing else:
{
  "scenario": "2-3 sentence example containing an invisible default narrative",
  "prompt": "One question asking what the argument assumes is simply true about the world",
  "reveal": "2-3 sentences naming the default narrative and why it stays invisible",
  "insight": "1 sentence on where this narrative shows up across other domains"
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 350,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text'
      ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json({ scenario: parsed })
  } catch {
    return NextResponse.json({
      scenario: {
        scenario: 'A hospital administrator proposes cutting nursing staff to reduce costs, arguing that efficiency gains from new software will compensate for the reduction in headcount.',
        prompt: 'What does this argument assume about what hospitals are fundamentally for?',
        reveal: 'The argument operates inside a default narrative that hospitals are organizations to be optimized for financial efficiency. The possibility that care quality is the primary output — and that it cannot be substituted by software — is never raised because it reads as sentiment, not strategy.',
        insight: 'The narrative that institutions are primarily financial entities to be optimized appears across healthcare, education, and public services — usually invisible to those inside the optimization frame.'
      }
    })
  }
}
