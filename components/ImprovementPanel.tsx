'use client'

import { useState } from 'react'
import type { Improvement } from '@/lib/improvements'

interface ImprovementPanelProps {
  improvements: Improvement[]
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#4a9e6b'
  if (score >= 5) return '#d4851a'
  return '#c0392b'
}

function ImprovementCard({ item }: { item: Improvement }) {
  const [open, setOpen] = useState(false)

  const label = item.source === 'floater'
    ? `${item.dimension} — ${item.dimensionLabel}`
    : item.issueLabel ?? 'Issue'

  const scoreColor = item.score !== undefined ? getScoreColor(item.score) : '#d4851a'

  return (
    <div
      className="border border-[#2e2e2e] hover:border-[#c8a84b] transition-colors cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-start justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {item.source === 'floater' && item.score !== undefined ? (
            <span
              className="text-xs font-mono font-bold w-6 h-6 flex items-center justify-center border shrink-0"
              style={{ color: scoreColor, borderColor: scoreColor }}
            >
              {item.dimension}
            </span>
          ) : (
            <span className="text-xs font-mono border border-[#c8a84b] text-[#c8a84b] px-1.5 py-0.5 shrink-0">
              ISSUE
            </span>
          )}
          <span className="text-sm font-mono text-[#888880] truncate">{label}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {item.score !== undefined && (
            <span className="text-xs font-mono" style={{ color: scoreColor }}>
              {item.score}/10
            </span>
          )}
          <span className="text-[#444440] text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-[#2e2e2e]" onClick={e => e.stopPropagation()}>

          {/* Evidence from the text */}
          {item.textEvidence && (
            <div className="pt-4">
              <p className="text-xs font-mono text-[#444440] uppercase tracking-widest mb-2">From the text</p>
              <blockquote className="border-l-2 border-[#c8a84b] pl-3">
                <p className="text-xs font-mono text-[#e8e8e0] leading-relaxed italic">&ldquo;{item.textEvidence}&rdquo;</p>
              </blockquote>
            </div>
          )}

          {/* Gap */}
          <div className={item.textEvidence ? '' : 'pt-4'}>
            <p className="text-xs font-mono text-[#444440] uppercase tracking-widest mb-1">Why this is a problem</p>
            <p className="text-xs font-mono text-[#888880] leading-relaxed">{item.gap}</p>
          </div>

          {/* Specific advice for this text */}
          {item.specificAdvice && (
            <div>
              <p className="text-xs font-mono text-[#444440] uppercase tracking-widest mb-1">For this argument specifically</p>
              <p className="text-xs font-mono text-[#888880] leading-relaxed border-l border-[#2e2e2e] pl-3">{item.specificAdvice}</p>
            </div>
          )}

          {/* Contrarian resource */}
          {item.contraryResource && (
            <div>
              <p className="text-xs font-mono text-[#444440] uppercase tracking-widest mb-1">Read the other side</p>
              <div className="flex items-start gap-2">
                <span className="text-[#c8a84b] text-xs mt-0.5 shrink-0">→</span>
                <p className="text-xs font-mono text-[#888880] leading-relaxed">{item.contraryResource}</p>
              </div>
            </div>
          )}

          {/* General look up */}
          <div>
            <p className="text-xs font-mono text-[#444440] uppercase tracking-widest mb-2">General reading</p>
            <ul className="space-y-1">
              {item.lookUp.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#444440] text-xs mt-0.5 shrink-0">→</span>
                  <span className="text-xs font-mono text-[#666660] leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Perspective */}
          <div>
            <p className="text-xs font-mono text-[#444440] uppercase tracking-widest mb-1">Perspective shift</p>
            <p className="text-xs font-mono text-[#c8a84b] leading-relaxed italic">&ldquo;{item.perspective}&rdquo;</p>
          </div>

          {/* Next step */}
          <div>
            <p className="text-xs font-mono text-[#444440] uppercase tracking-widest mb-1">Next step</p>
            <p className="text-xs font-mono text-[#888880] leading-relaxed border-l border-[#2e2e2e] pl-3">{item.nextStep}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ImprovementPanel({ improvements }: ImprovementPanelProps) {
  if (improvements.length === 0) {
    return (
      <p className="text-xs font-mono text-[#444440]">
        No significant improvement areas identified. Reasoning is strong across all dimensions.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {improvements.map((item, i) => (
        <ImprovementCard key={i} item={item} />
      ))}
    </div>
  )
}
