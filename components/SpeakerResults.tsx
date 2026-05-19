'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import FloaterBreakdown from './FloaterBreakdown'
import BiasCard from './BiasCard'
import QuestionList from './QuestionList'
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
  followUpQuestions: { defend: string[]; challenge: string[]; missing: string[] } | string[]
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

function ImprovementCard({ imp }: { imp: Improvement }) {
  const [lookUpOpen, setLookUpOpen] = useState(false)
  const label = imp.dimensionLabel
    ? `${imp.dimension} — ${imp.dimensionLabel}`
    : imp.issueLabel ?? 'Gap'
  return (
    <div style={{ borderLeft: '3px solid #c8a84b', paddingLeft: '16px', marginBottom: '24px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c8a84b', marginBottom: '8px' }}>{label}</div>
      <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#e8e8e0', lineHeight: '1.6', margin: '0 0 10px 0' }}>
        {imp.specificAdvice ?? imp.gap}
      </p>
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
        <p style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#666660', lineHeight: '1.5', margin: '0 0 8px 0' }}>Read: {imp.contraryResource}</p>
      )}
      {(imp.lookUp?.length > 0 || imp.perspective) && (
        <button onClick={() => setLookUpOpen(o => !o)} style={{ background: 'transparent', border: 'none', color: '#444440', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'monospace', padding: 0 }}>
          {lookUpOpen ? '↑ less' : '↓ more'}
        </button>
      )}
      {lookUpOpen && (
        <div style={{ marginTop: '8px' }}>
          {imp.perspective && <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#666660', fontStyle: 'italic', lineHeight: '1.6', margin: '0 0 8px 0' }}>{imp.perspective}</p>}
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

function SpeakerPanel({ speaker }: { speaker: SpeakerAnalysis }) {
  const [filter, setFilter] = useState<'all' | 'fallacies' | 'biases'>('all')
  const [showAllImprovements, setShowAllImprovements] = useState(false)
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
      {(() => {
        const qs = speaker.followUpQuestions
        const flat = Array.isArray(qs) ? qs : [...qs.defend, ...qs.challenge, ...qs.missing]
        return flat.length > 0 ? (
          <div>
            <h3 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-4">
              Questions to Sharpen This Reasoning
            </h3>
            <QuestionList questions={flat} />
          </div>
        ) : null
      })()}

      {/* How to Strengthen This */}
      {speaker.improvements && speaker.improvements.length > 0 && (
        <div style={{ paddingTop: '24px', borderTop: '1px solid #2e2e2e' }}>
          <h3 className="font-mono text-xs text-[#c8a84b] tracking-widest uppercase mb-2">How to Strengthen This</h3>
          <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', fontStyle: 'italic', marginBottom: '20px', marginTop: 0 }}>
            The highest-leverage gaps — what to address first.
          </p>
          {(showAllImprovements ? speaker.improvements : speaker.improvements.slice(0, 3)).map((imp, i) => (
            <ImprovementCard key={i} imp={imp} />
          ))}
          {speaker.improvements.length > 3 && (
            <button
              onClick={() => setShowAllImprovements(v => !v)}
              style={{ background: 'transparent', border: 'none', color: '#444440', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'monospace', padding: '4px 0' }}
            >
              {showAllImprovements ? '↑ Show less' : `↓ Show ${speaker.improvements.length - 3} more`}
            </button>
          )}
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
