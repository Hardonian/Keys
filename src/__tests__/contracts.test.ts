/**
 * Unit Tests for Keys Core
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
    validatePackManifest,
    validateRegistry,
    validateConfig,
    PackManifestSchema,
    RegistrySchema,
    KeysConfigSchema,
    type PackManifest,
    type Registry,
} from '../core/contracts';

describe('Manifest Validation', () => {
    it('should validate a minimal valid manifest', () => {
        const manifest = {
            id: 'test-pack',
            name: 'Test Pack',
            version: '1.0.0',
            description: 'A test pack',
            tags: [],
            actions: [],
        };

        const result = validatePackManifest(manifest);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should validate a full manifest with actions', () => {
        const manifest: PackManifest = {
            id: 'full-pack',
            name: 'Full Pack',
            version: '1.2.3',
            description: 'A fully-featured pack',
            tags: ['test', 'example'],
            entrypoints: {
                prompts: ['prompts/main.md'],
                scripts: ['scripts/run.ts'],
                workflows: [],
            },
            actions: [
                {
                    name: 'hello',
                    kind: 'shell',
                    command: 'echo',
                    args: ['Hello'],
                    description: 'Say hello',
                },
                {
                    name: 'greet',
                    kind: 'zeo',
                    promptFile: 'prompts/greet.md',
                },
            ],
            author: 'Test Author',
            license: 'MIT',
        };

        const result = validatePackManifest(manifest);
        expect(result.valid).toBe(true);
    });

    it('should reject manifest with invalid ID', () => {
        const manifest = {
            id: 'Invalid ID With Spaces',
            name: 'Test',
            version: '1.0.0',
            description: 'Test',
            tags: [],
            actions: [],
        };

        const result = validatePackManifest(manifest);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.path === 'id')).toBe(true);
    });

    it('should reject manifest with invalid version', () => {
        const manifest = {
            id: 'test-pack',
            name: 'Test',
            version: 'not-semver',
            description: 'Test',
            tags: [],
            actions: [],
        };

        const result = validatePackManifest(manifest);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.path === 'version')).toBe(true);
    });

    it('should reject manifest with missing required fields', () => {
        const manifest = {
            id: 'test-pack',
            // missing name, version, description
        };

        const result = validatePackManifest(manifest);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject action with invalid kind', () => {
        const manifest = {
            id: 'test-pack',
            name: 'Test',
            version: '1.0.0',
            description: 'Test',
            tags: [],
            actions: [
                {
                    name: 'bad-action',
                    kind: 'invalid-kind',
                },
            ],
        };

        const result = validatePackManifest(manifest);
        expect(result.valid).toBe(false);
    });
});

describe('Registry Validation', () => {
    it('should validate an empty registry', () => {
        const registry = {
            version: '1.0.0',
            entries: [],
        };

        const result = validateRegistry(registry);
        expect(result.valid).toBe(true);
    });

    it('should validate registry with entries', () => {
        const registry: Registry = {
            version: '1.0.0',
            entries: [
                {
                    id: 'pack-1',
                    name: 'Pack 1',
                    version: '1.0.0',
                    description: 'First pack',
                    tags: ['test'],
                    path: '/path/to/pack',
                    addedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    source: 'local',
                },
            ],
        };

        const result = validateRegistry(registry);
        expect(result.valid).toBe(true);
    });
});

describe('Config Validation', () => {
    it('should validate minimal config', () => {
        const config = {
            version: '1.0.0',
            workspaceMode: 'project',
        };

        const result = validateConfig(config);
        expect(result.valid).toBe(true);
    });

    it('should validate full config', () => {
        const config = {
            version: '1.0.0',
            workspaceMode: 'user',
            zeo: {
                enabled: true,
                commandTemplate: 'zeo run --pack "{packPath}" --action "{actionName}"',
                path: '/usr/local/bin/zeo',
            },
            controlplane: {
                enabled: false,
            },
            outputDir: 'dist/keys',
        };

        const result = validateConfig(config);
        expect(result.valid).toBe(true);
    });

    it('should apply defaults', () => {
        const parsed = KeysConfigSchema.parse({});
        expect(parsed.version).toBe('1.0.0');
        expect(parsed.workspaceMode).toBe('project');
        expect(parsed.outputDir).toBe('dist/keys');
    });
});

describe('Schema Defaults', () => {
    it('should apply manifest defaults', () => {
        const minimal = {
            id: 'test',
            name: 'Test',
            version: '1.0.0',
            description: 'Test',
        };

        const parsed = PackManifestSchema.parse(minimal);
        expect(parsed.tags).toEqual([]);
        expect(parsed.actions).toEqual([]);
    });

    it('should apply registry defaults', () => {
        const parsed = RegistrySchema.parse({});
        expect(parsed.version).toBe('1.0.0');
        expect(parsed.entries).toEqual([]);
    });
});
