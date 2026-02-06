# Evidence Pack

## Commands Run (Chronological)

```bash
npm install
npm run lint
npm run type-check
npm run test:all
npm run build
```

After fixes:

```bash
npm run lint
npm run type-check
npm run test:all
npm run build
npm --workspace backend audit --audit-level=high
npm --workspace frontend audit --audit-level=high
```

## Baseline Failures Observed
- **Frontend lint**: `next lint` failed due to missing Next CLI command and invalid project directory.
- **Typecheck/build**: `backend/src/routes/marketplace.ts` referenced possibly undefined auth header.
- **Frontend build**: Turbopack could not resolve workspace root because Next.js package was outside the inferred project directory.

## Fixes Applied
- Replaced frontend lint with ESLint flat config and limited lint scope to `src`.
- Guarded auth header usage in marketplace preview route.
- Split Stripe webhook router to ensure raw-body verification, added webhook rate limits, and updated build config with correct Turbopack root.
- Added webhook replay-protection tests and documentation updates.

## Verification After Fixes
- `npm run lint` ✅
- `npm run type-check` ✅
- `npm run test:all` ✅ (warnings from React act() in existing tests)
- `npm run build` ✅ (Next.js warning about middleware deprecation persists)
- `npm --workspace backend audit --audit-level=high` ✅
- `npm --workspace frontend audit --audit-level=high` ✅

## Notes
- The Next.js build emits a warning about the deprecated middleware file convention; this is informational and does not block build.
- React test warnings about `act(...)` are pre-existing in test code and did not cause failures.

