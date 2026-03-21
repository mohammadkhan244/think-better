import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const RESOURCE_LIBRARY: Record<string, { title: string; author: string; why: string }[]> = {
  'Confirmation Bias': [
    { title: 'The Intelligence Trap', author: 'David Robson', why: 'Why smart people are most vulnerable to believing what they already think.' },
    { title: 'Being Wrong', author: 'Kathryn Schulz', why: 'How certainty feels identical whether you are right or wrong.' }
  ],
  'Survivorship Bias': [
    { title: "The Drunkard's Walk", author: 'Leonard Mlodinow', why: 'How randomness shapes outcomes we attribute to skill or pattern.' },
    { title: 'Fooled by Randomness', author: 'Nassim Taleb', why: 'Why visible winners hide the full distribution of outcomes.' }
  ],
  'Availability Heuristic': [
    { title: 'The Perception of Risk', author: 'Paul Slovic', why: 'How vividness distorts our sense of how common something actually is.' },
    { title: 'Risk Savvy', author: 'Gerd Gigerenzer', why: 'How to think clearly about probability in a world of alarming headlines.' }
  ],
  'Sunk Cost Fallacy': [
    { title: 'Thinking in Bets', author: 'Annie Duke', why: 'How to separate the quality of a decision from its outcome.' },
    { title: 'Quit', author: 'Annie Duke', why: 'Why knowing when to stop is a skill, not a failure.' }
  ],
  'False Cause (Post Hoc)': [
    { title: 'The Book of Why', author: 'Judea Pearl', why: 'The difference between correlation, causation, and intervention.' },
    { title: 'Calling Bullshit', author: 'Carl Bergstrom & Jevin West', why: 'How causation gets smuggled into data presentations.' }
  ],
  'Hasty Generalization': [
    { title: 'The Tyranny of Metrics', author: 'Jerry Muller', why: 'How small samples get elevated into universal claims.' },
    { title: 'How to Lie with Statistics', author: 'Darrell Huff', why: 'The mechanics of turning limited data into sweeping conclusions.' }
  ],
  'Appeal to Authority': [
    { title: 'Merchants of Doubt', author: 'Naomi Oreskes & Erik Conway', why: 'How authority is manufactured and deployed to short-circuit evidence.' },
    { title: 'The Misinformation Age', author: "Cailin O'Connor & James Weatherall", why: 'Why credentialed sources are not the same as reliable evidence.' }
  ],
  'False Dichotomy': [
    { title: 'The Enigma of Reason', author: 'Hugo Mercier & Dan Sperber', why: 'Why binary framing is a feature of motivated reasoning, not clear thinking.' },
    { title: 'Superforecasting', author: 'Philip Tetlock', why: 'How to hold multiple possible outcomes simultaneously rather than forcing either/or.' }
  ],
  'Slippery Slope': [
    { title: 'How Minds Change', author: 'David McRaney', why: 'Why catastrophic predictions about change rarely materialize as predicted.' },
    { title: 'Future Babble', author: 'Dan Gardner', why: 'The track record of confident predictions about inevitable consequences.' }
  ],
  'Fundamental Attribution Error': [
    { title: 'The Person and the Situation', author: 'Lee Ross & Richard Nisbett', why: 'The foundational research showing context predicts behavior better than character.' },
    { title: 'Humankind', author: 'Rutger Bregman', why: 'How situational factors explain behavior we reflexively attribute to character flaws.' }
  ],
  'Narrative Fallacy': [
    { title: 'The Storytelling Animal', author: 'Jonathan Gottschall', why: 'Why humans impose narrative coherence on events that may be unrelated.' },
    { title: 'The Black Swan', author: 'Nassim Taleb', why: 'How retrospective storytelling creates false inevitability.' }
  ],
  'Dunning-Kruger Effect': [
    { title: 'Thinking Fast and Slow', author: 'Daniel Kahneman', why: "The mechanics of metacognitive failure — why we don't know what we don't know." },
    { title: 'The Intelligence Trap', author: 'David Robson', why: 'Why expertise in one domain creates blind spots in others.' }
  ],
  'Appeal to Nature': [
    { title: 'The Blank Slate', author: 'Steven Pinker', why: 'How natural/unnatural distinctions are applied selectively and inconsistently.' },
    { title: 'Unnatural', author: 'Philip Ball', why: 'The history of using nature as a moral argument.' }
  ],
  'Anecdotal Evidence': [
    { title: 'Bad Science', author: 'Ben Goldacre', why: 'How personal testimony gets elevated to evidence status.' },
    { title: 'The Antidote', author: 'Oliver Burkeman', why: 'How exceptional cases are used to build universal prescriptions.' }
  ],
  'Genetic Fallacy': [
    { title: 'The Righteous Mind', author: 'Jonathan Haidt', why: 'How source-based dismissal substitutes for engaging with actual arguments.' },
    { title: 'Calling Bullshit', author: 'Carl Bergstrom & Jevin West', why: 'The difference between evaluating a claim and evaluating its messenger.' }
  ],
  'Bandwagon (Ad Populum)': [
    { title: 'Extraordinary Popular Delusions', author: 'Charles Mackay', why: 'The long history of majority consensus being catastrophically wrong.' },
    { title: 'Rebel Ideas', author: 'Matthew Syed', why: 'Why diversity of dissent produces better outcomes than popular agreement.' }
  ],
  'Overconfidence Bias': [
    { title: 'Superforecasting', author: 'Philip Tetlock', why: 'What calibrated confidence actually looks like versus what it feels like.' },
    { title: 'The Signal and the Noise', author: 'Nate Silver', why: 'The difference between confident predictions and accurate ones.' }
  ],
  'Linear Extrapolation': [
    { title: 'The Precipice', author: 'Toby Ord', why: 'How linear projections of exponential change produce systematically wrong forecasts.' },
    { title: 'Superforecasting', author: 'Philip Tetlock', why: 'Why trend continuation is the most common and most wrong prediction method.' }
  ],
  'Status Quo Bias': [
    { title: 'Switch', author: 'Chip Heath & Dan Heath', why: 'Why inertia masquerades as rational preference for stability.' },
    { title: "The Innovator's Dilemma", author: 'Clayton Christensen', why: 'How attachment to existing systems prevents seeing what replaces them.' }
  ],
  'In-Group Bias': [
    { title: 'The Righteous Mind', author: 'Jonathan Haidt', why: 'How tribal reasoning masquerades as principled argument.' },
    { title: 'Strangers in Their Own Land', author: 'Arlie Hochschild', why: 'What in-group reasoning looks like from inside the group.' }
  ],
  'Moral Licensing': [
    { title: 'The Lucifer Effect', author: 'Philip Zimbardo', why: 'How past good behavior is used to justify present questionable behavior.' },
    { title: 'Mistakes Were Made (But Not by Me)', author: 'Carol Tavris & Elliot Aronson', why: 'How self-justification works after the fact.' }
  ],
  'Tu Quoque (Whataboutism)': [
    { title: 'How Democracies Die', author: 'Steven Levitsky & Daniel Ziblatt', why: 'How deflection and false equivalence replace genuine accountability.' },
    { title: 'The Art of Thinking Clearly', author: 'Rolf Dobelli', why: 'The mechanics of deflection as a substitute for engaging an argument.' }
  ],
  'False Equivalence': [
    { title: 'On Bullshit', author: 'Harry Frankfurt', why: 'The difference between lying and creating false symmetry.' },
    { title: 'Not All Dead White Men', author: 'Donna Zuckerberg', why: 'How false equivalence operates in cultural arguments specifically.' }
  ],
  'Historical Analogy Fallacy': [
    { title: 'The Lessons of History', author: 'Will & Ariel Durant', why: 'What historical comparison can and cannot actually tell us.' },
    { title: 'Thinking in Time', author: 'Richard Neustadt & Ernest May', why: 'How to use historical analogy rigorously rather than rhetorically.' }
  ],
  'Semmelweis Reflex': [
    { title: 'The Structure of Scientific Revolutions', author: 'Thomas Kuhn', why: 'Why established frameworks resist contradictory evidence even when the evidence is clear.' },
    { title: 'Rebel Ideas', author: 'Matthew Syed', why: 'What it costs institutions to reject ideas that challenge existing consensus.' }
  ],
  'Recency Bias': [
    { title: 'The Long View', author: 'Brian Fagan', why: 'How short-term patterns dissolve when examined across longer timeframes.' },
    { title: 'This Time is Different', author: 'Carmen Reinhart & Kenneth Rogoff', why: 'Why every generation believes current trends are unprecedented.' }
  ],
  'Zero-Risk Bias': [
    { title: 'Against the Gods', author: 'Peter Bernstein', why: 'How risk actually works versus how we intuitively want it to work.' },
    { title: 'Risk Savvy', author: 'Gerd Gigerenzer', why: 'Why eliminating one risk often transfers or amplifies others.' }
  ],
  'Planning Fallacy': [
    { title: 'How Big Things Get Done', author: 'Bent Flyvbjerg', why: 'The empirical record of how long things actually take versus predicted timelines.' },
    { title: 'Thinking Fast and Slow', author: 'Daniel Kahneman', why: 'The psychology behind systematic underestimation of time and cost.' }
  ],
  'Affect Heuristic': [
    { title: "Descartes' Error", author: 'Antonio Damasio', why: 'How emotion shapes reasoning in ways we don\'t notice.' },
    { title: 'Emotional Intelligence', author: 'Daniel Goleman', why: 'The difference between emotion informing judgment and emotion replacing it.' }
  ],
  'Cherry Picking': [
    { title: 'The Demon-Haunted World', author: 'Carl Sagan', why: 'How selective evidence use is distinguished from systematic evidence evaluation.' },
    { title: 'Factfulness', author: 'Hans Rosling', why: 'What happens when you look at complete datasets instead of memorable examples.' }
  ],
  'Circular Reasoning': [
    { title: 'Being Wrong', author: 'Kathryn Schulz', why: 'How conclusions get smuggled into premises without anyone noticing.' },
    { title: 'The Enigma of Reason', author: 'Hugo Mercier & Dan Sperber', why: 'Why circular reasoning is so difficult to detect in your own arguments.' }
  ]
}

