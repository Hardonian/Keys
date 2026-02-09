/**
 * Unit Tests for Pack Store and Index Store
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { LocalPackStore, createSamplePack } from '../core/pack-store';
import { LocalIndexStore } from '../core/index-store';
import type { WorkspacePaths } from '../core/workspace';

describe('LocalPackStore', () => {
    let tempDir: string;
    let workspace: WorkspacePaths;
    let store: LocalPackStore;

    beforeEach(() => {
        // Create temp directory
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-test-'));
        const keysDir = path.join(tempDir, '.keys');
        fs.mkdirSync(keysDir, { recursive: true });

        workspace = {
            root: keysDir,
            config: path.join(keysDir, 'config.json'),
            registry: path.join(keysDir, 'registry.json'),
            index: path.join(keysDir, 'index.json'),
            mode: 'project',
        };

        store = new LocalPackStore(workspace);
    });

    afterEach(() => {
        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should load empty registry when none exists', async () => {
        const registry = await store.loadRegistry();
        expect(registry.version).toBe('1.0.0');
        expect(registry.entries).toEqual([]);
    });

    it('should save and load registry', async () => {
        const registry = {
            version: '1.0.0',
            entries: [
                {
                    id: 'test-pack',
                    name: 'Test Pack',
                    version: '1.0.0',
                    description: 'A test',
                    tags: [],
                    path: '/test/path',
                    addedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    source: 'local' as const,
                },
            ],
        };

        await store.saveRegistry(registry);
        const loaded = await store.loadRegistry();

        expect(loaded.entries).toHaveLength(1);
        expect(loaded.entries[0].id).toBe('test-pack');
    });

    it('should add a pack from path', async () => {
        // Create sample pack
        const packDir = path.join(tempDir, 'sample-pack');
        createSamplePack(packDir);

        const entry = await store.addPack(packDir);

        expect(entry.id).toBe('sample-pack');
        expect(entry.name).toBe('Sample Pack');
        expect(entry.version).toBe('1.0.0');
    });

    it('should update existing pack when re-added', async () => {
        const packDir = path.join(tempDir, 'sample-pack');
        createSamplePack(packDir);

        const entry1 = await store.addPack(packDir);
        const entry2 = await store.addPack(packDir);

        // Should be same pack, not duplicate
        const registry = await store.loadRegistry();
        expect(registry.entries).toHaveLength(1);

        // addedAt should stay the same, updatedAt should change
        expect(entry2.addedAt).toBe(entry1.addedAt);
    });

    it('should remove a pack', async () => {
        const packDir = path.join(tempDir, 'sample-pack');
        createSamplePack(packDir);

        await store.addPack(packDir);
        const removed = await store.removePack('sample-pack');

        expect(removed).toBe(true);

        const registry = await store.loadRegistry();
        expect(registry.entries).toHaveLength(0);
    });

    it('should get pack by ID', async () => {
        const packDir = path.join(tempDir, 'sample-pack');
        createSamplePack(packDir);

        await store.addPack(packDir);
        const pack = await store.getPack('sample-pack');

        expect(pack).not.toBeNull();
        expect(pack?.name).toBe('Sample Pack');
    });

    it('should return null for non-existent pack', async () => {
        const pack = await store.getPack('non-existent');
        expect(pack).toBeNull();
    });

    it('should list all packs', async () => {
        const pack1Dir = path.join(tempDir, 'pack1');
        const pack2Dir = path.join(tempDir, 'pack2');

        // Create two packs manually
        fs.mkdirSync(pack1Dir);
        fs.writeFileSync(
            path.join(pack1Dir, 'keys.pack.json'),
            JSON.stringify({
                id: 'pack-1',
                name: 'Pack 1',
                version: '1.0.0',
                description: 'First pack',
                tags: [],
                actions: [],
            })
        );

        fs.mkdirSync(pack2Dir);
        fs.writeFileSync(
            path.join(pack2Dir, 'keys.pack.json'),
            JSON.stringify({
                id: 'pack-2',
                name: 'Pack 2',
                version: '2.0.0',
                description: 'Second pack',
                tags: ['test'],
                actions: [],
            })
        );

        await store.addPack(pack1Dir);
        await store.addPack(pack2Dir);

        const packs = await store.listPacks();
        expect(packs).toHaveLength(2);
    });

    it('should throw error for missing manifest', async () => {
        const emptyDir = path.join(tempDir, 'empty');
        fs.mkdirSync(emptyDir);

        await expect(store.addPack(emptyDir)).rejects.toThrow('Pack manifest not found');
    });

    it('should throw error for invalid manifest JSON', async () => {
        const packDir = path.join(tempDir, 'bad-json');
        fs.mkdirSync(packDir);
        fs.writeFileSync(path.join(packDir, 'keys.pack.json'), 'not json');

        await expect(store.addPack(packDir)).rejects.toThrow('Invalid JSON');
    });

    it('should throw error for invalid manifest schema', async () => {
        const packDir = path.join(tempDir, 'bad-schema');
        fs.mkdirSync(packDir);
        fs.writeFileSync(
            path.join(packDir, 'keys.pack.json'),
            JSON.stringify({ id: 'Invalid ID' }) // missing required fields
        );

        await expect(store.addPack(packDir)).rejects.toThrow('Invalid pack manifest');
    });
});

describe('LocalIndexStore', () => {
    let tempDir: string;
    let workspace: WorkspacePaths;
    let indexStore: LocalIndexStore;
    let packStore: LocalPackStore;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-test-'));
        const keysDir = path.join(tempDir, '.keys');
        fs.mkdirSync(keysDir, { recursive: true });

        workspace = {
            root: keysDir,
            config: path.join(keysDir, 'config.json'),
            registry: path.join(keysDir, 'registry.json'),
            index: path.join(keysDir, 'index.json'),
            mode: 'project',
        };

        indexStore = new LocalIndexStore(workspace);
        packStore = new LocalPackStore(workspace);
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should load empty index when none exists', async () => {
        const index = await indexStore.loadIndex();
        expect(index.version).toBe('1.0.0');
        expect(index.entries).toEqual([]);
    });

    it('should index a pack', async () => {
        const packDir = path.join(tempDir, 'sample-pack');
        createSamplePack(packDir);

        const entry = await packStore.addPack(packDir);
        const manifest = await packStore.loadPackManifest(entry.path);

        await indexStore.indexPack(entry, manifest);

        const index = await indexStore.loadIndex();
        expect(index.entries).toHaveLength(1);
        expect(index.entries[0].id).toBe('sample-pack');
        expect(index.entries[0].terms.length).toBeGreaterThan(0);
    });

    it('should search by ID', async () => {
        const packDir = path.join(tempDir, 'sample-pack');
        createSamplePack(packDir);

        const entry = await packStore.addPack(packDir);
        const manifest = await packStore.loadPackManifest(entry.path);
        await indexStore.indexPack(entry, manifest);

        const results = await indexStore.search('sample');
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('sample-pack');
    });

    it('should search by name', async () => {
        const packDir = path.join(tempDir, 'sample-pack');
        createSamplePack(packDir);

        const entry = await packStore.addPack(packDir);
        const manifest = await packStore.loadPackManifest(entry.path);
        await indexStore.indexPack(entry, manifest);

        const results = await indexStore.search('Sample Pack');
        expect(results).toHaveLength(1);
    });

    it('should search by tag', async () => {
        const packDir = path.join(tempDir, 'sample-pack');
        createSamplePack(packDir);

        const entry = await packStore.addPack(packDir);
        const manifest = await packStore.loadPackManifest(entry.path);
        await indexStore.indexPack(entry, manifest);

        const results = await indexStore.search('test');
        expect(results).toHaveLength(1);
    });

    it('should return empty results for no match', async () => {
        const packDir = path.join(tempDir, 'sample-pack');
        createSamplePack(packDir);

        const entry = await packStore.addPack(packDir);
        const manifest = await packStore.loadPackManifest(entry.path);
        await indexStore.indexPack(entry, manifest);

        const results = await indexStore.search('nonexistent');
        expect(results).toHaveLength(0);
    });

    it('should remove pack from index', async () => {
        const packDir = path.join(tempDir, 'sample-pack');
        createSamplePack(packDir);

        const entry = await packStore.addPack(packDir);
        const manifest = await packStore.loadPackManifest(entry.path);
        await indexStore.indexPack(entry, manifest);

        await indexStore.removeFromIndex('sample-pack');

        const index = await indexStore.loadIndex();
        expect(index.entries).toHaveLength(0);
    });

    it('should rebuild index from registry', async () => {
        const packDir = path.join(tempDir, 'sample-pack');
        createSamplePack(packDir);

        await packStore.addPack(packDir);
        const registry = await packStore.loadRegistry();

        const index = await indexStore.rebuildIndex(
            registry,
            (p) => packStore.loadPackManifest(p)
        );

        expect(index.entries).toHaveLength(1);
        expect(Object.keys(index.invertedIndex).length).toBeGreaterThan(0);
    });
});
