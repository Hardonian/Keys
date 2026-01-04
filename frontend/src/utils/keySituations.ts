/**
 * Maps Keys to recognizable situations
 * This helps users find Keys based on their actual needs, not technical categories
 */

export interface KeySituation {
  whenYouNeedThis: string;
  whatThisPrevents: string;
  situationGroup?: string;
}

const situationMap: Record<string, KeySituation> = {
  'cursor-authentication-scaffold': {
    whenYouNeedThis: 'You need to add authentication to your app but want to avoid common security mistakes.',
    whatThisPrevents: 'Prevents authentication vulnerabilities, session management issues, and password handling mistakes.',
    situationGroup: 'shipping',
  },
  'jupyter-data-analysis-basics': {
    whenYouNeedThis: 'You have data to analyze but aren\'t sure where to start or what patterns to follow.',
    whatThisPrevents: 'Prevents analysis errors, inconsistent workflows, and missing important insights.',
    situationGroup: 'understanding',
  },
  'runbook-stripe-webhook-failure': {
    whenYouNeedThis: 'A payment webhook failed and you need to recover without losing transactions or creating duplicates.',
    whatThisPrevents: 'Prevents lost payments, duplicate charges, and payment reconciliation nightmares.',
    situationGroup: 'incident-response',
  },
  'node-api-scaffold': {
    whenYouNeedThis: 'You\'re building an API and want to avoid common pitfalls around errors, validation, and security.',
    whatThisPrevents: 'Prevents API vulnerabilities, inconsistent error handling, and scaling issues.',
    situationGroup: 'shipping',
  },
  'next-dashboard-scaffold': {
    whenYouNeedThis: 'You need to build a dashboard but want proven patterns for data fetching and state management.',
    whatThisPrevents: 'Prevents performance issues, inconsistent UX, and maintenance headaches.',
    situationGroup: 'shipping',
  },
  'runbook-database-migration': {
    whenYouNeedThis: 'A database migration failed or you need to migrate safely without downtime.',
    whatThisPrevents: 'Prevents data loss, production outages, and irreversible migration mistakes.',
    situationGroup: 'incident-response',
  },
};

const defaultSituation: KeySituation = {
  whenYouNeedThis: 'You need practical, proven patterns for this capability.',
  whatThisPrevents: 'Prevents common mistakes and reduces uncertainty around implementation.',
};

export function getKeySituation(slug: string): KeySituation {
  return situationMap[slug] || defaultSituation;
}

export function getSituationGroup(slug: string): string | undefined {
  return situationMap[slug]?.situationGroup;
}

/**
 * Groups keys by situation for better organization
 */
export function groupKeysBySituation<T extends { slug: string }>(
  keys: T[]
): Record<string, T[]> {
  const groups: Record<string, T[]> = {
    'incident-response': [],
    'shipping': [],
    'understanding': [],
    'knowledge-sharing': [],
    'other': [],
  };

  keys.forEach(key => {
    const group = getSituationGroup(key.slug) || 'other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(key);
  });

  return groups;
}

export const situationGroupLabels: Record<string, string> = {
  'incident-response': 'When something breaks',
  'shipping': 'Shipping faster safely',
  'understanding': 'Understanding systems',
  'knowledge-sharing': 'Sharing knowledge',
  'other': 'Other situations',
};
