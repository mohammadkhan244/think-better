'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import BiasCard from '@/components/BiasCard'

const FloaterChart = dynamic(() => import('@/components/FloaterChart'), { ssr: false })

interface Questions { defend: string[]; challenge: string[]; missing: string[] }
interface BeliefSystem {
  coreAssumptions: string[]
  loadBearingBeliefs: string[]
  incentiveSystem: string
  speakerComparison: { speaker: string; coreBeliefs: string[] }[] | null
}
interface BookEntry { title: string; author: string; category: string; why: string }
interface Issue {
  name: string; type: 'bias' | 'fallacy'; definition: string
  matchedText: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; floaterDimension: string
}
interface FloaterData {
  scores: Record<string, { score: number; justification: string }>
  overall: number
}
interface DefaultNarrative {
  narrative: string; loadBearing: string; whoBenefits: string
  ifItBreaksUpside: string; ifItBreaksDownside: string
}

interface SingleResult {
  mode: 'single'
  floater: FloaterData
  biasesAndFallacies: Issue[]
  followUpQuestions: Questions
  domain?: { domain: string; confidence: string }
  resources?: { books: BookEntry[] }
  beliefSystem?: BeliefSystem
  defaultNarrative?: DefaultNarrative
  summary: string
}

interface MultiResult {
  mode: 'multi-speaker'
  speakers: {
    speaker: string; wordCount: number; floater: FloaterData
    biasesAndFallacies: Issue[]; followUpQuestions: Questions; summary: string
  }[]
  beliefSystem?: BeliefSystem
  defaultNarrative?: DefaultNarrative
  resources?: { books: BookEntry[] }
}

type AnalysisResult = SingleResult | MultiResult

const domainConfig: Record<string, { label: string; explanation: string }> = {
  theological: { label: 'Theological Argument', explanation: 'In theological arguments, low Falsifiability and Replicability scores are expected — these dimensions were designed for empirical claims. Focus on Logic, Objectivity, and Alternatives instead.' },
  philosophical: { label: 'Philosophical Argument', explanation: 'Philosophical arguments are not empirically testable by design. Low Falsifiability and Replicability scores reflect the nature of the domain, not a flaw. Logic, Objectivity, and Alternative Explanations are the most meaningful dimensions here.' },
  political: { label: 'Political Argument', explanation: 'Political arguments often involve value claims that cannot be falsified. Evidence and Objectivity are the most useful dimensions to examine. Watch for framing effects and selective use of data.' },
  personal: { label: 'Personal or Anecdotal Argument', explanation: 'This text is primarily personal or experiential. FLOATER scores are most meaningful on structured arguments — Replicability and Evidence scores here reflect the absence of external sourcing, not the validity of the experience described.' },
  business: { label: 'Business or Strategic Argument', explanation: 'Business arguments often involve predictions under uncertainty. Evidence and Tentative Conclusions are the most useful dimensions. Watch for survivorship bias and overconfident projections.' },
  cultural: { label: 'Cultural & Social Argument', explanation: 'This argument operates as cultural or social criticism. Falsifiability and Replicability scores are less meaningful here — focus on Logic, Objectivity, and whether the argument seriously considers alternative explanations for the patterns it identifies.' },
  fiction: { label: 'Creative Writing', explanation: 'This appears to be creative or fictional writing. FLOATER scores, bias detection, and belief system extraction are not designed for fiction. The questions treat the narrative structure as the subject.' },
}

function getWhatThisMeans(overall: number, issueCount: number): string {
  if (overall < 4)
    return `This reasoning contains ${issueCount > 0 ? `${issueCount} structural pattern${issueCount !== 1 ? 's' : ''}` : 'several areas'} where conclusions depend on untested assumptions. The questions below will sharpen any decision built on top of it.`
  if (overall < 7)
    return `This reasoning has real structure, but some of the load-bearing claims rest on assumptions worth examining. The questions below help stress-test them.`
  return `The reasoning shows relatively strong structure. A few targeted questions could make it more robust.`
}

function getSignalLabel(score: number): string {
  if (score >= 9.1) return 'Clear signals'
  if (score >= 7.1) return 'Strong signals'
  if (score >= 5.1) return 'Moderate signals'
  if (score >= 3.1) return 'Partial signals'
  return 'Limited signals detected'
}

