# Quick Start

## Prerequisites

- Node.js 18+
- Database (for distributed locking)

## Quick Install

Copy `node-keys/safe-cron-execution` to your project.

## Basic Usage

### 1. Configure Environment

```bash
# .env.local
DATABASE_URL=postgresql://...
```

### 2. Wrap Your Cron Jobs

```typescript
import { safeCronExecute } from '@/node-keys/safe-cron-execution/src';

await safeCronExecute({
  jobId: 'my-job',
  jobFunction: async () => {
    // Your job logic
  },
});
```

## Next Steps

See [README.md](./README.md) for full documentation.
