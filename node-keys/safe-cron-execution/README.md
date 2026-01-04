# Safe Cron Execution Key

## What This KEY Unlocks

Unlocks safe, idempotent cron job execution with distributed locking and error handling.

This KEY provides:
- Distributed locking to prevent concurrent execution
- Idempotent job execution
- Graceful error handling
- Execution logging

## Installation

### Step 1: Copy KEY to Your Project

```bash
cp -r node-keys/safe-cron-execution ./node-keys/
```

### Step 2: Configure Environment Variables

Add to your `.env.local`:

```bash
DATABASE_URL=postgresql://...
```

## Usage

### Wrap Your Cron Jobs

```typescript
import { safeCronExecute } from '@/node-keys/safe-cron-execution/src';
import cron from 'node-cron';

cron.schedule('0 2 * * *', async () => {
  await safeCronExecute({
    jobId: 'daily-reconciliation',
    jobFunction: async () => {
      // Your job logic here
      console.log('Running daily reconciliation...');
    },
    lockTimeoutSeconds: 300, // 5 minutes
  });
});
```

## Configuration

### Required Environment Variables

- `DATABASE_URL`: Database connection string (for distributed locking)

### Optional Environment Variables

- `LOCK_TIMEOUT_SECONDS`: Lock timeout in seconds (default: 300)

## Removal

### Step 1: Remove Job Wrappers

Remove `safeCronExecute` wrappers from your cron jobs.

### Step 2: Remove KEY Directory

```bash
rm -rf ./node-keys/safe-cron-execution
```

## License

MIT
