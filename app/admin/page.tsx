'use client'

import { useState } from 'react'

interface FeedbackEntry {
  id: string
  timestamp: number
  type: string
  message: string
  email?: string
}

interface AnalysisEvent {
  id: string
  timestamp: number
  inputType: string
  wordCount: number
  domain: string
  patternCount: number
  floaterOverall: number
}

interface Summary {
  totalAnalyses: number
  inputTypeCounts: Record<string, number>
  domainCounts: Record<string, number>
  patternCounts: Record<string, number>
  floaterTotals: Record<string, number>
  floaterCount: number
  narratives: string[]
  bookTitles: string[]
}

interface AdminData {
  summary: Summary | null
  recentEvents: AnalysisEvent[]
  feedback: FeedbackEntry[]
  totalEvents: number
  totalFeedback: number
}

type Section =
  'overview' | 'floater' | 'patterns' |
  'narratives' | 'books' | 'feedback' | 'events'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'overview',   label: 'Overview' },
  { id: 'floater',    label: 'FLOATER Scores' },
  { id: 'patterns',   label: 'Patterns Detected' },
  { id: 'narratives', label: 'Default Narratives' },
  { id: 'books',      label: 'Books Recommended' },
  { id: 'feedback',   label: 'Feedback' },
  { id: 'events',     label: 'Recent Events' },
]

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AdminData | null>(null)
  const [activeSection, setActiveSection] = useState<Section>('overview')
  const [viewAll, setViewAll] = useState(false)
  const [ingestUrl, setIngestUrl] = useState('')
  const [ingestStatus, setIngestStatus] = useState('')
  const [ingestLoading, setIngestLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (res.ok) {
        const d = await res.json()
        setData(d)
        setAuthed(true)
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Wrong password.')
      }
    } catch {
      setError('Failed to connect.')
    }
    setLoading(false)
  }

  const handleIngest = async () => {
    if (!ingestUrl.trim()) return
    setIngestLoading(true)
    setIngestStatus('')
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'ingest', shareUrl: ingestUrl.trim() })
      })
      const d = await res.json()
      setIngestStatus(d.message || (d.ok ? 'Done.' : 'Failed.'))
      if (d.ok) setIngestUrl('')
    } catch {
      setIngestStatus('Request failed.')
    }
    setIngestLoading(false)
  }

  const s = data?.summary

  const floaterAvgs = s
    ? Object.entries(s.floaterTotals).map(([k, v]) => ({
        dim: k,
        avg: s.floaterCount > 0
          ? ((v as number) / s.floaterCount).toFixed(1)
          : '—'
      }))
    : []

  const topPatterns = s
    ? Object.entries(s.patternCounts as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
    : []

  const domainEntries = s
    ? Object.entries(s.domainCounts as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
    : []

  const inputTypeEntries = s
    ? Object.entries(s.inputTypeCounts as Record<string, number>)
    : []

  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0908',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}>
        <div style={{
          background: '#141210',
          border: '1px solid rgba(200,168,75,0.2)',
          padding: '40px',
          width: '320px',
          borderRadius: '4px',
        }}>
          <div style={{
            color: '#c8a84b',
            fontSize: '0.7rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}>
            [[ ]] Admin
          </div>

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(200,168,75,0.15)',
              borderRadius: '4px',
              color: '#e8e4db',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              marginBottom: '12px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />

          {error && (
            <p style={{
              color: 'rgba(200,100,100,0.7)',
              fontSize: '0.75rem',
              marginBottom: '12px',
            }}>
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '12px',
              background: password ? '#c8a84b' : 'rgba(200,168,75,0.2)',
              border: 'none',
              color: password ? '#0a0908' : 'rgba(200,168,75,0.4)',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              cursor: password ? 'pointer' : 'not-allowed',
              borderRadius: '4px',
            }}
          >
            {loading ? 'Loading...' : 'Enter →'}
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const cell = (v: React.ReactNode) => (
    <td style={{
      padding: '10px 14px',
      borderBottom: '1px solid rgba(200,168,75,0.08)',
      color: '#e8e4db',
      fontSize: '0.82rem',
      fontFamily: 'monospace',
    }}>
      {v}
    </td>
  )

  const th = (v: string) => (
    <th style={{
      padding: '10px 14px',
      textAlign: 'left',
      fontSize: '0.65rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'rgba(200,168,75,0.6)',
      borderBottom: '1px solid rgba(200,168,75,0.15)',
      fontWeight: 400,
      fontFamily: 'monospace',
    }}>
      {v}
    </th>
  )

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#141210',
    border: '1px solid rgba(200,168,75,0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
  }

  const SectionBlock = ({
    id, title, children
  }: {
    id: Section
    title: string
    children: React.ReactNode
  }) => {
    const visible = viewAll || activeSection === id
    if (!visible) return null
    return (
      <div id={id} style={{ marginBottom: '48px', scrollMarginTop: '80px' }}>
        <h2 style={{
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#c8a84b',
          marginBottom: '16px',
          fontWeight: 400,
        }}>
          {title}
        </h2>
        {children}
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0908',
      color: '#e8e4db',
      fontFamily: 'monospace',
    }}>
      {/* Top nav */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#0e0c0a',
        borderBottom: '1px solid rgba(200,168,75,0.15)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <span style={{
          color: '#c8a84b',
          fontSize: '0.7rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginRight: '8px',
          flexShrink: 0,
        }}>
          [[ ]] Admin
        </span>

        <select
          value={viewAll ? 'all' : activeSection}
          onChange={e => {
            if (e.target.value === 'all') {
              setViewAll(true)
            } else {
              setViewAll(false)
              setActiveSection(e.target.value as Section)
            }
          }}
          style={{
            background: '#1a1a1a',
            border: '1px solid rgba(200,168,75,0.2)',
            color: '#e8e4db',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            padding: '6px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">All sections</option>
          {SECTIONS.map(sec => (
            <option key={sec.id} value={sec.id}>{sec.label}</option>
          ))}
        </select>

        {/* Ingest from share link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <input
            value={ingestUrl}
            onChange={e => setIngestUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleIngest()}
            placeholder="Paste share URL to ingest…"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(200,168,75,0.15)',
              color: '#e8e4db',
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              padding: '5px 10px',
              borderRadius: '4px',
              outline: 'none',
              width: '260px',
            }}
          />
          <button
            onClick={handleIngest}
            disabled={ingestLoading || !ingestUrl.trim()}
            style={{
              background: ingestUrl.trim() ? '#c8a84b' : 'rgba(200,168,75,0.2)',
              border: 'none',
              color: ingestUrl.trim() ? '#0a0908' : 'rgba(200,168,75,0.4)',
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              padding: '5px 12px',
              borderRadius: '4px',
              cursor: ingestUrl.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {ingestLoading ? '…' : 'Ingest →'}
          </button>
          {ingestStatus && (
            <span style={{ fontSize: '0.7rem', color: ingestStatus.startsWith('Ingested') ? '#c8a84b' : 'rgba(200,100,100,0.8)' }}>
              {ingestStatus}
            </span>
          )}
        </div>

        <span style={{ fontSize: '0.72rem', color: 'rgba(232,228,219,0.4)', flexShrink: 0 }}>
          {data.totalEvents} analyses · {data.totalFeedback} feedback
        </span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* OVERVIEW */}
        <SectionBlock id="overview" title="Overview">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}>
            {[
              { label: 'Total Analyses', value: s?.totalAnalyses || 0 },
              { label: 'Total Feedback', value: data.totalFeedback },
              {
                label: 'Avg Patterns/Analysis',
                value: s && s.totalAnalyses > 0
                  ? (Object.values(s.patternCounts as Record<string, number>)
                      .reduce((a: number, b: number) => a + b, 0) / s.totalAnalyses).toFixed(1)
                  : '—'
              },
              {
                label: 'Avg FLOATER Score',
                value: s && s.floaterCount > 0
                  ? (Object.values(s.floaterTotals as Record<string, number>)
                      .reduce((a: number, b: number) => a + b, 0) / (s.floaterCount * 7)).toFixed(1)
                  : '—'
              },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#141210',
                border: '1px solid rgba(200,168,75,0.1)',
                borderRadius: '4px',
                padding: '20px',
              }}>
                <div style={{ fontSize: '1.6rem', color: '#c8a84b', marginBottom: '6px', fontWeight: 500 }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(232,228,219,0.35)',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <table style={tableStyle}>
            <thead><tr>{th('Input Type')}{th('Count')}</tr></thead>
            <tbody>
              {inputTypeEntries.map(([k, v]) => (
                <tr key={k}>{cell(k)}{cell(v)}</tr>
              ))}
            </tbody>
          </table>

          <div style={{ height: '16px' }} />

          <table style={tableStyle}>
            <thead><tr>{th('Domain')}{th('Count')}</tr></thead>
            <tbody>
              {domainEntries.map(([k, v]) => (
                <tr key={k}>{cell(k)}{cell(v)}</tr>
              ))}
            </tbody>
          </table>
        </SectionBlock>

        {/* FLOATER SCORES */}
        <SectionBlock id="floater" title="FLOATER Scores">
          <table style={tableStyle}>
            <thead>
              <tr>{th('Dimension')}{th('Avg Score')}{th('Out of 10')}</tr>
            </thead>
            <tbody>
              {floaterAvgs.map(({ dim, avg }) => (
                <tr key={dim}>
                  {cell(dim)}
                  {cell(avg)}
                  {cell(
                    <div style={{ width: '120px', height: '4px', background: 'rgba(200,168,75,0.15)', borderRadius: '2px' }}>
                      <div style={{
                        width: `${parseFloat(avg as string) * 10}%`,
                        height: '100%',
                        background: '#c8a84b',
                        borderRadius: '2px',
                      }} />
                    </div>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </SectionBlock>

        {/* PATTERNS */}
        <SectionBlock id="patterns" title="Patterns Detected">
          <table style={tableStyle}>
            <thead><tr>{th('Pattern')}{th('Times Detected')}</tr></thead>
            <tbody>
              {topPatterns.map(([name, count]) => (
                <tr key={name}>{cell(name)}{cell(count)}</tr>
              ))}
            </tbody>
          </table>
        </SectionBlock>

        {/* NARRATIVES */}
        <SectionBlock id="narratives" title="Default Narratives">
          {(s?.narratives || []).length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'rgba(232,228,219,0.3)', fontStyle: 'italic' }}>
              No narratives logged yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(s?.narratives || []).map((n: string, i: number) => (
                <div key={i} style={{
                  background: '#141210',
                  border: '1px solid rgba(200,168,75,0.08)',
                  borderLeft: '2px solid rgba(200,168,75,0.4)',
                  padding: '12px 16px',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  fontStyle: 'italic',
                  color: 'rgba(232,228,219,0.8)',
                }}>
                  &ldquo;{n}&rdquo;
                </div>
              ))}
            </div>
          )}
        </SectionBlock>

        {/* BOOKS */}
        <SectionBlock id="books" title="Books Recommended">
          {(s?.bookTitles || []).length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'rgba(232,228,219,0.3)', fontStyle: 'italic' }}>
              No books logged yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(s?.bookTitles || []).map((title: string, i: number) => (
                <div key={i} style={{
                  padding: '10px 14px',
                  background: i % 2 === 0 ? '#141210' : '#111009',
                  fontSize: '0.82rem',
                  color: 'rgba(232,228,219,0.7)',
                  borderBottom: '1px solid rgba(200,168,75,0.06)',
                }}>
                  {i + 1}. {title}
                </div>
              ))}
            </div>
          )}
        </SectionBlock>

        {/* FEEDBACK */}
        <SectionBlock id="feedback" title="Feedback">
          {data.feedback.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'rgba(232,228,219,0.3)', fontStyle: 'italic' }}>
              No feedback submitted yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.feedback.map((f: FeedbackEntry) => (
                <div key={f.id} style={{
                  background: '#141210',
                  border: '1px solid rgba(200,168,75,0.1)',
                  borderRadius: '4px',
                  padding: '16px 20px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c8a84b' }}>
                      {f.type === 'feature' ? 'Feature Request' : 'Feedback'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(232,228,219,0.3)' }}>
                      {new Date(f.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '0.85rem',
                    lineHeight: '1.7',
                    color: 'rgba(232,228,219,0.85)',
                    whiteSpace: 'pre-wrap',
                    marginBottom: f.email ? '10px' : 0,
                  }}>
                    {f.message}
                  </p>
                  {f.email && (
                    <a href={`mailto:${f.email}`} style={{
                      fontSize: '0.72rem',
                      color: 'rgba(200,168,75,0.6)',
                      textDecoration: 'none',
                    }}>
                      {f.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionBlock>

        {/* RECENT EVENTS */}
        <SectionBlock id="events" title="Recent Events">
          <table style={tableStyle}>
            <thead>
              <tr>
                {th('Date')}
                {th('Type')}
                {th('Domain')}
                {th('Words')}
                {th('Patterns')}
                {th('FLOATER')}
              </tr>
            </thead>
            <tbody>
              {data.recentEvents.map((e: AnalysisEvent) => (
                <tr key={e.id}>
                  {cell(new Date(e.timestamp).toLocaleDateString())}
                  {cell(e.inputType)}
                  {cell(e.domain)}
                  {cell(e.wordCount)}
                  {cell(e.patternCount)}
                  {cell(e.floaterOverall?.toFixed(1))}
                </tr>
              ))}
            </tbody>
          </table>
        </SectionBlock>

      </div>
    </div>
  )
}
