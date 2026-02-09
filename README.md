# Keys

> **The Keyring for AI Toolkits** — Local-first pack management for AI agents

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)

Keys is a **backendless, local-first** CLI for managing structured asset packs that unlock capabilities in AI tools like [ZEO](https://zeo.dev), Cursor, Jupyter, and more.

**No accounts. No servers. No network required.**

```
┌─────────────────────────────────────────────────────────────────┐
│  🔑 KEYS                                                        │
│                                                                 │
│  Packs → Registry → Search → Execute → Export                  │
│     ↓        ↓         ↓        ↓         ↓                    │
│  Local    Portable   Instant   ZEO     Deterministic           │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
cd src && npm install

# Initialize workspace
npx tsx cli/keys.ts init

# Add a pack
npx tsx cli/keys.ts add ./path/to/pack

# List packs
npx tsx cli/keys.ts list

# Search packs
npx tsx cli/keys.ts search "api helper"

# Run an action
npx tsx cli/keys.ts run my-pack hello

# Check environment
npx tsx cli/keys.ts doctor
```

## Installation

### From Source

```bash
git clone https://github.com/Hardonian/Keys.git
cd Keys/src
npm install
npm run build
```

### Global CLI (after build)

```bash
npm link
keys --help
```

## CLI Reference

| Command | Description |
|---------|-------------|
| `keys init` | Initialize workspace + config |
| `keys add <path>` | Add pack from local path |
| `keys list` | List registered packs |
| `keys search <query>` | Search by name/tags/description |
| `keys show <id>` | Show pack manifest + actions |
| `keys export <id>` | Export to `dist/keys/<id>/` |
| `keys run <id> [action]` | Run pack action (ZEO/shell) |
| `keys doctor` | Check environment + integrations |

### Options

```bash
--json      # Output as JSON
--force     # Force operation (e.g., reinitialize)
--output    # Custom output directory for export
--readme    # Show README in show command
```

## Pack Format

A pack is a directory with a `keys.pack.json` manifest:

```
my-pack/
├── keys.pack.json    # Required: manifest
├── README.md         # Optional: documentation
├── assets/           # Optional: static files
├── actions/          # Optional: action scripts
└── prompts/          # Optional: prompt templates
```

### Manifest Schema

```json
{
  "id": "my-pack",
  "name": "My Pack",
  "version": "1.0.0",
  "description": "What this pack does",
  "tags": ["utility", "api"],
  "actions": [
    {
      "name": "hello",
      "kind": "shell",
      "command": "echo",
      "args": ["Hello from Keys!"]
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

### Action Kinds

| Kind | Description |
|------|-------------|
| `shell` | Execute command locally |
| `zeo` | Delegate to ZEO runner |
| `doc` | Display documentation |

## Workspace Modes

Keys automatically detects workspace mode:

| Mode | Location | When |
|------|----------|------|
| **Project** | `.keys/` | `.keys/` or `.git` exists in parent dirs |
| **User** | `~/.keys/` | Global fallback |

### Storage Files

```
.keys/
├── config.json     # Workspace settings
├── registry.json   # Pack database
└── index.json      # Search index
```

## ZEO Integration

Keys delegates `zeo` actions to the ZEO CLI:

```bash
# Default template
zeo run --pack "{packPath}" --action "{actionName}"
```

### Configuration

```json
{
  "zeo": {
    "enabled": true,
    "commandTemplate": "zeo run --pack \"{packPath}\" --action \"{actionName}\"",
    "path": "/custom/path/to/zeo"
  }
}
```

If ZEO is not installed, Keys shows helpful install instructions and exits with code 2.

## ControlPlane Integration

Optional export for ControlPlane compatibility:

```bash
keys export my-pack
```

Output:
```
dist/keys/my-pack/
├── my-pack-1.0.0.zip    # Deterministic archive
└── manifest.json         # Export metadata + hash
```

### Deterministic Export

- Stable file ordering
- Fixed mtimes
- SHA256 verification hash
- Excludes: `node_modules`, `dist`, `.git`, `tmp`

## Development

```bash
cd src

# Install dependencies
npm install

# Run CLI in dev mode
npm run dev -- init

# Type check
npm run typecheck

# Run tests
npm run test

# Build
npm run build
```

### Project Structure

```
src/
├── core/                 # Core library
│   ├── contracts.ts      # Types and Zod schemas
│   ├── workspace.ts      # Workspace detection
│   ├── pack-store.ts     # Registry management
│   ├── index-store.ts    # Pure-JS search index
│   ├── zeo-runner.ts     # Action execution
│   ├── controlplane-adapter.ts
│   └── doctor.ts         # Health checks
├── cli/
│   └── keys.ts           # CLI entry point
└── __tests__/
    ├── contracts.test.ts # Schema validation
    ├── stores.test.ts    # Store operations
    └── smoke.test.ts     # E2E tests
```

## Design Principles

1. **Local-first** — Core works offline, no network required
2. **No accounts** — No authentication, no user management
3. **No backend** — No database servers, pure file-based storage
4. **Graceful degradation** — Missing tools show helpful messages
5. **Portable** — Pure JS, minimal dependencies
6. **Deterministic** — Same input → same output

## Documentation

- [Architecture](docs/architecture.md) — Components, pack format, storage
- [Security](docs/SECURITY.md) — Security practices

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Areas of interest:
- New action kinds
- Additional export formats
- Search improvements
- Documentation

## License

[MIT License](LICENSE)

---

**Built for teams who want AI agents they can trust.**

[Documentation](docs/) • [Issues](https://github.com/Hardonian/Keys/issues) • [Discussions](https://github.com/Hardonian/Keys/discussions)
