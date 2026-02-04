# Contributing to KEYS

Thanks for helping improve KEYS. This guide covers how to add new keys, validate metadata, and contribute safely.

## Ways to Contribute
- **New keys and metadata** in `docs/library/`
- **Documentation improvements** (README, runbooks, specs)
- **Validation and indexing tooling** in `scripts/`
- **Bug reports and feature requests** via GitHub Issues

## First-Time Contributor Path
1. Read the metadata spec: `docs/METADATA_SPEC.md`.
2. Add a small docs fix or a single key + metadata pair.
3. Run `pnpm keys:validate` locally to confirm the schema.
4. Open a PR with a short description and validation output.

## Add a New Key
1. Add the asset content under `docs/library/`.
2. Create a matching `*.metadata.json` file in the same directory.
3. Validate and generate the static index:

```bash
pnpm keys:validate
pnpm keys:index
```

## Metadata Requirements
- Metadata must follow the schema in `contracts/artifact_metadata.schema.json`.
- The metadata file is the single source of truth. Do not add frontmatter to Markdown assets.
- `content_path` must point to the asset content file.

For details, see `docs/METADATA_SPEC.md`.

## Validation Workflow
- `pnpm keys:validate` runs the validator and writes:
  - `frontend/public/validation_report.json`
- `pnpm keys:index` validates metadata and writes:
  - `frontend/public/keys-index.json`
  - `frontend/public/validation_report.json`
  - `frontend/public/artifacts_manifest.json`
- CI runs strict validation and fails on errors.

## Local Verification
Run the same checks CI expects before opening a PR:

```bash
pnpm verify
```

## Discussions and Support
Use GitHub Discussions for:
- **Q&A**: “How do I…?” questions
- **Ideas**: proposals for new key categories or workflows
- **Show and tell**: examples of keys used in the wild
- **Design/architecture**: larger changes to the platform

Security issues should be reported privately via the process in `SECURITY.md`.
