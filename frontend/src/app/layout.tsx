import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], display: 'swap', preload: true });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://cursor-venture-companion.com'),
  title: {
    default: 'Cursor Venture Companion - AI Cofounder for Product Lifecycle',
    template: '%s | Cursor Venture Companion',
  },
  description: 'Your AI cofounder for ideation, specification, implementation, and operations. Transform your product development with intelligent automation.',
  keywords: [
    'AI cofounder',
    'product development',
    'AI assistant',
    'venture companion',
    'product lifecycle',
    'automation',
    'AI tools',
    'startup tools',
    'product management',
  ],
  authors: [{ name: 'Cursor Venture Companion' }],
  creator: 'Cursor Venture Companion',
  publisher: 'Cursor Venture Companion',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Venture Companion',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icon-192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Cursor Venture Companion',
    title: 'Cursor Venture Companion - AI Cofounder for Product Lifecycle',
    description: 'Your AI cofounder for ideation, specification, implementation, and operations. Transform your product development with intelligent automation.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cursor Venture Companion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cursor Venture Companion - AI Cofounder',
    description: 'Your AI cofounder for ideation, specification, implementation, and operations.',
    images: ['/og-image.png'],
    creator: '@cursorventure',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || 'https://cursor-venture-companion.com'} />
        <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1e40af" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Venture Companion" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Cursor Venture Companion',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              description: 'Your AI cofounder for ideation, specification, implementation, and operations.',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://cursor-venture-companion.com',
              author: {
                '@type': 'Organization',
                name: 'Cursor Venture Companion',
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <div id="skip-to-content" className="sr-only">
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
          </div>
          {children}
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('SW registered:', reg))
                    .catch(err => console.log('SW registration failed:', err));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
