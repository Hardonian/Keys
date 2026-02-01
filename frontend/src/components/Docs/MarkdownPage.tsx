import 'server-only';

import fs from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';

interface MarkdownPageProps {
  title: string;
  description?: string;
  filePath: string;
}

const candidateBaseDirs = [process.cwd(), path.join(process.cwd(), '..')];

async function readMarkdownFile(filePath: string) {
  const normalized = filePath.replace(/^\//, '');

  for (const baseDir of candidateBaseDirs) {
    try {
      const absolutePath = path.join(baseDir, normalized);
      const contents = await fs.readFile(absolutePath, 'utf8');
      return contents;
    } catch {
      // Continue to next candidate base dir.
    }
  }

  return null;
}

export async function MarkdownPage({ title, description, filePath }: MarkdownPageProps) {
  const raw = await readMarkdownFile(filePath);

  const markdown = raw
    ?? `# ${title}\n\nWe could not load this document right now. Please contact support if the issue persists.`;

  const html = marked.parse(markdown);

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          {description && (
            <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </header>
        <article
          className="prose prose-slate dark:prose-invert max-w-none bg-white/70 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl p-6 sm:p-8 shadow-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  );
}
