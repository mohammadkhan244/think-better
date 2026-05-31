'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function LandingClient() {

  const fadeRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1'
            ;(entry.target as HTMLElement).style.transform = 'translateY(0)'
          }
        })
      },
      { threshold: 0.15 }
    )
    fadeRefs.current.forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  const fade = (i: number) => ({
    ref: (el: HTMLElement | null) => { fadeRefs.current[i] = el },
    style: {
      opacity: 0,
      transform: 'translateY(24px)',
      transition: 'opacity 0.7s ease, transform 0.7s ease'
    } as React.CSSProperties
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #0a0908; }

        .land {
          font-family: 'JetBrains Mono', monospace;
          background: #0a0908;
          color: #e8e4db;
          min-height: 100vh;
        }

        .serif { font-family: 'DM Serif Display', serif; }
        .mono  { font-family: 'JetBrains Mono', monospace; }

        /* ── HERO ── */
        .hero {
          background: #0a0908;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 40px 80px;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
        }

        .hero-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          color: #c8a84b;
          text-transform: uppercase;
          margin-bottom: 32px;
        }

        .hero-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.8rem, 4vw, 3.2rem);
          font-weight: 400;
          line-height: 1.05;
          color: #f0ece4;
          margin-bottom: 32px;
          letter-spacing: -0.02em;
        }

        .hero-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.82rem;
          line-height: 1.8;
          color: rgba(232,228,219,0.65);
          max-width: 540px;
          margin-bottom: 48px;
        }

        .hero-sub p + p { margin-top: 16px; }

        .hero-input-note {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          color: rgba(200,168,75,0.6);
          margin-bottom: 48px;
          text-transform: uppercase;
        }

        .cta-primary {
          display: inline-block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.82rem;
          letter-spacing: 0.08em;
          color: #0a0908;
          background: #c8a84b;
          padding: 14px 28px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .cta-primary:hover { background: #d4b85a; }

        .cta-secondary {
          display: inline-block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.82rem;
          letter-spacing: 0.08em;
          color: #c8a84b;
          background: transparent;
          padding: 14px 28px;
          text-decoration: none;
          border: 1px solid rgba(200,168,75,0.4);
          cursor: pointer;
          margin-left: 16px;
          transition: border-color 0.2s ease;
        }

        .cta-secondary:hover { border-color: #c8a84b; }

        .hero-for {
          margin-top: 48px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.72rem;
          color: rgba(232,228,219,0.35);
          line-height: 1.6;
          max-width: 460px;
          font-style: italic;
        }

        /* Faint FLOATER axis decoration */
        .hero-bg-mark {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.04;
          pointer-events: none;
          width: 320px;
          height: 320px;
        }

        /* ── SECTION 2: CREAM ── */
        .s2 {
          background: #f4f1ea;
          color: #1a1814;
          padding: 120px 40px;
        }

        .s2-inner {
          max-width: 760px;
          margin: 0 auto;
        }

        .s2-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          color: #c8a84b;
          text-transform: uppercase;
          margin-bottom: 40px;
        }

        .s2-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.4rem, 2.8vw, 2.2rem);
          font-weight: 400;
          line-height: 1.15;
          color: #1a1814;
          margin-bottom: 40px;
          letter-spacing: -0.01em;
        }

        .s2-body {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          line-height: 1.9;
          color: rgba(26,24,20,0.7);
          max-width: 600px;
          margin-bottom: 64px;
        }

        .pullquote {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1rem, 2vw, 1.4rem);
          font-weight: 400;
          font-style: italic;
          line-height: 1.4;
          color: #1a1814;
          border-left: 3px solid #c8a84b;
          padding-left: 32px;
          max-width: 620px;
        }

        /* ── SECTION 3: HOW IT WORKS ── */
        .s3 {
          background: #0e0c0a;
          color: #e8e4db;
          padding: 120px 40px;
        }

        .s3-inner {
          max-width: 900px;
          margin: 0 auto;
        }

        .s3-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          color: #c8a84b;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .s3-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.3rem, 2.5vw, 2rem);
          font-weight: 400;
          color: #f0ece4;
          margin-bottom: 72px;
          letter-spacing: -0.01em;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 2px;
        }

        .card {
          background: #141210;
          padding: 40px 32px;
          border: 1px solid rgba(200,168,75,0.08);
        }

        .card-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          color: #c8a84b;
          margin-bottom: 24px;
        }

        .card-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.25rem;
          color: #f0ece4;
          margin-bottom: 16px;
          line-height: 1.3;
        }

        .card-body {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.78rem;
          line-height: 1.8;
          color: rgba(232,228,219,0.5);
        }

        /* ── SECTION 4: ACCENT BAND ── */
        .s4 {
          background: #c8a84b;
          padding: 72px 40px;
        }

        .s4-inner {
          max-width: 760px;
          margin: 0 auto;
        }

        .s4-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.2rem, 2.2vw, 1.8rem);
          font-weight: 400;
          font-style: italic;
          color: #0a0908;
          margin-bottom: 20px;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }

        .s4-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.78rem;
          line-height: 1.8;
          color: rgba(10,9,8,0.6);
          max-width: 500px;
        }

        /* ── SECTION 5: THE REAL REASON ── */
        .s5 {
          background: #f4f1ea;
          color: #1a1814;
          padding: 120px 40px;
        }

        .s5-inner {
          max-width: 760px;
          margin: 0 auto;
        }

        .s5-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          color: #c8a84b;
          text-transform: uppercase;
          margin-bottom: 40px;
        }

        .s5-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.4rem, 2.8vw, 2.2rem);
          font-weight: 400;
          color: #1a1814;
          margin-bottom: 40px;
          letter-spacing: -0.01em;
          line-height: 1.15;
        }

        .s5-body {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          line-height: 1.9;
          color: rgba(26,24,20,0.7);
          max-width: 600px;
          margin-bottom: 24px;
        }

        .s5-body-em {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          line-height: 1.9;
          color: #1a1814;
          max-width: 600px;
          margin-bottom: 56px;
        }

        /* ── FOOTER ── */
        .footer {
          background: #0a0908;
          padding: 48px 40px;
          border-top: 1px solid rgba(200,168,75,0.1);
        }

        .footer-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-mark {
          font-family: 'DM Serif Display', serif;
          font-size: 0.95rem;
          font-style: italic;
          color: rgba(232,228,219,0.4);
        }

        .footer-meta {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: rgba(232,228,219,0.25);
          text-align: right;
          line-height: 1.8;
        }

        .footer-meta a {
          color: rgba(200,168,75,0.5);
          text-decoration: none;
        }

        .footer-meta a:hover { color: #c8a84b; }

        /* ── LOGO MARK ── */
        .logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
        }

        .logo-brackets {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.4rem;
          font-weight: 400;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .logo-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          line-height: 1.4;
        }

        @media (max-width: 640px) {
          .hero { padding: 60px 24px 80px; }
          .s2, .s3, .s4, .s5 { padding: 80px 24px; }
          .footer { padding: 40px 24px; }
          .footer-inner { flex-direction: column; align-items: flex-start; }
          .footer-meta { text-align: left; }
          .cta-secondary { margin-left: 0; margin-top: 12px; display: block; }
          .cards { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="land">

        {/* ── HERO ── */}
        <section className="hero">

          {/* Faint FLOATER radar decoration */}
          <svg className="hero-bg-mark" viewBox="0 0 320 320" fill="none">
            <polygon points="160,20 280,90 280,230 160,300 40,230 40,90"
              stroke="#c8a84b" strokeWidth="0.5" fill="none"/>
            <polygon points="160,50 255,107 255,213 160,270 65,213 65,107"
              stroke="#c8a84b" strokeWidth="0.5" fill="none"/>
            <polygon points="160,80 230,124 230,196 160,240 90,196 90,124"
              stroke="#c8a84b" strokeWidth="0.5" fill="none"/>
            <line x1="160" y1="20" x2="160" y2="300" stroke="#c8a84b" strokeWidth="0.3"/>
            <line x1="40" y1="90" x2="280" y2="230" stroke="#c8a84b" strokeWidth="0.3"/>
            <line x1="280" y1="90" x2="40" y2="230" stroke="#c8a84b" strokeWidth="0.3"/>
            <text x="170" y="18" fill="#c8a84b" fontSize="8" fontFamily="monospace">F</text>
            <text x="285" y="88" fill="#c8a84b" fontSize="8" fontFamily="monospace">L</text>
            <text x="285" y="234" fill="#c8a84b" fontSize="8" fontFamily="monospace">O</text>
            <text x="162" y="310" fill="#c8a84b" fontSize="8" fontFamily="monospace">A</text>
            <text x="28" y="234" fill="#c8a84b" fontSize="8" fontFamily="monospace">T</text>
            <text x="28" y="88" fill="#c8a84b" fontSize="8" fontFamily="monospace">E</text>
          </svg>

          {/* Nav logo */}
          <div className="logo-row" {...fade(0)}>
            <div className="logo-brackets">
              <span style={{color:'#c8a84b'}}>[</span>
              <span style={{color:'rgba(200,168,75,0.3)'}}>[ ]</span>
              <span style={{color:'#c8a84b'}}>]</span>
            </div>
            <div className="logo-name" style={{color:'rgba(232,228,219,0.5)'}}>
              The Reasoning<br/>Machine
            </div>
          </div>

          <p className="hero-eyebrow" {...fade(1)}>
            Think Better · Modern Myths
          </p>

          <h1 className="hero-headline serif" {...fade(2)}>
            Confidence<br/>is not evidence.
          </h1>

          <div className="hero-sub" {...fade(3)}>
            <p>
              The most dangerous claims are the ones that sound right.
            </p>
            <p>
              Someone says it on a podcast. You read it online. It&apos;s
              clean, it&apos;s certain, and you can&apos;t quite tell where it&apos;s
              thin. Paste it in. The Reasoning Machine shows you the
              structure under the conviction — before you repeat it
              or act on it.
            </p>
          </div>

          <p className="hero-input-note" {...fade(4)}>
            Text · PDF · Article URL · YouTube link
          </p>

          <div {...fade(5)}>
            <Link href="/app" className="cta-primary">
              See what it&apos;s standing on →
            </Link>
          </div>

          <p className="hero-for" {...fade(6)}>
            For anyone who has to be right for a living,
            and is tired of taking a confident claim on faith.
          </p>

        </section>

        {/* ── SECTION 2 ── */}
        <section className="s2">
          <div className="s2-inner">

            <p className="s2-label" {...fade(7)}>
              The problem
            </p>

            <h2 className="s2-headline serif" {...fade(8)}>
              Coherent isn&apos;t<br/>the same as true.
            </h2>

            <p className="s2-body mono" {...fade(9)}>
              An argument holds together, so you stop looking.
              That&apos;s exactly when an unexamined assumption does
              the most damage. It&apos;s load-bearing and invisible at
              the same time, and you inherit it the moment you
              nod along.
            </p>

            <blockquote className="pullquote serif" {...fade(10)}>
              It&apos;s not a fact-checker. It won&apos;t tell you what&apos;s
              true. It shows you what the argument is standing on,
              so you decide before you&apos;ve already bought it.
            </blockquote>

          </div>
        </section>

        {/* ── SECTION 3 ── */}
        <section className="s3">
          <div className="s3-inner">

            <p className="s3-label" {...fade(11)}>
              How it works
            </p>

            <h2 className="s3-headline serif" {...fade(12)}>
              Paste it. See it. Pressure-test it.
            </h2>

            <div className="cards">

              <div className="card" {...fade(13)}>
                <p className="card-num">01</p>
                <h3 className="card-title serif">Drop in any argument.</h3>
                <p className="card-body">
                  It gets scored on seven axes of reasoning structure.
                  Falsifiability, logic, evidence, and four more. Same
                  input, same score, every time. No grades, just signals.
                </p>
              </div>

              <div className="card" {...fade(14)}>
                <p className="card-num">02</p>
                <h3 className="card-title serif">See the patterns it&apos;s running on.</h3>
                <p className="card-body">
                  The biases and fallacies it leans on, the beliefs
                  holding it up, and the cultural story it&apos;s swimming
                  inside without noticing.
                </p>
              </div>

              <div className="card" {...fade(15)}>
                <p className="card-num">03</p>
                <h3 className="card-title serif">Get the questions that come for it.</h3>
                <p className="card-body">
                  What a critic will use, where to press first, and
                  what the argument never thought to address.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── SECTION 4: ACCENT BAND ── */}
        <section className="s4">
          <div className="s4-inner">
            <h2 className="s4-headline serif" {...fade(16)}>
              It never tells you you&apos;re wrong.<br/>
              It shows you where it&apos;s exposed.
            </h2>
            <p className="s4-sub mono" {...fade(17)}>
              No verdicts. No score out of ten with a list of what
              you got wrong. It surfaces the structure and hands you
              the questions. You stay the judge.
            </p>
          </div>
        </section>

        {/* ── SECTION 5 ── */}
        <section className="s5">
          <div className="s5-inner">

            <p className="s5-label" {...fade(18)}>
              The real reason
            </p>

            <h2 className="s5-headline serif" {...fade(19)}>
              We mistake coherence<br/>for understanding.
            </h2>

            <p className="s5-body mono" {...fade(20)}>
              A claim that holds together feels finished. We repeat
              it, build on it, stake decisions on it, and never ask
              what would have to be false for the whole thing to
              collapse. By the time we find out, the options it
              closed are already gone.
            </p>

            <p className="s5-body-em mono" {...fade(21)}>
              The Reasoning Machine isn&apos;t built to win arguments.
              It&apos;s built to make the structure of thought visible
              before conviction hardens into decision. You leave
              sharper, not graded.
            </p>

            <div {...fade(22)}>
              <Link href="/app" className="cta-primary"
                style={{background:'#1a1814', color:'#c8a84b',
                  border:'1px solid rgba(200,168,75,0.4)'}}>
                Run one through it →
              </Link>
            </div>

          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <div className="footer-inner">
            <p className="footer-mark">
              Not what to think. How to think.
            </p>
            <div className="footer-meta">
              <p>Modern Myths · © 2026</p>
              <p>
                <a href="mailto:mohammadkhan@themohammadkhan.com">
                  mohammadkhan@themohammadkhan.com
                </a>
              </p>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
