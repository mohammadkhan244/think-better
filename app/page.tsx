import type { Metadata } from 'next'
import LandingClient from './LandingClient'

export const metadata: Metadata = {
  title: 'The Reasoning Machine — Not what to think. How to think.',
  description: 'Paste any argument, article, or claim. Get back exactly where it\'s strong, where it\'s exposed, and the questions that pressure-test it. Same input, same score, every time.',
  openGraph: {
    title: 'Confidence is not evidence.',
    description: 'The Reasoning Machine shows you the structure under the conviction — before you repeat it or act on it.',
    url: 'https://think-better-nine.vercel.app',
    siteName: 'The Reasoning Machine',
    images: [
      {
        url: 'https://think-better-nine.vercel.app/og-image.svg',
        width: 1200,
        height: 627,
        alt: 'The Reasoning Machine — Confidence is not evidence.',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Confidence is not evidence.',
    description: 'The Reasoning Machine shows you the structure under the conviction — before you repeat it or act on it.',
    images: ['https://think-better-nine.vercel.app/og-image.svg'],
  },
}

export default function LandingPage() {
  return <LandingClient />
}
