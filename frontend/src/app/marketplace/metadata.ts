import type { Metadata } from 'next';

export const marketplaceMetadata: Metadata = {
  title: 'Marketplace - Discover Keys for Cursor, Jupyter, Node.js & More',
  description: 'Browse and discover keys that unlock practical capability in Cursor, Jupyter, Node.js, and more. Each key unlocks a specific workflow, component, or runbook you can integrate into your projects.',
  keywords: [
    'keys marketplace',
    'cursor keys',
    'jupyter notebooks',
    'node.js keys',
    'runbooks',
    'workflow templates',
    'developer tools',
    'productivity keys',
  ],
  openGraph: {
    title: 'KEYS Marketplace - Discover Practical Capability',
    description: 'Browse and discover keys that unlock practical capability in modern development tools.',
    type: 'website',
    url: '/marketplace',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KEYS Marketplace',
    description: 'Discover keys that unlock practical capability in Cursor, Jupyter, Node.js, and more.',
  },
  alternates: {
    canonical: '/marketplace',
  },
};

export function generateKeyMetadata(key: {
  title: string;
  description?: string;
  slug: string;
  key_type: string;
  category?: string;
  tags: string[];
}): Metadata {
  return {
    title: `${key.title} - KEYS Marketplace`,
    description: key.description || `Discover ${key.title}, a ${key.key_type} key for ${key.category || 'development'}.`,
    keywords: [
      key.title,
      key.key_type,
      key.category,
      ...key.tags,
      'keys marketplace',
    ].filter(Boolean),
    openGraph: {
      title: `${key.title} - KEYS Marketplace`,
      description: key.description || `Discover ${key.title} on KEYS Marketplace`,
      type: 'website',
      url: `/marketplace/${key.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${key.title} - KEYS Marketplace`,
      description: key.description || `Discover ${key.title} on KEYS Marketplace`,
    },
    alternates: {
      canonical: `/marketplace/${key.slug}`,
    },
  };
}
