import Anthropic from '@anthropic-ai/sdk'
import type { DetectionResult } from './detectors'

export interface Improvement {
  dimension?: string
  dimensionLabel?: string
  score?: number
  gap: string
  lookUp: string[]
  perspective: string
  nextStep: string
  source: 'floater' | 'detector'
  issueLabel?: string
  // Filled in by enrichImprovementsWithEvidence()
  textEvidence?: string        // exact quote from the text proving the problem
  contraryResource?: string   // specific book/film/article that challenges this text's claim
  specificAdvice?: string     // tailored advice based on what the text actually argues
}

const DIMENSION_IMPROVEMENTS: Record<string, Omit<Improvement, 'score' | 'source'>> = {
  F: {
    dimension: 'F',
    dimensionLabel: 'Falsifiability',
    gap: 'The claims made here are difficult or impossible to test. Strong arguments define what evidence would prove them wrong.',
    lookUp: [
      'Karl Popper — "Conjectures and Refutations" (falsifiability criterion)',
      'Operationalization: how researchers turn abstract ideas into measurable variables',
      'The difference between empirical claims and normative claims',
    ],
    perspective: 'If you wanted to design an experiment to disprove this claim, what would it look like? If you can\'t answer that, the claim may be unfalsifiable.',
    nextStep: 'Rewrite your central claim as: "If X, then we would expect to observe Y. If we observe Z instead, the claim is wrong."',
  },
  L: {
    dimension: 'L',
    dimensionLabel: 'Logic',
    gap: 'The reasoning chain connecting premises to conclusions is weak, implicit, or circular. Conclusions don\'t clearly follow from what came before.',
    lookUp: [
      'Argument mapping (tools: Rationale, MindMup)',
      'The Toulmin Model of argumentation — claim, grounds, warrant, backing',
      '"Being Logical" by D.Q. McInerny — short, practical primer',
    ],
    perspective: 'Can you write out your argument as: "Because [premise 1] and [premise 2], therefore [conclusion]"? If the jump feels too large, there\'s a missing step.',
    nextStep: 'Draw a flowchart of your argument. Every arrow between boxes should be a logical step you can defend explicitly.',
  },
  O: {
    dimension: 'O',
    dimensionLabel: 'Objectivity',
    gap: 'The text shows signs of one-sided framing, emotional language, or failure to acknowledge opposing views. Objectivity doesn\'t mean no opinion — it means engaging fairly with what disagrees with you.',
    lookUp: [
      'Steel-manning: the practice of presenting the strongest possible version of an opposing argument',
      '"The Scout Mindset" by Julia Galef — curiosity over defensiveness',
      'Motivated reasoning: how beliefs shape evidence evaluation',
    ],
    perspective: 'What is the most compelling argument against your position? Write it out as charitably as possible. Does your argument survive it?',
    nextStep: 'Find one source that directly contradicts your conclusion and summarize its strongest point in your own words before responding to it.',
  },
  A: {
    dimension: 'A',
    dimensionLabel: 'Alternatives',
    gap: 'Only one explanation is presented for the evidence. Strong reasoning considers competing hypotheses and explains why this one is preferred.',
    lookUp: [
      'The "Competing Hypotheses" method (used in intelligence analysis)',
      'Inference to the best explanation (abductive reasoning)',
      '"Thinking in Bets" by Annie Duke — holding multiple possibilities simultaneously',
    ],
    perspective: 'List three other explanations for the same facts. Why is yours more likely than each of them?',
    nextStep: 'Add a section to your argument that begins: "One could also explain this by [X], but that account fails because..."',
  },
  T: {
    dimension: 'T',
    dimensionLabel: 'Tentativeness',
    gap: 'Conclusions are stated with more certainty than the evidence warrants. Almost no complex claim deserves 100% confidence.',
    lookUp: [
      'Epistemic humility — the calibrated acknowledgement of uncertainty',
      'Bayesian reasoning: updating confidence based on evidence weight',
      '"Superforecasting" by Philip Tetlock — how expert forecasters express calibrated uncertainty',
    ],
    perspective: 'On a scale of 0–100%, how confident are you in your conclusion? What would move that number up or down by 10%?',
    nextStep: 'Replace absolute terms ("proves", "certainly", "obviously") with calibrated language ("suggests", "is consistent with", "increases the probability that").',
  },
  E: {
    dimension: 'E',
    dimensionLabel: 'Evidence',
    gap: 'Claims are unsupported by citations, data, or verifiable sources. Anecdote and intuition are present where evidence is needed.',
    lookUp: [
      'Google Scholar (scholar.google.com) — free access to peer-reviewed research',
      'The hierarchy of evidence: systematic reviews > RCTs > cohort studies > case reports > anecdote',
      'How to read a study: abstract, methods, sample size, limitations',
    ],
    perspective: 'What is the best-quality study or data source you could cite for your central claim? If you don\'t know of one, that\'s important information.',
    nextStep: 'Search Google Scholar for your core claim. Cite at least one peer-reviewed source that directly supports or challenges it.',
  },
  R: {
    dimension: 'R',
    dimensionLabel: 'Replicability',
    gap: 'There is no description of methodology or sourcing that would allow someone else to verify or reproduce this reasoning independently.',
    lookUp: [
      'The replication crisis — why many published findings don\'t hold up',
      'Pre-registration: committing to methods before seeing results',
      'Open science principles: transparent methods, shared data',
    ],
    perspective: 'If a skeptic wanted to check your work from scratch, what exactly would they do? Could they reach the same conclusion?',
    nextStep: 'Describe your sources and method explicitly: "I reached this conclusion by examining [X], using [Y approach], and found [Z]. The raw sources are [links/citations]."',
  },
}

