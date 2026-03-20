'use client'

import { useState, useRef, useCallback } from 'react'

type Tab = 'text' | 'pdf' | 'youtube' | 'article'

interface InputTabsProps {
  onAnalyze: (text: string, sourceType: Tab) => void
  isLoading: boolean
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

const EXAMPLE_CHIPS = [
  {
    label: 'A health claim I\'m skeptical of',
    text: "Sugar is just sugar. Your body can't tell the difference between the fructose in a grape and the sugar in a Hershey's Kiss, so there's no reason to avoid candy if you're already eating fruit. The science on this is settled — calories in, calories out is all that matters. Anyone who says otherwise is selling you something.",
  },
  {
    label: 'Something my boss said',
    text: "We need to move fast on this. The market window is closing and if we don't ship in the next two weeks we'll lose our advantage. I know the QA isn't done but honestly our competitors aren't perfect either. We can fix bugs after launch — that's what updates are for. The team that ships first wins.",
  },
  {
    label: 'A news headline or op-ed',
    text: "Remote work is destroying innovation and corporate culture. Every major breakthrough in tech happened in an office. Companies that went fully remote are already seeing the consequences — declining output, disengaged employees, and a generation of workers who don't know how to collaborate. The data is clear: in-person teams outperform remote ones.",
  },
  {
    label: 'A position I\'m about to defend',
    text: "AI will eliminate more jobs than it creates. Every major technological shift in history has displaced workers, and this one moves faster than any before it. The jobs it creates require skills most displaced workers don't have and can't realistically acquire. Net job loss is inevitable.",
  },
]

export default function InputTabs({ onAnalyze, isLoading }: InputTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('text')
  const [textValue, setTextValue] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfText, setPdfText] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeText, setYoutubeText] = useState('')
  const [youtubeLoading, setYoutubeLoading] = useState(false)
  const [youtubeError, setYoutubeError] = useState('')
  const [articleUrl, setArticleUrl] = useState('')
  const [articleText, setArticleText] = useState('')
  const [articleTitle, setArticleTitle] = useState('')
  const [articleLoading, setArticleLoading] = useState(false)
  const [articleError, setArticleError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentWordCount =
    activeTab === 'text' ? countWords(textValue)
    : activeTab === 'pdf' ? countWords(pdfText)
    : activeTab === 'youtube' ? countWords(youtubeText)
    : countWords(articleText)

  const canAnalyze =
    currentWordCount >= 50 && !isLoading && !pdfLoading && !youtubeLoading && !articleLoading

  const getCurrentText = () => {
    if (activeTab === 'text') return textValue
    if (activeTab === 'pdf') return pdfText
    if (activeTab === 'youtube') return youtubeText
    return articleText
  }

  const handlePdfFile = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setPdfError('Please upload a PDF file.')
      return
    }
    setPdfFile(file)
    setPdfError('')
    setPdfLoading(true)
    setPdfText('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) setPdfError(data.error)
      else setPdfText(data.text)
    } catch {
      setPdfError('Failed to extract PDF text.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handlePdfFile(file)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleYoutubeExtract = async () => {
    setYoutubeError('')
    setYoutubeLoading(true)
    setYoutubeText('')
    try {
      const res = await fetch('/api/extract-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
      })
      const data = await res.json()
      if (data.error) setYoutubeError(data.error)
      else setYoutubeText(data.text)
    } catch {
      setYoutubeError('Failed to fetch transcript.')
    } finally {
      setYoutubeLoading(false)
    }
  }

  const handleArticleExtract = async () => {
    setArticleError('')
    setArticleLoading(true)
    setArticleText('')
    setArticleTitle('')
    try {
      const res = await fetch('/api/extract-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: articleUrl }),
      })
      const data = await res.json()
      if (data.error) setArticleError(data.error)
      else {
        setArticleText(data.text)
        setArticleTitle(data.title ?? '')
      }
    } catch {
      setArticleError('Failed to fetch article.')
    } finally {
      setArticleLoading(false)
    }
  }

  const isValidUrl = (url: string) => {
    try { new URL(url); return true } catch { return false }
  }

  const isValidYoutubeUrl = (url: string) =>
    /youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\//.test(url)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'text', label: 'Text' },
    { id: 'pdf', label: 'PDF' },
    { id: 'article', label: 'Article' },
    { id: 'youtube', label: 'YouTube' },
  ]

  return (
    <div className="border border-[#2e2e2e]">
      <div className="flex border-b border-[#2e2e2e]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-xs font-mono transition-colors ${
              activeTab === tab.id
                ? 'text-[#c8a84b] border-b border-[#c8a84b] -mb-px bg-[#1a1a1a]'
                : 'text-[#444440] hover:text-[#888880]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'text' && (
          <div>
            <textarea
              className="w-full h-48 bg-transparent text-[#e8e8e0] font-mono text-sm resize-none outline-none placeholder-[#444440] leading-relaxed"
              placeholder="Paste your argument, article, transcript, or claim here..."
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onInput={(e) => setTextValue((e.target as HTMLTextAreaElement).value)}
              maxLength={48000}
            />
            {!textValue && (
              <div className="mt-3">
                <p className="text-xs font-mono text-[#444440] mb-2">Not sure what to paste? Try one of these:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {EXAMPLE_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => setTextValue(chip.text)}
                      className="text-left text-xs font-mono text-[#666660] border border-[#2e2e2e] px-2.5 py-1.5 hover:border-[#c8a84b] hover:text-[#c8a84b] transition-colors leading-relaxed"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pdf' && (
          <div className="space-y-3">
            <div
              className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-[#c8a84b] bg-[#c8a84b08]' : 'border-[#2e2e2e] hover:border-[#444440]'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePdfFile(e.target.files[0])}
              />
              {pdfLoading ? (
                <p className="text-xs font-mono text-[#888880]">Extracting text...</p>
              ) : pdfFile ? (
                <div>
                  <p className="text-xs font-mono text-[#c8a84b]">{pdfFile.name}</p>
                  {pdfText && (
                    <p className="text-xs font-mono text-[#4a9e6b] mt-1">
                      {countWords(pdfText)} words extracted
                    </p>
                  )}
                  <p className="text-xs font-mono text-[#444440] mt-2">Click to re-upload</p>
                </div>
              ) : (
                <p className="text-xs font-mono text-[#444440]">Drop PDF here or click to upload</p>
              )}
            </div>
            {pdfError && <p className="text-xs font-mono text-[#c0392b]">{pdfError}</p>}
          </div>
        )}

        {activeTab === 'article' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                className="flex-1 bg-transparent border border-[#2e2e2e] text-[#e8e8e0] font-mono text-sm px-3 py-2 outline-none focus:border-[#c8a84b] placeholder-[#444440]"
                placeholder="https://example.com/article..."
                value={articleUrl}
                onChange={(e) => {
                  setArticleUrl(e.target.value)
                  setArticleText('')
                  setArticleTitle('')
                  setArticleError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValidUrl(articleUrl) && !articleLoading) handleArticleExtract()
                }}
              />
              <button
                onClick={handleArticleExtract}
                disabled={!isValidUrl(articleUrl) || articleLoading}
                className="px-4 py-2 text-xs font-mono border border-[#2e2e2e] text-[#888880] hover:border-[#c8a84b] hover:text-[#c8a84b] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {articleLoading ? 'Loading...' : 'Extract'}
              </button>
            </div>
            {articleError && (
              <div className="space-y-2">
                <p className="text-xs font-mono text-[#c0392b]">{articleError}</p>
                <p className="text-xs font-mono text-[#444440]">
                  If the article is paywalled, copy the text and paste it into the{' '}
                  <button onClick={() => setActiveTab('text')} className="text-[#c8a84b] underline">
                    Text tab
                  </button>
                  .
                </p>
              </div>
            )}
            {articleText && (
              <div>
                {articleTitle && (
                  <p className="text-xs font-mono text-[#c8a84b] mb-1 truncate">{articleTitle}</p>
                )}
                <p className="text-xs font-mono text-[#4a9e6b]">
                  {countWords(articleText)} words extracted
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'youtube' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                className="flex-1 bg-transparent border border-[#2e2e2e] text-[#e8e8e0] font-mono text-sm px-3 py-2 outline-none focus:border-[#c8a84b] placeholder-[#2e2e2e]"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value)
                  setYoutubeText('')
                  setYoutubeError('')
                }}
              />
              <button
                onClick={handleYoutubeExtract}
                disabled={!isValidYoutubeUrl(youtubeUrl) || youtubeLoading}
                className="px-4 py-2 text-xs font-mono border border-[#2e2e2e] text-[#888880] hover:border-[#c8a84b] hover:text-[#c8a84b] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {youtubeLoading ? 'Loading...' : 'Extract'}
              </button>
            </div>
            {youtubeError && (
              <div className="space-y-2">
                <p className="text-xs font-mono text-[#c0392b]">{youtubeError}</p>
                <div className="border border-[#2e2e2e] p-3 space-y-1">
                  <p className="text-xs font-mono text-[#888880]">YouTube blocks automatic extraction from servers. To work around this:</p>
                  <ol className="text-xs font-mono text-[#666660] space-y-1 list-none">
                    <li>1. Open the video on YouTube</li>
                    <li>2. Click <span className="text-[#888880]">&#8942;</span> below the video → <span className="text-[#888880]">Show transcript</span></li>
                    <li>3. Copy all the transcript text</li>
                    <li>4. Paste it into the <button onClick={() => setActiveTab('text')} className="text-[#c8a84b] underline cursor-pointer">Text tab</button></li>
                  </ol>
                </div>
              </div>
            )}
            {youtubeText && (
              <p className="text-xs font-mono text-[#4a9e6b]">
                {countWords(youtubeText)} words extracted from transcript
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2e2e2e]">
          <span className="text-xs font-mono text-[#444440]">
            {currentWordCount} word{currentWordCount !== 1 ? 's' : ''}
            {currentWordCount < 50 && currentWordCount > 0 && (
              <span className="text-[#c0392b] ml-1">— need {50 - currentWordCount} more</span>
            )}
          </span>
          <button
            onClick={() => onAnalyze(getCurrentText(), activeTab)}
            disabled={!canAnalyze}
            className="px-6 py-2 text-xs font-mono border transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-[#c8a84b] text-[#c8a84b] hover:bg-[#c8a84b] hover:text-[#0e0e0e]"
          >
            {isLoading ? 'ANALYZING...' : 'ANALYZE'}
          </button>
        </div>
      </div>
    </div>
  )
}
