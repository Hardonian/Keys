# Frontend (Optional)

> **⚠️ The frontend is NOT required for core Keys functionality.**

Keys is designed as a **local-first, backendless** CLI. The `frontend/` directory contains an optional web UI for visualization and browsing.

## Core Functionality (No Frontend)

The core Keys CLI works entirely from the command line:

```bash
cd src
npm install
npx tsx cli/keys.ts init
npx tsx cli/keys.ts list
npx tsx cli/keys.ts search "api"
npx tsx cli/keys.ts show my-pack
```

See the main [README](../README.md) for full CLI documentation.

## When You Might Need Frontend

- **Visual pack browsing** — GUI for exploring packs
- **Action execution UI** — Web-based action runner
- **Dashboard** — Metrics and status visualization

## Status

The frontend is currently in maintenance mode. For most use cases, the CLI is recommended.

If you need frontend features, please open a [discussion](https://github.com/Hardonian/Keys/discussions).
