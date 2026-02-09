# Backend (Optional)

> **⚠️ The backend is NOT required for core Keys functionality.**

Keys is designed as a **local-first, backendless** CLI. The `backend/` directory contains optional server components for advanced use cases like:

- Multi-user sync
- Hosted pack registry
- Enterprise features

## Core Functionality (No Backend)

The core Keys CLI works entirely offline:

```bash
cd src
npm install
npx tsx cli/keys.ts init
npx tsx cli/keys.ts add ./my-pack
npx tsx cli/keys.ts list
npx tsx cli/keys.ts run my-pack hello
```

See the main [README](../README.md) for full CLI documentation.

## When You Might Need Backend

- **Team collaboration** — Sharing packs across a team
- **Hosted registry** — Publishing packs to a central server
- **Access control** — Role-based permissions
- **Audit logging** — Centralized action tracking

## Status

The backend is currently in maintenance mode. For most use cases, the local-first CLI is recommended.

If you need backend features, please open a [discussion](https://github.com/Hardonian/Keys/discussions).
