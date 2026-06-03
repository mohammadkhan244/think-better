import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '627px',
          background: '#0a0908',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Logo mark */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '64px', color: '#c8a84b', lineHeight: '1', fontFamily: 'monospace' }}>[</span>
          <span style={{ fontSize: '64px', color: 'rgba(200,168,75,0.28)', lineHeight: '1', fontFamily: 'monospace' }}>[</span>
          <span style={{ fontSize: '64px', color: 'rgba(200,168,75,0.28)', lineHeight: '1', fontFamily: 'monospace' }}>]</span>
          <span style={{ fontSize: '64px', color: '#c8a84b', lineHeight: '1', fontFamily: 'monospace' }}>]</span>
        </div>

        {/* Wordmark */}
        <div style={{
          display: 'flex',
          fontSize: '13px',
          letterSpacing: '6px',
          color: 'rgba(232,228,219,0.45)',
          marginBottom: '32px',
          fontFamily: 'monospace',
        }}>
          THE REASONING MACHINE
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex',
          width: '240px',
          height: '1px',
          background: 'rgba(200,168,75,0.25)',
          marginBottom: '40px',
        }} />

        {/* Headline */}
        <div style={{
          display: 'flex',
          fontSize: '64px',
          color: '#f0ece4',
          fontFamily: 'serif',
          fontWeight: 400,
          marginBottom: '20px',
          textAlign: 'center',
          lineHeight: '1.1',
        }}>
          Confidence is not evidence.
        </div>

        {/* Subline */}
        <div style={{
          display: 'flex',
          fontSize: '20px',
          color: 'rgba(232,228,219,0.4)',
          fontFamily: 'monospace',
          textAlign: 'center',
        }}>
          The structure under the conviction.
        </div>

        {/* URL */}
        <div style={{
          display: 'flex',
          position: 'absolute',
          bottom: '40px',
          fontSize: '13px',
          letterSpacing: '3px',
          color: 'rgba(200,168,75,0.4)',
          fontFamily: 'monospace',
        }}>
          think-better-nine.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 627 }
  )
}
