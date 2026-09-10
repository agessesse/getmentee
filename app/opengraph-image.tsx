import { ImageResponse } from 'next/og';

// twitter.card was declared as summary_large_image with no image set, so shared
// links rendered an empty card. Generated here rather than shipped as a binary
// so it stays in sync with the wordmark and needs no asset pipeline.
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Mentee — Find the Mentor Who Changes Everything';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '96px',
          backgroundColor: '#1a1f3a',
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#8ba0d9',
            marginBottom: 40,
          }}
        >
          Mentee
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#fffbf7',
            maxWidth: 900,
          }}
        >
          The right mentor changes your trajectory.
        </div>
      </div>
    ),
    size
  );
}
