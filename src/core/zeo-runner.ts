/**
 * ZEO Runner Implementation
 * Delegates execution to ZEO CLI with configurable templates
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import type { Runner, RunResult, PackAction, ZeoConfig } from './contracts';

/**
 * Exit code for missing ZEO
 */
export const ZEO_MISSING_EXIT_CODE = 2;

/**
 * Find ZEO executable on PATH or at configured location
 */
function findZeo(configPath?: string): string | null {
    // Check configured path first
    if (configPath) {
        if (fs.existsSync(configPath)) {
            return configPath;
        }
    }

    // Check PATH using 'where' on Windows or 'which' on Unix
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'where' : 'which';

    try {
        const result = spawnSync(command, ['zeo'], {
            encoding: 'utf-8',
            shell: true,
            timeout: 5000,
        });

        if (result.status === 0 && result.stdout.trim()) {
            return result.stdout.trim().split('\n')[0];
        }
    } catch {
        // Ignore errors
    }

    return null;
}

/**
 * Get ZEO version
 */
function getZeoVersion(zeoPath: string): string | null {
    try {
        const result = spawnSync(zeoPath, ['--version'], {
            encoding: 'utf-8',
            timeout: 5000,
        });

        if (result.status === 0) {
            return result.stdout.trim() || result.stderr.trim();
        }
    } catch {
        // Ignore errors
    }

    return null;
}

export class ZeoRunner implements Runner {
    private zeoPath: string | null = null;
    private config: ZeoConfig;

    constructor(config?: ZeoConfig) {
        this.config = config ?? {
            enabled: true,
            commandTemplate: 'zeo run --pack "{packPath}" --action "{actionName}"',
        };
    }

    async isAvailable(): Promise<boolean> {
        if (!this.config.enabled) {
            return false;
        }

        this.zeoPath = findZeo(this.config.path);
        return this.zeoPath !== null;
    }

    async getInfo(): Promise<{
        name: string;
        available: boolean;
        version?: string;
        path?: string;
        message?: string;
    }> {
        const available = await this.isAvailable();

        if (!this.config.enabled) {
            return {
                name: 'ZEO Runner',
                available: false,
                message: 'ZEO integration is disabled in config',
            };
        }

        if (!available) {
            return {
                name: 'ZEO Runner',
                available: false,
                message: 'ZEO not found. Install ZEO or configure zeo.path in .keys/config.json',
            };
        }

        const version = this.zeoPath ? getZeoVersion(this.zeoPath) : undefined;

        return {
            name: 'ZEO Runner',
            available: true,
            version: version ?? undefined,
            path: this.zeoPath ?? undefined,
        };
    }

    async run(
        packPath: string,
        action: PackAction,
        options?: {
            cwd?: string;
            env?: Record<string, string>;
            stream?: boolean;
        }
    ): Promise<RunResult> {
        const startTime = Date.now();
        const cwd = options?.cwd ?? action.cwd ?? packPath;

        // Handle shell actions directly
        if (action.kind === 'shell') {
            return this.runShell(action, cwd, options?.env);
        }

        // Handle doc actions (just print info)
        if (action.kind === 'doc') {
            const docPath = action.promptFile
                ? path.join(packPath, action.promptFile)
                : null;

            let docContent = '';
            if (docPath && fs.existsSync(docPath)) {
                docContent = fs.readFileSync(docPath, 'utf-8');
            }

            return {
                success: true,
                exitCode: 0,
                stdout: `Documentation for action "${action.name}":\n\n${docContent || 'No documentation available.'}`,
                stderr: '',
                duration: Date.now() - startTime,
            };
        }

        // Handle ZEO actions
        if (action.kind === 'zeo') {
            const available = await this.isAvailable();

            if (!available) {
                return {
                    success: false,
                    exitCode: ZEO_MISSING_EXIT_CODE,
                    stdout: '',
                    stderr: `ZEO not found. To run ZEO actions:\n\n1. Install ZEO: https://zeo.dev/install\n2. Or configure zeo.path in .keys/config.json\n3. Or run this action with kind="shell" instead`,
                    duration: Date.now() - startTime,
                };
            }

            return this.runZeo(packPath, action, cwd, options?.env, options?.stream);
        }

        return {
            success: false,
            exitCode: 1,
            stdout: '',
            stderr: `Unknown action kind: ${action.kind}`,
            duration: Date.now() - startTime,
        };
    }

    private async runShell(
        action: PackAction,
        cwd: string,
        env?: Record<string, string>
    ): Promise<RunResult> {
        const startTime = Date.now();

        if (!action.command) {
            return {
                success: false,
                exitCode: 1,
                stdout: '',
                stderr: 'Shell action requires a command',
                duration: Date.now() - startTime,
            };
        }

        return new Promise((resolve) => {
            const args = action.args ?? [];
            const proc = spawn(action.command!, args, {
                cwd,
                env: { ...process.env, ...env },
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
                process.stdout.write(data);
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
                process.stderr.write(data);
            });

            proc.on('close', (code) => {
                resolve({
                    success: code === 0,
                    exitCode: code ?? 1,
                    stdout,
                    stderr,
                    duration: Date.now() - startTime,
                });
            });

            proc.on('error', (error) => {
                resolve({
                    success: false,
                    exitCode: 1,
                    stdout,
                    stderr: stderr + '\n' + error.message,
                    duration: Date.now() - startTime,
                });
            });
        });
    }

    private async runZeo(
        packPath: string,
        action: PackAction,
        cwd: string,
        env?: Record<string, string>,
        stream?: boolean
    ): Promise<RunResult> {
        const startTime = Date.now();

        // Build command from template
        const template = this.config.commandTemplate;
        const command = template
            .replace('{packPath}', packPath)
            .replace('{actionName}', action.name);

        // Parse command into executable and args
        const parts = command.split(' ');
        const executable = parts[0];
        const args = parts.slice(1);

        return new Promise((resolve) => {
            const proc = spawn(executable, args, {
                cwd,
                env: { ...process.env, ...env },
                shell: true,
                stdio: stream ? ['inherit', 'inherit', 'inherit'] : ['pipe', 'pipe', 'pipe'],
            });

            let stdout = '';
            let stderr = '';

            if (!stream) {
                proc.stdout?.on('data', (data) => {
                    stdout += data.toString();
                    process.stdout.write(data);
                });

                proc.stderr?.on('data', (data) => {
                    stderr += data.toString();
                    process.stderr.write(data);
                });
            }

            proc.on('close', (code) => {
                resolve({
                    success: code === 0,
                    exitCode: code ?? 1,
                    stdout,
                    stderr,
                    duration: Date.now() - startTime,
                });
            });

            proc.on('error', (error) => {
                resolve({
                    success: false,
                    exitCode: 1,
                    stdout,
                    stderr: stderr + '\n' + error.message,
                    duration: Date.now() - startTime,
                });
            });
        });
    }
}
