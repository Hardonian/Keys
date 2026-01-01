'use client';

interface GuaranteeBadgeProps {
  type: 'security' | 'compliance' | 'sla' | 'quality';
  included?: boolean;
  className?: string;
}

export function GuaranteeBadge({ type, included = true, className = '' }: GuaranteeBadgeProps) {
  const variants = {
    security: {
      label: 'Security Guarantee',
      icon: '🔒',
      description: 'We scan all outputs for vulnerabilities',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    compliance: {
      label: 'Compliance Guarantee',
      icon: '🛡️',
      description: 'All outputs meet GDPR/SOC 2 standards',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    sla: {
      label: 'SLA Guarantee',
      icon: '⚡',
      description: '99.9% uptime or 10% refund',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    quality: {
      label: 'Quality Guarantee',
      icon: '✨',
      description: 'Outputs meet production standards',
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      borderColor: 'border-pink-200 dark:border-pink-800',
    },
  };

  const variant = variants[type];

  if (!included) {
    return null;
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${variant.bgColor} ${variant.borderColor} ${className}`}>
      <span className={`text-xl flex-shrink-0 ${variant.color}`}>{variant.icon}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${variant.color}`}>{variant.label}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{variant.description}</div>
      </div>
    </div>
  );
}
