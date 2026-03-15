import { NextRequest, NextResponse } from 'next/server'
import { getDocumentProxy, extractText } from 'unpdf'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const document = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(document, { mergePages: true })

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: 'Could not extract text from this PDF. Try copy-pasting the text directly.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text: text.trim() })
  } catch (err) {
    console.error('PDF extraction error:', err)
    return NextResponse.json(
      { error: 'Could not extract text from this PDF. Try copy-pasting the text directly.' },
      { status: 500 }
    )
  }
}