const DETECTOR_IMPROVEMENTS: Record<string, Pick<Improvement, 'gap' | 'lookUp' | 'perspective' | 'nextStep'>> = {
  'Ad Hominem': {
    gap: 'The argument attacks the person rather than their reasoning. Even if the person is wrong about other things, that doesn\'t make this claim wrong.',
    lookUp: ['Ad hominem fallacy — Stanford Encyclopedia of Philosophy', 'Separating argument quality from arguer credibility'],
    perspective: 'If your worst enemy made this exact argument, would the argument itself be valid?',
    nextStep: 'Remove all references to the person\'s character. Rewrite the rebuttal targeting only the logic and evidence of their claim.',
  },
  'Strawman': {
    gap: 'The opposing view is represented in a weakened or distorted form. Defeating a strawman doesn\'t defeat the real argument.',
    lookUp: ['Steel-manning vs strawmanning', 'Principle of Charity in argumentation'],
    perspective: 'How would a thoughtful proponent of the opposing view describe their own position?',
    nextStep: 'Find a primary source where someone defends the opposing position. Quote them directly, then respond to that.',
  },
  'False Cause (Post Hoc)': {
    gap: 'Causation is being assumed from correlation or sequence. A came before B doesn\'t mean A caused B.',
    lookUp: ['"Correlation vs. causation" — Khan Academy Statistics', 'Bradford Hill criteria for causal inference', 'Confounding variables'],
    perspective: 'What third factor might explain both A and B independently?',
    nextStep: 'Ask: Is there a controlled study? What confounders were ruled out? What\'s the proposed mechanism by which A causes B?',
  },
  'Slippery Slope': {
    gap: 'A chain of increasingly extreme consequences is assumed without showing why each step is likely.',
    lookUp: ['Slippery slope fallacy vs legitimate slippery slope arguments', 'Base rate thinking'],
    perspective: 'At which specific step in the chain does the probability drop significantly? What evidence shows each transition is likely?',
    nextStep: 'Assign rough probabilities to each step in the chain. If any step is <50% likely, the overall chain is weak.',
  },
  'False Dichotomy': {
    gap: 'Only two options are presented when others exist. Most complex issues have more than two positions.',
    lookUp: ['False dilemma fallacy', 'The "middle ground" in policy and philosophy', 'Option generation techniques'],
    perspective: 'What is the third option? The fourth? What positions exist between the two presented?',
    nextStep: 'List at least three distinct positions on this issue, including at least one that combines elements of both sides.',
  },
  'Appeal to Authority': {
    gap: 'An authority\'s opinion is cited without their underlying reasoning or data. Experts can be wrong; their reasoning matters more than their title.',
    lookUp: ['Appeal to authority — when it\'s valid vs fallacious', 'How to evaluate expert consensus', 'Domain-specific expertise'],
    perspective: 'What is the actual evidence or reasoning the authority used? Do you find that reasoning convincing independent of who said it?',
    nextStep: 'Replace "Expert X says Y" with the underlying data or study that led Expert X to say Y.',
  },
  'Bandwagon (Ad Populum)': {
    gap: 'Popularity is treated as evidence of truth. Many widely-held beliefs have been wrong throughout history.',
    lookUp: ['Ad populum fallacy', 'Historical examples of consensus being wrong (e.g. germ theory, continental drift)', 'Wisdom of crowds — when it works and when it doesn\'t'],
    perspective: 'Was this ever widely believed to be false? Were the majority wrong then? What changed?',
    nextStep: 'Replace popularity claims with the actual evidence that makes the majority view compelling.',
  },
  'Appeal to Emotion': {
    gap: 'Emotional language is being used to drive conclusions instead of evidence and logic.',
    lookUp: ['Pathos vs logos in rhetoric', 'Emotional reasoning cognitive distortion', '"Thinking, Fast and Slow" by Daniel Kahneman — System 1 vs System 2'],
    perspective: 'If you felt nothing about this topic, what would the evidence alone say?',
    nextStep: 'Rewrite the key paragraph removing all emotionally loaded words. Does the argument still hold?',
  },
  'Circular Reasoning': {
    gap: 'The conclusion is smuggled into the premises. The argument assumes what it\'s trying to prove.',
    lookUp: ['Begging the question — formal definition', 'How to identify circular arguments', 'Deductive vs inductive reasoning'],
    perspective: 'Can you state your premises without using any words that assume the conclusion is already true?',
    nextStep: 'List your premises separately from your conclusion. Check: does believing the premises require already believing the conclusion?',
  },
  'Anecdotal Evidence': {
    gap: 'A single story or personal experience is used as if it represents a general pattern. Anecdotes can illustrate — they cannot prove.',
    lookUp: ['Anecdotal evidence vs statistical evidence', 'Law of large numbers', 'Representativeness heuristic'],
    perspective: 'How many cases would you need to see before you were confident this was a real pattern rather than a coincidence?',
    nextStep: 'Use your anecdote as illustration only. Find the systematic data that shows whether it\'s representative.',
  },
  'No True Scotsman': {
    gap: 'The definition of a category is being shifted after the fact to exclude inconvenient examples.',
    lookUp: ['No true Scotsman fallacy', 'Definitional vs empirical claims', 'Conceptual analysis'],
    perspective: 'What definition of the category were you using before you encountered the counterexample? Does the counterexample actually fit that original definition?',
    nextStep: 'Write out your definition of the key term before examining any cases. Then apply it consistently, including to cases that are inconvenient.',
  },
  'Genetic Fallacy': {
    gap: 'An argument is judged by its source rather than its content. Origin doesn\'t determine truth.',
    lookUp: ['Genetic fallacy — formal definition', 'Conflict of interest vs argument quality', 'Chronological snobbery (C.S. Lewis)'],
    perspective: 'If this argument were made by someone you trusted, would you find it more convincing? If yes, you\'re judging the source, not the argument.',
    nextStep: 'Evaluate the argument\'s logic and evidence as if you didn\'t know who made it.',
  },
  'Confirmation Bias': {
    gap: 'Evidence is being selected to confirm what\'s already believed, while disconfirming evidence is ignored or minimized.',
    lookUp: ['"The Scout Mindset" by Julia Galef', 'Disconfirmation bias — actively seeking evidence against your view', 'Pre-mortems: imagining the claim is wrong and asking why'],
    perspective: 'What evidence, if found, would change your mind? Have you actually looked for it?',
    nextStep: 'Spend 20 minutes deliberately searching for the strongest evidence against your position. Engage with it seriously.',
  },
  'Survivorship Bias': {
    gap: 'Only the successes are visible, making success look more common or more causally determined than it is.',
    lookUp: ['Survivorship bias — Abraham Wald\'s WWII airplane study', '"The Drunkard\'s Walk" by Leonard Mlodinow', 'Base rates in success stories'],
    perspective: 'Where are all the people who did the same thing and failed? What happened to them?',
    nextStep: 'Find data on the failure rate for the activity or group you\'re analyzing. Reframe your argument including the failures.',
  },
  'Dunning-Kruger Effect': {
    gap: 'The complexity of this domain may be underestimated, leading to overconfident conclusions from limited knowledge.',
    lookUp: ['Dunning-Kruger original paper (Kruger & Dunning, 1999)', '"Unknown unknowns" — Donald Rumsfeld\'s epistemology', 'Expert calibration research'],
    perspective: 'What would an expert in this field say you\'re missing? What takes years to understand that you haven\'t accounted for?',
    nextStep: 'Find one leading expert who disagrees with your conclusion and try to understand their reasoning in their own terms.',
  },
  'Sunk Cost Fallacy': {
    gap: 'Past investment is being used to justify continuing a course of action, regardless of whether future value justifies it.',
    lookUp: ['Sunk cost fallacy in economics and psychology', '"Thinking, Fast and Slow" — loss aversion', 'Prospective vs retrospective decision-making'],
    perspective: 'If you were starting fresh today with no prior investment, would you make the same choice?',
    nextStep: 'Evaluate the decision based only on expected future costs and benefits. Treat past costs as gone.',
  },
  'Availability Heuristic': {
    gap: 'How easily examples come to mind is being mistaken for how common or probable they actually are.',
    lookUp: ['Availability heuristic — Kahneman & Tversky', 'Base rates vs vivid examples', '"Factfulness" by Hans Rosling'],
    perspective: 'Is this topic more salient in your mind because it\'s actually common, or because it\'s dramatic and widely covered?',
    nextStep: 'Look up the actual statistical frequency of what you\'re describing. Compare it to what your intuition suggested.',
  },
  'Overconfidence Bias': {
    gap: 'Certainty is expressed beyond what the evidence supports.',
    lookUp: ['Calibration in forecasting — Good Judgment Project', '"Superforecasting" by Tetlock & Gardner', 'Confidence intervals and what they mean'],
    perspective: 'What is the chance you\'re wrong about this? What would that world look like?',
    nextStep: 'Assign explicit probability estimates to your claims and identify what evidence would revise them.',
  },
  'Hindsight Bias': {
    gap: 'Outcomes are being described as more predictable in retrospect than they actually were beforehand.',
    lookUp: ['Hindsight bias — Fischhoff (1975) original study', '"Thinking, Fast and Slow" Ch. 19', 'The "I knew it all along" effect'],
    perspective: 'What did people who were paying close attention actually predict before this happened?',
    nextStep: 'Find contemporaneous records (articles, predictions, forecasts) from before the event to check what was actually anticipated.',
  },
  'Narrative Fallacy': {
    gap: 'Events are being forced into a causal story that may not reflect how they actually unfolded.',
    lookUp: ['"The Black Swan" by Nassim Taleb — narrative fallacy chapter', 'Post hoc rationalization', 'Randomness vs pattern'],
    perspective: 'Could these events have happened in a different order and still produced the same story? Does the narrative require every link in the chain to hold?',
    nextStep: 'Identify which causal links in your story are assumptions vs. documented facts. Flag the assumptions explicitly.',
  },
  'Base Rate Neglect': {
    gap: 'The baseline probability of this outcome is being ignored in favor of specific details that seem diagnostic.',
    lookUp: ['Base rate neglect — Kahneman', 'Bayes\' theorem (intuitive explanation)', '"The Base Rate Book" — Credit Suisse'],
    perspective: 'Before considering any specific evidence about this case, what percentage of similar cases have this outcome?',
    nextStep: 'Start your analysis with the base rate. Only update from it based on evidence that is genuinely diagnostic.',
  },
  'Cherry Picking': {
    gap: 'Favorable evidence is highlighted while contradictory data is omitted.',
    lookUp: ['Publication bias in research', 'Systematic reviews vs selective citation', 'How to read a meta-analysis'],
    perspective: 'What does the full body of evidence say, not just the studies that support your view?',
    nextStep: 'Search for "evidence against [your claim]" and spend equal time reviewing what you find.',
  },
  'Texas Sharpshooter': {
    gap: 'Patterns are being identified in data after the fact, then presented as if they were predicted in advance.',
    lookUp: ['Texas sharpshooter fallacy', 'P-hacking and data dredging', 'Pre-registration in research'],
    perspective: 'Was this pattern predicted before looking at the data, or found by examining it?',
    nextStep: 'Specify your hypothesis before looking at new data. If you\'ve already seen the data, treat your finding as exploratory only — not confirmatory.',
  },
  'Framing Effect': {
    gap: 'The way information is presented is influencing the conclusion more than the content itself.',
    lookUp: ['Framing effects — Tversky & Kahneman', 'Loss aversion and how framing exploits it', 'Reframing as a critical thinking tool'],
    perspective: 'How would this exact same information look if presented from the opposite frame?',
    nextStep: 'Rewrite your argument using the opposite framing (e.g., if you\'re using "90% survival rate", rewrite using "10% death rate"). Does the conclusion change? It shouldn\'t.',
  },
}

