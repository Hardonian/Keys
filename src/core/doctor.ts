/**
 * Doctor Command Implementation
 * Environment and integration checks with clear status output
 */

import * as fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import type { DoctorCheck, DoctorResult, KeysConfig } from './contracts';
import type { WorkspacePaths } from './workspace';
import { ZeoRunner } from './zeo-runner';
import { LocalControlPlaneAdapter } from './controlplane-adapter';

/**
 * Check if a command exists on PATH
 */
function commandExists(command: string): { exists: boolean; path?: string; version?: string } {
    const isWindows = process.platform === 'win32';
    const whichCommand = isWindows ? 'where' : 'which';

    try {
        const result = spawnSync(whichCommand, [command], {
            encoding: 'utf-8',
            shell: true,
            timeout: 5000,
        });

        if (result.status === 0 && result.stdout.trim()) {
            const cmdPath = result.stdout.trim().split('\n')[0];

            // Try to get version
            try {
                const versionResult = spawnSync(command, ['--version'], {
                    encoding: 'utf-8',
                    timeout: 5000,
                });
                const version = versionResult.stdout?.trim() || versionResult.stderr?.trim();
                return { exists: true, path: cmdPath, version };
            } catch {
                return { exists: true, path: cmdPath };
            }
        }
    } catch {
        // Ignore
    }

    return { exists: false };
}

/**
 * Run all doctor checks
 */
export async function runDoctorChecks(
    workspace: WorkspacePaths,
    config: KeysConfig
): Promise<DoctorResult> {
    const checks: DoctorCheck[] = [];

    // Check 1: Workspace configuration
    checks.push(checkWorkspace(workspace));

    // Check 2: Node.js version
    checks.push(checkNode());

    // Check 3: ZEO availability
    checks.push(await checkZeo(config));

    // Check 4: ControlPlane availability
    checks.push(await checkControlPlane(config));

    // Check 5: Git availability
    checks.push(checkGit());

    // Check 6: Registry integrity
    checks.push(await checkRegistry(workspace));

    // Check 7: Index integrity
    checks.push(await checkIndex(workspace));

    // Compute summary
    const summary = {
        total: checks.length,
        ok: checks.filter(c => c.status === 'ok').length,
        warn: checks.filter(c => c.status === 'warn').length,
        fail: checks.filter(c => c.status === 'fail').length,
    };

    return {
        timestamp: new Date().toISOString(),
        checks,
        summary,
    };
}

function checkWorkspace(workspace: WorkspacePaths): DoctorCheck {
    if (!fs.existsSync(workspace.root)) {
        return {
            name: 'Workspace',
            status: 'fail',
            message: `Workspace not initialized at ${workspace.root}`,
            details: { path: workspace.root, mode: workspace.mode },
        };
    }

    if (!fs.existsSync(workspace.config)) {
        return {
            name: 'Workspace',
            status: 'warn',
            message: 'Workspace exists but config.json is missing. Run "keys init" to initialize.',
            details: { path: workspace.root, mode: workspace.mode },
        };
    }

    return {
        name: 'Workspace',
        status: 'ok',
        message: `Workspace configured in ${workspace.mode} mode`,
        details: { path: workspace.root, mode: workspace.mode },
    };
}

function checkNode(): DoctorCheck {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0], 10);

    if (major < 18) {
        return {
            name: 'Node.js',
            status: 'fail',
            message: `Node.js ${version} is too old. Version 18+ required.`,
            details: { version, required: '>=18.0.0' },
        };
    }

    if (major < 20) {
        return {
            name: 'Node.js',
            status: 'warn',
            message: `Node.js ${version} works but 20+ is recommended.`,
            details: { version, recommended: '>=20.0.0' },
        };
    }

    return {
        name: 'Node.js',
        status: 'ok',
        message: `Node.js ${version}`,
        details: { version },
    };
}

async function checkZeo(config: KeysConfig): Promise<DoctorCheck> {
    const runner = new ZeoRunner(config.zeo);
    const info = await runner.getInfo();

    if (!config.zeo?.enabled) {
        return {
            name: 'ZEO Runner',
            status: 'warn',
            message: 'ZEO integration is disabled in config',
            details: { enabled: false },
        };
    }

    if (!info.available) {
        return {
            name: 'ZEO Runner',
            status: 'warn',
            message: info.message ?? 'ZEO not found on PATH',
            details: { available: false },
        };
    }

    return {
        name: 'ZEO Runner',
        status: 'ok',
        message: info.version ? `ZEO ${info.version}` : 'ZEO available',
        details: { path: info.path, version: info.version },
    };
}

