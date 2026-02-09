/**
 * Smoke Tests for Keys CLI
 * End-to-end tests: init -> add -> list -> search -> export -> doctor
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { spawnSync } from 'node:child_process';

describe('Keys CLI Smoke Tests', () => {
    let tempDir: string;
    let originalCwd: string;

    beforeEach(() => {
        // Create temp directory and change to it
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keys-smoke-'));
        originalCwd = process.cwd();
        process.chdir(tempDir);

        // Create a .git directory to simulate project mode
        fs.mkdirSync(path.join(tempDir, '.git'));
    });

    afterEach(() => {
        // Restore original cwd and clean up
        process.chdir(originalCwd);
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    function runKeys(...args: string[]): { code: number; stdout: string; stderr: string } {
        const result = spawnSync('npx', ['tsx', path.join(originalCwd, 'src/cli/keys.ts'), ...args], {
            cwd: tempDir,
            encoding: 'utf-8',
            timeout: 30000,
            env: { ...process.env, NODE_ENV: 'test' },
        });

        return {
            code: result.status ?? 1,
            stdout: result.stdout ?? '',
            stderr: result.stderr ?? '',
        };
    }

    it('should show help', () => {
        const result = runKeys('help');
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('Keys CLI');
        expect(result.stdout).toContain('init');
        expect(result.stdout).toContain('add');
    });

    it('should initialize workspace', () => {
        const result = runKeys('init');
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('Initialized Keys workspace');

        // Verify files created
        expect(fs.existsSync(path.join(tempDir, '.keys', 'config.json'))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, '.keys', 'registry.json'))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, '.keys', 'index.json'))).toBe(true);
    });

    it('should list empty packs after init', () => {
        runKeys('init');
        const result = runKeys('list');
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('No packs registered');
    });

    it('should add a pack', () => {
        runKeys('init');

        // Create a sample pack
        const packDir = path.join(tempDir, 'my-pack');
        fs.mkdirSync(packDir);
        fs.writeFileSync(
            path.join(packDir, 'keys.pack.json'),
            JSON.stringify({
                id: 'my-pack',
                name: 'My Pack',
                version: '1.0.0',
                description: 'A test pack for smoke tests',
                tags: ['test', 'smoke'],
                actions: [
                    {
                        name: 'hello',
                        kind: 'shell',
                        command: 'echo',
                        args: ['Hello World'],
                    },
                ],
            })
        );
        fs.writeFileSync(path.join(packDir, 'README.md'), '# My Pack\n\nTest pack.');

        const result = runKeys('add', packDir);
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('Added pack: my-pack');
    });

    it('should list added pack', () => {
        runKeys('init');

        // Create and add pack
        const packDir = path.join(tempDir, 'my-pack');
        fs.mkdirSync(packDir);
        fs.writeFileSync(
            path.join(packDir, 'keys.pack.json'),
            JSON.stringify({
                id: 'my-pack',
                name: 'My Pack',
                version: '1.0.0',
                description: 'Test pack',
                tags: [],
                actions: [],
            })
        );

        runKeys('add', packDir);
        const result = runKeys('list');

        expect(result.code).toBe(0);
        expect(result.stdout).toContain('my-pack');
        expect(result.stdout).toContain('1.0.0');
        expect(result.stdout).toContain('My Pack');
    });

    it('should search for pack', () => {
        runKeys('init');

        // Create and add pack
        const packDir = path.join(tempDir, 'my-pack');
        fs.mkdirSync(packDir);
        fs.writeFileSync(
            path.join(packDir, 'keys.pack.json'),
            JSON.stringify({
                id: 'my-pack',
                name: 'My Pack',
                version: '1.0.0',
                description: 'A pack for testing search',
                tags: ['searchable'],
                actions: [],
            })
        );

        runKeys('add', packDir);

        // Search by name
        let result = runKeys('search', 'My Pack');
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('my-pack');

        // Search by tag
        result = runKeys('search', 'searchable');
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('my-pack');

        // Search with no results
        result = runKeys('search', 'nonexistent');
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('No packs found');
    });

    it('should show pack details', () => {
        runKeys('init');

        // Create and add pack
        const packDir = path.join(tempDir, 'my-pack');
        fs.mkdirSync(packDir);
        fs.writeFileSync(
            path.join(packDir, 'keys.pack.json'),
            JSON.stringify({
                id: 'my-pack',
                name: 'My Pack',
                version: '1.0.0',
                description: 'A detailed pack',
                tags: ['detail', 'test'],
                actions: [
                    {
                        name: 'greet',
                        kind: 'shell',
                        command: 'echo',
                        args: ['Hi'],
                        description: 'Say hi',
                    },
                ],
                author: 'Test Author',
                license: 'MIT',
            })
        );

        runKeys('add', packDir);
        const result = runKeys('show', 'my-pack');

        expect(result.code).toBe(0);
        expect(result.stdout).toContain('my-pack');
        expect(result.stdout).toContain('My Pack');
        expect(result.stdout).toContain('1.0.0');
        expect(result.stdout).toContain('Test Author');
        expect(result.stdout).toContain('MIT');
        expect(result.stdout).toContain('greet');
        expect(result.stdout).toContain('shell');
    });

    it('should export pack', () => {
        runKeys('init');

        // Create and add pack
        const packDir = path.join(tempDir, 'my-pack');
        fs.mkdirSync(packDir);
        fs.writeFileSync(
            path.join(packDir, 'keys.pack.json'),
            JSON.stringify({
                id: 'my-pack',
                name: 'My Pack',
                version: '1.0.0',
                description: 'Exportable pack',
                tags: [],
                actions: [],
            })
        );
        fs.writeFileSync(path.join(packDir, 'README.md'), '# My Pack');

        runKeys('add', packDir);
        const result = runKeys('export', 'my-pack');

        expect(result.code).toBe(0);
        expect(result.stdout).toContain('Exported pack: my-pack');
        expect(result.stdout).toContain('Archive:');
        expect(result.stdout).toContain('Manifest:');
        expect(result.stdout).toContain('Hash:');

        // Verify export files created
        const exportDir = path.join(tempDir, 'dist', 'keys', 'my-pack');
        expect(fs.existsSync(exportDir)).toBe(true);
        expect(fs.existsSync(path.join(exportDir, 'manifest.json'))).toBe(true);
    });

    it('should run doctor', () => {
        runKeys('init');
        const result = runKeys('doctor');

        expect(result.code).toBe(0);
        expect(result.stdout).toContain('Keys Doctor Report');
        expect(result.stdout).toContain('Workspace');
        expect(result.stdout).toContain('Node.js');
        expect(result.stdout).toContain('Summary');
    });

    it('should run shell action', () => {
        runKeys('init');

        // Create pack with shell action
        const packDir = path.join(tempDir, 'my-pack');
        fs.mkdirSync(packDir);
        fs.writeFileSync(
            path.join(packDir, 'keys.pack.json'),
            JSON.stringify({
                id: 'my-pack',
                name: 'My Pack',
                version: '1.0.0',
                description: 'Pack with shell action',
                tags: [],
                actions: [
                    {
                        name: 'hello',
                        kind: 'shell',
                        command: 'echo',
                        args: ['Hello from smoke test!'],
                    },
                ],
            })
        );

        runKeys('add', packDir);
        const result = runKeys('run', 'my-pack', 'hello');

        expect(result.code).toBe(0);
        expect(result.stdout).toContain('Hello from smoke test!');
    });

    it('should handle zeo action gracefully when zeo missing', () => {
        runKeys('init');

        // Create pack with zeo action
        const packDir = path.join(tempDir, 'my-pack');
        fs.mkdirSync(packDir);
        fs.writeFileSync(
            path.join(packDir, 'keys.pack.json'),
            JSON.stringify({
                id: 'my-pack',
                name: 'My Pack',
                version: '1.0.0',
                description: 'Pack with zeo action',
                tags: [],
                actions: [
                    {
                        name: 'zeo-action',
                        kind: 'zeo',
                        promptFile: 'prompts/test.md',
                    },
                ],
            })
        );

        runKeys('add', packDir);
        const result = runKeys('run', 'my-pack', 'zeo-action');

        // Should exit with code 2 (ZEO missing) and provide help
        expect(result.code).toBe(2);
        expect(result.stderr).toContain('ZEO');
        expect(result.stderr).toContain('install');
    });

    it('should output JSON format when requested', () => {
        runKeys('init');

        // Create and add pack
        const packDir = path.join(tempDir, 'my-pack');
        fs.mkdirSync(packDir);
        fs.writeFileSync(
            path.join(packDir, 'keys.pack.json'),
            JSON.stringify({
                id: 'my-pack',
                name: 'My Pack',
                version: '1.0.0',
                description: 'JSON test pack',
                tags: [],
                actions: [],
            })
        );

        runKeys('add', packDir);

        // List with JSON
        let result = runKeys('list', '--json');
        expect(result.code).toBe(0);
        const list = JSON.parse(result.stdout);
        expect(Array.isArray(list)).toBe(true);
        expect(list[0].id).toBe('my-pack');

        // Show with JSON
        result = runKeys('show', 'my-pack', '--json');
        expect(result.code).toBe(0);
        const show = JSON.parse(result.stdout);
        expect(show.entry.id).toBe('my-pack');

        // Doctor with JSON
        result = runKeys('doctor', '--json');
        expect(result.code).toBe(0);
        const doctor = JSON.parse(result.stdout);
        expect(doctor.checks).toBeDefined();
        expect(doctor.summary).toBeDefined();
    });

    it('should reject invalid manifest', () => {
        runKeys('init');

        // Create pack with invalid manifest
        const packDir = path.join(tempDir, 'bad-pack');
        fs.mkdirSync(packDir);
        fs.writeFileSync(
            path.join(packDir, 'keys.pack.json'),
            JSON.stringify({
                id: 'Invalid ID Spaces',
                name: 'Bad Pack',
                version: 'not-semver',
                // missing description
                tags: [],
                actions: [],
            })
        );

        const result = runKeys('add', packDir);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain('Error');
    });

    it('complete smoke test flow', () => {
        // Full flow: init -> add -> list -> search -> show -> export -> doctor

        // 1. Init
        let result = runKeys('init');
        expect(result.code).toBe(0);

        // 2. Create and add pack
        const packDir = path.join(tempDir, 'full-test-pack');
        fs.mkdirSync(packDir);
        fs.mkdirSync(path.join(packDir, 'assets'));
        fs.mkdirSync(path.join(packDir, 'actions'));
        fs.writeFileSync(
            path.join(packDir, 'keys.pack.json'),
            JSON.stringify({
                id: 'full-test-pack',
                name: 'Full Test Pack',
                version: '2.1.0',
                description: 'Complete smoke test pack',
                tags: ['smoke', 'full', 'test'],
                actions: [
                    {
                        name: 'hello',
                        kind: 'shell',
                        command: 'echo',
                        args: ['Complete test!'],
                    },
                    {
                        name: 'doc',
                        kind: 'doc',
                        description: 'Show documentation',
                    },
                ],
                author: 'Smoke Test',
                license: 'MIT',
            })
        );
        fs.writeFileSync(path.join(packDir, 'README.md'), '# Full Test Pack\n\nComplete smoke test.');
        fs.writeFileSync(path.join(packDir, 'assets', 'data.json'), '{}');
        fs.writeFileSync(path.join(packDir, 'actions', 'hello.sh'), 'echo "Hello"');

        result = runKeys('add', packDir);
        expect(result.code).toBe(0);

        // 3. List
        result = runKeys('list');
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('full-test-pack');

        // 4. Search
        result = runKeys('search', 'smoke');
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('full-test-pack');

        // 5. Show
        result = runKeys('show', 'full-test-pack');
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('2.1.0');

        // 6. Export
        result = runKeys('export', 'full-test-pack');
        expect(result.code).toBe(0);

        // Verify export manifest
        const exportManifest = JSON.parse(
            fs.readFileSync(
                path.join(tempDir, 'dist', 'keys', 'full-test-pack', 'manifest.json'),
                'utf-8'
            )
        );
        expect(exportManifest.id).toBe('full-test-pack');
        expect(exportManifest.version).toBe('2.1.0');
        expect(exportManifest.archiveHash).toBeDefined();

        // 7. Run shell action
        result = runKeys('run', 'full-test-pack', 'hello');
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('Complete test!');

        // 8. Doctor
        result = runKeys('doctor');
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('✓');
    });
});
