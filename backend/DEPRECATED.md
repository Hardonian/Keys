# Backend - DEPRECATED

> ⚠️ **The backend is optional for Keys CLI functionality.**

The core Keys CLI (`src/`) operates entirely offline without requiring this backend.

## When Backend Was Used

This backend was designed for:
- Multi-user team synchronization
- Hosted pack registry
- Enterprise access control
- Centralized audit logging

## Current Status

**Maintenance mode** — Not actively developed. The local-first CLI in `src/` is the recommended approach.

## If You Need Backend Features

1. Review the code in `backend/src/`
2. Set up Supabase (see `backend/supabase/`)
3. Configure environment variables

For most use cases, the local-first CLI is sufficient. Open a [discussion](https://github.com/Hardonian/Keys/discussions) if you have questions.

## See Also

- [Main README](../README.md) — Local-first CLI documentation
- [Architecture](../docs/architecture.md) — System overview
- [src/](../src/) — Primary CLI implementation
