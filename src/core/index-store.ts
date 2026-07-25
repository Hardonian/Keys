/**
 * Index Store Implementation
 * Pure-JS inverted index for local search
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
    IndexStore,
    SearchIndex,
    SearchIndexEntry,
    Registry,
    RegistryEntry,
    PackManifest
} from './contracts';
import { SearchIndexSchema } from './contracts';
import type { WorkspacePaths } from './workspace';

/**
 * Tokenize text for indexing
 */
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-_]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length >= 2)
        .filter((t, i, arr) => arr.indexOf(t) === i); // dedupe
}

/**
 * Extract searchable terms from a pack
 */
function extractTerms(entry: RegistryEntry, manifest?: PackManifest, readme?: string): string[] {
    const parts: string[] = [
        entry.id,
        entry.name,
        entry.description,
        ...entry.tags,
    ];

    if (manifest) {
        if (manifest.author) parts.push(manifest.author);
        if (manifest.license) parts.push(manifest.license);
        manifest.actions.forEach(action => {
            parts.push(action.name);
            if (action.description) parts.push(action.description);
        });
    }

    if (readme) {
        // Extract first 1000 chars from README for indexing
        parts.push(readme.slice(0, 1000));
    }

    return tokenize(parts.join(' '));
}

export class LocalIndexStore implements IndexStore {
    constructor(private workspace: WorkspacePaths) { }

    getIndexPath(): string {
        return this.workspace.index;
    }

    async loadIndex(): Promise<SearchIndex> {
        const indexPath = this.getIndexPath();

        if (!fs.existsSync(indexPath)) {
            return SearchIndexSchema.parse({
                version: '1.0.0',
                updatedAt: new Date().toISOString(),
                entries: [],
                invertedIndex: {},
            });
        }

        try {
            const raw = fs.readFileSync(indexPath, 'utf-8');
            const data = JSON.parse(raw);
            return SearchIndexSchema.parse(data);
        } catch (_error) {
            return SearchIndexSchema.parse({
                version: '1.0.0',
                updatedAt: new Date().toISOString(),
                entries: [],
                invertedIndex: {},
            });
        }
    }

    async saveIndex(index: SearchIndex): Promise<void> {
        const indexPath = this.getIndexPath();
        const dir = path.dirname(indexPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        index.updatedAt = new Date().toISOString();
        fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    }

    async rebuildIndex(
        registry: Registry,
        loadManifest: (packPath: string) => Promise<PackManifest>
    ): Promise<SearchIndex> {
        const entries: SearchIndexEntry[] = [];
        const invertedIndex: Record<string, string[]> = {};

        for (const regEntry of registry.entries) {
            try {
                const manifest = await loadManifest(regEntry.path);

                // Try to read README
                let readme = '';
                const readmePath = path.join(regEntry.path, 'README.md');
                if (fs.existsSync(readmePath)) {
                    readme = fs.readFileSync(readmePath, 'utf-8');
                }

                const terms = extractTerms(regEntry, manifest, readme);
                entries.push({ id: regEntry.id, terms });

                // Build inverted index
                for (const term of terms) {
                    if (!invertedIndex[term]) {
                        invertedIndex[term] = [];
                    }
                    if (!invertedIndex[term].includes(regEntry.id)) {
                        invertedIndex[term].push(regEntry.id);
                    }
                }
            } catch (error) {
                // Skip packs that can't be loaded
                console.warn(`Warning: Could not index pack at ${regEntry.path}: ${error}`);
            }
        }

        const index: SearchIndex = {
            version: '1.0.0',
            updatedAt: new Date().toISOString(),
            entries,
            invertedIndex,
        };

        await this.saveIndex(index);
        return index;
    }

    async search(query: string): Promise<SearchIndexEntry[]> {
        const index = await this.loadIndex();
        const queryTerms = tokenize(query);

        if (queryTerms.length === 0) {
            return index.entries;
        }

        // Score each entry based on matching terms
        const scores: Map<string, number> = new Map();

        for (const term of queryTerms) {
            // Exact match
            if (index.invertedIndex[term]) {
                for (const id of index.invertedIndex[term]) {
                    scores.set(id, (scores.get(id) ?? 0) + 10);
                }
            }

            // Prefix match
            for (const indexTerm of Object.keys(index.invertedIndex)) {
                if (indexTerm.startsWith(term) && indexTerm !== term) {
                    for (const id of index.invertedIndex[indexTerm]) {
                        scores.set(id, (scores.get(id) ?? 0) + 5);
                    }
                }
            }

            // Substring match
            for (const indexTerm of Object.keys(index.invertedIndex)) {
                if (indexTerm.includes(term) && !indexTerm.startsWith(term)) {
                    for (const id of index.invertedIndex[indexTerm]) {
                        scores.set(id, (scores.get(id) ?? 0) + 2);
                    }
                }
            }
        }

        // Filter entries with score > 0 and sort by score
        const results = index.entries
            .filter(e => (scores.get(e.id) ?? 0) > 0)
            .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));

        return results;
    }

    async indexPack(entry: RegistryEntry, manifest: PackManifest): Promise<void> {
        const index = await this.loadIndex();

        // Remove existing entry for this pack
        index.entries = index.entries.filter(e => e.id !== entry.id);

        // Clean up inverted index
        for (const term of Object.keys(index.invertedIndex)) {
            index.invertedIndex[term] = index.invertedIndex[term].filter(id => id !== entry.id);
            if (index.invertedIndex[term].length === 0) {
                delete index.invertedIndex[term];
            }
        }

        // Read README if available
        let readme = '';
        const readmePath = path.join(entry.path, 'README.md');
        if (fs.existsSync(readmePath)) {
            readme = fs.readFileSync(readmePath, 'utf-8');
        }

        // Add new entry
        const terms = extractTerms(entry, manifest, readme);
        index.entries.push({ id: entry.id, terms });

        // Update inverted index
        for (const term of terms) {
            if (!index.invertedIndex[term]) {
                index.invertedIndex[term] = [];
            }
            if (!index.invertedIndex[term].includes(entry.id)) {
                index.invertedIndex[term].push(entry.id);
            }
        }

        await this.saveIndex(index);
    }

    async removeFromIndex(packId: string): Promise<void> {
        const index = await this.loadIndex();

        // Remove entry
        index.entries = index.entries.filter(e => e.id !== packId);

        // Clean up inverted index
        for (const term of Object.keys(index.invertedIndex)) {
            index.invertedIndex[term] = index.invertedIndex[term].filter(id => id !== packId);
            if (index.invertedIndex[term].length === 0) {
                delete index.invertedIndex[term];
            }
        }

        await this.saveIndex(index);
    }
}
