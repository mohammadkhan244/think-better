import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

type KVSummary = {
  totalAnalyses: number
  inputTypeCounts: Record<string, number>
  domainCounts: Record<string, number>
  patternCounts: Record<string, number>
  floaterTotals: Record<string, number>
  floaterCount: number
  narratives: string[]
  bookTitles: string[]
}

type KVEvent = {
  id: string
  timestamp: number
  inputType: string
  wordCount: number
  domain: string
  floaterScores: Record<string, number>
  floaterOverall: number
  patternCount: number
  patternNames: string[]
  defaultNarrative: string | null
  bookTitles: string[]
}

const EMPTY_SUMMARY: KVSummary = {
  totalAnalyses: 0,
  inputTypeCounts: {},
  domainCounts: {},
  patternCounts: {},
  floaterTotals: { F:0, L:0, O:0, A:0, T:0, E:0, R:0 },
  floaterCount: 0,
  narratives: [],
  bookTitles: [],
}

function auth(password: string): boolean {
  const expected = (process.env.ADMIN_PASSWORD ?? '').trim()
  return !!expected && (password ?? '').trim() === expected
}

function applyEventToSummary(summary: KVSummary, event: KVEvent) {
  summary.totalAnalyses++
  const it = event.inputType || 'text'
  summary.inputTypeCounts[it] = (summary.inputTypeCounts[it] || 0) + 1
  summary.domainCounts[event.domain] = (summary.domainCounts[event.domain] || 0) + 1
  ;(event.patternNames || []).forEach(n => {
    summary.patternCounts[n] = (summary.patternCounts[n] || 0) + 1
  })
  if (event.floaterScores && Object.keys(event.floaterScores).length > 0) {
    const dims = ['F','L','O','A','T','E','R'] as const
    dims.forEach(d => {
      summary.floaterTotals[d] = (summary.floaterTotals[d] || 0) + (event.floaterScores[d] ?? 0)
    })
    summary.floaterCount++
  }
  if (event.defaultNarrative) {
    summary.narratives = [event.defaultNarrative, ...(summary.narratives || [])].slice(0, 100)
  }
  ;(event.bookTitles || []).forEach(t => {
    if (!summary.bookTitles.includes(t)) summary.bookTitles.push(t)
  })
  summary.bookTitles = summary.bookTitles.slice(0, 200)
}

// ── Rebuild summary from all stored events ────────────────────────────────────
async function rebuildSummary(): Promise<{ ok: boolean; message: string }> {
  const eventKeys: string[] = (await kv.keys('rm:event:*')) ?? []
  const summary: KVSummary = { ...EMPTY_SUMMARY, floaterTotals: { F:0,L:0,O:0,A:0,T:0,E:0,R:0 }, narratives: [], bookTitles: [] }

  const raws = await Promise.all(eventKeys.map(k => kv.get(k)))
  for (const raw of raws) {
    if (!raw) continue
    const event = raw as KVEvent
    applyEventToSummary(summary, event)
  }

  await kv.set('rm:stats:summary', summary)
  return { ok: true, message: `Rebuilt from ${eventKeys.length} events. Total analyses: ${summary.totalAnalyses}` }
}

