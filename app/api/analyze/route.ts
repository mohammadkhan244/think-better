import { NextRequest, NextResponse } from 'next/server'
import { runFLOATER } from '@/lib/floater'
import { runDetectors } from '@/lib/detectors'
import { generateQuestions } from '@/lib/questions'
import { generateImprovements, enrichImprovementsWithEvidence } from '@/lib/improvements'
import { getCacheKey, getFromCache, setInCache } from '@/lib/cache'
import { detectSpeakers, diarizeWithLLM, groupBySpeaker } from '@/lib/speakers'

// Heuristic: does this text look like a back-and-forth conversation?
// Checks for short exchanges and high question density.
function looksLikeConversation(text: string): boolean {
  const lines = text.split('\n').filter(l => l.trim().length > 0)
  if (lines.length < 6) return false
  const shortLines = lines.filter(l => l.trim().split(/\s+/).length < 40)
  const questionCount = (text.match(/\?/g) || []).length
  const shortLineRatio = shortLines.length / lines.length
  const questionRatio = questionCount / lines.length
  return shortLineRatio > 0.55 || questionRatio > 0.12
}

async function analyzeSingleText(text: string) {
  const floaterResult = runFLOATER(text)
  const detectedIssues = runDetectors(text)
  const rawImprovements = generateImprovements(floaterResult.scores, detectedIssues)

  const [improvements, questions] = await Promise.all([
    enrichImprovementsWithEvidence(text, rawImprovements).catch(() => rawImprovements),
    generateQuestions(text, floaterResult.scores, detectedIssues).catch(() => [] as string[]),
  ])

  const overall = floaterResult.overall
  const issueCount = detectedIssues.length
  const highConfidence = detectedIssues.filter(i => i.confidence === 'HIGH').length

  const summary =
    (overall >= 7 ? 'Relatively strong reasoning. ' : overall >= 4 ? 'Moderate reasoning quality with notable gaps. ' : 'Significant reasoning weaknesses. ') +
    (issueCount > 0 ? `${issueCount} bias or fallacy pattern(s) detected (${highConfidence} high-confidence).` : 'No common bias or fallacy patterns detected.')

  return { floater: floaterResult, biasesAndFallacies: detectedIssues, improvements, followUpQuestions: questions, summary }
}

export async function POST(req: NextRequest) {
  try {
    const { text, sourceType } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 })
    }

    const trimmed = text.trim()
    const wordCount = trimmed.split(/\s+/).length

    if (wordCount < 50) {
      return NextResponse.json(
        { error: 'Please provide at least 50 words for meaningful analysis.' },
        { status: 400 }
      )
    }

    const noCache = req.nextUrl.searchParams.get('nocache') === '1'
    const cacheKey = getCacheKey(trimmed + (sourceType ?? ''))
    if (!noCache) {
      const cached = getFromCache(cacheKey)
      if (cached) return NextResponse.json({ ...cached, fromCache: true })
    }

    // ── Auto speaker detection ────────────────────────────────────────────────
    // Step 1: deterministic label scan (free, no LLM)
    // Step 2: if no labels — YouTube always tries LLM diarization;
    //         text/PDF tries LLM only if it looks conversational
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

      // Detect on full text, attribute hits to the speaker who said them
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
            generateQuestions(block.text, floaterResult.scores, detectedIssues).catch(() => [] as string[]),
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

      const result = {
        mode: 'multi-speaker' as const,
        diarizationMethod,
        speakers: speakerResults,
        fromCache: false,
      }
      if (!noCache) setInCache(cacheKey, result)
      return NextResponse.json(result)
    }

    // ── Single-speaker path ───────────────────────────────────────────────────
    const analysis = await analyzeSingleText(trimmed)

    const overall = analysis.floater.overall
    const issueCount = analysis.biasesAndFallacies.length
    const highConfidence = analysis.biasesAndFallacies.filter(i => i.confidence === 'HIGH').length

    const summary =
      (overall >= 7 ? 'This text demonstrates relatively strong reasoning. ' : overall >= 4 ? 'This text shows moderate reasoning quality with notable gaps. ' : 'This text has significant reasoning weaknesses. ') +
      (issueCount > 0 ? `${issueCount} reasoning pattern(s) detected (${highConfidence} high-confidence). ` : 'No common reasoning patterns detected. ') +
      'Use the follow-up questions to probe the gaps.'

    const result = {
      mode: 'single' as const,
      floater: analysis.floater,
      biasesAndFallacies: analysis.biasesAndFallacies,
      improvements: analysis.improvements,
      followUpQuestions: analysis.followUpQuestions,
      summary,
      fromCache: false,
    }
    if (!noCache) setInCache(cacheKey, result)
    return NextResponse.json(result)

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
