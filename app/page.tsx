'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import InputTabs from '@/components/InputTabs'
import FloaterBreakdown from '@/components/FloaterBreakdown'
import BiasCard from '@/components/BiasCard'
import QuestionList from '@/components/QuestionList'
import ResultsSummary from '@/components/ResultsSummary'
import ImprovementPanel from '@/components/ImprovementPanel'
import SpeakerResults from '@/components/SpeakerResults'
import type { Improvement } from '@/lib/improvements'

const FloaterChart = dynamic(() => import('@/components/FloaterChart'), { ssr: false })

interface SingleResult {
  mode: 'single'
  floater: { scores: Record<string, { score: number; justification: string }>; overall: number }
  biasesAndFallacies: { name: string; type: 'bias' | 'fallacy'; definition: string; matchedText: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; floaterDimension: string }[]
  improvements: Improvement[]
  followUpQuestions: string[]
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
type MobileTab = 'terrain' | 'floater' | 'patterns' | 'questions'

function getWhatThisMeans(overall: number, issueCount: number): string {
  if (overall < 4)
    return `This reasoning contains ${issueCount > 0 ? `${issueCount} structural pattern${issueCount !== 1 ? 's' : ''}` : 'several areas'} where conclusions depend on untested assumptions. The questions below will sharpen any decision built on top of it.`
  if (overall < 7)
    return `This reasoning has real structure, but some of the load-bearing claims rest on assumptions worth examining. The questions below help stress-test them.`
  return `The reasoning shows relatively strong structure. A few targeted questions could make it more robust.`
}

const TABS: { id: MobileTab; icon: string; label: string }[] = [
  { id: 'terrain',   icon: '🧭', label: 'Terrain'   },
  { id: 'patterns',  icon: '🔍', label: 'Patterns'  },
  { id: 'floater',   icon: '📊', label: 'FLOATER'   },
  { id: 'questions', icon: '❓', label: 'Questions'  },
]

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [mobileTab, setMobileTab] = useState<MobileTab>('questions')

  const handleAnalyze = async (text: string, sourceType: string) => {
    setIsLoading(true)
    setError('')
    setResult(null)
    setMobileTab('questions')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceType }),
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

  const filteredIssues = single?.biasesAndFallacies.filter(issue => {
    if (filter === 'all') return true
    if (filter === 'fallacies') return issue.type === 'fallacy'
    return issue.type === 'bias'
  }) ?? []

  // Returns classes that show on the active mobile tab, and always on desktop
  function tabClass(tab: MobileTab) {
    return mobileTab === tab
      ? 'block mb-10'
      : 'hidden md:block md:mb-10'
  }

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
          <p className="text-sm font-mono text-[#e8e8e0] leading-relaxed">
            Map the hidden assumptions inside any argument.
          </p>
        </header>

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
          <div className="animate-fadeIn pb-[56px] md:pb-0">

            {/* ── Tab 1: Terrain ── */}
            <section className={tabClass('terrain')}>
              <ResultsSummary summary={single.summary} overall={single.floater.overall} fromCache={single.fromCache} />
              <div className="mt-4 border border-[#2e2e2e] p-4">
                <p className="text-xs font-mono text-[#444440] tracking-widest uppercase mb-2">What This Means</p>
                <p className="text-xs font-mono text-[#666660] leading-relaxed">
                  {getWhatThisMeans(single.floater.overall, single.biasesAndFallacies.length)}
                </p>
              </div>
            </section>

            {/* ── Tab 3: FLOATER (+ improvements) ── */}
            <section className={tabClass('floater')}>
              <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-4">FLOATER Scorecard</h2>
              <FloaterChart scores={single.floater.scores} />
              <div className="mt-4">
                <FloaterBreakdown scores={single.floater.scores} />
              </div>
              {single.improvements.length > 0 && (
                <div className="mt-6">
                  <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-1">How to Strengthen This</h2>
                  <p className="text-xs font-mono text-[#444440] mb-4">Specific gaps, what to read, and how to reframe.</p>
                  <ImprovementPanel improvements={single.improvements} />
                </div>
              )}
            </section>

            {/* ── Tab 2: Patterns ── */}
            <section className={tabClass('patterns')}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase">
                  Reasoning Patterns ({single.biasesAndFallacies.length})
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

            {/* ── Tab 4: Questions ── */}
            <section className={tabClass('questions')}>
              <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-2">Questions to Sharpen This Reasoning</h2>
              <p className="text-xs font-mono text-[#444440] mb-4 leading-relaxed">
                These questions don&apos;t challenge whether you&apos;re right — they reveal what would need to be true for the reasoning to hold.
              </p>
              <QuestionList questions={single.followUpQuestions} />
            </section>

            {/* ── Mobile bottom tab bar ── */}
            <div
              className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-[#0e0e0e] border-t border-[#2e2e2e]"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex h-14">
                {TABS.map(tab => {
                  const isActive = mobileTab === tab.id
                  const count = tab.id === 'patterns' ? single.biasesAndFallacies.length : null
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setMobileTab(tab.id)}
                      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono transition-colors ${
                        isActive ? 'text-[#c8a84b]' : 'text-[#444440]'
                      }`}
                    >
                      <span className="text-base leading-none">{tab.icon}</span>
                      <span>
                        {tab.label}
                        {count !== null && count > 0 ? ` (${count})` : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}
