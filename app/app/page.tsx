'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import InputTabs from '@/components/InputTabs'
import BiasCard from '@/components/BiasCard'
import SpeakerResults from '@/components/SpeakerResults'
import TrainingCard from '@/components/TrainingCard'
import type { TrainingScenario } from '@/components/TrainingCard'
import type { Improvement } from '@/lib/improvements'
import type { Domain } from '@/lib/domainDetector'

const FloaterChart = dynamic(() => import('@/components/FloaterChart'), { ssr: false })

interface Agency {
  framing: string
  bullets: string[]
}

interface Questions {
  defend: string[]
  challenge: string[]
  missing: string[]
}

interface BookEntry {
  title: string
  author: string
  category: string
  why: string
}

interface BeliefSystem {
  coreAssumptions: string[]
  loadBearingBeliefs: string[]
  incentiveSystem: string
  speakerComparison: { speaker: string; coreBeliefs: string[] }[] | null
}

interface SingleResult {
  mode: 'single'
  floater: { scores: Record<string, { score: number; justification: string }>; overall: number }
  biasesAndFallacies: { name: string; type: 'bias' | 'fallacy'; definition: string; matchedText: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; floaterDimension: string }[]
  improvements: Improvement[]
  followUpQuestions: Questions
  agency?: Agency
  domain?: { domain: Domain; confidence: string }
  resources?: { books: BookEntry[] }
  beliefSystem?: BeliefSystem
  defaultNarrative?: {
    narrative: string
    loadBearing: string
    whoBenefits: string
    ifItBreaksUpside: string
    ifItBreaksDownside: string
  }
  summary: string
  fromCache: boolean
}

interface MultiResult {
  mode: 'multi-speaker'
  diarizationMethod: 'deterministic' | 'llm' | 'failed'
  speakers: {
    speaker: string
    wordCount: number
    floater: { scores: Record<string, { score: number; justification: string }>; overall: number }
    biasesAndFallacies: { name: string; type: 'bias' | 'fallacy'; definition: string; matchedText: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; floaterDimension: string }[]
    improvements: Improvement[]
    followUpQuestions: Questions
    summary: string
  }[]
  domain?: { domain: Domain; confidence: string }
  beliefSystem?: BeliefSystem
  defaultNarrative?: {
    narrative: string
    loadBearing: string
    whoBenefits: string
    ifItBreaksUpside: string
    ifItBreaksDownside: string
  }
  resources?: { books: BookEntry[] }
  fromCache: boolean
}

type AnalysisResult = SingleResult | MultiResult
type FilterType = 'all' | 'fallacies' | 'biases'
type TabId = 'overview' | 'breakdown' | 'beliefs' | 'questions' | 'deeper'

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'overview',   emoji: '🎯', label: 'Overview'  },
  { id: 'breakdown',  emoji: '📊', label: 'Breakdown' },
  { id: 'beliefs',    emoji: '🧠', label: 'Beliefs'   },
  { id: 'questions',  emoji: '❓', label: 'Questions' },
  { id: 'deeper',     emoji: '📚', label: 'Deeper'    },
]

// ── Domain config ─────────────────────────────────────────────────────────────
const domainConfig: Partial<Record<Domain, { label: string; explanation: string }>> = {
  theological: {
    label: 'Theological Argument',
    explanation: 'In theological arguments, low Falsifiability and Replicability scores are expected — these dimensions were designed for empirical claims. Focus on Logic, Objectivity, and Alternatives instead. Weight the questions more than the numbers here.'
  },
  philosophical: {
    label: 'Philosophical Argument',
    explanation: 'Philosophical arguments are not empirically testable by design. Low Falsifiability and Replicability scores reflect the nature of the domain, not a flaw. Logic, Objectivity, and Alternative Explanations are the most meaningful dimensions here.'
  },
  political: {
    label: 'Political Argument',
    explanation: 'Political arguments often involve value claims that cannot be falsified. Evidence and Objectivity are the most useful dimensions to examine. Watch for framing effects and selective use of data.'
  },
  personal: {
    label: 'Personal or Anecdotal Argument',
    explanation: 'This text is primarily personal or experiential. FLOATER scores are most meaningful on structured arguments — Replicability and Evidence scores here reflect the absence of external sourcing, not the validity of the experience described.'
  },
  business: {
    label: 'Business or Strategic Argument',
    explanation: 'Business arguments often involve predictions under uncertainty. Evidence and Tentative Conclusions are the most useful dimensions. Watch for survivorship bias and overconfident projections.'
  },
  cultural: {
    label: 'Cultural & Social Argument',
    explanation: 'This argument operates as cultural or social criticism. Falsifiability and Replicability scores are less meaningful here — focus on Logic, Objectivity, and whether the argument seriously considers alternative explanations for the patterns it identifies.'
  },
  fiction: {
    label: 'Creative Writing',
    explanation: 'This appears to be creative or fictional writing. The Reasoning Machine analyzes argumentative reasoning — FLOATER scores, bias detection, and belief system extraction are not designed for fiction. The questions below treat the narrative structure as the subject.'
  }
}

// ── FLOATER blurbs ────────────────────────────────────────────────────────────
type SignalLabel = 'Limited signals detected' | 'Partial signals' | 'Moderate signals' | 'Strong signals' | 'Clear signals'

function getSignalLabel(score: number): SignalLabel {
  if (score >= 9.1) return 'Clear signals'
  if (score >= 7.1) return 'Strong signals'
  if (score >= 5.1) return 'Moderate signals'
  if (score >= 3.1) return 'Partial signals'
  return 'Limited signals detected'
}

function getTerrainLabel(overall: number): string {
  if (overall >= 9.1) return 'Strong'
  if (overall >= 7.1) return 'Solid'
  if (overall >= 5.1) return 'Moderate'
  if (overall >= 3.1) return 'Mixed'
  return 'Fragile'
}

