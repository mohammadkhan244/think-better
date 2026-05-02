import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const sheetsUrl = process.env.SHEETS_URL ||
                      process.env.GOOGLE_SHEETS_URL || ''

    if (!sheetsUrl) {
      return NextResponse.json({ assumptionsCount: 0 })
    }

    const res = await fetch(sheetsUrl, {
      method: 'GET',
      next: { revalidate: 60 }
    })

    const data = await res.json()

    return NextResponse.json({
      assumptionsCount: data.assumptionsCount || 0
    })
  } catch (err) {
    return NextResponse.json({ assumptionsCount: 0 })
  }
}
