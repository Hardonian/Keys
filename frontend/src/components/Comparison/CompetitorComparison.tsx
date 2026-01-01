'use client';

interface ComparisonFeature {
  feature: string;
  keys: boolean | string;
  chatgpt: boolean | string;
  claude: boolean | string;
  cursor: boolean | string;
  jasper: boolean | string;
}

const features: ComparisonFeature[] = [
  {
    feature: 'Price',
    keys: '$29/mo',
    chatgpt: '$20/mo',
    claude: '$20/mo',
    cursor: '$20/mo',
    jasper: '$49/mo',
  },
  {
    feature: 'Free Tier',
    keys: true,
    chatgpt: true,
    claude: true,
    cursor: true,
    jasper: false,
  },
  {
    feature: 'Security Guarantee',
    keys: true,
    chatgpt: false,
    claude: false,
    cursor: false,
    jasper: false,
  },
  {
    feature: 'Compliance Guarantee',
    keys: true,
    chatgpt: false,
    claude: false,
    cursor: false,
    jasper: false,
  },
  {
    feature: 'Institutional Memory',
    keys: true,
    chatgpt: false,
    claude: false,
    cursor: false,
    jasper: false,
  },
  {
    feature: 'Business Co-Founder Positioning',
    keys: true,
    chatgpt: false,
    claude: false,
    cursor: false,
    jasper: false,
  },
  {
    feature: 'Code Features',
    keys: true,
    chatgpt: true,
    claude: true,
    cursor: true,
    jasper: false,
  },
  {
    feature: 'Content Features',
    keys: 'Limited',
    chatgpt: true,
    claude: true,
    cursor: false,
    jasper: true,
  },
  {
    feature: 'Image Control',
    keys: 'Coming Soon',
    chatgpt: true,
    claude: false,
    cursor: false,
    jasper: true,
  },
  {
    feature: 'Venture Strategy Tools',
    keys: 'Coming Soon',
    chatgpt: false,
    claude: false,
    cursor: false,
    jasper: false,
  },
  {
    feature: 'IDE Integration',
    keys: true,
    chatgpt: false,
    claude: false,
    cursor: true,
    jasper: false,
  },
  {
    feature: 'CI/CD Integration',
    keys: true,
    chatgpt: false,
    claude: false,
    cursor: false,
    jasper: false,
  },
  {
    feature: 'Holistic Approach',
    keys: true,
    chatgpt: false,
    claude: false,
    cursor: false,
    jasper: false,
  },
];

function ComparisonCell({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <td className="px-4 py-3 text-center">
        <span className="text-green-500 text-xl">✓</span>
      </td>
    ) : (
      <td className="px-4 py-3 text-center">
        <span className="text-gray-400 text-xl">✗</span>
      </td>
    );
  }

  if (value === 'Limited' || value === 'Coming Soon') {
    return (
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {value}
        </span>
      </td>
    );
  }

  return (
    <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
      {value}
    </td>
  );
}

export function CompetitorComparison() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
        <thead className="bg-gray-50 dark:bg-slate-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Feature
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20">
              Keys
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              ChatGPT
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Claude
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Cursor
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Jasper
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {features.map((feature, idx) => (
            <tr
              key={idx}
              className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                {feature.feature}
              </td>
              <ComparisonCell value={feature.keys} />
              <ComparisonCell value={feature.chatgpt} />
              <ComparisonCell value={feature.claude} />
              <ComparisonCell value={feature.cursor} />
              <ComparisonCell value={feature.jasper} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
