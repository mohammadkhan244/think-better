'use client'

import { useState } from 'react'

interface FloaterBreakdownProps {
  scores: Record<string, { score: number; justification: string }>
}

const DIMENSION_NAMES: Record<string, string> = {
  F: 'Falsifiability',
  L: 'Logic',
  O: 'Objectivity',
  A: 'Alternatives',
  T: 'Tentativeness',
  E: 'Evidence',
  R: 'Replicability',
}

function getSignalLabel(score: number): string {
  if (score <= 3) return 'Limited signals detected'
  if (score <= 5) return 'Partial signals'
  if (score <= 7) return 'Moderate signals'
  if (score <= 9) return 'Strong signals'
  return 'Clear signals'
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#4a9e6b'
  if (score >= 5) return '#d4851a'
  return '#c0392b'
}

export default function FloaterBreakdown({ scores }: FloaterBreakdownProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-1">
      {Object.entries(scores).map(([key, val]) => {
        const isOpen = expanded === key
        const color = getScoreColor(val.score)
        const label = getSignalLabel(val.score)
        return (
          <div
            key={key}
            className="border border-[#2e2e2e] cursor-pointer hover:border-[#c8a84b] transition-colors"
            onClick={() => setExpanded(isOpen ? null : key)}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span
                className="text-xs font-bold w-6 h-6 flex items-center justify-center border shrink-0"
                style={{ color, borderColor: color }}
              >
                {key}
              </span>
              <span className="text-sm font-mono text-[#888880]">
                {DIMENSION_NAMES[key]}
              </span>
              <span className="text-xs font-mono mx-1 text-[#444440]">—</span>
              <span className="text-xs font-mono flex-1" style={{ color }}>
                {label}
              </span>
              <span className="text-[#444440] text-xs">{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
              <div className="px-4 pb-3 pt-0">
                <p className="text-xs font-mono text-[#666660] leading-relaxed border-t border-[#2e2e2e] pt-3">
                  {val.justification}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
