interface ResultsSummaryProps {
  summary: string
  overall: number
  fromCache: boolean
}

function getVisibilityLabel(score: number): string {
  if (score >= 9.1) return 'CLEAR'
  if (score >= 7.1) return 'STRONG'
  if (score >= 5.1) return 'MODERATE'
  if (score >= 3.1) return 'PARTIAL'
  return 'LOW'
}

function getScoreColor(score: number): string {
  if (score >= 7) return '#4a9e6b'
  if (score >= 4) return '#d4851a'
  return '#c0392b'
}

export default function ResultsSummary({ summary, overall, fromCache }: ResultsSummaryProps) {
  const color = getScoreColor(overall)
  const visibility = getVisibilityLabel(overall)

  return (
    <div className="border border-[#2e2e2e] p-6">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-[#444440] tracking-widest uppercase">Reasoning Terrain</span>
            {fromCache && (
              <span className="text-xs font-mono text-[#444440] border border-[#2e2e2e] px-1.5 py-0.5">cached</span>
            )}
          </div>
          <div className="text-sm font-mono mb-3" style={{ color }}>
            Visibility: {visibility}
          </div>
          <p className="text-xs font-mono text-[#666660] leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  )
}