export interface ResourceResult {
  curated: { title: string; author: string; why: string }[]
  topical: { title: string; author: string; why: string } | null
}

export async function generateResources(
  text: string,
  detectedIssues: { name: string; confidence: string }[],
  domain: string
): Promise<ResourceResult> {
  const highConfidence = detectedIssues
    .filter(i => i.confidence === 'HIGH' || i.confidence === 'Strong signal')
    .slice(0, 2)

  const curated: { title: string; author: string; why: string }[] = []
  const usedTitles = new Set<string>()

  for (const issue of highConfidence) {
    const resources = RESOURCE_LIBRARY[issue.name]
    if (resources) {
      const unused = resources.find(r => !usedTitles.has(r.title))
      if (unused) {
        curated.push(unused)
        usedTitles.add(unused.title)
      }
    }
  }

  if (curated.length < 2) {
    const medium = detectedIssues
      .filter(i => i.confidence === 'MEDIUM' || i.confidence === 'Possible signal')
      .slice(0, 2)
    for (const issue of medium) {
      if (curated.length >= 2) break
      const resources = RESOURCE_LIBRARY[issue.name]
      if (resources) {
        const unused = resources.find(r => !usedTitles.has(r.title))
        if (unused) {
          curated.push(unused)
          usedTitles.add(unused.title)
        }
      }
    }
  }

  let topical: { title: string; author: string; why: string } | null = null
  try {
    const prompt = `A user just analyzed an argument in the domain of "${domain}".
The text being analyzed is about:
"""
${text.slice(0, 800)}
"""

Recommend ONE real book (not article, not blog post) that would genuinely deepen understanding of the specific topic being argued — not the reasoning quality, but the subject matter itself.

The book must:
- Actually exist and be accurately attributed
- Be directly relevant to the specific topic (not generic critical thinking)
- Be readable by an intelligent non-specialist
- Add a perspective or evidence base that challenges or enriches the argument

Return ONLY this JSON, nothing else:
{
  "title": "Exact Book Title",
  "author": "Author Name",
  "why": "One sentence: what specific angle or evidence this book adds to this specific argument."
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    topical = JSON.parse(clean)
  } catch {
    topical = null
  }

  return { curated, topical }
}
