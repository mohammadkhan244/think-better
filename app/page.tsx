'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import InputTabs from '@/components/InputTabs'
import BiasCard from '@/components/BiasCard'
import ResultsSummary from '@/components/ResultsSummary'
import SpeakerResults from '@/components/SpeakerResults'
import type { Improvement } from '@/lib/improvements'

const FloaterChart = dynamic(() => import('@/components/FloaterChart'), { ssr: false })

interface Agency {
  framing: string
  bullets: string[]
}

interface Questions {
  defend: string[]
  challenge: string[]
  audit: string[]
}

interface SingleResult {
  mode: 'single'
  floater: { scores: Record<string, { score: number; justification: string }>; overall: number }
  biasesAndFallacies: { name: string; type: 'bias' | 'fallacy'; definition: string; matchedText: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; floaterDimension: string }[]
  improvements: Improvement[]
  followUpQuestions: Questions
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
    followUpQuestions: Questions
    summary: string
  }[]
  fromCache: boolean
}

type AnalysisResult = SingleResult | MultiResult
type FilterType = 'all' | 'fallacies' | 'biases'

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
        flexShrink: 0,
        fontSize: '0.75rem',
        padding: '4px 8px',
        border: '1px solid #2e2e2e',
        background: 'transparent',
        color: copied ? '#c8a84b' : '#444440',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontFamily: 'monospace',
        transition: 'color 0.15s'
      }}
    >
      {copied ? 'copied' : 'copy'}
    </button>
  )
}

function QuestionGroup({
  title,
  subhead,
  questions,
  startIndex,
  isLast
}: {
  title: string
  subhead: string
  questions: string[]
  startIndex: number
  isLast?: boolean
}) {
  return (
    <div style={{
      marginBottom: isLast ? 0 : '32px',
      paddingBottom: isLast ? 0 : '24px',
      borderBottom: isLast ? 'none' : '1px solid #2e2e2e'
    }}>
      <h3 style={{
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#c8a84b',
        marginBottom: '6px',
        marginTop: 0
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        color: '#666660',
        marginBottom: '16px',
        fontStyle: 'italic',
        marginTop: 0
      }}>
        {subhead}
      </p>
      <ol style={{
        paddingLeft: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        margin: 0
      }}>
        {questions.map((q, i) => (
          <li key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            color: '#e8e8e0'
          }}>
            <span>
              <span style={{ color: '#444440', marginRight: '8px' }}>{startIndex + i}.</span>
              {q}
            </span>
            <CopyButton text={q} />
          </li>
        ))}
      </ol>
    </div>
  )
}

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

            {/* 1. Reasoning Breakdown */}
            <section className="mb-6">
              <ResultsSummary summary={single.summary} overall={single.floater.overall} fromCache={single.fromCache} />
              <div className="mt-4 border border-[#2e2e2e] p-4">
                <p className="text-xs font-mono text-[#444440] tracking-widest uppercase mb-2">What This Means</p>
                <p className="text-xs font-mono text-[#666660] leading-relaxed">
                  {getWhatThisMeans(single.floater.overall, single.biasesAndFallacies.length)}
                </p>
              </div>
            </section>

            {/* 2. FLOATER Radar Chart */}
            <section className="mb-6">
              <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-4">FLOATER Scorecard</h2>
              <FloaterChart scores={single.floater.scores} />
            </section>

            {/* 3. Reasoning Patterns */}
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
                  {filteredIssues.map((issue, i) => <BiasCard key={i} {...issue} />)}
                </div>
              ) : (
                <p className="text-xs font-mono text-[#444440]">No common bias or fallacy patterns detected.</p>
              )}
            </section>

            {/* 4. Agency Block */}
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
                  marginTop: 0,
                  color: '#c8a84b'
                }}>
                  What This Argument Is Resting On
                </h3>
                <p style={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: '#666660',
                  fontStyle: 'italic',
                  marginBottom: '12px',
                  marginTop: 0,
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
                      <span style={{ position: 'absolute', left: 0, color: '#c8a84b' }}>→</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 5. Questions */}
            <section className="mb-6">
              <h2 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-6">
                Questions That Pressure-Test This Argument
              </h2>
              <QuestionGroup
                title="If you're defending this position"
                subhead="Questions a critic will use against you — have your answers ready."
                questions={single.followUpQuestions.defend}
                startIndex={1}
              />
              <QuestionGroup
                title="If you're challenging this argument"
                subhead="Sequenced by leverage — start with the first question."
                questions={single.followUpQuestions.challenge}
                startIndex={4}
              />
              <QuestionGroup
                title="If you're auditing your own thinking"
                subhead="Honest questions worth sitting with — not rhetorical."
                questions={single.followUpQuestions.audit}
                startIndex={7}
                isLast
              />
            </section>

          </div>
        )}
      </div>
    </main>
  )
}
