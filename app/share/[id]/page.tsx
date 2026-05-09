import { kv } from '@vercel/kv'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ShareView from './ShareView'

type Props = { params: { id: string } }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'The Reasoning Machine — Analysis',
    description: 'See how this argument scores on logic, evidence, and reasoning quality.',
  }
}

export default async function SharePage({ params }: Props) {
  const stored = await kv.get(`share:${params.id}`)
  if (!stored) notFound()
  // Support both old format (just the result object) and new format ({ result, originalText })
  const isNewFormat = stored !== null && typeof stored === 'object' && 'result' in (stored as object)
  const result = isNewFormat ? (stored as { result: unknown; originalText?: string }).result : stored
  const originalText = isNewFormat ? (stored as { result: unknown; originalText?: string }).originalText ?? '' : ''
  return <ShareView result={result} originalText={originalText} />
}
