import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { StructuredData, generateOrganizationSchema, generateSoftwareApplicationSchema } from '@/components/SEO/StructuredData';

const inter = Inter({ subsets: ['latin'], display: 'swap', preload: true });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://keys.dev'),
  title: {
    default: 'Keys - Logic Injection for Operations',
    template: '%s | Keys',
  },
  description: 'Eliminate data discrepancies by ensuring every team uses the exact same definitions, everywhere. Keys is a logic injection engine for your existing tools.',
  keywords: [
    'data governance',
    'revops',
    'analytics operations',
    'logic injection',
    'metric standardization',
    'business logic',
    'sql snippets',
    'excel formulas',
  ],
  authors: [{ name: 'Keys' }],
  creator: 'Keys',
  publisher: 'Keys',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Keys',
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
    siteName: 'Keys',
    title: 'Keys - Logic Injection for Operations',
    description: 'Eliminate data discrepancies by ensuring every team uses the exact same definitions, everywhere.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Keys',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Keys - Logic Injection for Operations',
    description: 'Eliminate data discrepancies by ensuring every team uses the exact same definitions, everywhere.',
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
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || 'https://keys.dev'} />
        <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1e40af" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Keys" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <StructuredData type="Organization" data={generateOrganizationSchema()} />
        <StructuredData type="SoftwareApplication" data={generateSoftwareApplicationSchema()} />
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
