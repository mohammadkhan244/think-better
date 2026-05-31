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
          fontFamily: '"Courier New", monospace',
        }}
      >
        {/* Hexagon rings — drawn as nested bordered boxes approximating the look */}
        <div style={{
          position: 'absolute',
          width: '360px',
          height: '360px',
          border: '1px solid rgba(200,168,75,0.07)',
          borderRadius: '50%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
        }}/>
        <div style={{
          position: 'absolute',
          width: '260px',
          height: '260px',
          border: '1px solid rgba(200,168,75,0.05)',
          borderRadius: '50%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
        }}/>

        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '12px' }}>
          <span style={{ fontSize: '64px', color: '#c8a84b', lineHeight: 1, letterSpacing: '-2px' }}>[</span>
          <span style={{ fontSize: '64px', color: 'rgba(200,168,75,0.28)', lineHeight: 1, letterSpacing: '-2px' }}>[ ]</span>
          <span style={{ fontSize: '64px', color: '#c8a84b', lineHeight: 1, letterSpacing: '-2px' }}>]</span>
        </div>

        {/* Wordmark */}
        <div style={{
          fontSize: '13px',
          letterSpacing: '6px',
          color: 'rgba(232,228,219,0.45)',
          marginBottom: '28px',
          textTransform: 'uppercase',
          display: 'flex',
        }}>
          THE REASONING MACHINE
        </div>

        {/* Divider */}
        <div style={{
          width: '240px',
          height: '1px',
          background: 'rgba(200,168,75,0.2)',
          marginBottom: '40px',
          display: 'flex',
        }}/>

        {/* Headline */}
        <div style={{
          fontSize: '64px',
          color: '#f0ece4',
          fontFamily: 'Georgia, serif',
          textAlign: 'center',
          lineHeight: 1.1,
          marginBottom: '24px',
          display: 'flex',
        }}>
          Confidence is not evidence.
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: '19px',
          color: 'rgba(232,228,219,0.45)',
          textAlign: 'center',
          display: 'flex',
        }}>
          The structure under the conviction.
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute',
          bottom: '48px',
          fontSize: '13px',
          letterSpacing: '3px',
          color: 'rgba(200,168,75,0.35)',
          display: 'flex',
        }}>
          think-better-nine.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 627 }
  )
}