const floaterBlurbs: Record<string, {
  name: string
  what: string
  signalLabels: Record<SignalLabel, string>
}> = {
  F: {
    name: 'Falsifiability',
    what: 'Can this claim be tested or disproven? Arguments with clear, testable predictions score higher. Vague or unfalsifiable claims score lower.',
    signalLabels: {
      'Limited signals detected': 'The claims here are difficult to test or disprove — they may be too vague, subjective, or structured to be immune to counterevidence.',
      'Partial signals': 'Some claims are testable, but others rely on definitions or framing that make them hard to disprove.',
      'Moderate signals': 'Most claims are reasonably testable, with some room to sharpen the definitions.',
      'Strong signals': 'The argument makes clear, testable claims that could be disproven with the right evidence.',
      'Clear signals': 'Exemplary — every major claim is specific and testable.'
    }
  },
  L: {
    name: 'Logic',
    what: 'Do the conclusions follow from the premises? This dimension checks for valid reasoning structure, consistent logic, and the absence of logical fallacies.',
    signalLabels: {
      'Limited signals detected': 'The logical connections between claims and conclusions are weak or missing — conclusions may not follow from what was actually argued.',
      'Partial signals': 'The reasoning holds in places but has gaps where the logic jumps or relies on unstated assumptions.',
      'Moderate signals': 'Generally sound reasoning with a few logical steps that could be made more explicit.',
      'Strong signals': 'The argument is logically coherent — conclusions follow from premises with few gaps.',
      'Clear signals': 'Rigorous logical structure throughout.'
    }
  },
  O: {
    name: 'Objectivity',
    what: 'Is the evidence evaluated honestly? This dimension checks for bias signals, emotional language, and whether opposing evidence is acknowledged.',
    signalLabels: {
      'Limited signals detected': 'The argument shows strong signs of motivated reasoning — evidence appears to be selected to confirm a conclusion already reached.',
      'Partial signals': "Some acknowledgment of complexity, but the overall framing leans toward confirming the author's existing position.",
      'Moderate signals': 'Reasonably balanced, with occasional one-sided framing.',
      'Strong signals': 'The argument engages honestly with evidence and acknowledges complexity.',
      'Clear signals': 'Exemplary objectivity — counterevidence is addressed, not avoided.'
    }
  },
  A: {
    name: 'Alternative Explanations',
    what: 'Are competing explanations considered? Strong arguments acknowledge other ways to interpret the evidence and explain why they prefer their explanation.',
    signalLabels: {
      'Limited signals detected': 'No alternative explanations are considered — the argument treats its interpretation as the only possible one.',
      'Partial signals': 'One or two alternatives are gestured at but not seriously engaged.',
      'Moderate signals': 'Some competing explanations acknowledged, though not all are fully addressed.',
      'Strong signals': 'The argument meaningfully engages with alternative interpretations.',
      'Clear signals': 'Comprehensive — competing hypotheses are considered and addressed.'
    }
  },
  T: {
    name: 'Tentative Conclusions',
    what: 'Are conclusions proportionate to the evidence? This dimension checks whether the argument overclaims certainty or appropriately hedges its conclusions.',
    signalLabels: {
      'Limited signals detected': 'Conclusions are stated with much more certainty than the evidence supports — hedging language is absent.',
      'Partial signals': 'Some conclusions are appropriately qualified, but key claims are stated with more confidence than the evidence justifies.',
      'Moderate signals': 'Generally proportionate conclusions with occasional overreach.',
      'Strong signals': 'Conclusions are well-calibrated to the evidence — certainty is earned, not assumed.',
      'Clear signals': 'Exemplary epistemic humility — conclusions are precisely proportioned to evidence.'
    }
  },
  E: {
    name: 'Evidence',
    what: 'Is the evidence cited, relevant, and sufficient? This dimension checks for sourcing, data quality, and whether the evidence actually supports the claims being made.',
    signalLabels: {
      'Limited signals detected': 'Claims are made without evidence — no citations, data, or sourcing detected.',
      'Partial signals': 'Some evidence is present but it is anecdotal, incomplete, or not directly relevant to the claims.',
      'Moderate signals': 'Evidence is present and relevant, though more sourcing would strengthen the argument.',
      'Strong signals': 'Well-evidenced — claims are supported with relevant, credible sourcing.',
      'Clear signals': 'Comprehensive evidence with strong sourcing throughout.'
    }
  },
  R: {
    name: 'Replicability',
    what: 'Could someone else verify this? This dimension checks whether the sources, methods, and reasoning are transparent enough for independent verification.',
    signalLabels: {
      'Limited signals detected': 'No methodology or sourcing is described — the claims cannot be independently verified from this text.',
      'Partial signals': 'Some sourcing is present but the reasoning or methods are not transparent enough to fully verify.',
      'Moderate signals': 'Reasonably verifiable with some gaps in sourcing or methodology.',
      'Strong signals': 'The argument is largely verifiable — sources and reasoning are transparent.',
      'Clear signals': 'Fully transparent — sources, methods, and reasoning are all verifiable.'
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getWhatThisMeans(overall: number, issueCount: number): string {
  if (overall < 4)
    return `This reasoning contains ${issueCount > 0 ? `${issueCount} structural pattern${issueCount !== 1 ? 's' : ''}` : 'several areas'} where conclusions depend on untested assumptions. The questions below will sharpen any decision built on top of it.`
  if (overall < 7)
    return `This reasoning has real structure, but some of the load-bearing claims rest on assumptions worth examining. The questions below help stress-test them.`
  return `The reasoning shows relatively strong structure. A few targeted questions could make it more robust.`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{
        flexShrink: 0, fontSize: '0.75rem', padding: '4px 8px',
        border: '1px solid #2e2e2e', background: 'transparent',
        color: copied ? '#c8a84b' : '#444440', cursor: 'pointer',
        whiteSpace: 'nowrap', fontFamily: 'monospace', transition: 'color 0.15s'
      }}
    >
      {copied ? 'copied' : 'copy'}
    </button>
  )
}

function ImprovementCard({ imp }: { imp: Improvement }) {
  const [lookUpOpen, setLookUpOpen] = useState(false)
  const label = imp.dimensionLabel
    ? `${imp.dimension} — ${imp.dimensionLabel}`
    : imp.issueLabel ?? 'Gap'
  return (
    <div style={{ borderLeft: '3px solid #c8a84b', paddingLeft: '16px', marginBottom: '24px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c8a84b', marginBottom: '8px' }}>
        {label}
      </div>
      {imp.specificAdvice ? (
        <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#e8e8e0', lineHeight: '1.6', margin: '0 0 10px 0' }}>{imp.specificAdvice}</p>
      ) : (
        <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#e8e8e0', lineHeight: '1.6', margin: '0 0 10px 0' }}>{imp.gap}</p>
      )}
      {imp.textEvidence && (
        <div style={{ marginBottom: '10px', padding: '8px 12px', background: '#141414', borderLeft: '2px solid #2e2e2e' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#a8a89a', fontStyle: 'italic', lineHeight: '1.5', margin: '0 0 4px 0' }}>
            &ldquo;{imp.textEvidence}&rdquo;
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#666660', margin: 0 }}>from the submitted text</p>
        </div>
      )}
      {imp.nextStep && (
        <div style={{ marginBottom: '10px', padding: '8px 12px', background: 'rgba(200, 168, 75, 0.04)', border: '1px solid rgba(200, 168, 75, 0.15)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c8a84b', margin: '0 0 4px 0' }}>Next step</p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#e8e8e0', lineHeight: '1.5', margin: 0 }}>{imp.nextStep}</p>
        </div>
      )}
      {imp.contraryResource && (
        <p style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#666660', lineHeight: '1.5', margin: '0 0 8px 0' }}>
          Read: {imp.contraryResource}
        </p>
      )}
      {(imp.lookUp?.length > 0 || imp.perspective) && (
        <button
          onClick={() => setLookUpOpen(o => !o)}
          style={{ background: 'transparent', border: 'none', color: '#444440', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'monospace', padding: 0 }}
        >
          {lookUpOpen ? '↑ less' : '↓ more'}
        </button>
      )}
      {lookUpOpen && (
        <div style={{ marginTop: '8px' }}>
          {imp.perspective && (
            <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#666660', fontStyle: 'italic', lineHeight: '1.6', margin: '0 0 8px 0' }}>{imp.perspective}</p>
          )}
          {imp.lookUp?.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {imp.lookUp.map((item, i) => (
                <li key={i} style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#666660' }}>
                  <span style={{ color: '#444440', marginRight: '6px' }}>·</span>{item}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function ShareButton({ result, originalText }: { result: AnalysisResult; originalText: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [hovered, setHovered] = useState(false)
  const [doneLabel, setDoneLabel] = useState('link copied')
  const [canShare] = useState(() => typeof navigator !== 'undefined' && 'share' in navigator)

  const handle = async () => {
    if (state !== 'idle') return
    setState('loading')
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, originalText }),
      })
      const { url } = await res.json()
      if (canShare) {
        try {
          await navigator.share({ url, title: 'The Reasoning Machine — Analysis' })
          setDoneLabel('shared ✓')
        } catch { /* cancelled */ }
      } else {
        await navigator.clipboard.writeText(url)
        setDoneLabel('link copied')
      }
    } catch {
      await navigator.clipboard.writeText(window.location.origin)
      setDoneLabel('link copied')
    }
    setState('done')
    setTimeout(() => setState('idle'), 2000)
  }

  const label = state === 'loading' ? '...' : state === 'done' ? doneLabel : 'share ↗'
  const bg = hovered && state === 'idle' ? '#c8a84b' : 'transparent'
  const color = state !== 'idle' ? '#c8a84b' : hovered ? '#0e0e0e' : '#c8a84b'

  return (
    <button
      onClick={handle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 16px', background: bg,
        border: '1px solid #c8a84b', color,
        fontSize: '0.75rem', cursor: 'pointer',
        fontFamily: 'monospace', transition: 'all 0.15s ease', whiteSpace: 'nowrap'
      }}
    >
      {label}
    </button>
  )
}

function QuestionGroup({ title, subhead, questions, startIndex, isLast }: {
  title: string; subhead: string; questions: string[]; startIndex: number; isLast?: boolean
}) {
  return (
    <div style={{
      marginBottom: isLast ? 0 : '32px',
      paddingBottom: isLast ? 0 : '24px',
      borderBottom: isLast ? 'none' : '1px solid #2e2e2e'
    }}>
      <h3 style={{ fontFamily: 'monospace', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c8a84b', marginBottom: '6px', marginTop: 0 }}>
        {title}
      </h3>
      <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', marginBottom: '16px', fontStyle: 'italic', marginTop: 0 }}>
        {subhead}
      </p>
      <ol style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px', margin: 0 }}>
        {questions.map((q, i) => (
          <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.6, color: '#e8e8e0' }}>
            <span><span style={{ color: '#444440', marginRight: '8px' }}>{startIndex + i}.</span>{q}</span>
            <CopyButton text={q} />
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<TabId>('questions')
  const [originalText, setOriginalText] = useState('')
  // Progress state
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [progressDetail, setProgressDetail] = useState('')
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (progressInterval) clearInterval(progressInterval)
    }
  }, [progressInterval])

  useEffect(() => {
    const prefill = sessionStorage.getItem('rm_prefill')
    if (prefill) {
      sessionStorage.removeItem('rm_prefill')
      setPrefillText(prefill)
      handleAnalyze(prefill, 'text')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  // Training state
  const [trainingPattern, setTrainingPattern] = useState<string | null>(null)
  const [trainingScenario, setTrainingScenario] = useState<TrainingScenario | null>(null)
  const [trainingLoading, setTrainingLoading] = useState(false)
  const [beliefTraining, setBeliefTraining] = useState<TrainingScenario | null>(null)
  const [beliefTrainingLoading, setBeliefTrainingLoading] = useState(false)
  const [incentiveTraining, setIncentiveTraining] = useState<TrainingScenario | null>(null)
  const [incentiveTrainingLoading, setIncentiveTrainingLoading] = useState(false)
  const [narrativeTraining, setNarrativeTraining] = useState<TrainingScenario | null>(null)
  const [narrativeTrainingLoading, setNarrativeTrainingLoading] = useState(false)
  const [showAllImprovements, setShowAllImprovements] = useState(false)
  const [prefillText, setPrefillText] = useState('')
  const [feedbackCopied, setFeedbackCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleExpanded = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const handleFeedback = async () => {
    try {
      await navigator.clipboard.writeText('mohammadkhan@themohammadkhan.com')
      setFeedbackCopied(true)
      setTimeout(() => setFeedbackCopied(false), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = 'mohammadkhan@themohammadkhan.com'
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setFeedbackCopied(true)
      setTimeout(() => setFeedbackCopied(false), 2000)
    }
  }

  const startProgress = (wordCount = 0) => {
    setProgress(0)
    setProgressLabel('Reading the text...')
    setProgressDetail(wordCount > 0 ? `${wordCount.toLocaleString()} words loaded` : '')

    const stages = [
      { target: 7,  label: 'Reading the text...',                detail: wordCount > 0 ? `${wordCount.toLocaleString()} words loaded` : 'Parsing input',                                           duration: 1000  },
      { target: 16, label: 'Scoring the reasoning...',           detail: 'Running FLOATER — 7 dimensions including Falsifiability, Logic, and Evidence',                                           duration: 4000  },
      { target: 27, label: 'Finding the assumptions...',         detail: 'Surfacing what this argument treats as obviously true — the water it swims in',                                          duration: 7000  },
      { target: 36, label: 'Checking for bias patterns...',      detail: 'Scanning against 40+ known cognitive biases and logical fallacies',                                                     duration: 5000  },
      { target: 46, label: 'Surfacing the default narrative...', detail: 'What cultural story is this argument taking for granted?',                                                              duration: 7000  },
      { target: 55, label: 'Detecting the incentive field...',   detail: 'Who benefits if this argument wins? What does the author gain from being right?',                                       duration: 6000  },
      { target: 63, label: 'Building the questions...',          detail: "Generating the sharpest challenges to this argument's weakest points",                                                  duration: 7000  },
      { target: 70, label: 'Gathering the books...',             detail: 'Finding what challenges or expands the framing — not more of what you already believe',                                 duration: 7000  },
      { target: 75, label: 'Finishing up...',                    detail: 'Almost there',                                                                                                          duration: 10000 },
    ]

    let currentStage = 0
    let currentProgress = 0
    let stageStartProgress = 0

    const interval = setInterval(() => {
      if (currentStage >= stages.length) return

      const stage = stages[currentStage]
      const totalTicks = stage.duration / 100
      const increment = (stage.target - stageStartProgress) / totalTicks

      currentProgress = Math.min(currentProgress + increment, stage.target)
      setProgress(Math.round(currentProgress))
      setProgressLabel(stage.label)
      setProgressDetail(stage.detail)

      if (currentProgress >= stage.target) {
        stageStartProgress = stage.target
        currentStage++
      }
    }, 100)

    setProgressInterval(interval)
    return interval
  }

  const completeProgress = (interval: NodeJS.Timeout) => {
    clearInterval(interval)
    setProgress(100)
    setProgressLabel('Done.')
    setProgressDetail('')
    setTimeout(() => {
      setProgress(0)
      setProgressLabel('')
    }, 600)
  }

  const handleAnalyze = async (text: string, sourceType: string) => {
    setIsLoading(true)
    setError('')
    setResult(null)
    setExpanded({})
    setActiveTab('questions')
    setOriginalText(text)
    setTrainingPattern(null)
    setTrainingScenario(null)
    setBeliefTraining(null)
    setIncentiveTraining(null)
    setNarrativeTraining(null)
    setShowAllImprovements(false)
    const interval = startProgress(text.trim().split(/\s+/).filter(Boolean).length)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceType }),
      })
      const data = await res.json()
      completeProgress(interval)
      if (data.error) setError(data.error)
      else {
        setResult(data)
      }
    } catch {
      clearInterval(interval)
      setProgress(0)
      setProgressLabel('')
      setProgressDetail('')
      setError('Analysis failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePatternTraining = async (patternName: string) => {
    if (trainingPattern === patternName) {
      setTrainingPattern(null)
      setTrainingScenario(null)
      return
    }
    setTrainingPattern(patternName)
    setTrainingScenario(null)
    setTrainingLoading(true)
    const data = await fetch('/api/training/pattern', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patternName })
    }).then(r => r.json())
    setTrainingScenario(data.scenario)
    setTrainingLoading(false)
  }

  const handleBeliefTraining = async () => {
    if (beliefTraining) {
      setBeliefTraining(null)
      return
    }
    setBeliefTrainingLoading(true)
    const res = await fetch('/api/training/belief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: originalText,
        coreAssumptions: (result as SingleResult)?.beliefSystem?.coreAssumptions ?? [],
        domain: (result as SingleResult)?.domain?.domain ?? 'general'
      })
    }).then(r => r.json())
    setBeliefTraining(res.scenario)
    setBeliefTrainingLoading(false)
  }

  const handleNarrativeTraining = async () => {
    if (narrativeTraining) {
      setNarrativeTraining(null)
      return
    }
    setNarrativeTrainingLoading(true)
    const res = await fetch('/api/training/narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        narrative: (result as SingleResult)?.defaultNarrative?.narrative ?? '',
        domain: (result as SingleResult)?.domain?.domain ?? 'general'
      })
    }).then(r => r.json())
    setNarrativeTraining(res.scenario)
    setNarrativeTrainingLoading(false)
  }

  const handleIncentiveTraining = async () => {
    if (incentiveTraining) {
      setIncentiveTraining(null)
      return
    }
    setIncentiveTrainingLoading(true)
    const res = await fetch('/api/training/incentive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: originalText,
        incentiveSystem: (result as SingleResult)?.beliefSystem?.incentiveSystem ?? '',
        domain: (result as SingleResult)?.domain?.domain ?? 'general'
      })
    }).then(r => r.json())
    setIncentiveTraining(res.scenario)
    setIncentiveTrainingLoading(false)
  }

  const single = result?.mode === 'single' ? result : null
  const multi = result?.mode === 'multi-speaker' ? result : null
  const isFiction = result !== null && result.mode === 'single' && result.domain?.domain === 'fiction'

  const filteredIssues = single?.biasesAndFallacies.filter(issue => {
    if (filter === 'all') return true
    if (filter === 'fallacies') return issue.type === 'fallacy'
    return issue.type === 'bias'
  }) ?? []

  const patternCount = single?.biasesAndFallacies.length ?? 0
  const terrainLabel = single ? getTerrainLabel(single.floater.overall) : ''
  const domainDisplay = single?.domain?.domain &&
    single.domain.domain !== 'general' &&
    single.domain.domain !== 'empirical'
    ? (domainConfig[single.domain.domain]?.label ?? '')
    : ''

  const hasResults = !!(single || multi) && !isLoading

  // Helper: show a section on mobile only if its tab is active; on desktop always show
  const tabClass = (tabId: TabId) =>
    activeTab === tabId ? 'md:block' : 'hidden md:block'

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-[#e8e8e0]">

      <button
        onClick={handleFeedback}
        title="Send feedback"
        style={{
          position: 'fixed',
          bottom: isMobile ? 'calc(56px + 12px + env(safe-area-inset-bottom))' : '24px',
          right: '16px',
          zIndex: 300,
          padding: '8px 14px',
          background: feedbackCopied ? 'rgba(200, 168, 75, 0.15)' : 'rgba(14, 14, 14, 0.9)',
          border: feedbackCopied ? '1px solid #c8a84b' : '1px solid #2e2e2e',
          color: feedbackCopied ? '#c8a84b' : '#666660',
          fontSize: '0.72rem',
          letterSpacing: '0.04em',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(8px)',
          fontFamily: 'monospace',
        }}
      >
        {feedbackCopied ? '✓ Copied!' : 'Feedback'}
      </button>

      {/* ── Single column, max 800px on desktop ── */}
      <div className="md:max-w-[800px] md:mx-auto md:px-6">

        {/* ── Header + Input ── */}
        <div className="px-6 pt-16 pb-6 md:pt-16 md:pb-6 md:px-0">
          <header className="mb-8">
            <Link
              href="/"
              style={{ display: 'inline-block', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#444440', textDecoration: 'none', marginBottom: '20px', letterSpacing: '0.04em' }}
            >
              ← back
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.6rem', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1, userSelect: 'none' }}>
                  <span style={{ color: '#c8a84b' }}>[</span>
                  <span style={{ color: 'rgba(200,168,75,0.3)' }}>[</span>
                  <span style={{ color: 'rgba(200,168,75,0.3)' }}>]</span>
                  <span style={{ color: '#c8a84b' }}>]</span>
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', fontWeight: 400, letterSpacing: '0.16em', color: '#e8e8e0', textTransform: 'uppercase', lineHeight: 1.3 }}>
                  The Reasoning<br />Machine
                </div>
              </div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', color: '#888880', margin: 0, textTransform: 'uppercase' }}>
                Not what to think — how to think.
              </p>
            </div>
            <p className="text-sm font-mono text-[#e8e8e0] leading-relaxed mb-1">
              Most people argue from conviction. This shows you what&apos;s underneath it.
            </p>
            <p className="text-xs font-mono text-[#666660] leading-relaxed mb-1">
              Paste any argument, article, or claim. Get back exactly where it&apos;s strong, where it&apos;s exposed, and the questions that pressure-test it.
            </p>
            <p className="text-xs font-mono text-[#444440]">
              Text, PDF, article URL, or YouTube link.
            </p>
          </header>

          <section className="mb-8">
            <InputTabs onAnalyze={handleAnalyze} isLoading={isLoading} defaultText={prefillText} />
          </section>

          {error && (
            <div className="border border-[#c0392b] p-4 mb-6">
              <p className="text-xs font-mono text-[#c0392b]">{error}</p>
            </div>
          )}

          {/* ── Score card: sticky on mobile, in-flow on desktop ── */}
          {single && !isLoading && (
            <div
              className="sticky top-0 z-10 md:static md:z-auto bg-[#0e0e0e] md:bg-transparent"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #2e2e2e',
                marginBottom: '4px',
              }}
            >
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666660', marginBottom: '4px' }}>
                  Reasoning Breakdown
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, color: '#e8e8e0', lineHeight: 1 }}>
                  {terrainLabel}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666660' }}>
                  {patternCount} pattern{patternCount !== 1 ? 's' : ''} detected
                </div>
                {domainDisplay && (
                  <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#444440' }}>
                    {domainDisplay}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {single.fromCache && (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#444440' }}>⚡ cached</span>
                  )}
                  <ShareButton result={single} originalText={originalText} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Content area ── */}
        <div className="px-6 pb-[72px] md:px-0 md:pb-16">

          {isLoading && (
            <div style={{ marginTop: '24px', padding: '20px 0', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ width: '100%', height: '3px', background: '#2e2e2e', borderRadius: '2px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#c8a84b', borderRadius: '2px', transition: 'width 0.1s ease-out' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, marginRight: '16px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#e8e8e0', marginBottom: '5px' }}>
                    {progressLabel}
                  </div>
                  {progressDetail && (
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#444440', lineHeight: '1.5' }}>
                      {progressDetail}
                    </div>
                  )}
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#c8a84b', fontWeight: 600, flexShrink: 0 }}>
                  {progress}%
                </span>
              </div>
              {originalText.trim().split(/\s+/).filter(Boolean).length > 2000 && (
                <div style={{ marginTop: '14px', fontFamily: 'monospace', fontSize: '0.7rem', color: '#666660', fontStyle: 'italic' }}>
                  Large text — analysis may take up to a minute.
                </div>
              )}
            </div>
          )}

          {/* Multi-speaker results */}
          {multi && !isLoading && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase">
                  Speaker Analysis — {multi.speakers.length} speakers detected
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {multi.fromCache && (
                    <span className="text-xs font-mono text-[#444440] border border-[#2e2e2e] px-1.5 py-0.5">⚡ cached</span>
                  )}
                  <ShareButton result={multi} originalText={originalText} />
                </div>
              </div>
              <SpeakerResults speakers={multi.speakers} diarizationMethod={multi.diarizationMethod} />

              {/* ── Global analysis: Belief System ── */}
              {multi.beliefSystem && multi.beliefSystem.coreAssumptions.length > 0 && (
                <section style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #2e2e2e' }}>
                  <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-3">Operating Belief System</h2>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#666660', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '24px', marginTop: 0 }}>
                    What this conversation assumes to be true — never stated, but load-bearing.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {multi.beliefSystem.coreAssumptions.length > 0 && (
                      <div>
                        <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '8px', marginTop: 0 }}>Core Assumptions</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {multi.beliefSystem.coreAssumptions.map((a, i) => (
                            <li key={i} style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#e8e8e0' }}>
                              <span style={{ color: '#666660', marginRight: '8px' }}>·</span>{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {multi.beliefSystem.loadBearingBeliefs.length > 0 && (
                      <div>
                        <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '8px', marginTop: 0 }}>If These Were False, The Argument Collapses</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {multi.beliefSystem.loadBearingBeliefs.map((b, i) => (
                            <li key={i} style={{ paddingLeft: '20px', position: 'relative', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#e8e8e0' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#c8a84b' }}>→</span>{b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {multi.beliefSystem.incentiveSystem && (
                      <div>
                        <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '8px', marginTop: 0 }}>Incentive System</p>
                        <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#666660', fontStyle: 'italic', lineHeight: '1.6', margin: 0, borderLeft: '2px solid #2e2e2e', paddingLeft: '12px' }}>
                          {multi.beliefSystem.incentiveSystem}
                        </p>
                      </div>
                    )}
                    {multi.beliefSystem.speakerComparison && multi.beliefSystem.speakerComparison.length > 0 && (
                      <div>
                        <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '8px', marginTop: 0 }}>Where The Belief Systems Actually Diverge</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {multi.beliefSystem.speakerComparison.map((s, i) => (
                            <div key={i} style={{ padding: '12px 14px', border: '1px solid #2e2e2e', background: '#141414' }}>
                              <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#c8a84b', marginBottom: '8px', marginTop: 0 }}>{s.speaker}</p>
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {s.coreBeliefs.map((b, j) => (
                                  <li key={j} style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#e8e8e0' }}>
                                    <span style={{ color: '#666660', marginRight: '8px' }}>·</span>{b}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── Global analysis: Default Narrative ── */}
              {multi.defaultNarrative?.narrative && (
                <section style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #2e2e2e' }}>
                  <h2 style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a84b', marginBottom: '4px', marginTop: 0, fontWeight: 600 }}>Default Narrative</h2>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', fontStyle: 'italic', marginBottom: '20px', marginTop: 0 }}>
                    The cultural story this conversation is swimming in — never examined because it reads as reality.
                  </p>
                  <div style={{ padding: '14px 16px', border: '1px solid #c8a84b', background: 'rgba(200, 168, 75, 0.04)', marginBottom: '16px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c8a84b', marginBottom: '6px' }}>The Narrative</div>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.95rem', lineHeight: '1.6', color: '#e8e8e0', margin: 0, fontStyle: 'italic' }}>
                      &ldquo;{multi.defaultNarrative.narrative}&rdquo;
                    </p>
                  </div>
                  {[
                    { label: 'What Makes It Load-Bearing',              value: multi.defaultNarrative.loadBearing },
                    { label: 'Who Benefits From It Staying Invisible',  value: multi.defaultNarrative.whoBenefits },
                    { label: 'If It Breaks — What Becomes Possible',    value: multi.defaultNarrative.ifItBreaksUpside },
                    { label: 'If It Breaks — What Gets Destabilized',   value: multi.defaultNarrative.ifItBreaksDownside },
                  ].map((row, i) => (
                    <div key={i} style={{ paddingTop: '12px', paddingBottom: '12px', borderBottom: i < 3 ? '1px solid #2e2e2e' : 'none' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '4px' }}>{row.label}</div>
                      <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#e8e8e0', margin: 0 }}>{row.value}</p>
                    </div>
                  ))}
                </section>
              )}

              {/* ── Global analysis: Go Deeper ── */}
              {(multi.resources?.books?.length ?? 0) > 0 && (
                <section style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #2e2e2e' }}>
                  <h2 style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a84b', marginBottom: '8px', marginTop: 0, fontWeight: 600 }}>Go Deeper</h2>
                  <p style={{ fontSize: '0.8rem', color: '#666660', fontStyle: 'italic', marginBottom: '20px', fontFamily: 'monospace' }}>
                    Three angles you haven&apos;t considered — not more of what you already believe.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {multi.resources!.books.map((book: BookEntry, i: number) => (
                      <div key={i} style={{ padding: '14px 16px', border: '1px solid #2e2e2e', background: '#141414' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666660', marginBottom: '4px' }}>
                          {book.category}
                          <span style={{ textTransform: 'none', letterSpacing: 'normal', fontStyle: 'italic', marginLeft: '6px', opacity: 0.7 }}>
                            — {({ Eyewitness: 'Closest to the problem', Explainer: 'Connects this to something larger', Expert: 'Deep in the field' } as Record<string, string>)[book.category] || book.category}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 600, marginBottom: '2px', color: '#e8e8e0' }}>{book.title}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', marginBottom: '8px' }}>{book.author}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#e8e8e0', lineHeight: '1.5' }}>{book.why}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}

          {/* ── Single-speaker results ── */}
          {single && !isLoading && (
            <div className="animate-fadeIn">

              {/*
                Desktop order (all sections always visible):
                  1. Domain banner + What This Means  (overview-top)
                  2. FLOATER + Patterns               (breakdown)
                  3. Beliefs                          (beliefs)
                  4. Agency + Summary                 (overview-bottom)
                  5. Questions                        (questions)
                  6. Go Deeper                        (deeper)

                Mobile: only the active tab's section(s) are visible.
                The `tabClass` helper applies `hidden md:block` for inactive tabs,
                so hidden on mobile but always shown on desktop.
              */}

              {/* ── 1. Domain banner + What This Means (overview-top) ── */}
              <div className={tabClass('overview')}>
                {single.domain?.domain &&
                 single.domain.domain !== 'general' &&
                 single.domain.domain !== 'empirical' &&
                 domainConfig[single.domain.domain] && (
                  <div style={{
                    borderLeft: '3px solid #c8a84b',
                    padding: '14px 16px',
                    marginBottom: '24px',
                    background: 'rgba(200, 168, 75, 0.06)'
                  }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a84b', marginBottom: '6px', fontWeight: 600 }}>
                      {domainConfig[single.domain.domain]!.label}
                    </div>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#666660', lineHeight: '1.6', margin: 0 }}>
                      {domainConfig[single.domain.domain]!.explanation}
                    </p>
                  </div>
                )}
                <div className="border border-[#2e2e2e] p-4 mb-6">
                  <p className="text-xs font-mono text-[#444440] tracking-widest uppercase mb-2">What This Means</p>
                  <p className="text-xs font-mono text-[#666660] leading-relaxed">
                    {getWhatThisMeans(single.floater.overall, single.biasesAndFallacies.length)}
                  </p>
                </div>
              </div>

              {/* ── 2. FLOATER radar + Reasoning Patterns (breakdown) ── */}
              <div className={tabClass('breakdown')}>
                <section className="mb-6">
                  <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-4">FLOATER Scorecard</h2>
                  <FloaterChart scores={single.floater.scores} />
                  <div className="mt-4">
                    {Object.entries(floaterBlurbs).map(([key, dim]) => {
                      const scoreData = single.floater.scores[key]
                      if (!scoreData) return null
                      const signalLabel = getSignalLabel(scoreData.score)
                      const isOpen = expanded[key]
                      return (
                        <div key={key} style={{ borderBottom: '1px solid #2e2e2e', padding: '12px 0' }}>
                          <div
                            onClick={() => toggleExpanded(key)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#c8a84b', fontSize: '0.9rem' }}>{key}</span>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#e8e8e0' }}>{dim.name}</span>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666660', fontStyle: 'italic' }}>— {signalLabel}</span>
                            </div>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#c8a84b', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                              {isOpen ? 'hide ↑' : 'what does this mean? ↓'}
                            </span>
                          </div>
                          {isOpen && (
                            <div style={{ marginTop: '10px', borderLeft: '2px solid #2e2e2e', paddingLeft: '12px' }}>
                              <div style={{ borderLeft: '3px solid #c8a84b', paddingLeft: '10px', marginBottom: '12px' }}>
                                <p style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#c8a84b', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Why this score</p>
                                <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#e8e8e0', lineHeight: '1.6', margin: 0 }}>
                                  {scoreData.justification}
                                </p>
                              </div>
                              {(() => {
                                const quotes = single.biasesAndFallacies.filter(p => p.floaterDimension === key && p.matchedText).slice(0, 2)
                                return quotes.length > 0 ? (
                                  <div style={{ marginBottom: '12px' }}>
                                    {quotes.map((p, i) => (
                                      <div key={i} style={{ borderLeft: '3px solid #3a3a2e', paddingLeft: '10px', marginBottom: i < quotes.length - 1 ? '8px' : 0 }}>
                                        <p style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#a8a89a', fontStyle: 'italic', lineHeight: '1.5', margin: '0 0 2px 0' }}>
                                          &ldquo;{p.matchedText}&rdquo;
                                        </p>
                                        <p style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#666660', margin: 0 }}>{p.name}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : null
                              })()}
                              <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#666660', lineHeight: '1.6', marginBottom: '8px', marginTop: 0 }}>
                                {dim.what}
                              </p>
                              <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#e8e8e0', lineHeight: '1.6', margin: 0 }}>
                                {dim.signalLabels[signalLabel]}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>

                {!isFiction && (
                <section className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase">
                      Reasoning Patterns Detected ({single.biasesAndFallacies.length})
                    </h2>
                    <div className="flex gap-1">
                      {(['all', 'fallacies', 'biases'] as FilterType[]).map(f => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`text-xs font-mono px-3 py-1 border transition-colors ${
                            filter === f ? 'border-[#c8a84b] text-[#c8a84b]' : 'border-[#2e2e2e] text-[#444440] hover:border-[#444440]'
                          }`}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {filteredIssues.length > 0 ? (
                    <div className="space-y-2">
                      {filteredIssues.map((issue, i) => (
                        <div key={i}>
                          <BiasCard {...issue} />
                          <button
                            onClick={() => handlePatternTraining(issue.name)}
                            style={{
                              marginTop: '10px',
                              padding: '6px 0',
                              background: 'transparent',
                              border: 'none',
                              color: '#444440',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontFamily: 'monospace'
                            }}
                          >
                            {trainingPattern === issue.name ? '↑ Close practice' : 'Practice spotting this →'}
                          </button>
                          {trainingPattern === issue.name && (
                            trainingLoading
                              ? <div style={{ fontSize: '0.8rem', color: '#666660', marginTop: '8px', fontFamily: 'monospace' }}>Loading scenario...</div>
                              : trainingScenario
                                ? <TrainingCard
                                    scenario={trainingScenario}
                                    onClose={() => { setTrainingPattern(null); setTrainingScenario(null) }}
                                  />
                                : null
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-[#444440]">No common bias or fallacy patterns detected.</p>
                  )}
                </section>
                )}
              </div>

              {/* ── 3. Operating Belief System (beliefs) ── */}
              {!isFiction && (
              <div className={tabClass('beliefs')}>
                <section className="mb-6">
                  <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-3">
                    Operating Belief System
                  </h2>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#666660', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '24px', marginTop: 0 }}>
                    What this argument assumes to be true — never stated, but load-bearing.
                  </p>
                  {single.beliefSystem && single.beliefSystem.coreAssumptions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                      {/* Core Assumptions */}
                      {single.beliefSystem.coreAssumptions.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                          <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '8px', marginTop: 0 }}>Core Assumptions</p>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {single.beliefSystem.coreAssumptions.map((a, i) => (
                              <li key={i} style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#e8e8e0' }}>
                                <span style={{ color: '#666660', marginRight: '8px' }}>·</span>{a}
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={handleBeliefTraining}
                            style={{ marginTop: '12px', padding: '6px 0', background: 'transparent', border: 'none', color: '#444440', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'monospace' }}
                          >
                            {beliefTraining ? '↑ Close practice' : 'Practice spotting hidden assumptions →'}
                          </button>
                          {beliefTrainingLoading && (
                            <div style={{ fontSize: '0.8rem', color: '#666660', marginTop: '8px', fontFamily: 'monospace' }}>
                              Generating scenario...
                            </div>
                          )}
                          {beliefTraining && (
                            <TrainingCard
                              scenario={beliefTraining}
                              onClose={() => setBeliefTraining(null)}
                            />
                          )}
                        </div>
                      )}

                      {/* Load-Bearing Beliefs */}
                      {single.beliefSystem.loadBearingBeliefs.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                          <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '8px', marginTop: 0 }}>If These Were False, The Argument Collapses</p>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {single.beliefSystem.loadBearingBeliefs.map((b, i) => (
                              <li key={i} style={{ paddingLeft: '20px', position: 'relative', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#e8e8e0' }}>
                                <span style={{ position: 'absolute', left: 0, color: '#c8a84b' }}>→</span>
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Incentive System */}
                      {single.beliefSystem.incentiveSystem && (
                        <div style={{ marginBottom: '20px' }}>
                          <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '8px', marginTop: 0 }}>Incentive System</p>
                          <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#666660', fontStyle: 'italic', lineHeight: '1.6', margin: 0, borderLeft: '2px solid #2e2e2e', paddingLeft: '12px' }}>
                            {single.beliefSystem.incentiveSystem}
                          </p>
                          <button
                            onClick={handleIncentiveTraining}
                            style={{ marginTop: '12px', padding: '6px 0', background: 'transparent', border: 'none', color: '#444440', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'monospace' }}
                          >
                            {incentiveTraining ? '↑ Close practice' : 'Practice spotting incentive structures →'}
                          </button>
                          {incentiveTrainingLoading && (
                            <div style={{ fontSize: '0.8rem', color: '#666660', marginTop: '8px', fontFamily: 'monospace' }}>
                              Generating scenario...
                            </div>
                          )}
                          {incentiveTraining && (
                            <TrainingCard
                              scenario={incentiveTraining}
                              onClose={() => setIncentiveTraining(null)}
                            />
                          )}
                        </div>
                      )}

                      {/* Speaker Comparison */}
                      {single.beliefSystem.speakerComparison && single.beliefSystem.speakerComparison.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                          <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '8px', marginTop: 0 }}>Where The Belief Systems Actually Diverge</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {single.beliefSystem.speakerComparison.map((s, i) => (
                              <div key={i} style={{ padding: '12px 14px', border: '1px solid #2e2e2e', background: '#141414' }}>
                                <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#c8a84b', marginBottom: '8px', marginTop: 0 }}>{s.speaker}</p>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {s.coreBeliefs.map((b, j) => (
                                    <li key={j} style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#e8e8e0' }}>
                                      <span style={{ color: '#666660', marginRight: '8px' }}>·</span>{b}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <p className="text-xs font-mono text-[#444440]">Belief system analysis will appear here.</p>
                  )}
                </section>
              </div>
              )}

              {/* ── Default Narrative (beliefs tab, after OBS) ── */}
              {!isFiction && single.defaultNarrative?.narrative && (
                <div className={tabClass('beliefs')} style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #2e2e2e' }}>
                  <h2 style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a84b', marginBottom: '4px', marginTop: 0, fontWeight: 600 }}>
                    Default Narrative
                  </h2>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', fontStyle: 'italic', marginBottom: '20px', marginTop: 0 }}>
                    The cultural story this argument is swimming in — never examined because it reads as reality.
                  </p>

                  <div style={{ padding: '14px 16px', border: '1px solid #c8a84b', background: 'rgba(200, 168, 75, 0.04)', marginBottom: '16px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c8a84b', marginBottom: '6px' }}>
                      The Narrative
                    </div>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.95rem', lineHeight: '1.6', color: '#e8e8e0', margin: 0, fontStyle: 'italic' }}>
                      &ldquo;{single.defaultNarrative.narrative}&rdquo;
                    </p>
                  </div>

                  {[
                    { label: 'What Makes It Load-Bearing', value: single.defaultNarrative.loadBearing },
                    { label: 'Who Benefits From It Staying Invisible', value: single.defaultNarrative.whoBenefits },
                    { label: 'If It Breaks — What Becomes Possible', value: single.defaultNarrative.ifItBreaksUpside },
                    { label: 'If It Breaks — What Gets Destabilized', value: single.defaultNarrative.ifItBreaksDownside },
                  ].map((row, i) => (
                    <div key={i} style={{ paddingTop: '12px', paddingBottom: '12px', borderBottom: i < 3 ? '1px solid #2e2e2e' : 'none' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '4px' }}>
                        {row.label}
                      </div>
                      <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#e8e8e0', margin: 0 }}>
                        {row.value}
                      </p>
                    </div>
                  ))}

                  <button
                    onClick={handleNarrativeTraining}
                    style={{ marginTop: '16px', padding: '6px 0', background: 'transparent', border: 'none', color: '#444440', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'monospace' }}
                  >
                    {narrativeTraining ? '↑ Close practice' : 'Practice spotting default narratives →'}
                  </button>
                  {narrativeTrainingLoading && (
                    <div style={{ fontSize: '0.8rem', color: '#666660', marginTop: '8px', fontFamily: 'monospace' }}>Generating scenario...</div>
                  )}
                  {narrativeTraining && (
                    <TrainingCard scenario={narrativeTraining} onClose={() => setNarrativeTraining(null)} />
                  )}
                </div>
              )}

              {/* ── 4. Agency + Summary (overview-bottom) ── */}
              <div className={tabClass('overview')}>
                {!isFiction && single.agency && single.agency.bullets.length > 0 && (
                  <div style={{
                    borderLeft: '3px solid #c8a84b', padding: '16px',
                    marginBottom: '24px',
                    background: 'rgba(200, 168, 75, 0.06)'
                  }}>
                    <h3 style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0, color: '#c8a84b' }}>
                      What This Argument Is Resting On
                    </h3>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#666660', fontStyle: 'italic', marginBottom: '12px', marginTop: 0, lineHeight: '1.6' }}>
                      {single.agency.framing}
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {single.agency.bullets.map((bullet, i) => (
                        <li key={i} style={{ paddingLeft: '20px', position: 'relative', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6', color: '#e8e8e0' }}>
                          <span style={{ position: 'absolute', left: 0, color: '#c8a84b' }}>→</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {single.summary && (
                  <div className="mb-6">
                    <p className="text-xs font-mono text-[#444440] tracking-widest uppercase mb-3">Summary</p>
                    <p className="text-sm font-mono text-[#666660] leading-relaxed">{single.summary}</p>
                  </div>
                )}

                {/* ── How to Strengthen This ── */}
                {!isFiction && single.improvements && single.improvements.length > 0 && (
                  <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #2e2e2e' }}>
                    <h2 style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a84b', marginBottom: '6px', marginTop: 0, fontWeight: 600 }}>
                      How to Strengthen This
                    </h2>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', fontStyle: 'italic', marginBottom: '24px', marginTop: 0 }}>
                      The highest-leverage gaps — what to address first.
                    </p>
                    {(showAllImprovements ? single.improvements : single.improvements.slice(0, 3)).map((imp, i) => (
                      <ImprovementCard key={i} imp={imp} />
                    ))}
                    {single.improvements.length > 3 && (
                      <button
                        onClick={() => setShowAllImprovements(v => !v)}
                        style={{ background: 'transparent', border: 'none', color: '#444440', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'monospace', padding: '4px 0', marginTop: '4px' }}
                      >
                        {showAllImprovements ? '↑ Show less' : `↓ Show ${single.improvements.length - 3} more`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ── 5. Questions ── */}
              <div className={tabClass('questions')}>
                <section className="mb-6">
                  <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-6">
                    {isFiction ? 'Questions About This Narrative' : 'Questions That Pressure-Test This Argument'}
                  </h2>
                  {isFiction && (
                    <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', fontStyle: 'italic', marginBottom: '24px', marginTop: 0 }}>
                      These questions treat the structure of the narrative — not any claims about reality — as the subject.
                    </p>
                  )}
                  <QuestionGroup
                    title={isFiction ? 'On the narrator and point of view' : 'Questions that will come for this argument'}
                    subhead="The sharpest challenges to this argument — worth having answers for."
                    questions={single.followUpQuestions.defend}
                    startIndex={1}
                  />
                  <QuestionGroup
                    title={isFiction ? "On structure and what's unresolved" : 'Where to press, in order'}
                    subhead="Ordered by leverage. The first question does the most damage."
                    questions={single.followUpQuestions.challenge}
                    startIndex={4}
                  />
                  <QuestionGroup
                    title={isFiction ? 'What the narrative leaves unnamed' : 'Outside the frame'}
                    subhead="Not flaws — absences. What this argument never thought to address."
                    questions={single.followUpQuestions.missing}
                    startIndex={7}
                    isLast
                  />
                </section>
              </div>

              {/* ── 6. Go Deeper ── */}
              <div className={tabClass('deeper')}>
                {!isFiction && (
                <section>
                  {(single.resources?.books?.length ?? 0) > 0 ? (
                    <>
                      <h2 style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a84b', marginBottom: '8px', marginTop: 0, fontWeight: 600 }}>
                        Go Deeper
                      </h2>
                      <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic',
                        marginBottom: '20px'
                      }}>
                        Three angles you haven&apos;t considered — not more of what you already believe.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {single.resources!.books.map((book: BookEntry, i: number) => (
                          <div key={i} style={{ padding: '14px 16px', border: '1px solid #2e2e2e', background: '#141414' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666660', marginBottom: '4px' }}>
                              {book.category}
                              <span style={{ textTransform: 'none', letterSpacing: 'normal', fontStyle: 'italic', marginLeft: '6px', opacity: 0.7 }}>
                                — {({ Eyewitness: 'Closest to the problem', Explainer: 'Connects this to something larger', Expert: 'Deep in the field' } as Record<string, string>)[book.category] || book.category}
                              </span>
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 600, marginBottom: '2px', color: '#e8e8e0' }}>{book.title}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', marginBottom: '8px' }}>{book.author}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#e8e8e0', lineHeight: '1.5' }}>{book.why}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="font-mono text-xs text-[#444440]">Book recommendations will appear here.</p>
                  )}
                </section>
                )}
              </div>

              {result && (
                <div style={{
                  marginTop: '48px',
                  paddingTop: '24px',
                  borderTop: '1px solid #2e2e2e',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#666660',
                    lineHeight: '1.7',
                    marginBottom: '16px',
                    maxWidth: '380px',
                    margin: '0 auto 16px auto',
                    fontFamily: 'monospace'
                  }}>
                    This tool costs real money to run.
                    If it was worth something to you,
                    contribute what feels right.
                  </p>
                  <a
                    href="https://buy.stripe.com/5kQ4gz3Eo3O41AS8Gt4wM03"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '10px 24px',
                      border: '1px solid #c8a84b',
                      color: '#c8a84b',
                      background: 'transparent',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontFamily: 'monospace'
                    }}
                    onMouseEnter={e => {
                      (e.target as HTMLElement).style.background = 'rgba(200, 168, 75, 0.1)'
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLElement).style.background = 'transparent'
                    }}
                  >
                    Keep it running →
                  </a>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── Mobile tab bar — fixed at bottom, hidden on desktop ── */}
      {hasResults && single && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex z-[100] bg-[#141414] border-t border-[#2e2e2e]"
          style={{ height: '56px', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                color: activeTab === tab.id ? '#c8a84b' : '#666660',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{tab.emoji}</span>
              <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
      )}

    </main>
  )
}
