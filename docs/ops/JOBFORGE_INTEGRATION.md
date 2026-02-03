# JobForge Integration (Admin)

## Overview
The JobForge integration is opt-in and safe by default. All operations are disabled unless explicitly enabled with environment variables. Tenant/project routing must be explicitly mapped before any request is forwarded.

## Configuration

```env
# Required to enable any JobForge calls
JOBFORGE_INTEGRATION_ENABLED=1

# Optional gate for bundle execution requests
JOBFORGE_BUNDLE_EXECUTION_ENABLED=1

# JobForge API configuration
JOBFORGE_BASE_URL=https://api.jobforge.example
JOBFORGE_API_KEY=your_jobforge_api_key

# Optional: override SDK module name if different
JOBFORGE_SDK_MODULE=jobforge-sdk

# Explicit tenant/project mapping (JSON array)
# tenantId/projectId refer to Keys identifiers
# jobforgeTenantId/jobforgeProjectId refer to JobForge identifiers
JOBFORGE_TENANT_PROJECT_MAP='[
  {"tenantId":"tenant-123","projectId":"project-abc","jobforgeTenantId":"jf-tenant-1","jobforgeProjectId":"jf-project-1"}
]'
```

## Admin API
All endpoints require an admin or superadmin access token.

- `GET /admin/jobforge/status`
  - Returns status of configuration, SDK availability, and mapping count.
- `POST /admin/jobforge/events`
  - Body: `{ tenantId, projectId, eventType, payload }`
- `POST /admin/jobforge/modules/dry-run`
  - Body: `{ tenantId, projectId, moduleId, input }`
- `GET /admin/jobforge/reports/:reportId?tenantId=...&projectId=...`
- `POST /admin/jobforge/reports/:reportId/bundle-execution`
  - Body: `{ tenantId, projectId, bundleId, confirm: true }`
  - Requires `JOBFORGE_BUNDLE_EXECUTION_ENABLED=1`.

## CLI
From the repo root:

```bash
npm --workspace backend run jobforge:admin -- submit-event \
  --tenant tenant-123 \
  --project project-abc \
  --event run.started \
  --payload '{"jobId":"job-77"}'

npm --workspace backend run jobforge:admin -- run-module \
  --tenant tenant-123 \
  --project project-abc \
  --module module-22 \
  --input '{"dryRun":true}'

npm --workspace backend run jobforge:admin -- view-report \
  --tenant tenant-123 \
  --project project-abc \
  --report report-99

npm --workspace backend run jobforge:admin -- request-bundle \
  --tenant tenant-123 \
  --project project-abc \
  --report report-99 \
  --bundle bundle-03 \
  --confirm
```

## Smoke test and verification commands
These commands verify the integration without side effects by default:

```bash
# Check status (requires admin auth token)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/admin/jobforge/status

# Dry-run module call (requires mapping + enabled integration)
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"tenant-123","projectId":"project-abc","moduleId":"module-22","input":{"dryRun":true}}' \
  http://localhost:3001/admin/jobforge/modules/dry-run
```
