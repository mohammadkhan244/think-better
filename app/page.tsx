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

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const handleAnalyze = async (text: string, sourceType: string) => {
    setIsLoading(true)
    setError('')
    setResult(null)
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
          <div className="border-l-2 border-[#2e2e2e] pl-4 space-y-3">
            <p className="text-sm font-mono text-[#e8e8e0] leading-relaxed">
              We were never taught to reason well, only to sound confident.
            </p>
            <p className="text-sm font-mono text-[#e8e8e0] leading-relaxed">
              This tool scores any argument, article, or conversation across seven dimensions of rigorous thinking, then shows you exactly where the logic breaks down and how to sharpen it.
            </p>
            <p className="text-sm font-mono text-[#e8e8e0] leading-relaxed">
              Paste text, upload a PDF, drop an article link, or pull a YouTube transcript.
            </p>
            <p className="text-sm font-mono text-[#e8e8e0] leading-relaxed">
              You will get a FLOATER scorecard, detected biases and fallacies with quotes from the source, specific improvement steps, and Socratic questions to stress-test the reasoning further.
            </p>
          </div>
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
          <div className="space-y-10 animate-fadeIn">
            <section>
              <ResultsSummary summary={single.summary} overall={single.floater.overall} fromCache={single.fromCache} />
            </section>

            <section>
              <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-4">FLOATER Scorecard</h2>
              <FloaterChart scores={single.floater.scores} />
              <div className="mt-4">
                <FloaterBreakdown scores={single.floater.scores} />
              </div>
            </section>

            {single.improvements.length > 0 && (
              <section>
                <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-1">How to Improve</h2>
                <p className="text-xs font-mono text-[#444440] mb-4">Specific gaps, what to read, and how to reframe — click any row to expand.</p>
                <ImprovementPanel improvements={single.improvements} />
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase">
                  Detected Issues ({single.biasesAndFallacies.length})
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

            <section>
              <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-4">Questions to Sharpen This Reasoning</h2>
              <QuestionList questions={single.followUpQuestions} />
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
