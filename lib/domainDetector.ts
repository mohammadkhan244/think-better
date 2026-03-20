export type Domain =
  | 'theological'
  | 'philosophical'
  | 'political'
  | 'personal'
  | 'business'
  | 'empirical'
  | 'general'

export interface DomainResult {
  domain: Domain
  confidence: 'high' | 'medium' | 'low'
}

// Keyword sets per domain — deterministic, no LLM
const SIGNALS: Record<Domain, RegExp[]> = {
  theological: [
    /\b(god|allah|jesus|christ|holy spirit|trinity|bible|quran|quranic|torah|scripture|sacred text)\b/i,
    /\b(surah|hadith|tafsir|sharia|caliph|uthman|ali ibn abi talib|companion of the prophet)\b/i,
    /\b(ramadan|mosque|islamic|revelation|religious law|religious interpretation)\b/i,
    /\b(theology|theological|divine|salvation|sin|prophet|prophethood|afterlife|heaven|hell|soul)\b/i,
    /\b(buddhism|hinduism|christianity|islam|judaism|faith tradition|denomination|scripture interpretation)\b/i,
    /\b(prayer|worship|ritual|pilgrimage|clergy|priesthood|sermon|covenant|resurrection)\b/i,
  ],
  philosophical: [
    /\b(epistemology|ontology|metaphysics|phenomenology|existentialism|ethics|moral philosophy)\b/i,
    /\b(consciousness|free will|determinism|qualia|a priori|a posteriori|categorical imperative)\b/i,
    /\b(socrates|plato|aristotle|kant|hegel|nietzsche|heidegger|wittgenstein|descartes|locke|hume)\b/i,
    /\b(philosophical|philosophy|dialectic|rationalism|empiricism|idealism|materialism|dualism)\b/i,
    /\b(moral realism|subjectivism|utilitarian|deontological|virtue ethics|normative)\b/i,
  ],
  political: [
    /\b(democracy|socialism|capitalism|liberalism|conservatism|fascism|communism|libertarian)\b/i,
    /\b(election|vote|policy|legislation|congress|senate|parliament|government|administration)\b/i,
    /\b(democrat|republican|left|right|progressive|conservative|partisan|political party)\b/i,
    /\b(immigration|tax|healthcare|gun control|abortion|climate policy|foreign policy|trade deal)\b/i,
    /\b(president|prime minister|senator|governor|politician|campaign|ballot|referendum)\b/i,
  ],
  personal: [
    /\bI (am|was|have|had|feel|felt|think|thought|believe|believe|know|knew|experienced)\b/i,
    /\bmy (life|experience|journey|story|struggle|success|failure|family|friend|relationship)\b/i,
    /\b(in my opinion|from my perspective|personally|speaking for myself|based on my experience)\b/i,
    /\b(diagnosed|trauma|recovery|mental health|anxiety|depression|grief|loss|healing)\b/i,
  ],
  business: [
    /\b(revenue|profit|margin|ROI|KPI|market share|customer acquisition|churn|burn rate)\b/i,
    /\b(startup|venture|enterprise|B2B|B2C|SaaS|product market fit|go-to-market|competitive moat)\b/i,
    /\b(quarterly|fiscal|earnings|valuation|funding|investment|IPO|acquisition|merger)\b/i,
    /\b(strategy|roadmap|stakeholder|deliverable|scalable|agile|pivot|disrupt|innovation)\b/i,
    /\b(CEO|CFO|CTO|board|investor|shareholder|employee|workforce|talent|hiring)\b/i,
  ],
  empirical: [
    /\b(study|studies|research|data|dataset|sample|control group|placebo|double-blind)\b/i,
    /\b(peer-reviewed|meta-analysis|systematic review|clinical trial|randomized|longitudinal)\b/i,
    /\b(p-value|statistical significance|confidence interval|regression|correlation|causation)\b/i,
    /\b(hypothesis|methodology|replication|findings|results|conclusion|evidence-based)\b/i,
  ],
  general: [],
}

export function detectDomain(text: string): DomainResult {
  const lower = text.toLowerCase()
  const scores: Record<Domain, number> = {
    theological: 0,
    philosophical: 0,
    political: 0,
    personal: 0,
    business: 0,
    empirical: 0,
    general: 0,
  }

  for (const [domain, patterns] of Object.entries(SIGNALS) as [Domain, RegExp[]][]) {
    for (const pattern of patterns) {
      const matches = lower.match(new RegExp(pattern.source, 'gi'))
      if (matches) scores[domain] += matches.length
    }
  }

  // IMPORTANT: theological override — if any theological signals fire,
  // religious/scripture/interpretive content always classifies as theological
  const theologicalSignals = scores.theological
  if (theologicalSignals >= 2) {
    const confidence = theologicalSignals >= 5 ? 'high' : theologicalSignals >= 3 ? 'medium' : 'low'
    return { domain: 'theological', confidence }
  }

  const top = (Object.entries(scores) as [Domain, number][])
    .filter(([d]) => d !== 'general')
    .sort(([, a], [, b]) => b - a)

  const [topDomain, topScore] = top[0]
  const [, secondScore] = top[1] ?? ['general', 0]

  if (topScore === 0) return { domain: 'general', confidence: 'low' }
  if (topScore < 2) return { domain: 'general', confidence: 'low' }

  const gap = topScore - secondScore
  const confidence = gap >= 4 ? 'high' : gap >= 2 ? 'medium' : 'low'

  return { domain: topDomain, confidence }
}