// ── Ingest a single share link ────────────────────────────────────────────────
async function ingestShare(shareId: string): Promise<{ ok: boolean; message: string }> {
  const raw = await kv.get(`share:${shareId}`)
  if (!raw) return { ok: false, message: 'Share ID not found in KV.' }

  const stored = raw as Record<string, unknown>
  const result = (stored.result ?? stored) as Record<string, unknown>

  if (result.mode !== 'single') {
    return { ok: false, message: 'Only single-speaker analyses can be ingested.' }
  }

  const floater = result.floater as Record<string, unknown> | undefined
  const scores = floater?.scores as Record<string, { score: number }> | undefined
  const domainObj = result.domain as Record<string, string> | undefined
  const domain = domainObj?.domain ?? 'unknown'
  const issues = (result.biasesAndFallacies as { name: string }[]) ?? []
  const narrative = (result.defaultNarrative as { narrative?: string } | undefined)?.narrative ?? null
  const books = (result.resources as { books?: { title: string }[] } | undefined)?.books ?? []

  const event: KVEvent = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    inputType: 'share-import',
    wordCount: 0,
    domain,
    floaterScores: scores
      ? { F: scores.F?.score ?? 0, L: scores.L?.score ?? 0, O: scores.O?.score ?? 0, A: scores.A?.score ?? 0, T: scores.T?.score ?? 0, E: scores.E?.score ?? 0, R: scores.R?.score ?? 0 }
      : {},
    floaterOverall: (floater?.overall as number) ?? 0,
    patternCount: issues.length,
    patternNames: issues.map(i => i.name),
    defaultNarrative: narrative,
    bookTitles: books.map(b => b.title),
  }

  await kv.set(`rm:event:${event.timestamp}:${event.id}`, event)

  const storedSummary = await kv.get('rm:stats:summary') as KVSummary | null
  const summary: KVSummary = storedSummary ?? { ...EMPTY_SUMMARY, floaterTotals: { F:0,L:0,O:0,A:0,T:0,E:0,R:0 }, narratives: [], bookTitles: [] }
  applyEventToSummary(summary, event)
  await kv.set('rm:stats:summary', summary)

  return { ok: true, message: `Ingested: domain=${domain}, patterns=${issues.length}, floater=${event.floaterOverall}` }
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!auth(body.password)) {
    const expected = (process.env.ADMIN_PASSWORD ?? '').trim()
    if (!expected) return NextResponse.json({ error: 'Not configured.' }, { status: 401 })
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  // Rebuild action
  if (body.action === 'rebuild') {
    try {
      return NextResponse.json(await rebuildSummary())
    } catch (err) {
      return NextResponse.json({ ok: false, message: String(err) })
    }
  }

  // Ingest action
  if (body.action === 'ingest') {
    const url: string = body.shareUrl ?? ''
    const shareId = url.includes('/share/')
      ? url.split('/share/')[1].split('?')[0].trim()
      : url.trim()
    if (!shareId) return NextResponse.json({ error: 'No share ID provided.' }, { status: 400 })
    try {
      return NextResponse.json(await ingestShare(shareId))
    } catch (err) {
      return NextResponse.json({ ok: false, message: String(err) })
    }
  }

  // Dashboard data
  let summary: KVSummary | null = null
  let recentEvents: unknown[] = []
  let feedback: unknown[] = []
  let totalEvents = 0
  let totalFeedback = 0
  const errors: string[] = []

  try {
    summary = (await kv.get('rm:stats:summary')) as KVSummary | null
  } catch (e) { errors.push(`summary: ${e}`) }

  try {
    const eventKeys: string[] = (await kv.keys('rm:event:*')) ?? []
    totalEvents = eventKeys.length
    const sorted = eventKeys
      .sort((a, b) => parseInt(b.split(':')[2]) - parseInt(a.split(':')[2]))
      .slice(0, 50)
    recentEvents = (await Promise.all(sorted.map(k => kv.get(k)))).filter(Boolean)
  } catch (e) { errors.push(`events: ${e}`) }

  try {
    const fbKeys: string[] = (await kv.keys('rm:feedback:*')) ?? []
    totalFeedback = fbKeys.length
    const sorted = fbKeys.sort((a, b) => parseInt(b.split(':')[2]) - parseInt(a.split(':')[2]))
    feedback = (await Promise.all(sorted.map(k => kv.get(k)))).filter(Boolean)
  } catch (e) { errors.push(`feedback: ${e}`) }

  return NextResponse.json({
    summary, recentEvents, feedback, totalEvents, totalFeedback,
    ...(errors.length ? { _errors: errors } : {}),
  })
}
