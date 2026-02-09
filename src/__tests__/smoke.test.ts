/**
 * Smoke Tests for Keys CLI
 * End-to-end tests using core modules directly (not spawning processes)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
    LocalPackStore,
    LocalIndexStore,
    LocalControlPlaneAdapter,
    runDoctorChecks,
    formatDoctorResult,
    type WorkspacePaths,
    type KeysConfig,
} from '../core';

describe('Keys CLI Smoke Tests', () => {
    let tempDir: string;
    let workspace: WorkspacePaths;
    let config: KeysConfig;

    beforeEach(() => {
        // Create temp directory
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-smoke-'));
        const keysDir = path.join(tempDir, '.keys');
        fs.mkdirSync(keysDir, { recursive: true });

        // Create a .git directory to simulate project mode
        fs.mkdirSync(path.join(tempDir, '.git'));

        workspace = {
            root: keysDir,
            config: path.join(keysDir, 'config.json'),
            registry: path.join(keysDir, 'registry.json'),
            index: path.join(keysDir, 'index.json'),
            mode: 'project',
        };

        config = {
            version: '1.0.0',
            workspaceMode: 'project',
            zeo: { enabled: true, commandTemplate: 'zeo run --pack "{packPath}" --action "{actionName}"' },
            controlplane: { enabled: false },
            outputDir: 'dist/keys',
        };

        // Initialize workspace files
        fs.writeFileSync(workspace.config, JSON.stringify(config, null, 2));
        fs.writeFileSync(workspace.registry, JSON.stringify({ version: '1.0.0', entries: [] }, null, 2));
        fs.writeFileSync(workspace.index, JSON.stringify({
            version: '1.0.0',
            updatedAt: new Date().toISOString(),
            entries: [],
            invertedIndex: {}
        }, null, 2));
    });

    afterEach(() => {
        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    function createTestPack(id: string, options: Partial<{
        name: string;
        version: string;
        description: string;
        tags: string[];
        actions: Array<{ name: string; kind: string; command?: string; args?: string[] }>;
    }> = {}): string {
        const packDir = path.join(tempDir, id);
        fs.mkdirSync(packDir, { recursive: true });

        const manifest = {
            id,
            name: options.name ?? `${id} Pack`,
            version: options.version ?? '1.0.0',
            description: options.description ?? `Description for ${id}`,
            tags: options.tags ?? [],
            actions: options.actions ?? [],
        };

        fs.writeFileSync(path.join(packDir, 'keys.pack.json'), JSON.stringify(manifest, null, 2));
        fs.writeFileSync(path.join(packDir, 'README.md'), `# ${manifest.name}\n\n${manifest.description}`);

        return packDir;
    }

    it('should initialize workspace correctly', () => {
        expect(fs.existsSync(workspace.config)).toBe(true);
        expect(fs.existsSync(workspace.registry)).toBe(true);
        expect(fs.existsSync(workspace.index)).toBe(true);
    });

    it('should list empty packs after init', async () => {
        const store = new LocalPackStore(workspace);
        const packs = await store.listPacks();
        expect(packs).toHaveLength(0);
    });

    it('should add a pack', async () => {
        const packDir = createTestPack('my-pack', {
            tags: ['test', 'smoke'],
            actions: [
                { name: 'hello', kind: 'shell', command: 'echo', args: ['Hello World'] },
            ],
        });

        const store = new LocalPackStore(workspace);
        const indexStore = new LocalIndexStore(workspace);

        const entry = await store.addPack(packDir);
        expect(entry.id).toBe('my-pack');
        expect(entry.version).toBe('1.0.0');

        // Update index
        const manifest = await store.loadPackManifest(entry.path);
        await indexStore.indexPack(entry, manifest);

        const index = await indexStore.loadIndex();
        expect(index.entries).toHaveLength(1);
    });

    it('should list added pack', async () => {
        const packDir = createTestPack('my-pack');

        const store = new LocalPackStore(workspace);
        await store.addPack(packDir);

        const packs = await store.listPacks();
        expect(packs).toHaveLength(1);
        expect(packs[0].id).toBe('my-pack');
        expect(packs[0].name).toBe('my-pack Pack');
    });

    it('should search for pack by name', async () => {
        const packDir = createTestPack('my-pack', {
            name: 'My Awesome Pack',
            description: 'A pack for testing search',
            tags: ['searchable'],
        });

        const store = new LocalPackStore(workspace);
        const indexStore = new LocalIndexStore(workspace);

        const entry = await store.addPack(packDir);
        const manifest = await store.loadPackManifest(entry.path);
        await indexStore.indexPack(entry, manifest);

        // Search by name
        const results = await indexStore.search('awesome');
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('my-pack');
    });

    it('should search for pack by tag', async () => {
        const packDir = createTestPack('my-pack', {
            tags: ['searchable', 'test'],
        });

        const store = new LocalPackStore(workspace);
        const indexStore = new LocalIndexStore(workspace);

        const entry = await store.addPack(packDir);
        const manifest = await store.loadPackManifest(entry.path);
        await indexStore.indexPack(entry, manifest);

        const results = await indexStore.search('searchable');
        expect(results).toHaveLength(1);
    });

    it('should return no results for non-matching search', async () => {
        const packDir = createTestPack('my-pack');

        const store = new LocalPackStore(workspace);
        const indexStore = new LocalIndexStore(workspace);

        const entry = await store.addPack(packDir);
        const manifest = await store.loadPackManifest(entry.path);
        await indexStore.indexPack(entry, manifest);

        const results = await indexStore.search('nonexistent');
        expect(results).toHaveLength(0);
    });

    it('should show pack details', async () => {
        const packDir = createTestPack('my-pack', {
            name: 'Detailed Pack',
            version: '2.0.0',
            description: 'A detailed pack',
            tags: ['detail', 'test'],
            actions: [
                { name: 'greet', kind: 'shell', command: 'echo', args: ['Hi'] },
            ],
        });

        const store = new LocalPackStore(workspace);
        await store.addPack(packDir);

        const entry = await store.getPack('my-pack');
        expect(entry).not.toBeNull();
        expect(entry?.name).toBe('Detailed Pack');
        expect(entry?.version).toBe('2.0.0');

        const manifest = await store.loadPackManifest(entry!.path);
        expect(manifest.actions).toHaveLength(1);
        expect(manifest.actions[0].name).toBe('greet');
    });

    it('should export pack', async () => {
        const packDir = createTestPack('my-pack', {
            version: '1.2.3',
        });

        const store = new LocalPackStore(workspace);
        const entry = await store.addPack(packDir);

        const manifest = await store.loadPackManifest(entry.path);
        const outputDir = path.join(tempDir, 'dist', 'keys');
        const adapter = new LocalControlPlaneAdapter(config.controlplane);

        const result = await adapter.export(entry.path, manifest, outputDir);

        expect(fs.existsSync(result.manifestPath)).toBe(true);
        expect(result.hash).toBeDefined();
        expect(result.size).toBeGreaterThan(0);

        // Verify export manifest
        const exportManifest = JSON.parse(fs.readFileSync(result.manifestPath, 'utf-8'));
        expect(exportManifest.id).toBe('my-pack');
        expect(exportManifest.version).toBe('1.2.3');
        expect(exportManifest.archiveHash).toBe(result.hash);
    });

    it('should run doctor checks', async () => {
        const result = await runDoctorChecks(workspace, config);

        expect(result.timestamp).toBeDefined();
        expect(result.checks.length).toBeGreaterThan(0);
        expect(result.summary.total).toBe(result.checks.length);

        // Workspace check should pass
        const workspaceCheck = result.checks.find(c => c.name === 'Workspace');
        expect(workspaceCheck?.status).toBe('ok');

        // Node.js check should pass (we're running Node)
        const nodeCheck = result.checks.find(c => c.name === 'Node.js');
        expect(['ok', 'warn']).toContain(nodeCheck?.status);
    });

    it('should format doctor result', async () => {
        const result = await runDoctorChecks(workspace, config);
        const formatted = formatDoctorResult(result);

        expect(formatted).toContain('Keys Doctor Report');
        expect(formatted).toContain('Workspace');
        expect(formatted).toContain('Summary');
    });

    it('should handle multiple packs', async () => {
        const pack1Dir = createTestPack('pack-1', { tags: ['alpha'] });
        const pack2Dir = createTestPack('pack-2', { tags: ['beta'] });
        const pack3Dir = createTestPack('pack-3', { tags: ['gamma'] });

        const store = new LocalPackStore(workspace);
        const indexStore = new LocalIndexStore(workspace);

        for (const packDir of [pack1Dir, pack2Dir, pack3Dir]) {
            const entry = await store.addPack(packDir);
            const manifest = await store.loadPackManifest(entry.path);
            await indexStore.indexPack(entry, manifest);
        }

        const packs = await store.listPacks();
        expect(packs).toHaveLength(3);

        // Search should find specific pack
        const results = await indexStore.search('beta');
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('pack-2');
    });

    it('should update pack when re-added', async () => {
        const packDir = createTestPack('my-pack', { version: '1.0.0' });

        const store = new LocalPackStore(workspace);
        const entry1 = await store.addPack(packDir);
        expect(entry1.version).toBe('1.0.0');

        // Update manifest version
        const manifestPath = path.join(packDir, 'keys.pack.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        manifest.version = '2.0.0';
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        // Re-add
        const entry2 = await store.addPack(packDir);
        expect(entry2.version).toBe('2.0.0');

        // Should still be only one pack
        const packs = await store.listPacks();
        expect(packs).toHaveLength(1);
        expect(packs[0].version).toBe('2.0.0');
    });

    it('complete smoke test flow', async () => {
        // Full flow: init (done in beforeEach) -> add -> list -> search -> show -> export -> doctor

        // 1. Create and add pack
        const packDir = createTestPack('full-test-pack', {
            name: 'Full Test Pack',
            version: '2.1.0',
            description: 'Complete smoke test pack',
            tags: ['smoke', 'full', 'test'],
            actions: [
                { name: 'hello', kind: 'shell', command: 'echo', args: ['Complete test!'] },
                { name: 'doc', kind: 'doc' },
            ],
        });

        // Create subdirectories
        fs.mkdirSync(path.join(packDir, 'assets'), { recursive: true });
        fs.mkdirSync(path.join(packDir, 'actions'), { recursive: true });
        fs.writeFileSync(path.join(packDir, 'assets', 'data.json'), '{}');
        fs.writeFileSync(path.join(packDir, 'actions', 'hello.sh'), 'echo "Hello"');

        const store = new LocalPackStore(workspace);
        const indexStore = new LocalIndexStore(workspace);

        // 2. Add
        const entry = await store.addPack(packDir);
        expect(entry.id).toBe('full-test-pack');

        const manifest = await store.loadPackManifest(entry.path);
        await indexStore.indexPack(entry, manifest);

        // 3. List
        const packs = await store.listPacks();
        expect(packs).toHaveLength(1);

        // 4. Search
        const searchResults = await indexStore.search('smoke');
        expect(searchResults).toHaveLength(1);
        expect(searchResults[0].id).toBe('full-test-pack');

        // 5. Show
        const showEntry = await store.getPack('full-test-pack');
        expect(showEntry?.version).toBe('2.1.0');

        // 6. Export
        const outputDir = path.join(tempDir, 'dist', 'keys');
        const adapter = new LocalControlPlaneAdapter(config.controlplane);
        const exportResult = await adapter.export(entry.path, manifest, outputDir);

        expect(fs.existsSync(exportResult.manifestPath)).toBe(true);
        const exportManifest = JSON.parse(fs.readFileSync(exportResult.manifestPath, 'utf-8'));
        expect(exportManifest.id).toBe('full-test-pack');
        expect(exportManifest.version).toBe('2.1.0');
        expect(exportManifest.archiveHash).toBeDefined();

        // 7. Doctor
        const doctorResult = await runDoctorChecks(workspace, config);
        expect(doctorResult.summary.fail).toBe(0);
    });
});
