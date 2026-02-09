#!/usr/bin/env node
/**
 * Keys CLI
 * Backendless, local-first pack management for Keys + ZEO + ControlPlane
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
    detectWorkspace,
    initWorkspace,
    loadConfig,
    isWorkspaceInitialized,
    getProjectRoot,
    LocalPackStore,
    LocalIndexStore,
    ZeoRunner,
    LocalControlPlaneAdapter,
    runDoctorChecks,
    formatDoctorResult,
    createSamplePack,
    ZEO_MISSING_EXIT_CODE,
    type PackManifest,
    type RegistryEntry,
} from '../core';

// =============================================================================
// CLI Argument Parsing
// =============================================================================

interface ParsedArgs {
    command: string;
    args: string[];
    flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
    const [, , command = 'help', ...rest] = argv;
    const args: string[] = [];
    const flags: Record<string, string | boolean> = {};

    for (let i = 0; i < rest.length; i++) {
        const arg = rest[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const nextArg = rest[i + 1];
            if (nextArg && !nextArg.startsWith('-')) {
                flags[key] = nextArg;
                i++;
            } else {
                flags[key] = true;
            }
        } else if (arg.startsWith('-')) {
            const key = arg.slice(1);
            flags[key] = true;
        } else {
            args.push(arg);
        }
    }

    return { command, args, flags };
}

// =============================================================================
// Output Helpers
// =============================================================================

function log(message: string): void {
    console.log(message);
}

function error(message: string): void {
    console.error(`Error: ${message}`);
}

function success(message: string): void {
    console.log(`✓ ${message}`);
}

function warn(message: string): void {
    console.log(`⚠ ${message}`);
}

function table(headers: string[], rows: string[][]): void {
    const widths = headers.map((h, i) =>
        Math.max(h.length, ...rows.map(r => (r[i] ?? '').length))
    );

    const headerLine = headers.map((h, i) => h.padEnd(widths[i])).join('  ');
    const separator = widths.map(w => '-'.repeat(w)).join('  ');

    log(headerLine);
    log(separator);

    for (const row of rows) {
        const rowLine = row.map((cell, i) => (cell ?? '').padEnd(widths[i])).join('  ');
        log(rowLine);
    }
}

// =============================================================================
// Commands
// =============================================================================

async function commandInit(args: string[], flags: Record<string, string | boolean>): Promise<number> {
    const workspace = detectWorkspace();

    if (isWorkspaceInitialized(workspace) && !flags.force) {
        warn(`Workspace already initialized at ${workspace.root}`);
        log('Use --force to reinitialize');
        return 0;
    }

    const config = initWorkspace(workspace, {
        workspaceMode: workspace.mode,
    });

    success(`Initialized Keys workspace at ${workspace.root}`);
    log(`Mode: ${workspace.mode}`);
    log('');
    log('Next steps:');
    log('  keys add <path>    Add a pack from a local path');
    log('  keys list          List registered packs');
    log('  keys doctor        Check environment');

    return 0;
}

async function commandAdd(args: string[], flags: Record<string, string | boolean>): Promise<number> {
    if (args.length === 0) {
        error('Usage: keys add <path>');
        log('');
        log('Add a pack from a local path:');
        log('  keys add ./my-pack');
        log('  keys add /absolute/path/to/pack');
        return 1;
    }

    const workspace = detectWorkspace();
    if (!isWorkspaceInitialized(workspace)) {
        error('Workspace not initialized. Run "keys init" first.');
        return 1;
    }

    const packPath = args[0];
    const source = (flags.git ? 'git' : 'local') as 'local' | 'git';

    const store = new LocalPackStore(workspace);
    const indexStore = new LocalIndexStore(workspace);

    try {
        const entry = await store.addPack(packPath, source);
        const manifest = await store.loadPackManifest(entry.path);

        // Update search index
        await indexStore.indexPack(entry, manifest);

        success(`Added pack: ${entry.id} (${entry.version})`);
        log(`Path: ${entry.path}`);
        log(`Tags: ${entry.tags.join(', ') || 'none'}`);

        if (manifest.actions.length > 0) {
            log('');
            log('Actions:');
            for (const action of manifest.actions) {
                log(`  - ${action.name} (${action.kind}): ${action.description ?? ''}`);
            }
        }

        return 0;
    } catch (err) {
        error(String(err));
        return 1;
    }
}

async function commandList(args: string[], flags: Record<string, string | boolean>): Promise<number> {
    const workspace = detectWorkspace();

    if (!isWorkspaceInitialized(workspace)) {
        error('Workspace not initialized. Run "keys init" first.');
        return 1;
    }

    const store = new LocalPackStore(workspace);
    const entries = await store.listPacks();

    if (entries.length === 0) {
        log('No packs registered.');
        log('');
        log('Add a pack:');
        log('  keys add <path>');
        return 0;
    }

    if (flags.json) {
        log(JSON.stringify(entries, null, 2));
        return 0;
    }

    table(
        ['ID', 'Version', 'Name', 'Tags'],
        entries.map(e => [e.id, e.version, e.name, e.tags.join(', ')])
    );

    return 0;
}

async function commandSearch(args: string[], flags: Record<string, string | boolean>): Promise<number> {
    if (args.length === 0) {
        error('Usage: keys search <query>');
        log('');
        log('Search for packs by name, tags, or description:');
        log('  keys search auth');
        log('  keys search "api client"');
        return 1;
    }

    const workspace = detectWorkspace();

    if (!isWorkspaceInitialized(workspace)) {
        error('Workspace not initialized. Run "keys init" first.');
        return 1;
    }

    const query = args.join(' ');
    const indexStore = new LocalIndexStore(workspace);
    const store = new LocalPackStore(workspace);

    const results = await indexStore.search(query);

    if (results.length === 0) {
        log(`No packs found matching "${query}"`);
        return 0;
    }

    // Get full entry info for each result
    const entries: RegistryEntry[] = [];
    for (const result of results) {
        const entry = await store.getPack(result.id);
        if (entry) entries.push(entry);
    }

    if (flags.json) {
        log(JSON.stringify(entries, null, 2));
        return 0;
    }

    log(`Found ${entries.length} pack(s) matching "${query}":`);
    log('');

    table(
        ['ID', 'Version', 'Description'],
        entries.map(e => [e.id, e.version, e.description.slice(0, 50)])
    );

    return 0;
}

async function commandShow(args: string[], flags: Record<string, string | boolean>): Promise<number> {
    if (args.length === 0) {
        error('Usage: keys show <id>');
        log('');
        log('Show details for a pack:');
        log('  keys show my-pack');
        return 1;
    }

    const workspace = detectWorkspace();

    if (!isWorkspaceInitialized(workspace)) {
        error('Workspace not initialized. Run "keys init" first.');
        return 1;
    }

    const packId = args[0];
    const store = new LocalPackStore(workspace);

    const entry = await store.getPack(packId);
    if (!entry) {
        error(`Pack not found: ${packId}`);
        return 1;
    }

    let manifest: PackManifest | null = null;
    try {
        manifest = await store.loadPackManifest(entry.path);
    } catch (err) {
        warn(`Could not load manifest: ${err}`);
    }

    if (flags.json) {
        log(JSON.stringify({ entry, manifest }, null, 2));
        return 0;
    }

    log(`Pack: ${entry.name}`);
    log('='.repeat(50));
    log(`ID:          ${entry.id}`);
    log(`Version:     ${entry.version}`);
    log(`Description: ${entry.description}`);
    log(`Path:        ${entry.path}`);
    log(`Source:      ${entry.source}`);
    log(`Tags:        ${entry.tags.join(', ') || 'none'}`);
    log(`Added:       ${entry.addedAt}`);
    log(`Updated:     ${entry.updatedAt}`);

    if (manifest) {
        if (manifest.author) log(`Author:      ${manifest.author}`);
        if (manifest.license) log(`License:     ${manifest.license}`);
        if (manifest.repository) log(`Repository:  ${manifest.repository}`);

        if (manifest.actions.length > 0) {
            log('');
            log('Actions:');
            for (const action of manifest.actions) {
                log(`  [${action.kind}] ${action.name}`);
                if (action.description) log(`        ${action.description}`);
                if (action.command) log(`        Command: ${action.command} ${action.args?.join(' ') ?? ''}`);
            }
        }

        if (manifest.entrypoints) {
            const hasEntrypoints =
                manifest.entrypoints.prompts.length > 0 ||
                manifest.entrypoints.scripts.length > 0 ||
                manifest.entrypoints.workflows.length > 0;

            if (hasEntrypoints) {
                log('');
                log('Entrypoints:');
                if (manifest.entrypoints.prompts.length > 0) {
                    log(`  Prompts:   ${manifest.entrypoints.prompts.join(', ')}`);
                }
                if (manifest.entrypoints.scripts.length > 0) {
                    log(`  Scripts:   ${manifest.entrypoints.scripts.join(', ')}`);
                }
                if (manifest.entrypoints.workflows.length > 0) {
                    log(`  Workflows: ${manifest.entrypoints.workflows.join(', ')}`);
                }
            }
        }
    }

    // Show README if exists
    const readmePath = path.join(entry.path, 'README.md');
    if (fs.existsSync(readmePath) && flags.readme) {
        log('');
        log('README:');
        log('-'.repeat(50));
        log(fs.readFileSync(readmePath, 'utf-8'));
    }

    return 0;
}

async function commandExport(args: string[], flags: Record<string, string | boolean>): Promise<number> {
    if (args.length === 0) {
        error('Usage: keys export <id>');
        log('');
        log('Export a pack to a distributable archive:');
        log('  keys export my-pack');
        log('  keys export my-pack --output ./exports');
        return 1;
    }

    const workspace = detectWorkspace();

    if (!isWorkspaceInitialized(workspace)) {
        error('Workspace not initialized. Run "keys init" first.');
        return 1;
    }

    const packId = args[0];
    const store = new LocalPackStore(workspace);
    const config = loadConfig(workspace);

    const entry = await store.getPack(packId);
    if (!entry) {
        error(`Pack not found: ${packId}`);
        return 1;
    }

    let manifest: PackManifest;
    try {
        manifest = await store.loadPackManifest(entry.path);
    } catch (err) {
        error(`Could not load manifest: ${err}`);
        return 1;
    }

    const outputDir = (flags.output as string) || path.join(getProjectRoot(workspace), config.outputDir);
    const adapter = new LocalControlPlaneAdapter(config.controlplane);

    try {
        const result = await adapter.export(entry.path, manifest, outputDir);

        success(`Exported pack: ${packId}`);
        log(`Archive:  ${result.archivePath}`);
        log(`Manifest: ${result.manifestPath}`);
        log(`Size:     ${(result.size / 1024).toFixed(2)} KB`);
        log(`Hash:     ${result.hash.slice(0, 16)}...`);

        return 0;
    } catch (err) {
        error(`Export failed: ${err}`);
        return 1;
    }
}

async function commandRun(args: string[], flags: Record<string, string | boolean>): Promise<number> {
    if (args.length === 0) {
        error('Usage: keys run <id> [action]');
        log('');
        log('Run a pack action:');
        log('  keys run my-pack hello');
        log('  keys run my-pack         (runs default action)');
        return 1;
    }

    const workspace = detectWorkspace();

    if (!isWorkspaceInitialized(workspace)) {
        error('Workspace not initialized. Run "keys init" first.');
        return 1;
    }

    const packId = args[0];
    const actionName = args[1];
    const store = new LocalPackStore(workspace);
    const config = loadConfig(workspace);

    const entry = await store.getPack(packId);
    if (!entry) {
        error(`Pack not found: ${packId}`);
        return 1;
    }

    let manifest: PackManifest;
    try {
        manifest = await store.loadPackManifest(entry.path);
    } catch (err) {
        error(`Could not load manifest: ${err}`);
        return 1;
    }

    if (manifest.actions.length === 0) {
        error(`Pack "${packId}" has no actions defined`);
        return 1;
    }

    // Find action
    let action = actionName
        ? manifest.actions.find(a => a.name === actionName)
        : manifest.actions[0]; // default to first action

    if (!action) {
        error(`Action not found: ${actionName}`);
        log('');
        log('Available actions:');
        for (const a of manifest.actions) {
            log(`  - ${a.name} (${a.kind})`);
        }
        return 1;
    }

    const runner = new ZeoRunner(config.zeo);
    const result = await runner.run(entry.path, action, {
        stream: true,
    });

    if (result.exitCode === ZEO_MISSING_EXIT_CODE) {
        error('ZEO is required for this action but was not found.');
        log('');
        log('To fix:');
        log('  1. Install ZEO: https://zeo.dev/install');
        log('  2. Or configure zeo.path in .keys/config.json');
        log('  3. Or change action kind to "shell" if applicable');
        return ZEO_MISSING_EXIT_CODE;
    }

    return result.exitCode;
}

async function commandDoctor(args: string[], flags: Record<string, string | boolean>): Promise<number> {
    const workspace = detectWorkspace();
    const config = loadConfig(workspace);

    const result = await runDoctorChecks(workspace, config);

    if (flags.json) {
        log(JSON.stringify(result, null, 2));
    } else {
        log(formatDoctorResult(result));
    }

    return result.summary.fail > 0 ? 1 : 0;
}

async function commandHelp(): Promise<number> {
    log(`
Keys CLI - Backendless local-first pack management

Usage: keys <command> [options]

Commands:
  init                   Initialize workspace + config
  add <path>             Add pack from local path
  list                   List registered packs
  search <query>         Search packs by name/tags/description
  show <id>              Show pack manifest + actions
  export <id>            Export pack to dist/keys/<id>/
  run <id> [action]      Run pack action (delegates to ZEO)
  doctor                 Check environment + integrations
  help                   Show this help message

Options:
  --json                 Output as JSON (where applicable)
  --force                Force operation (e.g., reinitialize)
  --output <path>        Custom output directory for export
  --readme               Show README content in show command

Examples:
  keys init
  keys add ./my-pack
  keys list
  keys search "api helper"
  keys show my-pack
  keys export my-pack
  keys run my-pack hello
  keys doctor

Workspace:
  Keys uses .keys/ in project root (project mode) or ~/.keys/ (user mode).
  Project mode is used when .keys/ or .git exists in parent directories.

Pack Format:
  A pack is a directory containing:
    - keys.pack.json (required) - Pack manifest
    - README.md (optional)      - Documentation
    - assets/ (optional)        - Static assets
    - actions/ (optional)       - Action scripts
    - prompts/ (optional)       - Prompt templates

More info: https://github.com/Hardonian/Keys
`);
    return 0;
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main(): Promise<number> {
    const parsed = parseArgs(process.argv);

    const commands: Record<string, (args: string[], flags: Record<string, string | boolean>) => Promise<number>> = {
        init: commandInit,
        add: commandAdd,
        list: commandList,
        search: commandSearch,
        show: commandShow,
        export: commandExport,
        run: commandRun,
        doctor: commandDoctor,
        help: commandHelp,
    };

    const handler = commands[parsed.command];

    if (!handler) {
        error(`Unknown command: ${parsed.command}`);
        log('Run "keys help" for usage information.');
        return 1;
    }

    try {
        return await handler(parsed.args, parsed.flags);
    } catch (err) {
        error(`Unexpected error: ${err}`);
        if (parsed.flags.debug) {
            console.error(err);
        }
        return 1;
    }
}

main()
    .then(code => process.exit(code))
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