function InputToggle({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #2e2e2e' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'transparent', border: '1px solid #2e2e2e', color: '#666660', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'monospace', padding: '6px 14px' }}
      >
        {open ? '↑ Hide original input' : '↓ Show original input'}
      </button>
      {open && (
        <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto', padding: '14px', background: '#141414', border: '1px solid #2e2e2e' }}>
          <pre style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#a8a89a', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {text}
          </pre>
        </div>
      )}
    </div>
  )
}

function FloaterExpandable({ scores }: { scores: Record<string, { score: number; justification: string }> }) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }))
  const dimNames: Record<string, string> = { F: 'Falsifiability', L: 'Logic', O: 'Objectivity', A: 'Alternative Explanations', T: 'Tentative Conclusions', E: 'Evidence', R: 'Replicability' }
  return (
    <div style={{ marginTop: '16px' }}>
      {Object.entries(scores).map(([key, data]) => {
        const signal = getSignalLabel(data.score)
        const isOpen = open[key]
        return (
          <div key={key} style={{ borderBottom: '1px solid #2e2e2e', padding: '12px 0' }}>
            <div
              onClick={() => toggle(key)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#c8a84b', fontSize: '0.9rem' }}>{key}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#e8e8e0' }}>{dimNames[key] ?? key}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666660', fontStyle: 'italic' }}>— {signal}</span>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#c8a84b', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                {isOpen ? 'hide ↑' : 'what does this mean? ↓'}
              </span>
            </div>
            {isOpen && (
              <div style={{ marginTop: '10px', borderLeft: '3px solid #c8a84b', paddingLeft: '12px' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#e8e8e0', lineHeight: '1.6', margin: 0 }}>
                  {data.justification}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function getTerrainLabel(overall: number): string {
  if (overall >= 9.1) return 'Strong'
  if (overall >= 7.1) return 'Solid'
  if (overall >= 5.1) return 'Moderate'
  if (overall >= 3.1) return 'Mixed'
  return 'Fragile'
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a84b', marginBottom: '16px', marginTop: 0, fontWeight: 600 }}>
      {children}
    </h2>
  )
}

function BeliefSystemSection({ bs }: { bs: BeliefSystem }) {
  return (
    <section style={{ marginBottom: '40px', paddingTop: '32px', borderTop: '1px solid #2e2e2e' }}>
      <SectionHeading>Operating Belief System</SectionHeading>
      <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#666660', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '24px', marginTop: 0 }}>
        What this argument assumes to be true — never stated, but load-bearing.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {bs.coreAssumptions.length > 0 && (
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '8px', marginTop: 0 }}>Core Assumptions</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bs.coreAssumptions.map((a, i) => (
                <li key={i} style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#e8e8e0' }}>
                  <span style={{ color: '#666660', marginRight: '8px' }}>·</span>{a}
                </li>
              ))}
            </ul>
          </div>
        )}
        {bs.loadBearingBeliefs.length > 0 && (
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '8px', marginTop: 0 }}>If These Were False, The Argument Collapses</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bs.loadBearingBeliefs.map((b, i) => (
                <li key={i} style={{ paddingLeft: '20px', position: 'relative', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#e8e8e0' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#c8a84b' }}>→</span>{b}
                </li>
              ))}
            </ul>
          </div>
        )}
        {bs.incentiveSystem && (
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '8px', marginTop: 0 }}>Incentive System</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#666660', fontStyle: 'italic', lineHeight: '1.6', margin: 0, borderLeft: '2px solid #2e2e2e', paddingLeft: '12px' }}>
              {bs.incentiveSystem}
            </p>
          </div>
        )}
        {bs.speakerComparison && bs.speakerComparison.length > 0 && (
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '8px', marginTop: 0 }}>Where The Belief Systems Actually Diverge</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bs.speakerComparison.map((s, i) => (
                <div key={i} style={{ padding: '12px 14px', border: '1px solid #2e2e2e', background: '#141414' }}>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#c8a84b', marginBottom: '8px', marginTop: 0 }}>{s.speaker}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {s.coreBeliefs.map((b, j) => (
                      <li key={j} style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#e8e8e0' }}>
                        <span style={{ color: '#666660', marginRight: '8px' }}>·</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function DefaultNarrativeSection({ dn }: { dn: DefaultNarrative }) {
  return (
    <section style={{ marginBottom: '40px', paddingTop: '32px', borderTop: '1px solid #2e2e2e' }}>
      <SectionHeading>Default Narrative</SectionHeading>
      <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', fontStyle: 'italic', marginBottom: '20px', marginTop: 0 }}>
        The cultural story this argument is swimming in — never examined because it reads as reality.
      </p>
      <div style={{ padding: '14px 16px', border: '1px solid #c8a84b', background: 'rgba(200, 168, 75, 0.04)', marginBottom: '16px' }}>
        <p style={{ fontFamily: 'monospace', fontSize: '0.95rem', lineHeight: '1.6', color: '#e8e8e0', margin: 0, fontStyle: 'italic' }}>
          &ldquo;{dn.narrative}&rdquo;
        </p>
      </div>
      {[
        { label: 'What Makes It Load-Bearing', value: dn.loadBearing },
        { label: 'Who Benefits From It Staying Invisible', value: dn.whoBenefits },
        { label: 'If It Breaks — What Becomes Possible', value: dn.ifItBreaksUpside },
        { label: 'If It Breaks — What Gets Destabilized', value: dn.ifItBreaksDownside },
      ].map((row, i) => (
        <div key={i} style={{ paddingTop: '12px', paddingBottom: '12px', borderBottom: i < 3 ? '1px solid #2e2e2e' : 'none' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666660', marginBottom: '4px' }}>{row.label}</div>
          <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#e8e8e0', margin: 0 }}>{row.value}</p>
        </div>
      ))}
    </section>
  )
}

function QuestionsSection({ q }: { q: Questions }) {
  const groups = [
    { title: 'Questions that will come for this argument', subhead: 'The sharpest challenges — worth having answers for.', qs: q.defend, start: 1 },
    { title: 'Where to press, in order', subhead: 'Ordered by leverage. The first question does the most damage.', qs: q.challenge, start: 4 },
    { title: 'Outside the frame', subhead: 'Not flaws — absences. What this argument never thought to address.', qs: q.missing, start: 7 },
  ]
  return (
    <section style={{ paddingTop: '32px', borderTop: '1px solid #2e2e2e', marginBottom: '40px' }}>
      <SectionHeading>Questions That Pressure-Test This Argument</SectionHeading>
      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: gi < 2 ? '32px' : 0, paddingBottom: gi < 2 ? '24px' : 0, borderBottom: gi < 2 ? '1px solid #2e2e2e' : 'none' }}>
          <h3 style={{ fontFamily: 'monospace', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c8a84b', marginBottom: '6px', marginTop: 0 }}>{g.title}</h3>
          <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', fontStyle: 'italic', marginBottom: '16px', marginTop: 0 }}>{g.subhead}</p>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {g.qs.map((question, i) => (
              <li key={i} style={{ fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.6, color: '#e8e8e0' }}>
                <span style={{ color: '#444440', marginRight: '8px' }}>{g.start + i}.</span>{question}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  )
}

function BooksSection({ books }: { books: BookEntry[] }) {
  if (!books.length) return null
  return (
    <section style={{ paddingTop: '32px', borderTop: '1px solid #2e2e2e', marginBottom: '40px' }}>
      <SectionHeading>Go Deeper</SectionHeading>
      <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', fontStyle: 'italic', marginBottom: '20px', marginTop: 0 }}>
        Three angles you haven&apos;t considered — not more of what you already believe.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {books.map((book, i) => (
          <div key={i} style={{ padding: '14px 16px', border: '1px solid #2e2e2e', background: '#141414' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666660', marginBottom: '4px' }}>{book.category}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 600, marginBottom: '2px', color: '#e8e8e0' }}>{book.title}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', marginBottom: '8px' }}>{book.author}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#e8e8e0', lineHeight: '1.5' }}>{book.why}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function ShareView({ result: raw, originalText }: { result: unknown; originalText?: string }) {
  const result = raw as AnalysisResult

  return (
    <main style={{ minHeight: '100vh', background: '#0e0e0e', color: '#e8e8e0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 80px' }}>

        <header style={{ marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid #2e2e2e' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.8rem', color: '#e8e8e0', letterSpacing: '-0.02em', marginBottom: '4px', marginTop: 0 }}>
            The Reasoning Machine
          </h1>
          <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#888880', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
            Shared Analysis
          </p>
        </header>

        {originalText && <InputToggle text={originalText} />}

        {result.mode === 'single' ? <SingleView result={result} /> : <MultiView result={result} />}

        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #2e2e2e' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch', maxWidth: '360px', margin: '0 auto' }}>
            {originalText && (
              <button
                onClick={() => {
                  sessionStorage.setItem('rm_prefill', originalText)
                  window.location.href = '/'
                }}
                style={{ display: 'block', width: '100%', padding: '12px 24px', border: '1px solid #c8a84b', color: '#c8a84b', background: 'transparent', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.85rem', letterSpacing: '0.04em', cursor: 'pointer', textAlign: 'center' }}
              >
                Dig deeper into this argument →
              </button>
            )}
            <a
              href="/"
              style={{ display: 'block', padding: '12px 24px', border: '1px solid #2e2e2e', color: '#666660', background: 'transparent', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.85rem', letterSpacing: '0.04em', textAlign: 'center' }}
            >
              Analyze your own argument →
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

function SingleView({ result }: { result: SingleResult }) {
  const terrain = getTerrainLabel(result.floater.overall)
  const pc = result.biasesAndFallacies.length
  const domain = result.domain?.domain
  const domainInfo = domain && domain !== 'general' && domain !== 'empirical' ? domainConfig[domain] : null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #2e2e2e', paddingBottom: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666660', marginBottom: '4px' }}>Reasoning Breakdown</div>
          <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, color: '#e8e8e0', lineHeight: 1 }}>{terrain}</div>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666660', textAlign: 'right' }}>
          {result.floater.overall}/10 · {pc} pattern{pc !== 1 ? 's' : ''} detected
        </div>
      </div>

      {domainInfo && (
        <div style={{ borderLeft: '3px solid #c8a84b', padding: '14px 16px', marginBottom: '24px', background: 'rgba(200, 168, 75, 0.06)' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a84b', marginBottom: '6px', fontWeight: 600 }}>
            {domainInfo.label}
          </div>
          <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#666660', lineHeight: '1.6', margin: 0 }}>
            {domainInfo.explanation}
          </p>
        </div>
      )}

      <div style={{ border: '1px solid #2e2e2e', padding: '16px', marginBottom: '32px' }}>
        <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#444440', marginBottom: '8px', marginTop: 0 }}>What This Means</p>
        <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660', lineHeight: '1.6', margin: 0 }}>
          {getWhatThisMeans(result.floater.overall, pc)}
        </p>
      </div>

      <section style={{ marginBottom: '40px' }}>
        <SectionHeading>FLOATER Scorecard</SectionHeading>
        <FloaterChart scores={result.floater.scores} />
        <FloaterExpandable scores={result.floater.scores} />
      </section>

      {pc > 0 && (
        <section style={{ marginBottom: '40px', paddingTop: '32px', borderTop: '1px solid #2e2e2e' }}>
          <SectionHeading>Reasoning Patterns ({pc})</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.biasesAndFallacies.map((issue, i) => <BiasCard key={i} {...issue} />)}
          </div>
        </section>
      )}

      {result.beliefSystem && result.beliefSystem.coreAssumptions.length > 0 && (
        <BeliefSystemSection bs={result.beliefSystem} />
      )}

      {result.defaultNarrative?.narrative && (
        <DefaultNarrativeSection dn={result.defaultNarrative} />
      )}

      <QuestionsSection q={result.followUpQuestions} />

      {(result.resources?.books?.length ?? 0) > 0 && (
        <BooksSection books={result.resources!.books} />
      )}
    </div>
  )
}

function MultiView({ result }: { result: MultiResult }) {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <SectionHeading>Speaker Analysis — {result.speakers.length} speakers</SectionHeading>
      </div>

      {result.speakers.map((sp, i) => (
        <div key={i} style={{ marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid #2e2e2e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: '#c8a84b' }}>{sp.speaker}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666660' }}>
              {sp.floater.overall}/10 · {getTerrainLabel(sp.floater.overall)}
            </span>
          </div>
          <FloaterChart scores={sp.floater.scores} />
          {sp.biasesAndFallacies.length > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sp.biasesAndFallacies.map((issue, j) => <BiasCard key={j} {...issue} />)}
            </div>
          )}
          <QuestionsSection q={sp.followUpQuestions} />
        </div>
      ))}

      {result.beliefSystem && result.beliefSystem.coreAssumptions.length > 0 && (
        <BeliefSystemSection bs={result.beliefSystem} />
      )}

      {result.defaultNarrative?.narrative && (
        <DefaultNarrativeSection dn={result.defaultNarrative} />
      )}

      {(result.resources?.books?.length ?? 0) > 0 && (
        <BooksSection books={result.resources!.books} />
      )}
    </div>
  )
}
