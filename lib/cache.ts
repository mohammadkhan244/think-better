import crypto from 'crypto'

interface CacheEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const TTL_MS = 60 * 60 * 1000

export function getCacheKey(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFromCache(key: string): any | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setInCache(key: string, result: any): void {
  cache.set(key, { result, timestamp: Date.now() })
}

export function clearCache(): void {
  cache.clear()
}
