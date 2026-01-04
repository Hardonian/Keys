/**
 * Demo Data Service
 * 
 * Provides sample data for non-authenticated users to explore KEYS features
 * without requiring authentication or backend access.
 */

export interface DemoKey {
  id: string;
  slug: string;
  title: string;
  description: string;
  key_type: 'jupyter' | 'node' | 'next' | 'runbook';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
  version: string;
  license_spdx: string;
  outcome: string;
  maturity: 'starter' | 'operator' | 'scale' | 'enterprise';
  price_cents: number;
  preview_public: boolean;
  cover_path?: string;
  preview_html_path?: string;
}

export const DEMO_KEYS: DemoKey[] = [
  {
    id: 'demo-cursor-auth-scaffold',
    slug: 'cursor-authentication-scaffold',
    title: 'Cursor Keys: Authentication Scaffolding',
    description: 'Unlock consistent JWT authentication patterns in Cursor. This Key provides a complete authentication scaffold with signup, login, password reset, and session management. Perfect for SaaS applications.',
    key_type: 'node',
    category: 'Authentication',
    difficulty: 'intermediate',
    tags: ['authentication', 'jwt', 'security', 'saas', 'cursor'],
    version: '1.2.0',
    license_spdx: 'MIT',
    outcome: 'Complete authentication system with JWT, password hashing, session management, and email verification.',
    maturity: 'operator',
    price_cents: 9900,
    preview_public: true,
  },
  {
    id: 'demo-jupyter-data-analysis',
    slug: 'jupyter-data-analysis-basics',
    title: 'Jupyter Keys: Data Analysis Basics',
    description: 'Unlock fundamental data science workflows in Jupyter. Includes data loading, cleaning, visualization, and statistical analysis patterns. Perfect for getting started with data science.',
    key_type: 'jupyter',
    category: 'Data Science',
    difficulty: 'beginner',
    tags: ['data-science', 'analysis', 'pandas', 'visualization', 'jupyter'],
    version: '2.0.0',
    license_spdx: 'MIT',
    outcome: 'Complete data analysis workflow from raw data to insights with visualizations and statistical summaries.',
    maturity: 'starter',
    price_cents: 4900,
    preview_public: true,
  },
  {
    id: 'demo-runbook-stripe-webhook',
    slug: 'runbook-stripe-webhook-failure',
    title: 'Runbook Keys: Stripe Webhook Failure Recovery',
    description: 'Unlock operational recovery patterns for Stripe webhook failures. Includes detection, retry logic, idempotency handling, and manual replay procedures. Essential for payment operations.',
    key_type: 'runbook',
    category: 'Operations',
    difficulty: 'advanced',
    tags: ['stripe', 'webhooks', 'payments', 'operations', 'recovery'],
    version: '1.0.0',
    license_spdx: 'MIT',
    outcome: 'Complete webhook failure recovery process with automated retries and manual intervention procedures.',
    maturity: 'operator',
    price_cents: 14900,
    preview_public: true,
  },
  {
    id: 'demo-node-api-scaffold',
    slug: 'node-api-scaffold',
    title: 'Node.js Keys: REST API Scaffold',
    description: 'Unlock production-ready REST API patterns in Node.js. Includes Express setup, error handling, validation, rate limiting, and testing patterns. Perfect for building APIs.',
    key_type: 'node',
    category: 'Backend',
    difficulty: 'intermediate',
    tags: ['node', 'express', 'api', 'rest', 'backend'],
    version: '1.5.0',
    license_spdx: 'MIT',
    outcome: 'Complete REST API scaffold with error handling, validation, rate limiting, and comprehensive tests.',
    maturity: 'operator',
    price_cents: 7900,
    preview_public: true,
  },
  {
    id: 'demo-next-dashboard',
    slug: 'next-dashboard-scaffold',
    title: 'Next.js Keys: Dashboard Scaffold',
    description: 'Unlock modern dashboard patterns in Next.js. Includes authentication, data fetching, charts, tables, and responsive layouts. Perfect for building admin dashboards.',
    key_type: 'next',
    category: 'Frontend',
    difficulty: 'intermediate',
    tags: ['nextjs', 'dashboard', 'admin', 'ui', 'frontend'],
    version: '1.0.0',
    license_spdx: 'MIT',
    outcome: 'Complete dashboard scaffold with authentication, data visualization, and responsive design patterns.',
    maturity: 'operator',
    price_cents: 11900,
    preview_public: true,
  },
  {
    id: 'demo-runbook-db-migration',
    slug: 'runbook-database-migration',
    title: 'Runbook Keys: Database Migration Recovery',
    description: 'Unlock database migration failure recovery patterns. Includes rollback procedures, data validation, and safe migration practices. Essential for database operations.',
    key_type: 'runbook',
    category: 'Operations',
    difficulty: 'expert',
    tags: ['database', 'migration', 'operations', 'recovery', 'postgresql'],
    version: '1.0.0',
    license_spdx: 'MIT',
    outcome: 'Complete database migration recovery process with rollback procedures and validation checks.',
    maturity: 'scale',
    price_cents: 19900,
    preview_public: true,
  },
];

export const DEMO_DISCOVERY_RECOMMENDATIONS = [
  {
    id: DEMO_KEYS[0].id,
    slug: DEMO_KEYS[0].slug,
    title: DEMO_KEYS[0].title,
    description: DEMO_KEYS[0].description,
    key_type: DEMO_KEYS[0].key_type,
    version: DEMO_KEYS[0].version,
    reason: 'Perfect for building secure authentication in your SaaS application',
    confidence: 'high' as const,
  },
  {
    id: DEMO_KEYS[1].id,
    slug: DEMO_KEYS[1].slug,
    title: DEMO_KEYS[1].title,
    description: DEMO_KEYS[1].description,
    key_type: DEMO_KEYS[1].key_type,
    version: DEMO_KEYS[1].version,
    reason: 'Great starting point for data science workflows',
    confidence: 'high' as const,
  },
  {
    id: DEMO_KEYS[2].id,
    slug: DEMO_KEYS[2].slug,
    title: DEMO_KEYS[2].title,
    description: DEMO_KEYS[2].description,
    key_type: DEMO_KEYS[2].key_type,
    version: DEMO_KEYS[2].version,
    reason: 'Essential for payment operations reliability',
    confidence: 'medium' as const,
  },
];

export function getDemoKey(slug: string): DemoKey | undefined {
  return DEMO_KEYS.find(key => key.slug === slug);
}

export function getDemoKeys(filters?: {
  key_type?: string;
  category?: string;
  search?: string;
}): DemoKey[] {
  let keys = [...DEMO_KEYS];

  if (filters?.key_type) {
    keys = keys.filter(key => key.key_type === filters.key_type);
  }

  if (filters?.category) {
    keys = keys.filter(key => key.category === filters.category);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    keys = keys.filter(key =>
      key.title.toLowerCase().includes(searchLower) ||
      key.description.toLowerCase().includes(searchLower) ||
      key.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  return keys;
}
