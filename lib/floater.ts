import { preprocessText, countMatches, normalizeScore } from './textUtils'

const UNFALSIFIABLE = [
  /you can'?t (disprove|refute|deny)/i,
  /impossible to (test|disprove|falsify)/i,
  /beyond (question|doubt|dispute)/i,
  /self[- ]evident/i,
  /no evidence could/i,
  /faith alone/i,
  /cannot be measured/i,
  /unprovable (but true|by nature)/i,
]

const FALSIFIABLE_POSITIVE = [
  /if .{3,40} then .{3,40}/i,
  /we (predict|hypothesize|expect) that/i,
  /this (claim|prediction) can be tested/i,
  /measurable outcome/i,
  /defined as .{3,60}/i,
  /operationally defined/i,
]

const LOGICAL_CONNECTIVES = [
  /\btherefore\b/i, /\bbecause\b/i, /\bit follows\b/i, /\bthus\b/i,
  /\bconsequently\b/i, /\bsince\b/i, /\bgiven that\b/i, /\bwhich implies\b/i,
  /\bthis means\b/i, /\bas a result\b/i, /\bin conclusion\b/i,
]

const CIRCULAR_PATTERNS = [
  /(\w+).{0,30}because.{0,30}\1/i,
  /true because (it is|that's) true/i,
  /(\w+).{0,20}by definition.{0,20}\1/i,
]

const COUNTERARGUMENT_MARKERS = [
  /\bhowever\b/i, /\balternatively\b/i, /\bon the other hand\b/i,
  /\bcritics (argue|suggest|contend)\b/i, /\bsome argue\b/i,
  /\bopponents (claim|say)\b/i, /\banother explanation\b/i,
  /\bit could also be\b/i, /\bnot everyone agrees\b/i,
  /\bskeptics (point out|note)\b/i, /\bcontrary evidence\b/i,
  /\bthis view is challenged\b/i, /\bin contrast\b/i,
]

const OVERCONFIDENT_TERMS = [
  /\bproves?\b/i, /\bdefinitively\b/i, /\bundeniably\b/i,
  /\bit is certain\b/i, /\bwithout (any |a )?doubt\b/i,
  /\bclearly (shows|demonstrates|proves)\b/i, /\beveryone knows\b/i,
  /\bobviously\b/i, /\bfact of the matter\b/i, /\bindisputable\b/i,
  /\babsolutely (proven|true|certain)\b/i, /\bno question that\b/i,
]

const EPISTEMIC_HEDGES = [
  /\bsuggests?\b/i, /\bindicates?\b/i, /\bmay\b/i, /\bmight\b/i,
  /\bcould\b/i, /\bappears? to\b/i, /\bpreliminary\b/i,
  /\bpossible that\b/i, /\bit seems\b/i, /\btentatively\b/i,
  /\bwe cannot rule out\b/i, /\bmore research (is )?needed\b/i,
  /\binconclusively\b/i, /\bour best current understanding\b/i,
]

const EVIDENCE_MARKERS = [
  /according to\b/i, /\bstudy (found|shows?|demonstrates?)\b/i,
  /\bresearch (shows?|indicates?|suggests?)\b/i,
  /\bdata (shows?|indicates?|suggests?)\b/i,
  /\bpublished in\b/i, /\bpeer[- ]reviewed\b/i,
  /\bn\s*=\s*\d+/i, /\bsample (size|of \d+)\b/i,
  /\b\d{4}\)\b/,
  /\bhttps?:\/\//i, /\bcited in\b/i,
  /\bstatistically significant\b/i, /\bcontrol group\b/i,
  /\bmeta[- ]analysis\b/i, /\bsystematic review\b/i,
  /\bconfidence interval\b/i, /\bp[- ]value\b/i,
]

const EVIDENCE_ABSENT_SIGNALS = [
  /\beveryone knows\b/i, /\bit'?s (common sense|obvious)\b/i,
  /\bI (heard|read somewhere)\b/i,
  /\btrust me\b/i, /\bbelieve me\b/i,
  /\bmy (personal )?experience\b/i,
  /\bI (feel|think|believe) (that )?this is true\b/i,
]

const METHOD_MARKERS = [
  /\bwe (measured|tested|observed|conducted)\b/i,
  /\bmethodology\b/i, /\bprocedure\b/i,
  /\breplicated\b/i, /\bcontrolled (for|study)\b/i,
  /\bblind(ed)? (study|trial)\b/i,
  /\bpeer (review|reviewed)\b/i,
  /\bpre[- ]registered\b/i, /\bopen (data|science)\b/i,
  /\bcross[- ]validated\b/i, /\bsample (was )?representative\b/i,
]

export function scoreFalsifiability(parsed: ReturnType<typeof preprocessText>) {
  const t = parsed.lower
  const positive = countMatches(t, FALSIFIABLE_POSITIVE)
  const negative = countMatches(t, UNFALSIFIABLE)
  const score = normalizeScore(positive, negative, parsed.wordCount, 150)

  const issues: string[] = []
  if (negative > 0) issues.push(`${negative} unfalsifiable phrase(s) detected`)
  if (positive === 0) issues.push('No testable predictions or defined terms found')
  const strengths: string[] = []
  if (positive > 0) strengths.push(`${positive} falsifiable/testable statement(s) found`)

  return {
    score,
    justification: [...strengths, ...issues].join('. ') || 'Neutral — no strong signals either way.'
  }
}

