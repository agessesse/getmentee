import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Responses carried no security headers, and advertised the framework
  // and version via X-Powered-By.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // The authenticated app has destructive controls (account deletion,
          // declining a request), so framing must be refused.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Without this, full URLs including /mentor/<uuid> and
          // /sessions/<uuid> leak to every third party the page touches.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), geolocation=(), payment=(), microphone=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  // NOTE: no Content-Security-Policy yet — the marketing page uses inline
  // styles, so a real CSP needs a nonce and belongs in its own change.
  eslint: {
    dirs: ['app', 'components', 'lib', 'utils'],
  },
};

export default nextConfig;
