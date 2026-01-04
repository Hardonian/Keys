# Audit Log Capture Key

## What This KEY Unlocks

Unlocks audit log dashboard widget for tracking user actions in Next.js applications.

This KEY provides:
- React component for audit log display
- Server-side data fetching
- Tenant-isolated log queries
- Error handling

## Installation

### Step 1: Copy KEY to Your Project

```bash
cp -r node-keys/audit-log-capture ./node-keys/
```

### Step 2: Install Dependencies

```bash
npm install react
```

### Step 3: Configure Environment Variables

Add to your `.env.local`:

```bash
DATABASE_URL=postgresql://...
```

## Usage

### Use in a Page

```typescript
// app/dashboard/audit-log/page.tsx
import { AuditLogWidget } from '@/node-keys/audit-log-capture/src';

export default function AuditLogPage() {
  return (
    <div>
      <h1>Audit Log</h1>
      <AuditLogWidget />
    </div>
  );
}
```

### Use as a Widget

```typescript
// app/dashboard/page.tsx
import { AuditLogWidget } from '@/node-keys/audit-log-capture/src';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <AuditLogWidget />
    </div>
  );
}
```

## Configuration

### Required Environment Variables

- `DATABASE_URL`: Database connection string

### Optional Environment Variables

- `AUDIT_LOG_RETENTION_DAYS`: Number of days to retain logs (default: 90)

## Removal

### Step 1: Remove Component Usage

Remove `<AuditLogWidget />` from your pages.

### Step 2: Remove KEY Directory

```bash
rm -rf ./node-keys/audit-log-capture
```

## License

MIT
