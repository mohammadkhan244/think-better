'use client'

import { useState } from 'react'

interface QuestionListProps {
  questions: string[]
}

export default function QuestionList({ questions }: QuestionListProps) {
  const [copied, setCopied] = useState<number | null>(null)

  const handleCopy = async (q: string, i: number) => {
    await navigator.clipboard.writeText(q)
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <ol className="space-y-3">
      {questions.map((q, i) => (
        <li key={i} className="flex items-start gap-3 group">
          <span className="text-[#444440] font-mono text-xs mt-0.5 w-5 shrink-0">{i + 1}.</span>
          <p className="text-sm font-mono text-[#888880] leading-relaxed flex-1">{q}</p>
          <button
            onClick={() => handleCopy(q, i)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-[#c8a84b] hover:text-[#e8e8e0] shrink-0"
          >
            {copied === i ? 'copied' : 'copy'}
          </button>
        </li>
      ))}
    </ol>
  )
}
