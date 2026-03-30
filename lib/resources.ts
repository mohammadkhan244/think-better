import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic()

export interface ResourceResult {
  books: { title: string; author: string; category: string; why: string }[]
}

export async function generateResources(
  text: string,
  detectedIssues: { name: string; confidence: string }[],
  domain: string
): Promise<ResourceResult> {

  const topPatterns = detectedIssues
    .slice(0, 5)
    .map(i => i.name)
    .join(', ')

  const prompt = `A user analyzed an argument and you must recommend exactly 3 books.

ARGUMENT DOMAIN: ${domain}

ARGUMENT TOPIC (summary):
"""
${text.slice(0, 2400)}
"""

DETECTED REASONING PATTERNS:
${topPatterns || 'None detected'}

YOUR TASK — return exactly 3 books, one per category:

BOOK 1 — EYEWITNESS
A firsthand account, memoir, journalism, or narrative nonfiction
where someone lived through or reported directly on this topic.
Not theory. Not analysis. Someone who was there or saw it happen.
Category label: "Eyewitness"

BOOK 2 — EXPLAINER
A book that contextualizes this topic — connecting it to broader
patterns, history, or systems. Explains the threads that link this
argument to something larger.
Category label: "Explainer"

BOOK 3 — EXPERT
A deep specialist text — research-based, data-driven, or
field-defining — that gives rigorous depth on the specific
subject matter of this argument.
Category label: "Expert"

CRITICAL INSTRUCTION: Do NOT recommend books that validate or reinforce the argument being analyzed. The user has already read in this direction.

For each book ask: does this EXPAND the frame or CONFIRM it?
Only recommend books that expand.

Specifically:
- Eyewitness: someone who experienced the CONSEQUENCES or OPPOSITE SIDE of this argument's position — not someone who exemplifies it. If the argument is about visionary founders ignoring feedback, the eyewitness is NOT a Jobs biography. It is someone who experienced what happens when founders ignore users — a customer, a failed founder, a product that harmed people.

- Explainer: a book that connects this topic to a field or domain the argument completely ignores — not the adjacent field the argument already draws from.

- Expert: the leading researcher whose findings most directly complicate or contradict the argument's central claim.

If the most obvious book for a category would confirm the argument, that book is the wrong choice. Find the second or third most obvious book — it will usually be the one that expands the frame.

STRICT RULES:
- All 3 books must be about the TOPIC of the argument, not about
  reasoning quality or cognitive bias
- Only recommend books you are certain exist with accurate title
  and author — do not invent or misattribute
- Do not recommend the same author twice
- Each "why" must be 1 sentence, specific to this argument's topic
- You MUST return all 3. No exceptions. No partial lists.
- If you cannot find a perfect fit for a category, find the
  closest real book that exists

Return ONLY this exact JSON. No markdown. No preamble. No explanation:
{
  "books": [
    {
      "title": "Exact Book Title",
      "author": "Author Full Name",
      "category": "Eyewitness",
      "why": "One sentence specific to this argument."
    },
    {
      "title": "Exact Book Title",
      "author": "Author Full Name",
      "category": "Explainer",
      "why": "One sentence specific to this argument."
    },
    {
      "title": "Exact Book Title",
      "author": "Author Full Name",
      "category": "Expert",
      "why": "One sentence specific to this argument."
    }
  ]
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text'
      ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!parsed.books || parsed.books.length !== 3) {
      throw new Error('Did not return exactly 3 books')
    }

    return { books: parsed.books }

  } catch {
    return {
      books: [
        {
          title: 'Thinking Fast and Slow',
          author: 'Daniel Kahneman',
          category: 'Expert',
          why: 'The foundational research text on how reasoning and judgment actually work.'
        },
        {
          title: 'The Undoing Project',
          author: 'Michael Lewis',
          category: 'Eyewitness',
          why: 'A narrative account of how Kahneman and Tversky discovered the patterns behind flawed reasoning.'
        },
        {
          title: 'Being Wrong',
          author: 'Kathryn Schulz',
          category: 'Explainer',
          why: 'Connects the experience of being wrong to broader patterns in how humans construct certainty.'
        }
      ]
    }
  }
}
