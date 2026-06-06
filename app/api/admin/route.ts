import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  const expected = (process.env.ADMIN_PASSWORD ?? '').trim()
  if (!expected) {
    return NextResponse.json({ error: 'Not configured.' }, { status: 401 })
  }
  if ((password ?? '').trim() !== expected) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  // Fetch each section independently — a missing key never blocks the others
  let summary = null
  let recentEvents: unknown[] = []
  let feedback: unknown[] = []
  let totalEvents = 0
  let totalFeedback = 0
  const errors: string[] = []

  try {
    const raw = await kv.get('rm:stats:summary')
    summary = raw ? JSON.parse(raw as string) : null
  } catch (e) {
    errors.push(`summary: ${e}`)
  }

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
  } catch (e) {
    errors.push(`events: ${e}`)
  }

  try {
    const fbKeys: string[] = (await kv.keys('rm:feedback:*')) ?? []
    totalFeedback = fbKeys.length
    const sorted = fbKeys.sort(
      (a, b) => parseInt(b.split(':')[2]) - parseInt(a.split(':')[2])
    )
    const raws = await Promise.all(sorted.map(k => kv.get(k)))
    feedback = raws.flatMap(r => {
      try { return r ? [JSON.parse(r as string)] : [] } catch { return [] }
    })
  } catch (e) {
    errors.push(`feedback: ${e}`)
  }

  return NextResponse.json({
    summary,
    recentEvents,
    feedback,
    totalEvents,
    totalFeedback,
    ...(errors.length ? { _errors: errors } : {}),
  })
}
