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
        return (
          <div
            key={key}
            className="border border-[#2e2e2e] cursor-pointer hover:border-[#c8a84b] transition-colors"
            onClick={() => setExpanded(isOpen ? null : key)}
          >
            <div className="flex items-center gap-4 px-4 py-3">
              <span
                className="text-xs font-bold w-6 h-6 flex items-center justify-center border"
                style={{ color, borderColor: color }}
              >
                {key}
              </span>
              <span className="text-sm font-mono text-[#888880] flex-1">
                {DIMENSION_NAMES[key]}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-[#2e2e2e]">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${val.score * 10}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-sm font-mono w-8 text-right" style={{ color }}>
                  {val.score}
                </span>
              </div>
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
