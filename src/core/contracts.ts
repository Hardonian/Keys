/**
 * Keys Core Contracts
 * Backendless, local-first type definitions for the Keys CLI
 */

import { z } from 'zod';

// =============================================================================
// Pack Manifest Schema (keys.pack.json)
// =============================================================================

export const PackActionSchema = z.object({
    name: z.string().min(1),
    kind: z.enum(['zeo', 'shell', 'doc']),
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    promptFile: z.string().optional(),
    cwd: z.string().optional(),
    description: z.string().optional(),
});

export type PackAction = z.infer<typeof PackActionSchema>;

export const PackEntrypointsSchema = z.object({
    prompts: z.array(z.string()).default([]),
    scripts: z.array(z.string()).default([]),
    workflows: z.array(z.string()).default([]),
});

export type PackEntrypoints = z.infer<typeof PackEntrypointsSchema>;

export const PackManifestSchema = z.object({
    id: z.string().min(1).regex(/^[a-z0-9._-]+$/, 'ID must be lowercase alphanumeric with dots, underscores, or hyphens'),
    name: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/, 'Version must be semver format'),
    description: z.string().min(1),
    tags: z.array(z.string()).default([]),
    entrypoints: PackEntrypointsSchema.optional(),
    actions: z.array(PackActionSchema).default([]),
    author: z.string().optional(),
    license: z.string().optional(),
    repository: z.string().optional(),
});

export type PackManifest = z.infer<typeof PackManifestSchema>;

// =============================================================================
// Registry Entry (stored in registry.json)
// =============================================================================

export const RegistryEntrySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    version: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    path: z.string(),
    addedAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    source: z.enum(['local', 'git']).default('local'),
});

export type RegistryEntry = z.infer<typeof RegistryEntrySchema>;

export const RegistrySchema = z.object({
    version: z.string().default('1.0.0'),
    entries: z.array(RegistryEntrySchema).default([]),
});

export type Registry = z.infer<typeof RegistrySchema>;

// =============================================================================
// Config Schema (.keys/config.json)
// =============================================================================

export const ZeoConfigSchema = z.object({
    enabled: z.boolean().default(true),
    commandTemplate: z.string().default('zeo run --pack "{packPath}" --action "{actionName}"'),
    path: z.string().optional(),
});

export type ZeoConfig = z.infer<typeof ZeoConfigSchema>;

export const ControlPlaneConfigSchema = z.object({
    enabled: z.boolean().default(false),
    path: z.string().optional(),
});

export type ControlPlaneConfig = z.infer<typeof ControlPlaneConfigSchema>;

export const KeysConfigSchema = z.object({
    version: z.string().default('1.0.0'),
    workspaceMode: z.enum(['project', 'user']).default('project'),
    zeo: ZeoConfigSchema.optional(),
    controlplane: ControlPlaneConfigSchema.optional(),
    outputDir: z.string().default('dist/keys'),
});

export type KeysConfig = z.infer<typeof KeysConfigSchema>;

// =============================================================================
// Search Index Schema
// =============================================================================

export const SearchIndexEntrySchema = z.object({
    id: z.string(),
    terms: z.array(z.string()),
});

export type SearchIndexEntry = z.infer<typeof SearchIndexEntrySchema>;

export const SearchIndexSchema = z.object({
    version: z.string().default('1.0.0'),
    updatedAt: z.string().datetime(),
    entries: z.array(SearchIndexEntrySchema).default([]),
    invertedIndex: z.record(z.string(), z.array(z.string())).default({}),
});

export type SearchIndex = z.infer<typeof SearchIndexSchema>;

// =============================================================================
// Store Interfaces
// =============================================================================

export interface PackStore {
    /** Get registry path */
    getRegistryPath(): string;

    /** Load registry from disk */
    loadRegistry(): Promise<Registry>;

    /** Save registry to disk */
    saveRegistry(registry: Registry): Promise<void>;

    /** Add a pack to the registry */
    addPack(packPath: string, source?: 'local' | 'git'): Promise<RegistryEntry>;

    /** Remove a pack from the registry */
    removePack(packId: string): Promise<boolean>;

    /** Get a pack by ID */
    getPack(packId: string): Promise<RegistryEntry | null>;

    /** List all packs */
    listPacks(): Promise<RegistryEntry[]>;

    /** Load pack manifest from path */
    loadPackManifest(packPath: string): Promise<PackManifest>;
}

export interface IndexStore {
    /** Get index path */
    getIndexPath(): string;

    /** Load search index */
    loadIndex(): Promise<SearchIndex>;

    /** Save search index */
    saveIndex(index: SearchIndex): Promise<void>;

    /** Rebuild the full index from registry */
    rebuildIndex(registry: Registry, loadManifest: (path: string) => Promise<PackManifest>): Promise<SearchIndex>;

    /** Search for packs matching query */
    search(query: string): Promise<SearchIndexEntry[]>;

    /** Add entry to index */
    indexPack(entry: RegistryEntry, manifest: PackManifest): Promise<void>;

    /** Remove entry from index */
    removeFromIndex(packId: string): Promise<void>;
}

// =============================================================================
// Runner Interface (ZEO)
// =============================================================================

export interface RunResult {
    success: boolean;
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
}

export interface Runner {
    /** Check if runner is available */
    isAvailable(): Promise<boolean>;

    /** Get runner info for diagnostics */
    getInfo(): Promise<{
        name: string;
        available: boolean;
        version?: string;
        path?: string;
        message?: string;
    }>;

    /** Run an action */
    run(packPath: string, action: PackAction, options?: {
        cwd?: string;
        env?: Record<string, string>;
        stream?: boolean;
    }): Promise<RunResult>;
}

// =============================================================================
// ControlPlane Adapter Interface
// =============================================================================

export interface ExportResult {
    archivePath: string;
    manifestPath: string;
    size: number;
    hash: string;
}

export interface ControlPlaneAdapter {
    /** Check if ControlPlane is available */
    isAvailable(): Promise<boolean>;

    /** Get adapter info for diagnostics */
    getInfo(): Promise<{
        name: string;
        available: boolean;
        version?: string;
        path?: string;
        message?: string;
    }>;

    /** Export pack for ControlPlane */
    export(packPath: string, manifest: PackManifest, outputDir: string): Promise<ExportResult>;

    /** Publish to ControlPlane (optional) */
    publish?(packId: string): Promise<{ success: boolean; message: string }>;
}

// =============================================================================
// Doctor Check Interface
// =============================================================================

export interface DoctorCheck {
    name: string;
    status: 'ok' | 'warn' | 'fail';
    message: string;
    details?: Record<string, unknown>;
}

export interface DoctorResult {
    timestamp: string;
    checks: DoctorCheck[];
    summary: {
        total: number;
        ok: number;
        warn: number;
        fail: number;
    };
}

// =============================================================================
// Validation Helpers
// =============================================================================

export interface ValidationError {
    path: string;
    message: string;
    code: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

export function validatePackManifest(data: unknown): ValidationResult {
    const result = PackManifestSchema.safeParse(data);
    if (result.success) {
        return { valid: true, errors: [] };
    }

    return {
        valid: false,
        errors: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
        })),
    };
}

export function validateRegistry(data: unknown): ValidationResult {
    const result = RegistrySchema.safeParse(data);
    if (result.success) {
        return { valid: true, errors: [] };
    }

    return {
        valid: false,
        errors: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
        })),
    };
}

export function validateConfig(data: unknown): ValidationResult {
    const result = KeysConfigSchema.safeParse(data);
    if (result.success) {
        return { valid: true, errors: [] };
    }

    return {
        valid: false,
        errors: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
        })),
    };
}
