/**
 * Workspace Detection and Configuration
 * Determines project vs user mode and resolves paths
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { KeysConfig } from './contracts';
import { KeysConfigSchema } from './contracts';

const KEYS_DIR = '.keys';
const CONFIG_FILE = 'config.json';
const REGISTRY_FILE = 'registry.json';
const INDEX_FILE = 'index.json';

export type WorkspaceMode = 'project' | 'user';

export interface WorkspacePaths {
    root: string;
    config: string;
    registry: string;
    index: string;
    mode: WorkspaceMode;
}

/**
 * Find project root by traversing up to find .keys or .git
 */
function findProjectRoot(startDir: string = process.cwd()): string | null {
    let current = path.resolve(startDir);
    const root = path.parse(current).root;

    while (current !== root) {
        const keysDir = path.join(current, KEYS_DIR);
        if (fs.existsSync(keysDir) && fs.statSync(keysDir).isDirectory()) {
            return current;
        }

        // Also check for .git as project root indicator
        const gitDir = path.join(current, '.git');
        if (fs.existsSync(gitDir)) {
            // If .git exists, this is the project root even if .keys doesn't exist yet
            return current;
        }

        current = path.dirname(current);
    }

    return null;
}

/**
 * Get user-level Keys directory (~/.keys)
 */
function getUserKeysDir(): string {
    return path.join(os.homedir(), KEYS_DIR);
}

/**
 * Detect workspace mode and get paths
 */
export function detectWorkspace(cwd: string = process.cwd()): WorkspacePaths {
    const projectRoot = findProjectRoot(cwd);

    if (projectRoot) {
        const keysRoot = path.join(projectRoot, KEYS_DIR);
        return {
            root: keysRoot,
            config: path.join(keysRoot, CONFIG_FILE),
            registry: path.join(keysRoot, REGISTRY_FILE),
            index: path.join(keysRoot, INDEX_FILE),
            mode: 'project',
        };
    }

    // Fall back to user mode
    const userRoot = getUserKeysDir();
    return {
        root: userRoot,
        config: path.join(userRoot, CONFIG_FILE),
        registry: path.join(userRoot, REGISTRY_FILE),
        index: path.join(userRoot, INDEX_FILE),
        mode: 'user',
    };
}

/**
 * Ensure workspace directory exists
 */
export function ensureWorkspace(workspace: WorkspacePaths): void {
    if (!fs.existsSync(workspace.root)) {
        fs.mkdirSync(workspace.root, { recursive: true });
    }
}

/**
 * Check if workspace is initialized
 */
export function isWorkspaceInitialized(workspace: WorkspacePaths): boolean {
    return fs.existsSync(workspace.config);
}

/**
 * Load configuration from workspace
 */
export function loadConfig(workspace: WorkspacePaths): KeysConfig {
    if (!fs.existsSync(workspace.config)) {
        return KeysConfigSchema.parse({
            version: '1.0.0',
            workspaceMode: workspace.mode,
        });
    }

    try {
        const raw = fs.readFileSync(workspace.config, 'utf-8');
        const data = JSON.parse(raw);
        return KeysConfigSchema.parse(data);
    } catch (_error) {
        // Return defaults on parse error
        return KeysConfigSchema.parse({
            version: '1.0.0',
            workspaceMode: workspace.mode,
        });
    }
}

/**
 * Save configuration to workspace
 */
export function saveConfig(workspace: WorkspacePaths, config: KeysConfig): void {
    ensureWorkspace(workspace);
    fs.writeFileSync(workspace.config, JSON.stringify(config, null, 2));
}

/**
 * Initialize a new workspace
 */
export function initWorkspace(workspace: WorkspacePaths, options?: Partial<KeysConfig>): KeysConfig {
    ensureWorkspace(workspace);

    const config = KeysConfigSchema.parse({
        version: '1.0.0',
        workspaceMode: workspace.mode,
        zeo: {
            enabled: true,
            commandTemplate: 'zeo run --pack "{packPath}" --action "{actionName}"',
        },
        controlplane: {
            enabled: false,
        },
        outputDir: 'dist/keys',
        ...options,
    });

    saveConfig(workspace, config);

    // Initialize empty registry
    const registryPath = workspace.registry;
    if (!fs.existsSync(registryPath)) {
        fs.writeFileSync(registryPath, JSON.stringify({
            version: '1.0.0',
            entries: [],
        }, null, 2));
    }

    // Initialize empty index
    const indexPath = workspace.index;
    if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, JSON.stringify({
            version: '1.0.0',
            updatedAt: new Date().toISOString(),
            entries: [],
            invertedIndex: {},
        }, null, 2));
    }

    return config;
}

/**
 * Get the project root from workspace
 */
export function getProjectRoot(workspace: WorkspacePaths): string {
    if (workspace.mode === 'project') {
        return path.dirname(workspace.root);
    }
    return process.cwd();
}
