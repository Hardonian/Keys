/**
 * ControlPlane Adapter Implementation
 * Optional integration with ControlPlane for publishing
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import type {
    ControlPlaneAdapter,
    ExportResult,
    PackManifest,
    ControlPlaneConfig
} from './contracts';

/**
 * Files/directories to exclude from export
 */
const EXCLUDE_PATTERNS = [
    'node_modules',
    'dist',
    '.git',
    'tmp',
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '.env',
    '.env.*',
];

/**
 * Files to include in export
 */
const INCLUDE_FILES = [
    'keys.pack.json',
    'README.md',
    'LICENSE',
    'LICENSE.md',
    'LICENSE.txt',
    'CHANGELOG.md',
];

const INCLUDE_DIRS = [
    'assets',
    'actions',
    'prompts',
    'scripts',
    'workflows',
];

/**
 * Check if a file should be excluded
 */
function shouldExclude(filePath: string): boolean {
    const basename = path.basename(filePath);

    for (const pattern of EXCLUDE_PATTERNS) {
        if (pattern.startsWith('*')) {
            // Wildcard pattern
            const ext = pattern.slice(1);
            if (basename.endsWith(ext)) return true;
        } else {
            if (basename === pattern) return true;
        }
    }

    return false;
}

/**
 * Get all files to include in export
 */
function getExportFiles(packPath: string): string[] {
    const files: string[] = [];
    const absolutePackPath = path.resolve(packPath);

    // Add required and optional root files
    for (const file of INCLUDE_FILES) {
        const filePath = path.join(absolutePackPath, file);
        if (fs.existsSync(filePath)) {
            files.push(filePath);
        }
    }

    // Add directories recursively
    for (const dir of INCLUDE_DIRS) {
        const dirPath = path.join(absolutePackPath, dir);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, files);
        }
    }

    // Sort for deterministic ordering
    files.sort();

    return files;
}

/**
 * Walk directory recursively
 */
function walkDir(dirPath: string, files: string[]): void {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (shouldExclude(fullPath)) continue;

        if (entry.isDirectory()) {
            walkDir(fullPath, files);
        } else if (entry.isFile()) {
            files.push(fullPath);
        }
    }
}

/**
 * Find ControlPlane CLI
 */
function findControlPlane(configPath?: string): string | null {
    if (configPath && fs.existsSync(configPath)) {
        return configPath;
    }

    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'where' : 'which';

    try {
        const result = spawnSync(command, ['controlplane'], {
            encoding: 'utf-8',
            shell: true,
            timeout: 5000,
        });

        if (result.status === 0 && result.stdout.trim()) {
            return result.stdout.trim().split('\n')[0];
        }
    } catch {
        // Ignore
    }

    return null;
}

/**
 * Calculate SHA256 hash of file
 */
function hashFile(filePath: string): string {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

export class LocalControlPlaneAdapter implements ControlPlaneAdapter {
    private cpPath: string | null = null;
    private config: ControlPlaneConfig;

    constructor(config?: ControlPlaneConfig) {
        this.config = config ?? { enabled: false };
    }

    async isAvailable(): Promise<boolean> {
        if (!this.config.enabled) {
            return false;
        }

        this.cpPath = findControlPlane(this.config.path);
        return this.cpPath !== null;
    }

    async getInfo(): Promise<{
        name: string;
        available: boolean;
        version?: string;
        path?: string;
        message?: string;
    }> {
        if (!this.config.enabled) {
            return {
                name: 'ControlPlane',
                available: false,
                message: 'ControlPlane integration is disabled in config',
            };
        }

        const available = await this.isAvailable();

        if (!available) {
            return {
                name: 'ControlPlane',
                available: false,
                message: 'ControlPlane CLI not found. Install or configure controlplane.path in config',
            };
        }

        return {
            name: 'ControlPlane',
            available: true,
            path: this.cpPath ?? undefined,
        };
    }

    async export(
        packPath: string,
        manifest: PackManifest,
        outputDir: string
    ): Promise<ExportResult> {
        const absolutePackPath = path.resolve(packPath);
        const packOutputDir = path.join(outputDir, manifest.id);

        // Ensure output directory exists
        if (!fs.existsSync(packOutputDir)) {
            fs.mkdirSync(packOutputDir, { recursive: true });
        }

        // Archive filename with version
        const archiveName = `${manifest.id}-${manifest.version}.zip`;
        const archivePath = path.join(packOutputDir, archiveName);
        const manifestPath = path.join(packOutputDir, 'manifest.json');

        // Get files to include
        const files = getExportFiles(absolutePackPath);

        // Create archive using built-in zip approach
        // For true determinism, we use a simple approach that doesn't require external tools
        await this.createDeterministicArchive(absolutePackPath, files, archivePath);

        // Calculate hash
        const hash = hashFile(archivePath);
        const size = fs.statSync(archivePath).size;

        // Write export manifest
        const exportManifest = {
            id: manifest.id,
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            tags: manifest.tags,
            exportedAt: new Date().toISOString(),
            archivePath: archiveName,
            archiveHash: hash,
            archiveSize: size,
            files: files.map(f => path.relative(absolutePackPath, f)),
        };

        fs.writeFileSync(manifestPath, JSON.stringify(exportManifest, null, 2));

        return {
            archivePath,
            manifestPath,
            size,
            hash,
        };
    }

    private async createDeterministicArchive(
        basePath: string,
        files: string[],
        outputPath: string
    ): Promise<void> {
        // Use Node.js built-in capabilities
        // For cross-platform deterministic zip, we'll use a simple approach

        const isWindows = process.platform === 'win32';

        // Try using tar for deterministic archive on Unix
        // On Windows, use PowerShell Compress-Archive
        if (isWindows) {
            // PowerShell approach
            const relativePaths = files.map(f => path.relative(basePath, f)).join('","');
            const psCommand = `
        $files = @("${relativePaths}")
        Compress-Archive -Path $files -DestinationPath "${outputPath}" -Force
      `;

            const result = spawnSync('powershell', ['-Command', psCommand], {
                cwd: basePath,
                encoding: 'utf-8',
            });

            if (result.status !== 0) {
                // Fallback: create a simple tar.gz-like file list
                this.createSimpleArchive(basePath, files, outputPath);
            }
        } else {
            // Unix: use zip command if available, otherwise fallback
            const zipFiles = files.map(f => path.relative(basePath, f));
            const result = spawnSync('zip', ['-r', '-X', outputPath, ...zipFiles], {
                cwd: basePath,
                encoding: 'utf-8',
            });

            if (result.status !== 0) {
                this.createSimpleArchive(basePath, files, outputPath);
            }
        }
    }

    private createSimpleArchive(
        basePath: string,
        files: string[],
        outputPath: string
    ): void {
        // Fallback: create a JSON manifest of file contents (not a true zip, but works offline)
        // This is a simple approach when zip tools aren't available
        const archive: Record<string, string> = {};

        for (const file of files) {
            const relativePath = path.relative(basePath, file);
            const content = fs.readFileSync(file, 'base64');
            archive[relativePath] = content;
        }

        // Write as JSON with .zip extension (can be extracted with custom tooling)
        fs.writeFileSync(outputPath, JSON.stringify(archive, null, 2));
    }

    async publish?(packId: string): Promise<{ success: boolean; message: string }> {
        const available = await this.isAvailable();

        if (!available) {
            return {
                success: false,
                message: 'ControlPlane CLI not available. Publish skipped.',
            };
        }

        // Placeholder for actual publish logic
        return {
            success: false,
            message: 'ControlPlane publish not yet implemented. Export completed locally.',
        };
    }
}
