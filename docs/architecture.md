# Keys Architecture

> Local-first, backendless pack management for AI agents

## Overview

Keys is designed as a **local-first** system that runs entirely on the user's machine without requiring any backend services, accounts, or network connectivity for core operations.

```
┌────────────────────────────────────────────────────────────────────┐
│                        Keys CLI                                    │
│  keys init | add | list | search | show | export | run | doctor   │
└────────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
        ┌───────────┐     ┌───────────┐     ┌───────────┐
        │ PackStore │     │IndexStore │     │  Runner   │
        │ registry  │     │  search   │     │   ZEO     │
        └───────────┘     └───────────┘     └───────────┘
                │                 │                 │
                └─────────────────┼─────────────────┘
                                  │
                                  ▼
                        ┌─────────────────┐
                        │   .keys/        │
                        │   config.json   │
                        │   registry.json │
                        │   index.json    │
                        └─────────────────┘
```

## Core Components

### 1. Contracts (`src/core/contracts.ts`)

Type-safe interfaces and Zod schemas for all data structures:

- **PackManifest** - The `keys.pack.json` specification
- **Registry** - Local pack database
- **SearchIndex** - Inverted index for search
- **Runner** - Interface for action execution
- **ControlPlaneAdapter** - Optional export adapter

### 2. Workspace (`src/core/workspace.ts`)

Workspace detection with two modes:

| Mode | Location | When |
|------|----------|------|
| **Project** | `.keys/` | `.keys/` or `.git` exists in parent dirs |
| **User** | `~/.keys/` | Fallback for global packs |

### 3. PackStore (`src/core/pack-store.ts`)

JSON-based pack registry:

- **loadRegistry()** - Read `registry.json`
- **saveRegistry()** - Write `registry.json`  
- **addPack(path)** - Validate manifest and register
- **removePack(id)** - Remove from registry
- **getPack(id)** - Lookup by ID
- **listPacks()** - List all registered packs

### 4. IndexStore (`src/core/index-store.ts`)

Pure-JS inverted index for local search:

- Tokenizes pack metadata (ID, name, description, tags, README)
- Builds inverted index: `term → [packId1, packId2, ...]`
- Scores results by exact match, prefix match, substring match
- No external dependencies (MiniSearch-like behavior)

### 5. ZeoRunner (`src/core/zeo-runner.ts`)

Action execution with ZEO integration:

| Action Kind | Behavior |
|-------------|----------|
| `shell` | Execute command directly |
| `zeo` | Delegate to ZEO CLI |
| `doc` | Display documentation |

**Graceful degradation**: If ZEO is not installed, returns exit code 2 with install instructions.

### 6. ControlPlane Adapter (`src/core/controlplane-adapter.ts`)

Optional export for ControlPlane compatibility:

- Deterministic ZIP archives (stable file order, fixed mtimes)
- SHA256 hash for verification
- Export manifest with metadata

## Pack Format

A pack is a directory containing:

```
my-pack/
├── keys.pack.json    # Required: manifest
├── README.md         # Optional: documentation
├── assets/           # Optional: static files
├── actions/          # Optional: action scripts
└── prompts/          # Optional: prompt templates
```

### Manifest Schema (`keys.pack.json`)

```json
{
  "id": "my-pack",
  "name": "My Pack",
  "version": "1.0.0",
  "description": "What this pack does",
  "tags": ["tag1", "tag2"],
  "entrypoints": {
    "prompts": ["prompts/main.md"],
    "scripts": [],
    "workflows": []
  },
  "actions": [
    {
      "name": "hello",
      "kind": "shell",
      "command": "echo",
      "args": ["Hello!"],
      "description": "Say hello"
    },
    {
      "name": "assist",
      "kind": "zeo",
      "promptFile": "prompts/assist.md"
    }
  ],
  "author": "Your Name",
  "license": "MIT"
}
```

### Validation Rules

- **id**: lowercase alphanumeric with `.`, `-`, `_`
- **version**: semver format (e.g., `1.0.0`, `2.1.0-beta`)
- **actions[].kind**: must be `zeo`, `shell`, or `doc`

## Storage

All data is stored in JSON files:

| File | Purpose |
|------|---------|
| `config.json` | Workspace settings, ZEO/CP config |
| `registry.json` | Pack metadata and paths |
| `index.json` | Search index with inverted terms |

### Why JSON?

1. **Portable** - Works everywhere, no native dependencies
2. **Human-readable** - Easy to inspect and debug
3. **Git-friendly** - Can be version controlled
4. **Offline-first** - No database server required

## Integration Points

### ZEO Runner

Default command template:
```
zeo run --pack "{packPath}" --action "{actionName}"
```

Override in config:
```json
{
  "zeo": {
    "enabled": true,
    "commandTemplate": "my-zeo --pack {packPath} --action {actionName}",
    "path": "/custom/path/to/zeo"
  }
}
```

### ControlPlane (Optional)

When enabled, `keys export` produces:
```
dist/keys/<packId>/
├── <packId>-<version>.zip   # Deterministic archive
└── manifest.json             # Export metadata with hash
```

## Design Principles

1. **No network required** - Core functionality works offline
2. **No accounts** - No authentication, no user management
3. **No server** - No database, no backend services
4. **Graceful degradation** - Missing tools show helpful messages
5. **Portable** - Pure JS, minimal dependencies
6. **Deterministic** - Same input → same output

## Directory Structure

```
src/
├── core/                 # Core library
│   ├── contracts.ts      # Types and schemas
│   ├── workspace.ts      # Workspace detection
│   ├── pack-store.ts     # Registry management
│   ├── index-store.ts    # Search index
│   ├── zeo-runner.ts     # Action execution
│   ├── controlplane-adapter.ts
│   ├── doctor.ts         # Health checks
│   └── index.ts          # Barrel export
├── cli/
│   └── keys.ts           # CLI entry point
└── __tests__/
    ├── contracts.test.ts # Schema validation tests
    ├── stores.test.ts    # Store operation tests
    └── smoke.test.ts     # E2E CLI tests
```
