import { NextRequest, NextResponse } from 'next/server'

function extractVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const p of patterns) {
    const match = url.match(p)
    if (match) return match[1]
  }
  return null
}

async function fetchTranscriptSupadata(videoId: string): Promise<string> {
  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) throw new Error('SUPADATA_API_KEY not configured')

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
    { headers: { 'x-api-key': apiKey } }
  )

  if (res.status === 404 || res.status === 422) {
    throw new Error('No captions available for this video')
  }
  if (!res.ok) throw new Error(`Supadata error: ${res.status}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()

  // Supadata returns { content: string } when text=true
  const text: string = typeof data.content === 'string'
    ? data.content
    : Array.isArray(data.content)
      ? data.content.map((s: { text: string }) => s.text).join(' ')
      : ''

  return text.replace(/\s+/g, ' ').trim()
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    const videoId = extractVideoId(url)

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL.' }, { status: 400 })
    }

    const text = await fetchTranscriptSupadata(videoId)

    if (!text || text.length < 200) {
      return NextResponse.json(
        { error: 'Transcript not available for this video.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('No captions')) {
      return NextResponse.json(
        { error: 'This video does not have captions/subtitles available.' },
        { status: 422 }
      )
    }
    return NextResponse.json(
      { error: `Transcript not available for this video. (debug: ${message})` },
      { status: 500 }
    )
  }
}