export function generateImprovements(
  floaterScores: Record<string, { score: number; justification: string }>,
  detectedIssues: DetectionResult[]
): Improvement[] {
  const improvements: Improvement[] = []

  // Add FLOATER-based improvements for any dimension scoring ≤ 6
  for (const [key, val] of Object.entries(floaterScores)) {
    if (val.score <= 6) {
      const template = DIMENSION_IMPROVEMENTS[key]
      if (template) {
        improvements.push({
          ...template,
          score: val.score,
          source: 'floater',
        })
      }
    }
  }

  // Add detector-based improvements for HIGH and MEDIUM confidence issues
  const seen = new Set<string>()
  for (const issue of detectedIssues) {
    if (issue.confidence === 'LOW') continue
    if (seen.has(issue.name)) continue
    seen.add(issue.name)

    const template = DETECTOR_IMPROVEMENTS[issue.name]
    if (template) {
      improvements.push({
        ...template,
        issueLabel: issue.name,
        source: 'detector',
      })
    }
  }

  // Sort: worst FLOATER scores first, then detector issues
  return improvements.sort((a, b) => {
    if (a.source === 'floater' && b.source === 'floater') {
      return (a.score ?? 10) - (b.score ?? 10)
    }
    if (a.source === 'floater') return -1
    if (b.source === 'floater') return 1
    return 0
  })
}