async function checkControlPlane(config: KeysConfig): Promise<DoctorCheck> {
    const adapter = new LocalControlPlaneAdapter(config.controlplane);
    const info = await adapter.getInfo();

    if (!config.controlplane?.enabled) {
        return {
            name: 'ControlPlane',
            status: 'ok',
            message: 'ControlPlane integration is disabled (optional)',
            details: { enabled: false },
        };
    }

    if (!info.available) {
        return {
            name: 'ControlPlane',
            status: 'warn',
            message: info.message ?? 'ControlPlane CLI not found',
            details: { available: false },
        };
    }

    return {
        name: 'ControlPlane',
        status: 'ok',
        message: 'ControlPlane available',
        details: { path: info.path },
    };
}

function checkGit(): DoctorCheck {
    const git = commandExists('git');

    if (!git.exists) {
        return {
            name: 'Git',
            status: 'warn',
            message: 'Git not found. Required for git-based pack sources.',
            details: { available: false },
        };
    }

    return {
        name: 'Git',
        status: 'ok',
        message: git.version ?? 'Git available',
        details: { path: git.path, version: git.version },
    };
}

async function checkRegistry(workspace: WorkspacePaths): Promise<DoctorCheck> {
    if (!fs.existsSync(workspace.registry)) {
        return {
            name: 'Registry',
            status: 'warn',
            message: 'Registry file not found. Run "keys init" to create.',
            details: { path: workspace.registry },
        };
    }

    try {
        const raw = fs.readFileSync(workspace.registry, 'utf-8');
        const data = JSON.parse(raw);

        if (!data.entries || !Array.isArray(data.entries)) {
            return {
                name: 'Registry',
                status: 'fail',
                message: 'Registry file is malformed (missing entries array)',
                details: { path: workspace.registry },
            };
        }

        return {
            name: 'Registry',
            status: 'ok',
            message: `Registry contains ${data.entries.length} pack(s)`,
            details: { path: workspace.registry, count: data.entries.length },
        };
    } catch (error) {
        return {
            name: 'Registry',
            status: 'fail',
            message: `Registry file is invalid JSON: ${error}`,
            details: { path: workspace.registry },
        };
    }
}

async function checkIndex(workspace: WorkspacePaths): Promise<DoctorCheck> {
    if (!fs.existsSync(workspace.index)) {
        return {
            name: 'Search Index',
            status: 'warn',
            message: 'Index file not found. Run "keys init" or add a pack to create.',
            details: { path: workspace.index },
        };
    }

    try {
        const raw = fs.readFileSync(workspace.index, 'utf-8');
        const data = JSON.parse(raw);

        if (!data.entries || !Array.isArray(data.entries)) {
            return {
                name: 'Search Index',
                status: 'fail',
                message: 'Index file is malformed (missing entries array)',
                details: { path: workspace.index },
            };
        }

        const termCount = Object.keys(data.invertedIndex ?? {}).length;

        return {
            name: 'Search Index',
            status: 'ok',
            message: `Index contains ${data.entries.length} pack(s), ${termCount} terms`,
            details: {
                path: workspace.index,
                packCount: data.entries.length,
                termCount,
            },
        };
    } catch (error) {
        return {
            name: 'Search Index',
            status: 'fail',
            message: `Index file is invalid JSON: ${error}`,
            details: { path: workspace.index },
        };
    }
}

/**
 * Format doctor result for console output
 */
export function formatDoctorResult(result: DoctorResult): string {
    const lines: string[] = [];

    lines.push('Keys Doctor Report');
    lines.push('==================');
    lines.push(`Timestamp: ${result.timestamp}`);
    lines.push('');

    for (const check of result.checks) {
        const icon = check.status === 'ok' ? '✓' : check.status === 'warn' ? '⚠' : '✗';
        const status = check.status.toUpperCase().padEnd(4);
        lines.push(`[${icon}] ${status} ${check.name}: ${check.message}`);
    }

    lines.push('');
    lines.push('Summary');
    lines.push('-------');
    lines.push(`Total: ${result.summary.total}, OK: ${result.summary.ok}, Warn: ${result.summary.warn}, Fail: ${result.summary.fail}`);

    if (result.summary.fail > 0) {
        lines.push('');
        lines.push('⚠️  Some checks failed. Please address the issues above.');
    } else if (result.summary.warn > 0) {
        lines.push('');
        lines.push('ℹ️  Some checks have warnings. Core functionality will work.');
    } else {
        lines.push('');
        lines.push('✅ All checks passed!');
    }

    return lines.join('\n');
}
