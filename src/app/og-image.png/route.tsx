import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        <div
          style={{
            fontSize: '72px',
            fontWeight: 800,
            color: '#111827',
            letterSpacing: '-2px',
          }}
        >
          ArchLog
        </div>
        <div
          style={{
            fontSize: '32px',
            color: '#6b7280',
            maxWidth: '700px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Decision memory for teams that move fast
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
