'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import FloaterBreakdown from './FloaterBreakdown'
import BiasCard from './BiasCard'
import QuestionList from './QuestionList'
import ImprovementPanel from './ImprovementPanel'
import type { Improvement } from '@/lib/improvements'

const FloaterChart = dynamic(() => import('./FloaterChart'), { ssr: false })

interface SpeakerAnalysis {
  speaker: string
  wordCount: number
  floater: {
    scores: Record<string, { score: number; justification: string }>
    overall: number
  }
  biasesAndFallacies: {
    name: string
    type: 'bias' | 'fallacy'
    definition: string
    matchedText: string
    confidence: 'HIGH' | 'MEDIUM' | 'LOW'
    floaterDimension: string
  }[]
  improvements: Improvement[]
  followUpQuestions: string[]
  summary: string
}

interface SpeakerResultsProps {
  speakers: SpeakerAnalysis[]
  diarizationMethod: 'deterministic' | 'llm' | 'failed'
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#4a9e6b'
  if (score >= 5) return '#d4851a'
  return '#c0392b'
}

function SpeakerPanel({ speaker }: { speaker: SpeakerAnalysis }) {
  const [filter, setFilter] = useState<'all' | 'fallacies' | 'biases'>('all')
  const color = getScoreColor(speaker.floater.overall)

  const filteredIssues = speaker.biasesAndFallacies.filter(i => {
    if (filter === 'all') return true
    if (filter === 'fallacies') return i.type === 'fallacy'
    return i.type === 'bias'
  })

  return (
    <div className="space-y-8">
      {/* Score bar */}
      <div className="flex items-center gap-4 border border-[#2e2e2e] px-5 py-4">
        <div>
          <span className="text-4xl font-serif" style={{ color }}>{speaker.floater.overall}</span>
          <span className="text-xs font-mono text-[#444440] ml-1">/10</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-mono text-[#c8a84b] mb-1">FLOATER SCORE</p>
          <p className="text-xs font-mono text-[#666660] leading-relaxed">{speaker.summary}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-mono text-[#444440]">{speaker.wordCount} words</p>
        </div>
      </div>

      {/* Radar + breakdown */}
      <div>
        <h3 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-4">FLOATER Scorecard</h3>
        <FloaterChart scores={speaker.floater.scores} />
        <div className="mt-3">
          <FloaterBreakdown scores={speaker.floater.scores} />
        </div>
      </div>

      {/* Improvements */}
      {speaker.improvements.length > 0 && (
        <div>
          <h3 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-1">How to Improve</h3>
          <p className="text-xs font-mono text-[#444440] mb-3">Click any row to expand.</p>
          <ImprovementPanel improvements={speaker.improvements} />
        </div>
      )}

      {/* Detected issues */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase">
            Detected Issues ({speaker.biasesAndFallacies.length})
          </h3>
          <div className="flex gap-1">
            {(['all', 'fallacies', 'biases'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-mono px-3 py-1 border transition-colors ${
                  filter === f
                    ? 'border-[#c8a84b] text-[#c8a84b]'
                    : 'border-[#2e2e2e] text-[#444440] hover:border-[#444440]'
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
          <p className="text-xs font-mono text-[#444440]">No patterns detected for this filter.</p>
        )}
      </div>

      {/* Questions */}
      {speaker.followUpQuestions.length > 0 && (
        <div>
          <h3 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-4">
            Questions to Sharpen This Reasoning
          </h3>
          <QuestionList questions={speaker.followUpQuestions} />
        </div>
      )}
    </div>
  )
}

export default function SpeakerResults({ speakers, diarizationMethod }: SpeakerResultsProps) {
  const [active, setActive] = useState(0)

  return (
    <div>
      {/* Method badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs font-mono text-[#444440]">
          {diarizationMethod === 'deterministic'
            ? 'Speaker labels detected automatically'
            : 'Speakers identified by AI from context'}
        </span>
        <span className="text-xs font-mono border border-[#2e2e2e] text-[#444440] px-1.5 py-0.5">
          {diarizationMethod === 'deterministic' ? 'PATTERN MATCH' : 'AI DIARIZED'}
        </span>
      </div>

      {/* Speaker tabs */}
      <div className="flex border-b border-[#2e2e2e] mb-8">
        {speakers.map((s, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-5 py-3 text-xs font-mono transition-colors ${
              active === i
                ? 'text-[#c8a84b] border-b border-[#c8a84b] -mb-px'
                : 'text-[#444440] hover:text-[#888880]'
            }`}
          >
            {s.speaker}
          </button>
        ))}
      </div>

      {/* Active speaker panel */}
      <SpeakerPanel speaker={speakers[active]} />
    </div>
  )
}
