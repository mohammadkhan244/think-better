'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import InputTabs from '@/components/InputTabs'
import BiasCard from '@/components/BiasCard'
import QuestionList from '@/components/QuestionList'
import ResultsSummary from '@/components/ResultsSummary'
import SpeakerResults from '@/components/SpeakerResults'
import type { Improvement } from '@/lib/improvements'

const FloaterChart = dynamic(() => import('@/components/FloaterChart'), { ssr: false })

type Mode = 'defend' | 'challenge' | 'audit'

interface Agency {
  framing: string
  bullets: string[]
}

interface SingleResult {
  mode: 'single'
  floater: { scores: Record<string, { score: number; justification: string }>; overall: number }
  biasesAndFallacies: { name: string; type: 'bias' | 'fallacy'; definition: string; matchedText: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; floaterDimension: string }[]
  improvements: Improvement[]
  followUpQuestions: string[]
  agency?: Agency
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
    followUpQuestions: string[]
    summary: string
  }[]
  fromCache: boolean
}

type AnalysisResult = SingleResult | MultiResult
type FilterType = 'all' | 'fallacies' | 'biases'

const MODE_LABELS: Record<Mode, {
  results: string
  patterns: string
  questions: string
  questionsSub: string
  agency: string
}> = {
  defend: {
    results: 'Where This Argument Is Most Exposed',
    patterns: 'Weaknesses to Shore Up',
    questions: 'Questions Someone Will Use Against You',
    questionsSub: 'These are the exact questions a sharp critic will ask. Have your answers ready.',
    agency: 'What to Fix Before You Ship This',
  },
  challenge: {
    results: 'Where This Argument Is Most Vulnerable',
    patterns: 'Weaknesses to Exploit',
    questions: 'Questions to Put to This Argument',
    questionsSub: 'Use these to probe the argument. Each one targets a specific weak point.',
    agency: 'Where to Press and In What Order',
  },
  audit: {
    results: 'Reasoning Breakdown',
    patterns: 'Reasoning Patterns Detected',
    questions: 'Questions to Explore',
    questionsSub: "These questions don't challenge whether you're right — they reveal what would need to be true for the reasoning to hold.",
    agency: 'What This Argument Is Actually Resting On',
  },
}

function getWhatThisMeans(overall: number, issueCount: number): string {
  if (overall < 4)
    return `This reasoning contains ${issueCount > 0 ? `${issueCount} structural pattern${issueCount !== 1 ? 's' : ''}` : 'several areas'} where conclusions depend on untested assumptions. The questions below will sharpen any decision built on top of it.`
  if (overall < 7)
    return `This reasoning has real structure, but some of the load-bearing claims rest on assumptions worth examining. The questions below help stress-test them.`
  return `The reasoning shows relatively strong structure. A few targeted questions could make it more robust.`
}

