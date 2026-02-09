# Contributing to Keys

Thanks for helping improve Keys! This guide covers how to contribute code, add new packs, and participate in the project.

## Ways to Contribute

- **Keys CLI improvements** in `src/`
- **New example packs** in `examples/`
- **Documentation improvements** (README, architecture docs)
- **Bug reports and feature requests** via GitHub Issues

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm or npm

### Setup

```bash
# Clone the repo
git clone https://github.com/Hardonian/Keys.git
cd Keys

# Install dependencies
cd src
npm install

# Run the CLI
npx tsx cli/keys.ts help

# Run tests
npm run test

# Type check
npm run typecheck
```

## Development Workflow

### Keys CLI (`src/`)

The core CLI is in `src/`. It's designed to be backendless and local-first.

```bash
cd src

# Run in development
npm run dev -- help
npm run dev -- init
npm run dev -- doctor

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
    └── *.test.ts         # Tests
```

## Adding a New Pack

1. Create a directory in `examples/`:

```bash
mkdir examples/my-pack
```

2. Add a `keys.pack.json` manifest:

```json
{
  "id": "my-pack",
  "name": "My Pack",
  "version": "1.0.0",
  "description": "What this pack does",
  "tags": ["tag1", "tag2"],
  "actions": [
    {
      "name": "hello",
      "kind": "shell",
      "command": "echo",
      "args": ["Hello!"]
    }
  ]
}
```

3. Add a README.md with usage instructions.

4. Test the pack:

```bash
cd src
npx tsx cli/keys.ts add ../examples/my-pack
npx tsx cli/keys.ts run my-pack hello
```

## Verification

Run the same checks CI expects before opening a PR:

```bash
cd src

# Type check
npm run typecheck

# Run tests
npm run test

# Build
npm run build
```

Or from the root:

```bash
npm run keys:typecheck
npm run keys:test
```

## Pull Request Guidelines

1. **Keep PRs focused** - One feature or fix per PR
2. **Add tests** - New functionality should have tests
3. **Update docs** - Update README or architecture docs if needed
4. **Follow conventions** - Match existing code style

## Architecture Decisions

- **Local-first** - Core functionality works offline
- **No accounts** - No authentication required
- **Pure JS** - Minimal dependencies, portable
- **Graceful degradation** - Missing tools show helpful messages

See [docs/architecture.md](docs/architecture.md) for details.

## Discussions

Use GitHub Discussions for:
- **Q&A**: "How do I…?" questions
- **Ideas**: Proposals for new features
- **Show and tell**: Examples of packs in the wild

## Security

Security issues should be reported privately via the process in [SECURITY.md](docs/SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
