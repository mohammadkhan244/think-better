import compromise from 'compromise'
import Sentiment from 'sentiment'

const sentimentAnalyzer = new Sentiment()

export function preprocessText(raw: string) {
  const text = raw.trim()
  const doc = compromise(text)
  const sentences: string[] = doc.sentences().out('array')
  const words: string[] = doc.terms().out('array')
  const wordCount = words.length
  const sentenceCount = sentences.length
  const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1)
  const sentimentScore = sentimentAnalyzer.analyze(text)

  return {
    raw: text,
    sentences,
    words,
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    sentimentScore,
    lower: text.toLowerCase()
  }
}

export function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, p) => {
    const matches = text.match(new RegExp(p.source, 'gi')) || []
    return acc + matches.length
  }, 0)
}

export function normalizeScore(
  positiveHits: number,
  negativeHits: number,
  wordCount: number,
  baseWeight = 100
): number {
  const normalized = ((positiveHits - negativeHits * 1.5) / Math.max(wordCount, 1)) * baseWeight
  return Math.min(10, Math.max(0, Math.round(5 + normalized)))
}
