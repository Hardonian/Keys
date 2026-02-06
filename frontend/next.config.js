/** @type {import('next').NextConfig} */
const path = require('node:path');

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Don't ignore TypeScript errors
    ignoreBuildErrors: false,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
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
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/pricing', destination: '/enterprise', permanent: true },
      { source: '/compare', destination: '/open-source', permanent: true },
      { source: '/features', destination: '/library', permanent: true },
      { source: '/for-founders', destination: '/what-is-keys', permanent: true },
      { source: '/for-developers', destination: '/what-is-keys', permanent: true },
      { source: '/discover', destination: '/library', permanent: true },
      { source: '/marketplace', destination: '/library', permanent: true },
      { source: '/marketplace/bundles', destination: '/library', permanent: true },
      { source: '/marketplace/:slug', destination: '/library/:slug', permanent: true },
    ];
  },
  // Enable static exports for desktop app
  output: process.env.NEXT_OUTPUT || undefined,
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  // Experimental features for performance
  experimental: {
    optimizeCss: false, // Disabled due to potential build issues
    // optimizePackageImports: ['framer-motion', '@supabase/supabase-js'],
  },
}

module.exports = nextConfig
