'use client'

import { useState } from 'react'

export interface TrainingScenario {
  scenario: string
  prompt: string
  reveal: string
  insight: string
}

export default function TrainingCard({
  scenario,
  onClose
}: {
  scenario: TrainingScenario
  onClose: () => void
}) {
  const [showReveal, setShowReveal] = useState(false)
  const [response, setResponse] = useState('')

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      background: 'rgba(200, 168, 75, 0.06)',
      border: '1px solid #c8a84b',
      borderRadius: '4px'
    }}>
      <div style={{
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: '#c8a84b',
        marginBottom: '10px',
        fontFamily: 'monospace'
      }}>
        Practice Scenario
      </div>

      <p style={{
        fontSize: '0.875rem',
        lineHeight: '1.6',
        color: '#e8e8e0',
        marginBottom: '12px',
        fontFamily: 'monospace'
      }}>
        {scenario.scenario}
      </p>

      <p style={{
        fontSize: '0.8rem',
        color: '#888880',
        fontStyle: 'italic',
        marginBottom: '10px',
        fontFamily: 'monospace'
      }}>
        {scenario.prompt}
      </p>

      {!showReveal && (
        <textarea
          value={response}
          onChange={e => setResponse(e.target.value)}
          placeholder="Think it through — no right or wrong answer..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '10px',
            background: '#141414',
            border: '1px solid #2e2e2e',
            color: '#e8e8e0',
            fontSize: '0.85rem',
            lineHeight: '1.5',
            resize: 'vertical',
            marginBottom: '10px',
            boxSizing: 'border-box',
            fontFamily: 'monospace'
          }}
        />
      )}

      {!showReveal && (
        <button
          onClick={() => setShowReveal(true)}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid #c8a84b',
            color: '#c8a84b',
            fontSize: '0.8rem',
            cursor: 'pointer',
            marginRight: '8px',
            fontFamily: 'monospace'
          }}
        >
          See the pattern →
        </button>
      )}

      {showReveal && (
        <div style={{ marginTop: '4px' }}>
          <div style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#c8a84b',
            marginBottom: '6px',
            fontFamily: 'monospace'
          }}>
            The Pattern
          </div>
          <p style={{
            fontSize: '0.875rem',
            lineHeight: '1.6',
            color: '#e8e8e0',
            marginBottom: '10px',
            fontFamily: 'monospace'
          }}>
            {scenario.reveal}
          </p>
          <p style={{
            fontSize: '0.8rem',
            lineHeight: '1.5',
            color: '#888880',
            fontStyle: 'italic',
            borderLeft: '2px solid #2e2e2e',
            paddingLeft: '10px',
            marginBottom: '12px',
            fontFamily: 'monospace'
          }}>
            {scenario.insight}
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid #2e2e2e',
              color: '#666660',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            Back to analysis
          </button>
        </div>
      )}
    </div>
  )
}
