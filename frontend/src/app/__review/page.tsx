import Link from 'next/link';
import { generatePageMetadata } from '@/utils/metadata';
import { ReviewClient } from './review-client';

export const metadata = generatePageMetadata({
  title: 'Internal Review',
  description: 'Internal UI review and polish utilities (non-public).',
  path: '/__review',
  noIndex: true,
});

export default function ReviewPage() {
  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Internal Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fast visual QA for preview deployments: critical links, state toggles, and runtime UI config.
          </p>
        </div>
        <Link href="/" className="text-sm underline underline-offset-4">
          Back to app
        </Link>
      </div>

      <div className="mt-8">
        <ReviewClient />
      </div>
    </main>
  );
}

