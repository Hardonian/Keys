/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint configuration
  eslint: {
    // Don't fail build on lint warnings (only errors)
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Don't ignore TypeScript errors
    ignoreBuildErrors: false,
  },
  // PWA configuration
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
  // Enable static exports for desktop app
  output: process.env.NEXT_OUTPUT || undefined,
}

module.exports = nextConfig
