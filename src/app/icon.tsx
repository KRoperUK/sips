import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#DC2626',
          fontWeight: 'bold',
          borderRadius: '4px',
          border: '2px solid #DC2626',
        }}
      >
        K♥
      </div>
    ),
    {
      ...size,
    }
  );
}
