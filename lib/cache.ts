import crypto from 'crypto'

interface CacheEntry {
  result: AnalysisResult
  timestamp: number
}

interface FloaterDimensionScore {
  score: number
  justification: string
}

interface FloaterResult {
  scores: Record<string, FloaterDimensionScore>
  overall: number
}

interface DetectedIssue {
  name: string
  type: 'bias' | 'fallacy'
  definition: string
  matchedText: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  floaterDimension: string
}

interface AnalysisResult {
  floater: FloaterResult
  biasesAndFallacies: DetectedIssue[]
  followUpQuestions: string[]
  summary: string
}

const cache = new Map<string, CacheEntry>()
const TTL_MS = 60 * 60 * 1000

export function getCacheKey(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex')
}

export function getFromCache(key: string): AnalysisResult | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.result
}

export function setInCache(key: string, result: AnalysisResult): void {
  cache.set(key, { result, timestamp: Date.now() })
}
