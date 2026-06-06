import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

function auth(password: string): boolean {
  const expected = (process.env.ADMIN_PASSWORD ?? '').trim()
  return !!expected && (password ?? '').trim() === expected
}

// ── Ingest a share result into the rolling summary ────────────────────────────
async function ingestShare(shareId: string): Promise<{ ok: boolean; message: string }> {
  const raw = await kv.get(`share:${shareId}`)
  if (!raw) return { ok: false, message: 'Share ID not found in KV.' }

  // Share data may be stored as { result, originalText } or just result
  const stored = typeof raw === 'string' ? JSON.parse(raw) : raw as Record<string, unknown>
  const result = (stored.result ?? stored) as Record<string, unknown>

  if (result.mode !== 'single') {
    return { ok: false, message: 'Only single-speaker analyses can be ingested.' }
  }

  const floater = result.floater as Record<string, unknown>
  const scores = floater?.scores as Record<string, { score: number }> | undefined
  const domain = (result.domain as Record<string, string> | undefined)?.domain ?? 'unknown'
  const issues = (result.biasesAndFallacies as { name: string }[]) ?? []
  const narrative = (result.defaultNarrative as { narrative?: string } | undefined)?.narrative ?? null
  const books = (result.resources as { books?: { title: string }[] } | undefined)?.books ?? []
  const floaterOverall = (floater?.overall as number) ?? 0

  const eventId = crypto.randomUUID()
  const timestamp = Date.now()
  const eventKey = `rm:event:${timestamp}:${eventId}`

  const event = {
    id: eventId,
    timestamp,
    inputType: 'share-import',
    wordCount: 0,
    domain,
    domainConfidence: 'unknown',
    isFiction: domain === 'fiction',
    floaterScores: scores
      ? { F: scores.F?.score, L: scores.L?.score, O: scores.O?.score, A: scores.A?.score, T: scores.T?.score, E: scores.E?.score, R: scores.R?.score }
      : {},
    floaterOverall,
    patternCount: issues.length,
    patternNames: issues.map(i => i.name),
    defaultNarrative: narrative,
    bookTitles: books.map(b => b.title),
    fromCache: false,
  }

  await kv.set(eventKey, JSON.stringify(event))

  const summaryRaw = await kv.get('rm:stats:summary')
  const summary = summaryRaw
    ? JSON.parse(summaryRaw as string)
    : { totalAnalyses: 0, inputTypeCounts: {}, domainCounts: {}, patternCounts: {}, floaterTotals: { F:0,L:0,O:0,A:0,T:0,E:0,R:0 }, floaterCount: 0, narratives: [], bookTitles: [] }

  summary.totalAnalyses++
  summary.inputTypeCounts['share-import'] = (summary.inputTypeCounts['share-import'] || 0) + 1
  summary.domainCounts[domain] = (summary.domainCounts[domain] || 0) + 1
  issues.forEach(i => { summary.patternCounts[i.name] = (summary.patternCounts[i.name] || 0) + 1 })

  if (scores) {
    const dims = ['F','L','O','A','T','E','R'] as const
    dims.forEach(d => { summary.floaterTotals[d] = (summary.floaterTotals[d] || 0) + (scores[d]?.score ?? 0) })
    summary.floaterCount++
  }

  if (narrative) {
    summary.narratives = [narrative, ...(summary.narratives || [])].slice(0, 100)
  }

  books.forEach(b => {
    if (!summary.bookTitles.includes(b.title)) summary.bookTitles.push(b.title)
  })
  summary.bookTitles = summary.bookTitles.slice(0, 200)

  await kv.set('rm:stats:summary', JSON.stringify(summary))
  return { ok: true, message: `Ingested: domain=${domain}, patterns=${issues.length}, floater=${floaterOverall}` }
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!auth(body.password)) {
    const expected = (process.env.ADMIN_PASSWORD ?? '').trim()
    if (!expected) return NextResponse.json({ error: 'Not configured.' }, { status: 401 })
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  // ── Ingest action ──────────────────────────────────────────────────────────
  if (body.action === 'ingest') {
    const url: string = body.shareUrl ?? ''
    // Accept full URL or bare ID
    const shareId = url.includes('/share/') ? url.split('/share/')[1].split('?')[0].trim() : url.trim()
    if (!shareId) return NextResponse.json({ error: 'No share ID provided.' }, { status: 400 })

    try {
      const result = await ingestShare(shareId)
      return NextResponse.json(result)
    } catch (err) {
      return NextResponse.json({ ok: false, message: String(err) })
    }
  }

  // ── Dashboard data ─────────────────────────────────────────────────────────
  let summary = null
  let recentEvents: unknown[] = []
  let feedback: unknown[] = []
  let totalEvents = 0
  let totalFeedback = 0
  const errors: string[] = []

  try {
    const raw = await kv.get('rm:stats:summary')
    summary = raw ? JSON.parse(raw as string) : null
  } catch (e) { errors.push(`summary: ${e}`) }

  try {
    const eventKeys: string[] = (await kv.keys('rm:event:*')) ?? []
    totalEvents = eventKeys.length
    const sorted = eventKeys
      .sort((a, b) => parseInt(b.split(':')[2]) - parseInt(a.split(':')[2]))
      .slice(0, 50)
    const raws = await Promise.all(sorted.map(k => kv.get(k)))
    recentEvents = raws.flatMap(r => {
      try { return r ? [JSON.parse(r as string)] : [] } catch { return [] }
    })
  } catch (e) { errors.push(`events: ${e}`) }

  try {
    const fbKeys: string[] = (await kv.keys('rm:feedback:*')) ?? []
    totalFeedback = fbKeys.length
    const sorted = fbKeys.sort((a, b) => parseInt(b.split(':')[2]) - parseInt(a.split(':')[2]))
    const raws = await Promise.all(sorted.map(k => kv.get(k)))
    feedback = raws.flatMap(r => {
      try { return r ? [JSON.parse(r as string)] : [] } catch { return [] }
    })
  } catch (e) { errors.push(`feedback: ${e}`) }

  return NextResponse.json({
    summary, recentEvents, feedback, totalEvents, totalFeedback,
    ...(errors.length ? { _errors: errors } : {}),
  })
}
