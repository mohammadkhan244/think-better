import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function POST(req: NextRequest) {
  try {
    const { result, originalText } = await req.json()
    if (!result) {
      return NextResponse.json({ error: 'No result provided' }, { status: 400 })
    }
    const id = crypto.randomUUID().slice(0, 8)
    await kv.set(`share:${id}`, { result, originalText: originalText ?? '' }, { ex: 60 * 60 * 24 * 30 })
    const url = `${req.nextUrl.origin}/share/${id}`
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}
