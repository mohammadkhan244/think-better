import { NextRequest, NextResponse } from 'next/server'
import { runFLOATER } from '@/lib/floater'
import { runDetectors } from '@/lib/detectors'
import { generateQuestions } from '@/lib/questions'
import { generateAgency } from '@/lib/agency'
import { generateImprovements, enrichImprovementsWithEvidence } from '@/lib/improvements'
import { getCacheKey, getFromCache, setInCache } from '@/lib/cache'
import { detectSpeakers, diarizeWithLLM, groupBySpeaker } from '@/lib/speakers'
import { detectDomain } from '@/lib/domainDetector'
import { generateResources } from '@/lib/resources'
import { extractBeliefSystem } from '@/lib/beliefSystem'
import { extractDefaultNarrative } from '@/lib/defaultNarrative'

function looksLikeConversation(text: string): boolean {
  const lines = text.split('\n').filter(l => l.trim().length > 0)
  if (lines.length < 6) return false
  const shortLines = lines.filter(l => l.trim().split(/\s+/).length < 40)
  const questionCount = (text.match(/\?/g) || []).length
  const shortLineRatio = shortLines.length / lines.length
  const questionRatio = questionCount / lines.length
  return shortLineRatio > 0.55 || questionRatio > 0.12
}

const DEFAULT_QUESTIONS = {
  defend: ['What evidence would cause you to abandon this position?'],
  challenge: ['What specific data supports this claim?'],
  missing: ['What perspective is entirely absent from this argument?']
}


