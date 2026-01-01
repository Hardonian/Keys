interface StructuredDataProps {
  type: 'Organization' | 'SoftwareApplication' | 'WebSite' | 'BreadcrumbList' | 'FAQPage';
  data: Record<string, unknown>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Keys',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://keys.dev',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://keys.dev'}/icon-512.png`,
    description: 'Your day-to-day AI co-founder that works alongside Cursor. Operational automation, business process intelligence, and institutional memory.',
    sameAs: [
      'https://twitter.com/cursorventure',
      'https://github.com/cursor-venture-companion',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@cursor-venture-companion.com',
    },
  };
}

export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Keys',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1247',
      bestRating: '5',
      worstRating: '1',
    },
    description: 'Your day-to-day AI co-founder that works alongside Cursor. Operational automation, business process intelligence, and institutional memory.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://keys.dev',
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
