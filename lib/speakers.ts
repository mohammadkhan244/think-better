import Anthropic from '@anthropic-ai/sdk'

export interface SpeakerSegment {
  speaker: string
  text: string
}

export interface SpeakerBlock {
  speaker: string
  text: string
  wordCount: number
}

// ─── DETERMINISTIC DETECTION ─────────────────────────────────────────────────
// Matches: "Name:", "SPEAKER 1:", "Host:", "Q:", "A:", "[Name]", etc.

const SPEAKER_LINE_PATTERN = /^([A-Z][A-Za-z0-9 \-']{0,30}):\s+(.+)/
const SHORT_LABEL_PATTERN = /^(Q|A|HOST|GUEST|INTERVIEWER|INTERVIEWEE|SPEAKER\s*\d+):\s+(.+)/i

export function detectSpeakers(text: string): SpeakerSegment[] | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const segments: SpeakerSegment[] = []
  let labeledLines = 0

  for (const line of lines) {
    const m = line.match(SHORT_LABEL_PATTERN) || line.match(SPEAKER_LINE_PATTERN)
    if (m) {
      labeledLines++
      const speaker = m[1].trim()
      const content = m[2].trim()
      const last = segments[segments.length - 1]
      if (last && last.speaker === speaker) {
        last.text += ' ' + content
      } else {
        segments.push({ speaker, text: content })
      }
    } else if (segments.length > 0) {
      // continuation of previous speaker
      segments[segments.length - 1].text += ' ' + line
    }
  }

  // Only trust detection if >30% of lines had labels and at least 2 distinct speakers
  const speakers = new Set(segments.map(s => s.speaker))
  const ratio = labeledLines / Math.max(lines.length, 1)
  if (speakers.size < 2 || ratio < 0.3) return null

  return segments
}

// ─── LLM DIARIZATION ─────────────────────────────────────────────────────────

export async function diarizeWithLLM(text: string): Promise<SpeakerSegment[] | null> {
  const client = new Anthropic()

  const prompt = `You are a transcript analyst. The following text is a conversation, interview, or podcast between multiple people, but the speakers are not labeled.

Your job: Identify the speaker turns and label each one with their REAL NAME if discoverable.

STEP 1 — Find real names by scanning for:
- Direct address: "Welcome, [Name]", "Thank you, [Name]", "So [Name], what do you think..."
- Self-introduction: "I'm [Name]", "My name is [Name]", "This is [Name]"
- Show/episode context: "You're listening to The [Name] Show", "I'm your host [Name]"
- Third-person reference: "As [Name] explained", "[Name] has argued that"
- Sign-offs: "Thanks for having me" preceded by name
Use actual names whenever found. Only use generic labels ("Host", "Guest", "Speaker A", "Speaker B") when no name can be inferred.

STEP 2 — Split the transcript into speaker turns:
- One entry per turn
- Short fillers ("Mm-hmm", "Right", "Yeah", "Sure") should be merged into the next substantive turn from the same speaker
- Do not change, summarize, or paraphrase — preserve exact words

TEXT:
"""
${text.slice(0, 8000)}
"""

Return ONLY a valid JSON array. No markdown, no explanation.
Format: [{"speaker": "Joe Rogan", "text": "..."}, {"speaker": "Elon Musk", "text": "..."}, ...]`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed: SpeakerSegment[] = JSON.parse(clean)

    if (!Array.isArray(parsed) || parsed.length < 2) return null
    const speakers = new Set(parsed.map(s => s.speaker))
    if (speakers.size < 2) return null

    return parsed
  } catch {
    return null
  }
}

// ─── GROUP SEGMENTS BY SPEAKER ────────────────────────────────────────────────

export function groupBySpeaker(segments: SpeakerSegment[]): SpeakerBlock[] {
  const map = new Map<string, string>()

  for (const seg of segments) {
    const existing = map.get(seg.speaker) ?? ''
    map.set(seg.speaker, existing + (existing ? ' ' : '') + seg.text.trim())
  }

  return Array.from(map.entries())
    .map(([speaker, text]) => ({
      speaker,
      text,
      wordCount: text.trim().split(/\s+/).length,
    }))
    .filter(b => b.wordCount >= 30) // skip speakers with too little text
}
