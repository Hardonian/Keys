# Quick Start

## Prerequisites

- Next.js 13+ (App Router)
- React 18+
- Database

## Quick Install

```bash
npm install react
```

Copy `node-keys/audit-log-capture` to your project.

## Basic Usage

### 1. Configure Environment

```bash
# .env.local
DATABASE_URL=postgresql://...
```

### 2. Use Component

```typescript
import { AuditLogWidget } from '@/node-keys/audit-log-capture/src';

export default function Page() {
  return <AuditLogWidget />;
}
```

## Next Steps

See [README.md](./README.md) for full documentation.
