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
  // Fetch the YouTube watch page with browser-like headers to avoid datacenter IP blocking
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })

  if (!pageRes.ok) throw new Error(`YouTube page fetch failed: ${pageRes.status}`)

  const html = await pageRes.text()

  // Extract ytInitialPlayerResponse from the page
  const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/)
  if (!match) throw new Error('Could not parse YouTube player response')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let playerResponse: any
  try {
    playerResponse = JSON.parse(match[1])
  } catch {
    throw new Error('Failed to parse player response JSON')
  }

  // Find caption tracks
  const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
  if (!captionTracks || captionTracks.length === 0) {
    throw new Error('No captions available')
  }

  // Prefer English, fall back to first available
  const track =
    captionTracks.find((t: { languageCode: string }) => t.languageCode.startsWith('en')) ??
    captionTracks[0]

  const captionUrl: string = track.baseUrl
  if (!captionUrl) throw new Error('No caption URL found')

  // Fetch the caption XML
  const captionRes = await fetch(captionUrl + '&fmt=json3', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })

  if (!captionRes.ok) {
    // Fall back to XML format
    const xmlRes = await fetch(captionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    const xml = await xmlRes.text()
    // Parse XML transcript
    const texts: string[] = []
    const re = /<text[^>]*>([^<]*)<\/text>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(xml)) !== null) {
      texts.push(m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"'))
    }
    return texts.join(' ').replace(/\s+/g, ' ').trim()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any = await captionRes.json()
  const events = json?.events ?? []
  const text = events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((e: any) => e.segs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => e.segs.map((s: any) => s.utf8).join(''))
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
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('No caption') || message.includes('No captions')) {
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
