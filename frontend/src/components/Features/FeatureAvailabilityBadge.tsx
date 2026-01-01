'use client';

import { Badge } from './Badge';

interface FeatureAvailabilityBadgeProps {
  status: 'available' | 'coming-soon' | 'beta';
  className?: string;
}

export function FeatureAvailabilityBadge({ status, className = '' }: FeatureAvailabilityBadgeProps) {
  const variants = {
    available: {
      label: 'Available',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700',
    },
    'coming-soon': {
      label: 'Coming Soon',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    },
    beta: {
      label: 'Beta',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    },
  };

  const variant = variants[status];

  return (
    <Badge className={`${variant.className} ${className}`}>
      {variant.label}
    </Badge>
  );
}
