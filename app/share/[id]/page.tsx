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
  const result = await kv.get(`share:${params.id}`)
  if (!result) notFound()
  return <ShareView result={result} />
}
