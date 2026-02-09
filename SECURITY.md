# Security Policy

## Supported Versions

Security updates apply to the `main` branch. If you depend on tagged releases, upgrade to the latest release before reporting issues.

## Security Model

Keys is designed as a **local-first CLI** with the following security principles:

### Local-First Design
- **No network required** — Core functionality works entirely offline
- **No accounts** — No authentication, no user data collection
- **No backend** — No server, no database, no external dependencies
- **Local storage only** — All data stored in `.keys/` directory

### Open Source Transparency
- All code is visible and auditable
- No hidden processing logic
- Pure JavaScript/TypeScript with minimal dependencies

### Execution Safety
- **Shell actions** execute local commands with user permissions
- **ZEO actions** delegate to ZEO CLI (if installed)
- Pack manifests are validated before execution
- Graceful degradation for missing tools

## Pack Security

Each pack in the registry includes:
- Validated JSON manifest (`keys.pack.json`)
- Documented actions with explicit commands
- Optional README documentation

**Your responsibility:**
- Review pack manifests before adding
- Validate actions before running
- Apply your security policies and controls

## Dependency Security

We run `npm audit` on all dependencies. Current status:
- **Source packages (`src/`)**: Minimal dependencies (Zod only)
- **Dev dependencies**: May have moderate vulnerabilities in tooling

## Reporting a Vulnerability

Please report security issues privately through responsible disclosure.

1. Open a private GitHub Security Advisory on this repository
2. Include reproduction steps, impact assessment, and any relevant logs
3. Do not open public issues for security vulnerabilities

## Response Timeline

We acknowledge reports within 5 business days and provide a remediation plan or status update as soon as practical.

## Security Contact

- **GitHub Security Advisory**: Preferred method
- **Email**: [To be defined for critical issues]

---

**Note:** This document is honest about our security posture. Keys prioritizes local-first, offline operation over complex security infrastructure.
