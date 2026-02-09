# Frontend - DEPRECATED

> ⚠️ **The frontend is optional for Keys CLI functionality.**

The core Keys CLI (`src/`) operates entirely from the command line.

## When Frontend Was Used

This frontend was designed for:
- Visual pack browsing
- Web-based action execution
- Dashboard and metrics
- Marketplace UI

## Current Status

**Maintenance mode** — Not actively developed. The CLI in `src/` is the recommended approach.

## If You Need Frontend

1. Install dependencies: `cd frontend && pnpm install`
2. Configure `.env.local` (copy from `.env.example`)
3. Run: `pnpm dev`

For most use cases, the CLI is sufficient. Open a [discussion](https://github.com/Hardonian/Keys/discussions) if you have questions.

## See Also

- [Main README](../README.md) — Local-first CLI documentation
- [src/](../src/) — Primary CLI implementation
