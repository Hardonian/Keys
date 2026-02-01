'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';

export interface IndexArtifact {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  categories: string[];
  tools_supported: string[];
  updated_at?: string | null;
  content_path: string;
  license?: string | null;
  safety_notes?: string | null;
}

interface LibraryIndexClientProps {
  artifacts: IndexArtifact[];
  indexMissing: boolean;
}

const filterMatches = (artifact: IndexArtifact, query: string, tags: string[], categories: string[], tools: string[]) => {
  const queryLower = query.toLowerCase();
  const matchesQuery =
    queryLower.length === 0 ||
    artifact.title.toLowerCase().includes(queryLower) ||
    artifact.description.toLowerCase().includes(queryLower) ||
    artifact.tags.some((tag) => tag.toLowerCase().includes(queryLower)) ||
    artifact.categories.some((category) => category.toLowerCase().includes(queryLower));

  const matchesTags = tags.length === 0 || tags.every((tag) => artifact.tags.includes(tag));
  const matchesCategories = categories.length === 0 || categories.every((category) => artifact.categories.includes(category));
  const matchesTools = tools.length === 0 || tools.every((tool) => artifact.tools_supported.includes(tool));

  return matchesQuery && matchesTags && matchesCategories && matchesTools;
};

const toggleFilter = (value: string, values: string[]) => {
  if (values.includes(value)) {
    return values.filter((item) => item !== value);
  }
  return [...values, value];
};

export default function LibraryIndexClient({ artifacts, indexMissing }: LibraryIndexClientProps) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    artifacts.forEach((artifact) => artifact.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [artifacts]);

  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    artifacts.forEach((artifact) => artifact.categories.forEach((category) => categorySet.add(category)));
    return Array.from(categorySet).sort();
  }, [artifacts]);

  const availableTools = useMemo(() => {
    const toolSet = new Set<string>();
    artifacts.forEach((artifact) => artifact.tools_supported.forEach((tool) => toolSet.add(tool)));
    return Array.from(toolSet).sort();
  }, [artifacts]);

  const filteredArtifacts = useMemo(() => {
    return artifacts.filter((artifact) => filterMatches(artifact, query, selectedTags, selectedCategories, selectedTools));
  }, [artifacts, query, selectedTags, selectedCategories, selectedTools]);

  const resetFilters = () => {
    setQuery('');
    setSelectedTags([]);
    setSelectedCategories([]);
    setSelectedTools([]);
  };

  return (
    <section className="space-y-6">
      {indexMissing && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-900/20 dark:text-amber-100">
          <p className="font-semibold">Static index not found.</p>
          <p className="mt-2">Generate it locally with:</p>
          <code className="mt-2 block rounded bg-amber-100 px-3 py-2 font-mono text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
            pnpm keys:index
          </code>
        </div>
      )}

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <div>
          <label htmlFor="library-search" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Search the library
          </label>
          <input
            id="library-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, description, tags..."
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-gray-100"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FilterGroup
            title="Tags"
            options={availableTags}
            selected={selectedTags}
            onToggle={(value) => setSelectedTags((current) => toggleFilter(value, current))}
          />
          <FilterGroup
            title="Categories"
            options={availableCategories}
            selected={selectedCategories}
            onToggle={(value) => setSelectedCategories((current) => toggleFilter(value, current))}
          />
          <FilterGroup
            title="Tools"
            options={availableTools}
            selected={selectedTools}
            onToggle={(value) => setSelectedTools((current) => toggleFilter(value, current))}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span>{filteredArtifacts.length} artifacts</span>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-gray-200 dark:hover:border-blue-400 dark:hover:text-blue-200"
          >
            Clear filters
          </button>
        </div>
      </div>

{filteredArtifacts.length === 0 ? (
        <EmptyState
          title="No matches found"
          description="No artifacts match the current filters. Try adjusting your search criteria or clearing the filters."
          showIllustration={false}
          icon="🔍"
          action={{
            label: 'Clear Filters',
            onClick: resetFilters,
          }}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtifacts.map((artifact) => (
            <Link
              key={artifact.id}
              href={`/library/${artifact.slug}`}
              className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300">
                <span>{artifact.categories[0] ?? 'Artifact'}</span>
                {artifact.updated_at && <span>{new Date(artifact.updated_at).toLocaleDateString()}</span>}
              </div>
              <h2 className="mt-3 text-lg font-semibold text-gray-900 group-hover:underline dark:text-gray-100">
                {artifact.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{artifact.description}</p>
              <div className="mt-auto space-y-3 pt-4">
                {artifact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {artifact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {artifact.tools_supported.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Tools: {artifact.tools_supported.join(', ')}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

interface FilterGroupProps {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterGroup({ title, options, selected, onToggle }: FilterGroupProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.length === 0 ? (
          <span className="text-xs text-gray-400 dark:text-gray-500">None</span>
        ) : (
          options.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:border-blue-400 dark:text-blue-200'
                    : 'border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-gray-300 dark:hover:border-blue-400'
                }`}
              >
                {option}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
