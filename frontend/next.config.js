/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Environment variables are automatically available via process.env in Next.js
  // No need to explicitly list them in env object unless you want to override
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
  // Enable static exports for desktop app (only if NEXT_OUTPUT is set)
  ...(process.env.NEXT_OUTPUT && { output: process.env.NEXT_OUTPUT }),
  // Optimize images
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  // Suppress build warnings for missing environment variables during build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