export async function POST(req: NextRequest) {
  try {
    const { text, sourceType } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 })
    }

    const trimmed = text.trim()
    const wordCount = trimmed.split(/\s+/).length

    if (wordCount < 5) {
      return NextResponse.json(
        { error: 'Please provide at least a few words to analyze.' },
        { status: 400 }
      )
    }

    const noCache = req.nextUrl.searchParams.get('nocache') === '1'
    const cacheKey = getCacheKey(trimmed + '::v10')
    if (!noCache) {
      const cached = getFromCache(cacheKey)
      if (cached) return NextResponse.json({ ...cached, fromCache: true, cacheStatus: 'hit' })
    }

    // ── Auto speaker detection ────────────────────────────────────────────────
    let segments = detectSpeakers(trimmed)
    let diarizationMethod: 'deterministic' | 'llm' | 'none' = segments ? 'deterministic' : 'none'

    if (!segments) {
      const tryLLM = sourceType === 'youtube' || looksLikeConversation(trimmed)
      if (tryLLM) {
        diarizationMethod = 'llm'
        segments = await diarizeWithLLM(trimmed)
      }
    }

    // ── Multi-speaker path ────────────────────────────────────────────────────
    if (segments && segments.length >= 2) {
      const blocks = groupBySpeaker(segments)

      const allIssues = runDetectors(trimmed)
      const issuesBySpeaker = new Map<string, typeof allIssues>(
        blocks.map(b => [b.speaker, []])
      )
      for (const issue of allIssues) {
        const needle = issue.matchedText.toLowerCase()
        const owner = blocks.find(b => b.text.toLowerCase().includes(needle))
        if (owner) {
          issuesBySpeaker.get(owner.speaker)!.push(issue)
        } else {
          blocks.forEach(b => issuesBySpeaker.get(b.speaker)!.push(issue))
        }
      }

      const speakerResults = await Promise.all(
        blocks.map(async (block) => {
          const floaterResult = runFLOATER(block.text)
          const detectedIssues = issuesBySpeaker.get(block.speaker) ?? []
          const rawImprovements = generateImprovements(floaterResult.scores, detectedIssues)

          const [improvements, questions] = await Promise.all([
            enrichImprovementsWithEvidence(block.text, rawImprovements).catch(() => rawImprovements),
            generateQuestions(block.text, floaterResult.scores, detectedIssues).catch(() => DEFAULT_QUESTIONS),
          ])

          const overall = floaterResult.overall
          const issueCount = detectedIssues.length
          const highConfidence = detectedIssues.filter(i => i.confidence === 'HIGH').length
          const summary =
            (overall >= 7 ? 'Relatively strong reasoning. ' : overall >= 4 ? 'Moderate reasoning quality with notable gaps. ' : 'Significant reasoning weaknesses. ') +
            (issueCount > 0 ? `${issueCount} issue(s) detected (${highConfidence} high-confidence).` : 'No common bias or fallacy patterns detected.')

          return { speaker: block.speaker, wordCount: block.wordCount, floater: floaterResult, biasesAndFallacies: detectedIssues, improvements, followUpQuestions: questions, summary }
        })
      )

      const multiDomainResult = await detectDomain(trimmed)

      const [multiBeliefSystem, multiDefaultNarrative, multiResources] = await Promise.all([
        extractBeliefSystem(trimmed, true, blocks.map(b => b.speaker)).catch(() => ({
          coreAssumptions: [], loadBearingBeliefs: [], incentiveSystem: '', speakerComparison: null
        })),
        extractDefaultNarrative(trimmed, multiDomainResult.domain).catch(() => ({
          narrative: 'The current conditions are natural rather than constructed.',
          loadBearing: 'This narrative collapses if current arrangements can be shown to have authors, dates, and beneficiaries.',
          whoBenefits: 'Those whose position depends on present arrangements feeling inevitable rather than chosen.',
          ifItBreaksUpside: 'The conditions become negotiable — open to redesign rather than adaptation.',
          ifItBreaksDownside: 'The stability that comes from shared assumptions about reality gets disrupted.'
        })),
        generateResources(trimmed, allIssues, multiDomainResult.domain).catch(() => ({ books: [] })),
      ])

      const result = {
        mode: 'multi-speaker' as const,
        diarizationMethod,
        speakers: speakerResults,
        domain: multiDomainResult,
        beliefSystem: multiBeliefSystem,
        defaultNarrative: multiDefaultNarrative,
        resources: multiResources,
        fromCache: false,
      }
      if (!noCache) setInCache(cacheKey, result)
      return NextResponse.json({ ...result, cacheStatus: noCache ? 'bypassed' : 'miss' })
    }

    // ── Single-speaker path ───────────────────────────────────────────────────
    const floaterResult = runFLOATER(trimmed)
    const detectedIssues = runDetectors(trimmed)
    const rawImprovements = generateImprovements(floaterResult.scores, detectedIssues)

    const overall = floaterResult.overall
    const issueCount = detectedIssues.length
    const highConfidence = detectedIssues.filter(i => i.confidence === 'HIGH').length

    const summary =
      (overall >= 7 ? 'This text demonstrates relatively strong reasoning. ' : overall >= 4 ? 'This text shows moderate reasoning quality with notable gaps. ' : 'This text has significant reasoning weaknesses. ') +
      (issueCount > 0 ? `${issueCount} reasoning pattern(s) detected (${highConfidence} high-confidence). ` : 'No common reasoning patterns detected. ') +
      'Use the follow-up questions to probe the gaps.'

    const domainResult = await detectDomain(trimmed)

    const [
      improvements,
      beliefSystem,
      defaultNarrative,
      agency,
      questions,
      resources,
    ] = await Promise.all([
      enrichImprovementsWithEvidence(trimmed, rawImprovements).catch(() => rawImprovements),
      extractBeliefSystem(trimmed, false, []).catch(() => ({ coreAssumptions: [], loadBearingBeliefs: [], incentiveSystem: '', speakerComparison: null })),
      extractDefaultNarrative(trimmed, domainResult.domain).catch(() => ({
        narrative: 'The current conditions are natural rather than constructed.',
        loadBearing: 'This narrative collapses if current arrangements can be shown to have authors, dates, and beneficiaries.',
        whoBenefits: 'Those whose position depends on present arrangements feeling inevitable rather than chosen.',
        ifItBreaksUpside: 'The conditions become negotiable — open to redesign rather than adaptation.',
        ifItBreaksDownside: 'The stability that comes from shared assumptions about reality gets disrupted.'
      })),
      generateAgency(trimmed, floaterResult.scores, detectedIssues).catch(() => ({
        framing: 'Here is what this argument is resting on.',
        bullets: [
          'The weakest link in this argument is the evidence dimension — the core claims are asserted without sourcing.',
          'At least one alternative explanation is not addressed.',
          'The conclusion is stated with more certainty than the supporting points justify.'
        ]
      })),
      generateQuestions(trimmed, floaterResult.scores, detectedIssues).catch(() => DEFAULT_QUESTIONS),
      generateResources(trimmed, detectedIssues, domainResult.domain).catch(() => ({ books: [] })),
    ])

    const result = {
      mode: 'single' as const,
      floater: floaterResult,
      biasesAndFallacies: detectedIssues,
      improvements,
      followUpQuestions: questions,
      agency,
      domain: domainResult,
      resources,
      beliefSystem,
      defaultNarrative,
      summary,
      fromCache: false,
    }
    if (!noCache) setInCache(cacheKey, result)

    // Fire and forget — do not await, never block the response
    if (detectedIssues.length > 0) {
      fetch(process.env.SHEETS_URL || '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            incrementAssumptions: detectedIssues.length,
            incrementArguments: 1
          })
      }).catch(() => {})
    }

    return NextResponse.json({ ...result, cacheStatus: noCache ? 'bypassed' : 'miss' })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