// ─── LLM ENRICHMENT ───────────────────────────────────────────────────────────
// Adds text-specific evidence quotes, contrarian resources, and tailored advice
// to each improvement card.

export async function enrichImprovementsWithEvidence(
  text: string,
  improvements: Improvement[]
): Promise<Improvement[]> {
  if (improvements.length === 0) return improvements

  const client = new Anthropic()

  const itemList = improvements.map((imp, i) => {
    const label = imp.source === 'floater'
      ? `${imp.dimension} — ${imp.dimensionLabel} (score ${imp.score}/10)`
      : `Issue: ${imp.issueLabel}`
    return `${i + 1}. ${label}\n   Problem: ${imp.gap}`
  }).join('\n\n')

  const prompt = `You are a critical reasoning coach analyzing a specific text for weaknesses.

TEXT BEING ANALYZED:
"""
${text.slice(0, 5000)}
"""

WEAKNESSES IDENTIFIED (${improvements.length} total):
${itemList}

For each numbered weakness above, provide:
1. "evidence" — an EXACT QUOTE (10–40 words) copied verbatim from the text above that best demonstrates this specific weakness. Use "..." to trim if needed. If no single quote works, pick the most relevant passage.
2. "contraryResource" — ONE specific book, documentary, article, podcast episode, or study that directly challenges or contradicts the central argument of THIS text. Be specific: include title, author/source, and one sentence on WHY it challenges this text's actual claim. Do NOT recommend generic critical thinking books here — recommend something that engages the actual subject matter being argued.
3. "specificAdvice" — 1–2 sentences of advice tailored to what this text actually argues. Reference the specific claim or topic, not generic reasoning tips.

Return ONLY valid JSON — an array with one object per weakness, in the same order.
Format:
[
  {
    "index": 1,
    "evidence": "exact quote from the text...",
    "contraryResource": "Title by Author (Year) — one sentence on why it directly challenges this text's claim.",
    "specificAdvice": "Tailored advice referencing the specific claim in this text."
  }
]`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }]
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const clean = raw.replace(/```json|```/g, '').trim()
    const enrichments: { index: number; evidence: string; contraryResource: string; specificAdvice: string }[] = JSON.parse(clean)

    return improvements.map((imp, i) => {
      const match = enrichments.find(e => e.index === i + 1)
      if (!match) return imp
      return {
        ...imp,
        textEvidence: match.evidence,
        contraryResource: match.contraryResource,
        specificAdvice: match.specificAdvice,
      }
    })
  } catch (err) {
    console.warn('Improvement enrichment failed:', err)
    return improvements
  }
}
