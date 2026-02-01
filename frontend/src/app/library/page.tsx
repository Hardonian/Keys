import path from 'node:path';
import fs from 'node:fs/promises';
import LibraryIndexClient, { IndexArtifact } from '@/components/Library/LibraryIndexClient';
import { EmptyState } from '@/components/EmptyState';
import Link from 'next/link';

export const runtime = 'nodejs';

export const metadata = {
  title: 'Library',
  description: 'Browse open source prompts, notebooks, and runbooks maintained by Keys.',
};

interface IndexFileShape {
  artifacts: IndexArtifact[];
}

const candidateBaseDirs = [process.cwd(), path.join(process.cwd(), '..')];

async function loadIndex(): Promise<IndexArtifact[] | null> {
  const indexPath = path.join(process.cwd(), 'public', 'keys-index.json');
  try {
    const raw = await fs.readFile(indexPath, 'utf8');
    const parsed = JSON.parse(raw) as IndexFileShape;
    if (!parsed?.artifacts) return null;
    return parsed.artifacts;
  } catch {
    return null;
  }
}

async function loadFallbackArtifacts(): Promise<IndexArtifact[]> {
  for (const baseDir of candidateBaseDirs) {
    const libraryDir = path.join(baseDir, 'docs/library');
    try {
      const entries = await fs.readdir(libraryDir);
      const metadataFiles = entries.filter((entry) => entry.endsWith('.metadata.json'));
      const artifacts = await Promise.all(
        metadataFiles.map(async (entry) => {
          const filePath = path.join(libraryDir, entry);
          const raw = await fs.readFile(filePath, 'utf8');
          const parsed = JSON.parse(raw) as Omit<IndexArtifact, 'slug'>;
          return {
            ...parsed,
            tags: parsed.tags ?? [],
            categories: parsed.categories ?? [],
            tools_supported: parsed.tools_supported ?? [],
            slug: parsed.id,
          } as IndexArtifact;
        })
      );
      return artifacts.sort((a, b) => a.title.localeCompare(b.title));
    } catch {
      continue;
    }
  }
  return [];
}

export default async function LibraryPage() {
  const indexArtifacts = await loadIndex();
  const indexMissing = indexArtifacts === null;
  const artifacts = indexArtifacts ?? (await loadFallbackArtifacts());

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">Library</h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Browse open source artifacts. Each entry includes clear metadata and is meant to be adapted to your tools.
          </p>
        </header>

{artifacts.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
            <EmptyState
              title="Library is empty"
              description="No artifacts are available yet. Check back soon or contribute a new prompt, notebook, or runbook."
              showIllustration={true}
              illustrationAlt="Empty library waiting for content"
              action={{
                label: 'Contribute on GitHub',
                onClick: () => window.open('https://github.com/anomalyco/keys', '_blank'),
              }}
              secondaryAction={{
                label: 'Browse Docs',
                onClick: () => window.location.href = '/docs',
              }}
            />
          </div>
        ) : (
          <LibraryIndexClient artifacts={artifacts} indexMissing={indexMissing} />
        )}
      </div>
    </main>
  );
}
