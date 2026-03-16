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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPlayerData(videoId: string): Promise<any> {
  const clients = [
    {
      key: 'AIzaSyDCU8hByM-4DrUqRExfe-42miAWjlTzZUA',
      context: {
        client: { clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', clientVersion: '2.0' },
        thirdParty: { embedUrl: 'https://www.youtube.com/' },
      },
    },
    {
      key: 'AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc',
      context: {
        client: {
          clientName: 'IOS',
          clientVersion: '19.29.1',
          deviceModel: 'iPhone16,2',
          osName: 'iPhone',
          osVersion: '17.5.1.21F90',
        },
      },
    },
    {
      key: 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '19.29.37',
          androidSdkVersion: 34,
        },
      },
    },
  ]

  for (const client of clients) {
    try {
      const res = await fetch(
        `https://www.youtube.com/youtubei/v1/player?key=${client.key}&prettyPrint=false`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: client.context, videoId }),
        }
      )
      if (!res.ok) continue
      const data = await res.json()
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks
      if (tracks && tracks.length > 0) return data
    } catch {
      // try next client
    }
  }

  throw new Error('No captions available for this video')
}

async function fetchTranscript(videoId: string): Promise<string> {
  const data = await getPlayerData(videoId)

  const captionTracks = data.captions.playerCaptionsTracklistRenderer.captionTracks
  const track =
    captionTracks.find((t: { languageCode: string }) => t.languageCode.startsWith('en')) ??
    captionTracks[0]

  if (!track?.baseUrl) throw new Error('No caption URL found')

  const captionRes = await fetch(track.baseUrl + '&fmt=json3')
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