export function scoreLogic(parsed: ReturnType<typeof preprocessText>) {
  const t = parsed.lower
  const connectives = countMatches(t, LOGICAL_CONNECTIVES)
  const circular = countMatches(t, CIRCULAR_PATTERNS)
  const score = normalizeScore(connectives, circular, parsed.wordCount, 120)

  const issues: string[] = []
  if (circular > 0) issues.push(`${circular} potentially circular argument pattern(s)`)
  if (connectives < 2) issues.push('Few logical connectives — reasoning chain may be implicit or absent')
  const strengths: string[] = []
  if (connectives >= 3) strengths.push(`${connectives} logical connectives found, indicating structured reasoning`)

  return {
    score,
    justification: [...strengths, ...issues].join('. ') || 'Neutral — moderate connective use.'
  }
}

export function scoreObjectivity(parsed: ReturnType<typeof preprocessText>) {
  const t = parsed.lower
  const counterargs = countMatches(t, COUNTERARGUMENT_MARKERS)
  const overconfident = countMatches(t, OVERCONFIDENT_TERMS)
  const sentimentMagnitude = Math.abs(parsed.sentimentScore.comparative)
  const emotionalPenalty = sentimentMagnitude > 0.15 ? Math.round(sentimentMagnitude * 10) : 0
  const score = normalizeScore(counterargs, overconfident + emotionalPenalty, parsed.wordCount, 130)

  const issues: string[] = []
  if (overconfident > 0) issues.push(`${overconfident} overconfident assertion(s)`)
  if (sentimentMagnitude > 0.15) issues.push(`High emotional language detected (sentiment: ${sentimentMagnitude.toFixed(2)})`)
  if (counterargs === 0) issues.push('No counterarguments or opposing views acknowledged')
  const strengths: string[] = []
  if (counterargs > 0) strengths.push(`${counterargs} counterargument marker(s) found`)

  return {
    score,
    justification: [...strengths, ...issues].join('. ') || 'Moderate objectivity signals.'
  }
}

export function scoreAlternativeExplanations(parsed: ReturnType<typeof preprocessText>) {
  const t = parsed.lower
  const alternatives = countMatches(t, COUNTERARGUMENT_MARKERS)
  const score = normalizeScore(alternatives, 0, parsed.wordCount, 200)

  return {
    score,
    justification: alternatives > 0
      ? `${alternatives} alternative explanation or counterpoint marker(s) found.`
      : 'No alternative explanations or competing hypotheses presented.'
  }
}

export function scoreTentativeConclusions(parsed: ReturnType<typeof preprocessText>) {
  const t = parsed.lower
  const hedges = countMatches(t, EPISTEMIC_HEDGES)
  const overconfident = countMatches(t, OVERCONFIDENT_TERMS)
  const score = normalizeScore(hedges, overconfident, parsed.wordCount, 140)

  const issues: string[] = []
  if (overconfident > 0) issues.push(`${overconfident} overconfident conclusion(s) detected`)
  const strengths: string[] = []
  if (hedges > 0) strengths.push(`${hedges} epistemic hedge(s) found — conclusions are appropriately qualified`)

  return {
    score,
    justification: [...strengths, ...issues].join('. ') || 'Balanced — neither strongly hedged nor overconfident.'
  }
}

export function scoreEvidence(parsed: ReturnType<typeof preprocessText>) {
  const t = parsed.lower
  const evidenceHits = countMatches(t, EVIDENCE_MARKERS)
  const absentSignals = countMatches(t, EVIDENCE_ABSENT_SIGNALS)
  const score = normalizeScore(evidenceHits, absentSignals, parsed.wordCount, 100)

  const issues: string[] = []
  if (evidenceHits === 0) issues.push('No citations, data, or source references detected')
  if (absentSignals > 0) issues.push(`${absentSignals} anecdotal or unverifiable evidence signal(s)`)
  const strengths: string[] = []
  if (evidenceHits > 0) strengths.push(`${evidenceHits} evidence marker(s) detected (citations, data, sources)`)

  return {
    score,
    justification: [...strengths, ...issues].join('. ') || 'Some evidence signals present.'
  }
}

export function scoreReplicability(parsed: ReturnType<typeof preprocessText>) {
  const t = parsed.lower
  const methodHits = countMatches(t, METHOD_MARKERS)
  const evidenceHits = countMatches(t, EVIDENCE_MARKERS)
  const combined = methodHits + Math.floor(evidenceHits / 2)
  const score = normalizeScore(combined, 0, parsed.wordCount, 180)

  return {
    score,
    justification: methodHits > 0
      ? `${methodHits} methodology/replication marker(s) found.`
      : 'No methodology, sourcing, or replication language detected. Results cannot be independently verified from this text.'
  }
}

const WEIGHTS = { F: 0.15, L: 0.20, O: 0.15, A: 0.15, T: 0.10, E: 0.15, R: 0.10 }

export function runFLOATER(rawText: string) {
  const parsed = preprocessText(rawText)

  const scores = {
    F: scoreFalsifiability(parsed),
    L: scoreLogic(parsed),
    O: scoreObjectivity(parsed),
    A: scoreAlternativeExplanations(parsed),
    T: scoreTentativeConclusions(parsed),
    E: scoreEvidence(parsed),
    R: scoreReplicability(parsed),
  }

  const overall = Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + scores[key as keyof typeof scores].score * weight
  }, 0)

  return {
    scores,
    overall: Math.round(overall * 10) / 10
  }
}
