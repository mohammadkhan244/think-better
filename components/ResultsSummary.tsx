interface ResultsSummaryProps {
  summary: string
  overall: number
  fromCache: boolean
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#4a9e6b'
  if (score >= 5) return '#d4851a'
  return '#c0392b'
}

export default function ResultsSummary({ summary, overall, fromCache }: ResultsSummaryProps) {
  const color = getScoreColor(overall)
  return (
    <div className="border border-[#2e2e2e] p-6">
      <div className="flex items-start gap-6">
        <div className="shrink-0">
          <div className="text-6xl font-serif" style={{ color }}>
            {overall}
          </div>
          <div className="text-xs font-mono text-[#444440] mt-1">/ 10</div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-[#c8a84b]">FLOATER SCORE</span>
            {fromCache && (
              <span className="text-xs font-mono text-[#444440] border border-[#2e2e2e] px-1.5 py-0.5">
                cached
              </span>
            )}
          </div>
          <p className="text-sm font-mono text-[#888880] leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  )
}
