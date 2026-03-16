import { NextRequest, NextResponse } from 'next/server'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

function getSiteHint(hostname: string): string | null {
  if (/linkedin\.com/.test(hostname))
    return 'LinkedIn requires login to view content. Copy the post text and paste it into the Text tab.'
  if (/twitter\.com|x\.com/.test(hostname))
    return 'X/Twitter requires login to view most content. Copy the tweet/thread text and paste it into the Text tab.'
  if (/wsj\.com|ft\.com|bloomberg\.com|thetimes\.com|barrons\.com/.test(hostname))
    return 'This article is behind a paywall. If you have a subscription, copy the article text and paste it into the Text tab.'
  if (/nytimes\.com/.test(hostname))
    return 'The New York Times may limit access. If the article is paywalled, copy the text and paste it into the Text tab.'
  if (/facebook\.com|instagram\.com/.test(hostname))
    return 'Facebook and Instagram require login. Copy the text and paste it into the Text tab.'
  return null
}

function detectPaywall(html: string, text: string): boolean {
  const paywallSignals = [
    /subscribe to (continue|read|access)/i,
    /sign in to (continue|read|access)/i,
    /create (a free )?account to (continue|read)/i,
    /you('ve| have) reached your (free )?article limit/i,
    /unlock (this|full) article/i,
  ]
  return paywallSignals.some(re => re.test(html)) && text.split(/\s+/).length < 200
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required.' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL. Make sure it starts with https://' }, { status: 400 })
    }

    const hostname = parsedUrl.hostname

    // Check for sites we know won't work before even fetching
    const earlyHint = getSiteHint(hostname)
    if (/linkedin\.com|twitter\.com|x\.com|facebook\.com|instagram\.com/.test(hostname)) {
      return NextResponse.json({ error: earlyHint }, { status: 422 })
    }

    const res = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    })

    if (res.status === 401 || res.status === 403) {
      const hint = earlyHint ?? 'This site is blocking access. Copy the article text and paste it into the Text tab.'
      return NextResponse.json({ error: hint }, { status: 422 })
    }

    if (res.status === 404) {
      return NextResponse.json({ error: 'Article not found (404). Check that the URL is correct.' }, { status: 422 })
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not reach this site (HTTP ${res.status}). It may be blocking automated access.` },
        { status: 422 }
      )
    }

    const html = await res.text()
    const dom = new JSDOM(html, { url: parsedUrl.toString() })
    const article = new Readability(dom.window.document).parse()

    const rawText = article?.textContent ?? ''
    const text = rawText.replace(/\s+/g, ' ').trim()

    if (detectPaywall(html, text)) {
      const hint = earlyHint ?? 'This article appears to be paywalled. Copy the article text and paste it into the Text tab.'
      return NextResponse.json({ error: hint }, { status: 422 })
    }

    if (!text || text.split(/\s+/).length < 50) {
      const hint = earlyHint ?? 'Not enough text could be extracted. The page may require login, or the content may be behind a paywall.'
      return NextResponse.json({ error: hint }, { status: 422 })
    }

    return NextResponse.json({ text, title: article?.title ?? '' })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    console.error('Article extraction error:', message)
    return NextResponse.json(
      { error: `Could not extract article. (debug: ${message})` },
      { status: 500 }
    )
  }
}
