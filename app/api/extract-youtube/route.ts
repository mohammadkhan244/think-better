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

async function fetchTranscript(videoId: string): Promise<string> {
  // Use YouTube's internal Innertube API (same as the YouTube mobile app).
  // The ANDROID client bypasses consent/bot checks and returns full caption data.
  const res = await fetch(
    'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '17.31.35',
            androidSdkVersion: 30,
          },
        },
        videoId,
      }),
    }
  )

  if (!res.ok) throw new Error(`Innertube request failed: ${res.status}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()
  const captionTracks =
    data?.captions?.playerCaptionsTracklistRenderer?.captionTracks

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error('No captions available for this video')
  }

  // Prefer English captions, fall back to first track
  const track =
    captionTracks.find((t: { languageCode: string }) =>
      t.languageCode.startsWith('en')
    ) ?? captionTracks[0]

  const captionUrl: string = track.baseUrl
  if (!captionUrl) throw new Error('No caption URL found')

  // Fetch as JSON3 format (cleaner than XML)
  const captionRes = await fetch(captionUrl + '&fmt=json3')
  if (!captionRes.ok) throw new Error(`Caption fetch failed: ${captionRes.status}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any = await captionRes.json()
  const text = (json?.events ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((e: any) => e.segs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => e.segs.map((s: any) => s.utf8 ?? '').join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    const videoId = extractVideoId(url)

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL.' }, { status: 400 })
    }

    const text = await fetchTranscript(videoId)

    if (!text || text.length < 200) {
      return NextResponse.json(
        { error: 'Transcript not available for this video.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('No captions') || message.includes('No caption URL')) {
      return NextResponse.json(
        { error: 'This video does not have captions/subtitles available.' },
        { status: 422 }
      )
    }
    return NextResponse.json(
      { error: 'Transcript not available for this video.' },
      { status: 500 }
    )
  }
}
