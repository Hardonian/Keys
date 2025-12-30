/**
 * PageWrapper
 * 
 * Wrapper component that adds page transitions and consistent layout.
 */

'use client';

import { PageTransition } from '@/systems/motion';

export interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <PageTransition className={className}>
      {children}
    </PageTransition>
  );
}
