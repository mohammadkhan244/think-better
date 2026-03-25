import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export interface BookEntry {
  title: string
  author: string
  category: string
  why: string
}

export interface ResourceResult {
  books: BookEntry[]
}

export async function generateResources(
  text: string,
  detectedIssues: { name: string; confidence: string }[],
  domain: string
): Promise<ResourceResult> {
  const topPatterns = detectedIssues
    .filter(i => i.confidence === 'HIGH' || i.confidence === 'MEDIUM')
    .slice(0, 3)
    .map(i => i.name)

  const patternContext = topPatterns.length > 0
    ? `Detected reasoning patterns: ${topPatterns.join(', ')}.`
    : 'No specific reasoning patterns detected — recommend books on critical thinking and argument quality generally.'

  const prompt = `You are recommending books for someone who just analyzed an argument.

${patternContext}
Domain: ${domain}
Text excerpt: "${text.slice(0, 600)}"

You MUST return exactly 3 books — no more, no fewer.
- Book 1: about a REASONING PATTERN detected (category: "On the reasoning")
- Book 2: about a REASONING PATTERN detected (category: "On the reasoning")
- Book 3: about the TOPIC ITSELF (category: "On the topic")

If you cannot find 2 distinct books about the detected reasoning patterns, use 2 different authors writing about critical thinking, cognitive bias, or argument quality generally — but they must be real books with accurate attribution.

You must always return exactly 3 items in the books array.
Never return 1 or 2. Never return 4 or more. Always exactly 3.

CRITICAL: Every book must actually exist. Verify title, author, and publication before including. Do not hallucinate books.

Return ONLY this exact JSON, nothing else. No markdown. No preamble:
{
  "books": [
    {
      "title": "Exact Book Title",
      "author": "Author Name",
      "category": "On the reasoning",
      "why": "One sentence on why this book is relevant."
    },
    {
      "title": "Exact Book Title",
      "author": "Author Name",
      "category": "On the reasoning",
      "why": "One sentence on why this book is relevant."
    },
    {
      "title": "Exact Book Title",
      "author": "Author Name",
      "category": "On the topic",
      "why": "One sentence on why this book is relevant."
    }
  ]
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!parsed.books || parsed.books.length !== 3) {
      throw new Error('Invalid books count')
    }

    return { books: parsed.books }
  } catch {
    return {
      books: [
        {
          title: 'Thinking Fast and Slow',
          author: 'Daniel Kahneman',
          category: 'On the reasoning',
          why: 'The foundational text on cognitive bias and how reasoning goes wrong.'
        },
        {
          title: 'Being Wrong',
          author: 'Kathryn Schulz',
          category: 'On the reasoning',
          why: 'How certainty feels identical whether you are right or wrong.'
        },
        {
          title: 'The Enigma of Reason',
          author: 'Hugo Mercier and Dan Sperber',
          category: 'On the topic',
          why: 'Why motivated reasoning is a feature of human cognition, not a bug.'
        }
      ]
    }
  }
}
