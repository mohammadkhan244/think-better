import { NextRequest, NextResponse } from 'next/server'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

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
      return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 })
    }

    const res = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch article (${res.status}). The site may be blocking automated access.` },
        { status: 422 }
      )
    }

    const html = await res.text()
    const dom = new JSDOM(html, { url: parsedUrl.toString() })
    const article = new Readability(dom.window.document).parse()

    if (!article || !article.textContent) {
      return NextResponse.json(
        { error: 'Could not extract article text. The page may require a login or subscription.' },
        { status: 422 }
      )
    }

    const text = article.textContent.replace(/\s+/g, ' ').trim()

    if (text.split(/\s+/).length < 50) {
      return NextResponse.json(
        { error: 'Not enough text extracted. The article may be paywalled or login-required.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text, title: article.title ?? '' })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    console.error('Article extraction error:', message)
    return NextResponse.json(
      { error: 'Failed to extract article. Try copying and pasting the text directly.' },
      { status: 500 }
    )
  }
}
