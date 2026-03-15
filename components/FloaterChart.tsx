'use client'

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface FloaterChartProps {
  scores: Record<string, { score: number; justification: string }>
}

const DIMENSION_LABELS: Record<string, string> = {
  F: 'Falsifiability',
  L: 'Logic',
  O: 'Objectivity',
  A: 'Alternatives',
  T: 'Tentativeness',
  E: 'Evidence',
  R: 'Replicability',
}

export default function FloaterChart({ scores }: FloaterChartProps) {
  const data = Object.entries(scores).map(([key, val]) => ({
    dimension: DIMENSION_LABELS[key] || key,
    score: val.score,
    fullMark: 10,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
        <PolarGrid stroke="#2e2e2e" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: '#888880', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
        />
        <Radar
          name="FLOATER"
          dataKey="score"
          stroke="#c8a84b"
          fill="#c8a84b"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #2e2e2e',
            borderRadius: 0,
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 12,
            color: '#e8e8e0',
          }}
          formatter={(value) => [`${value}/10`, 'Score']}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
