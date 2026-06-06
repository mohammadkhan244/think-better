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

  try {
    const summaryRaw = await kv.get('rm:stats:summary')
    const summary = summaryRaw ? JSON.parse(summaryRaw as string) : null

    const eventKeys = await kv.keys('rm:event:*')
    const sortedKeys = eventKeys
      .sort((a, b) => {
        const tsA = parseInt(a.split(':')[2])
        const tsB = parseInt(b.split(':')[2])
        return tsB - tsA
      })
      .slice(0, 50)

    const events = await Promise.all(
      sortedKeys.map(async k => {
        const raw = await kv.get(k)
        return raw ? JSON.parse(raw as string) : null
      })
    )

    const feedbackKeys = await kv.keys('rm:feedback:*')
    const sortedFeedbackKeys = feedbackKeys.sort((a, b) => {
      const tsA = parseInt(a.split(':')[2])
      const tsB = parseInt(b.split(':')[2])
      return tsB - tsA
    })

    const feedback = await Promise.all(
      sortedFeedbackKeys.map(async k => {
        const raw = await kv.get(k)
        return raw ? JSON.parse(raw as string) : null
      })
    )

    return NextResponse.json({
      summary,
      recentEvents: events.filter(Boolean),
      feedback: feedback.filter(Boolean),
      totalEvents: eventKeys.length,
      totalFeedback: feedbackKeys.length,
    })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to load data.' }, { status: 500 })
  }
}
