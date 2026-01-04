import { Metadata } from 'next';
import { DiscoveryFlow } from '@/components/Discovery/DiscoveryFlow';

export const metadata: Metadata = {
  title: 'Discover Keys',
  description: 'Find the right Keys for your situation through a guided discovery flow.',
};

export default function DiscoverPage() {
  return (
    <main id="main-content" className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto">
        <DiscoveryFlow />
      </div>
    </main>
  );
}
