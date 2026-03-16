'use client'

interface BiasCardProps {
  name: string
  type: 'bias' | 'fallacy'
  definition: string
  matchedText: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  floaterDimension: string
}

const signalStrength: Record<string, string> = {
  HIGH: 'Strong signal',
  MEDIUM: 'Possible signal',
  LOW: 'Weak signal',
}

const signalColors: Record<string, string> = {
  HIGH: '#4a9e6b',
  MEDIUM: '#d4851a',
  LOW: '#666660',
}

export default function BiasCard({ name, type, definition, matchedText, confidence, floaterDimension }: BiasCardProps) {
  return (
    <div className="border border-[#2e2e2e] p-4 hover:border-[#c8a84b] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-serif text-[#e8e8e0] text-sm">{name}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs font-mono px-1.5 py-0.5 border"
            style={{ color: type === 'fallacy' ? '#c8a84b' : '#888880', borderColor: type === 'fallacy' ? '#c8a84b' : '#444440' }}
          >
            {type === 'fallacy' ? 'REASONING PATTERN' : 'COGNITIVE PATTERN'}
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: signalColors[confidence] }}
          >
            {signalStrength[confidence]}
          </span>
        </div>
      </div>
      <p className="text-xs text-[#666660] font-mono leading-relaxed mb-3">{definition}</p>
      <div className="flex items-start gap-2">
        <span className="text-xs text-[#444440] font-mono shrink-0">found in:</span>
        <em className="text-xs text-[#888880] font-mono">&quot;{matchedText}&quot;</em>
      </div>
      <div className="mt-2">
        <span className="text-xs text-[#444440] font-mono">affects FLOATER-{floaterDimension}</span>
      </div>
    </div>
  )
}
