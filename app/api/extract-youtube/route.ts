import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    const videoId = extractVideoId(url)

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL.' }, { status: 400 })
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    const text = transcript.map((t: { text: string }) => t.text).join(' ').replace(/\s+/g, ' ').trim()

    if (!text || text.length < 200) {
      return NextResponse.json(
        { error: 'Transcript not available for this video.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text })
  } catch {
    return NextResponse.json(
      { error: 'Transcript not available for this video.' },
      { status: 500 }
    )
  }
}

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
