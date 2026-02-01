'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  showIllustration?: boolean;
  illustrationSrc?: string;
  illustrationAlt?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const visualsDisabled = process.env.NEXT_PUBLIC_DISABLE_VISUALS === '1';

export function EmptyState({ 
  title, 
  description, 
  icon, 
  showIllustration = false,
  illustrationSrc = '/assets/visuals/empty-library.webp',
  illustrationAlt = '',
  action, 
  secondaryAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      {/* Priority: illustration > icon > default */}
      {showIllustration && !visualsDisabled ? (
        <div className="relative w-48 h-36 mb-6 opacity-80">
          <Image
            src={illustrationSrc}
            alt={illustrationAlt}
            fill
            loading="lazy"
            sizes="192px"
            className="object-contain"
          />
        </div>
      ) : icon ? (
        <div className="mb-6 text-6xl sm:text-7xl animate-bounce-subtle" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      
      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md text-lg">{description}</p>
      {action && (
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={action.onClick}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl active:scale-95"
          >
            {action.label}
          </button>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