const MODE_OPTIONS: { id: Mode; label: string }[] = [
  { id: 'defend',    label: '🛡 Help me not lose this argument' },
  { id: 'challenge', label: '⚔️ Help me break someone else\'s argument' },
  { id: 'audit',     label: '🔍 Help me catch my own sloppy thinking' },
]

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [mode, setMode] = useState<Mode>('audit')

  const handleAnalyze = async (text: string, sourceType: string) => {
    setIsLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceType, mode }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setResult(data)
    } catch {
      setError('Analysis failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const single = result?.mode === 'single' ? result : null
  const multi = result?.mode === 'multi-speaker' ? result : null
  const labels = MODE_LABELS[mode]

  const filteredIssues = single?.biasesAndFallacies.filter(issue => {
    if (filter === 'all') return true
    if (filter === 'fallacies') return issue.type === 'fallacy'
    return issue.type === 'bias'
  }) ?? []

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-[#e8e8e0]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-8">
          <h1 className="font-serif text-4xl text-[#e8e8e0] tracking-tight mb-2">
            The Reasoning Machine
          </h1>
          <p className="font-mono text-xs text-[#888880] tracking-widest uppercase mb-6">
            Not what to think — how to think.
          </p>
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

        {/* ── Mode selector ── */}
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          {MODE_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex-1 py-2.5 px-4 text-xs font-mono border transition-colors text-left md:text-center ${
                mode === id
                  ? 'border-[#c8a84b] text-[#c8a84b] bg-[#c8a84b10]'
                  : 'border-[#2e2e2e] text-[#444440] hover:border-[#666660] hover:text-[#888880]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="mb-12">
          <InputTabs onAnalyze={handleAnalyze} isLoading={isLoading} />
        </section>

        {error && (
          <div className="border border-[#c0392b] p-4 mb-8">
            <p className="text-xs font-mono text-[#c0392b]">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-16">
            <p className="text-xs font-mono text-[#444440] tracking-widest">ANALYZING...</p>
          </div>
        )}

        {/* ── Multi-speaker results ── */}
        {multi && !isLoading && (
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase">
                Speaker Analysis — {multi.speakers.length} speakers detected
              </h2>
              {multi.fromCache && (
                <span className="text-xs font-mono text-[#444440] border border-[#2e2e2e] px-1.5 py-0.5">⚡ cached</span>
              )}
            </div>
            <SpeakerResults speakers={multi.speakers} diarizationMethod={multi.diarizationMethod} />
          </div>
        )}

        {/* ── Single-speaker results ── */}
        {single && !isLoading && (
          <div className="animate-fadeIn">

            {/* ── 1. Reasoning Breakdown ── */}
            <section className="mb-6">
              <ResultsSummary summary={single.summary} overall={single.floater.overall} fromCache={single.fromCache} />
              <div className="mt-4 border border-[#2e2e2e] p-4">
                <p className="text-xs font-mono text-[#444440] tracking-widest uppercase mb-2">What This Means</p>
                <p className="text-xs font-mono text-[#666660] leading-relaxed">
                  {getWhatThisMeans(single.floater.overall, single.biasesAndFallacies.length)}
                </p>
              </div>
            </section>

            {/* ── 2. FLOATER Radar Chart only ── */}
            <section className="mb-6">
              <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-4">FLOATER Scorecard</h2>
              <FloaterChart scores={single.floater.scores} />
            </section>

            {/* ── 3. Patterns Detected ── */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase">
                  {labels.patterns} ({single.biasesAndFallacies.length})
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
                  {filteredIssues.map((issue, i) => <BiasCard key={i} {...issue} />)}
                </div>
              ) : (
                <p className="text-xs font-mono text-[#444440]">No common bias or fallacy patterns detected.</p>
              )}
            </section>

            {/* ── 4. Agency Block ── */}
            {single.agency && single.agency.bullets.length > 0 && (
              <div style={{
                borderLeft: '3px solid #c8a84b',
                padding: '16px',
                marginTop: '24px',
                marginBottom: '24px',
                background: 'rgba(200, 168, 75, 0.06)'
              }}>
                <h3 style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  color: '#c8a84b'
                }}>
                  {mode === 'defend' && 'What to Fix Before You Ship This'}
                  {mode === 'challenge' && 'Where to Press and In What Order'}
                  {mode === 'audit' && 'What This Argument Is Actually Resting On'}
                </h3>
                <p style={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: '#666660',
                  fontStyle: 'italic',
                  marginBottom: '12px',
                  lineHeight: '1.6'
                }}>
                  {single.agency.framing}
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {single.agency.bullets.map((bullet, i) => (
                    <li key={i} style={{
                      paddingLeft: '20px',
                      position: 'relative',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      color: '#e8e8e0'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: '#c8a84b'
                      }}>→</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── 5. Questions ── */}
            <section className="mb-6">
              <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-2">{labels.questions}</h2>
              <p className="text-xs font-mono text-[#444440] mb-4 leading-relaxed">
                {labels.questionsSub}
              </p>
              <QuestionList questions={single.followUpQuestions} />
            </section>

          </div>
        )}
      </div>
    </main>
  )
}
