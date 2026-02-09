/**
 * Pack Store Implementation
 * Local-first pack registry management
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
    PackStore,
    Registry,
    RegistryEntry,
    PackManifest
} from './contracts';
import {
    RegistrySchema,
    PackManifestSchema,
    validatePackManifest
} from './contracts';
import type { WorkspacePaths } from './workspace';

const MANIFEST_FILENAME = 'keys.pack.json';

export class LocalPackStore implements PackStore {
    constructor(private workspace: WorkspacePaths) { }

    getRegistryPath(): string {
        return this.workspace.registry;
    }

    async loadRegistry(): Promise<Registry> {
        const registryPath = this.getRegistryPath();

        if (!fs.existsSync(registryPath)) {
            return RegistrySchema.parse({ version: '1.0.0', entries: [] });
        }

        try {
            const raw = fs.readFileSync(registryPath, 'utf-8');
            const data = JSON.parse(raw);
            return RegistrySchema.parse(data);
        } catch (error) {
            // Return empty registry on error
            return RegistrySchema.parse({ version: '1.0.0', entries: [] });
        }
    }

    async saveRegistry(registry: Registry): Promise<void> {
        const registryPath = this.getRegistryPath();
        const dir = path.dirname(registryPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    }

    async loadPackManifest(packPath: string): Promise<PackManifest> {
        const manifestPath = path.join(packPath, MANIFEST_FILENAME);

        if (!fs.existsSync(manifestPath)) {
            throw new Error(`Pack manifest not found: ${manifestPath}\nExpected file: ${MANIFEST_FILENAME}`);
        }

        const raw = fs.readFileSync(manifestPath, 'utf-8');
        let data: unknown;

        try {
            data = JSON.parse(raw);
        } catch (error) {
            throw new Error(`Invalid JSON in pack manifest: ${manifestPath}`);
        }

        const validation = validatePackManifest(data);
        if (!validation.valid) {
            const errorMessages = validation.errors.map(e => `  - ${e.path}: ${e.message}`).join('\n');
            throw new Error(`Invalid pack manifest at ${manifestPath}:\n${errorMessages}`);
        }

        return PackManifestSchema.parse(data);
    }

    async addPack(packPath: string, source: 'local' | 'git' = 'local'): Promise<RegistryEntry> {
        const absolutePath = path.resolve(packPath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Pack path does not exist: ${absolutePath}`);
        }

        if (!fs.statSync(absolutePath).isDirectory()) {
            throw new Error(`Pack path must be a directory: ${absolutePath}`);
        }

        const manifest = await this.loadPackManifest(absolutePath);
        const registry = await this.loadRegistry();

        // Check for existing entry
        const existingIndex = registry.entries.findIndex(e => e.id === manifest.id);
        const now = new Date().toISOString();

        const entry: RegistryEntry = {
            id: manifest.id,
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            tags: manifest.tags,
            path: absolutePath,
            addedAt: existingIndex >= 0 ? registry.entries[existingIndex].addedAt : now,
            updatedAt: now,
            source,
        };

        if (existingIndex >= 0) {
            registry.entries[existingIndex] = entry;
        } else {
            registry.entries.push(entry);
        }

        await this.saveRegistry(registry);
        return entry;
    }

    async removePack(packId: string): Promise<boolean> {
        const registry = await this.loadRegistry();
        const initialLength = registry.entries.length;

        registry.entries = registry.entries.filter(e => e.id !== packId);

        if (registry.entries.length < initialLength) {
            await this.saveRegistry(registry);
            return true;
        }

        return false;
    }

    async getPack(packId: string): Promise<RegistryEntry | null> {
        const registry = await this.loadRegistry();
        return registry.entries.find(e => e.id === packId) ?? null;
    }

    async listPacks(): Promise<RegistryEntry[]> {
        const registry = await this.loadRegistry();
        return registry.entries;
    }
}

/**
 * Create a sample pack for testing
 */
export function createSamplePack(targetPath: string): void {
    const packDir = path.resolve(targetPath);

    if (!fs.existsSync(packDir)) {
        fs.mkdirSync(packDir, { recursive: true });
    }

    const manifest: PackManifest = {
        id: 'sample-pack',
        name: 'Sample Pack',
        version: '1.0.0',
        description: 'A sample pack for testing Keys CLI',
        tags: ['sample', 'test'],
        entrypoints: {
            prompts: [],
            scripts: [],
            workflows: [],
        },
        actions: [
            {
                name: 'hello',
                kind: 'shell',
                command: 'echo',
                args: ['Hello from Keys!'],
                description: 'Print a greeting',
            },
            {
                name: 'greet',
                kind: 'zeo',
                promptFile: 'prompts/greet.md',
                description: 'Interactive greeting with ZEO',
            },
        ],
        author: 'Keys Team',
        license: 'MIT',
    };

    fs.writeFileSync(
        path.join(packDir, MANIFEST_FILENAME),
        JSON.stringify(manifest, null, 2)
    );

    fs.writeFileSync(
        path.join(packDir, 'README.md'),
        `# ${manifest.name}\n\n${manifest.description}\n\n## Usage\n\n\`\`\`bash\nkeys run ${manifest.id} hello\n\`\`\`\n`
    );

    // Create actions directory
    const actionsDir = path.join(packDir, 'actions');
    if (!fs.existsSync(actionsDir)) {
        fs.mkdirSync(actionsDir, { recursive: true });
    }

    // Create prompts directory
    const promptsDir = path.join(packDir, 'prompts');
    if (!fs.existsSync(promptsDir)) {
        fs.mkdirSync(promptsDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(promptsDir, 'greet.md'),
        '# Greeting Prompt\n\nProvide a friendly greeting to the user.\n'
    );
}
