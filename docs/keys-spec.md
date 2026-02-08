Reality Mode. Implement only. No backend. No placeholders. Keep everything local-first.

CONTEXT WINDOW BUDGET
- This prompt is designed to fit under 200,000 tokens.
- You MUST keep your own outputs compact: do not paste large files in-chat unless explicitly requested.
- Prefer “changed files + key excerpts + command outputs”. If you must show full files, do it only for small ones.

REPO
- Repo: Keys (current working directory)
- Goal: Convert Keys into a backendless, local-first OSS tool that integrates with ControlPlane + ZEO via CLI/SDK hooks.
- Core must function offline with no hosted services.

NON-NEGOTIABLES
- No network calls required for core functionality (offline-first).
- No auth/accounts.
- No server-required DB. Local-only storage.
- Graceful degradation: if ControlPlane or ZEO missing, Keys still runs and explains what’s missing (no hard crash).
- Termux/CI-safe: avoid native deps where possible; provide WASM/pure-js fallback when risky.
- Ship verified: lint/typecheck/build/test/smoke must pass.

DELIVERABLES (MINIMUM FEATURE SET)
1) Backendless CLI commands
- `keys init`                  Create local workspace + config
- `keys add <path|git?>`       Add a “pack” from local path (git optional if already supported)
- `keys list`                  List packs
- `keys search <query>`        Search by name/tags/README/manifest summary (local index)
- `keys show <id>`             Show pack manifest + actions
- `keys export <id>`           Deterministic ZIP (or tar.gz) artifact output
- `keys run <id> [action]`     Delegate execution to ZEO runner (NO internal backend)
- `keys doctor`                Environment + integration checks

2) Local storage + indexing (portable)
- Default store: local JSON registry + local search index (portable).
- Avoid native SQLite unless repo already uses it safely across Termux/CI.
- Suggested default:
  - registry: `.keys/registry.json` (project mode) or `~/.keys/registry.json` (user mode)
  - config: `.keys/config.json` or `~/.keys/config.json`
  - index: `.keys/index.json` built/updated on add/update
- Use a lightweight pure-js search index (MiniSearch or equivalent) OR a simple inverted index you implement.

3) Pack format standardization
- A pack is a folder containing:
  - `keys.pack.json` (required manifest)
  - `README.md` (optional)
  - `assets/` (optional)
  - `actions/` (optional)
- Manifest schema (validate on add):
  - id, name, version, description, tags[]
  - entrypoints: prompts[], scripts[], workflows[]
  - actions[]: { name, kind: "zeo"|"shell"|"doc", command?, args?, promptFile?, cwd? }
- Reject invalid packs with clear, actionable errors.

4) ZEO integration (delegate execution)
- Implement a `ZeoRunner`:
  - Detect `zeo` CLI on PATH OR configured path in Keys config.
  - Execute via spawn with streaming logs.
  - `keys run <pack> <action>` behavior:
    - action.kind="zeo": execute a configurable command template
      - Default template: `zeo run --pack "{packPath}" --action "{actionName}"`
      - Allow override in config: `zeo.commandTemplate`
    - action.kind="shell": run local command with safe env + cwd (default cwd=packPath)
  - If ZEO missing: print install/config instructions; exit code 2 (not 1).

5) ControlPlane integration (optional but wired)
- Do NOT depend on ControlPlane for core.
- Implement `ControlPlaneAdapter` that:
  - Detects `controlplane` CLI or `@controlplane/sdk` if present.
  - Makes `keys export` artifacts easy for CP to consume:
    - Output to: `dist/keys/<packId>/<packId>-<version>.zip`
    - Also emit: `dist/keys/<packId>/manifest.json` (export metadata)
  - Optional command ONLY if trivial:
    - `keys cp publish <id>` runs only when CP CLI/SDK present; otherwise prints skip message.

6) Deterministic export rules
- Stable file ordering
- Fixed mtimes in archive entries if possible
- Exclude: node_modules, dist, .git, tmp, .DS_Store
- Include: keys.pack.json, README.md, assets/, actions/, entrypoints

QUALITY + DOCS
- Update README: install, quickstart, CLI, pack format, integration (Keys + ZEO + ControlPlane)
- Add `/docs/architecture.md` (1 page max): components, pack format, storage choice, integration strategy
- Add minimal contributor info if missing.
- Add tests:
  - unit: manifest validation, registry ops, export determinism
  - smoke: init -> add sample pack -> list -> search -> export -> doctor (in temp dir)
- Add/repair CI if missing: lint + typecheck + test + build + smoke.

IMPLEMENTATION PLAN (MUST FOLLOW)
Phase 0 — Discover (fast, factual)
- Inspect repo structure, package manager, tsconfig, CLI framework, existing commands.
- Identify any backend/server code. Remove it OR isolate it so default build is backendless.
- Locate any existing ZEO/ControlPlane references; extend existing patterns.

Phase 1 — Contracts (tiny, stable)
- Add `src/core/contracts.ts` with interfaces:
  - PackStore
  - IndexStore
  - Runner (ZEO)
  - ControlPlaneAdapter

Phase 2 — Implement (smallest safe changes)
- Implement CLI with existing library (commander/yargs/clack/etc.).
- Implement:
  - workspace mode detection:
    - If repo contains `.keys/` use project mode
    - Else default to `~/.keys/` user mode (config option to force)
  - registry + index updates on add
  - `doctor` prints a clear status table: node, config, write perms, zeo found, controlplane found
  - `run` delegates to ZEO template
  - deterministic `export`

Phase 3 — Verify (must pass)
- Add scripts:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `pnpm smoke`
- Smoke test runs locally + CI.
- If repo includes a web UI, ensure it runs without backend dependency and has error boundaries (no hard-500 routes).

Phase 4 — Commits (exact messages)
- Commit 1: feat(keys): backendless local-first core + pack format
- Commit 2: feat(cli): init/add/list/search/show/export/run/doctor
- Commit 3: test: unit + smoke
- Commit 4: docs: README + architecture
- Commit 5: ci: workflows (only if absent/broken)

HARD CONSTRAINTS
- No TODOs, no partial scaffolds.
- Don’t fake ZEO CLI semantics: make it configurable with commandTemplate + sensible default.
- Keep dependencies minimal and portable.

FINAL REPORT (REQUIRED)
At the end output ONLY:
1) Summary of what changed (focus: removing backend need)
2) Files changed list
3) Verification commands run + results
4) Optional next steps (sync adapter, UI, hosted registry) — DO NOT implement hosting.

Now implement in this repo.
