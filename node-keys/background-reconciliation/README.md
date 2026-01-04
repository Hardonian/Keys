# Background Reconciliation Job Key

## What This KEY Unlocks

Unlocks automated background reconciliation of subscription data with Stripe.

This KEY provides:
- Scheduled background job for data reconciliation
- Stripe API integration for subscription data
- Tenant-isolated processing
- Graceful error handling

## Installation

### Step 1: Copy KEY to Your Project

```bash
cp -r node-keys/background-reconciliation ./node-keys/
```

### Step 2: Install Dependencies

```bash
npm install stripe
```

### Step 3: Configure Environment Variables

Add to your `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
```

## Usage

### Register with Job Runner

```typescript
// jobs/reconciliation.ts
import { reconciliationJob } from '@/node-keys/background-reconciliation/src';
import cron from 'node-cron';

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await reconciliationJob();
});
```

### Direct Execution

```typescript
import { reconciliationJob } from '@/node-keys/background-reconciliation/src';

await reconciliationJob();
```

## Configuration

### Required Environment Variables

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `DATABASE_URL`: Database connection string

### Optional Environment Variables

- `RECONCILIATION_SCHEDULE`: Cron schedule (default: daily at 2 AM)
- `EMAIL_NOTIFICATION_ENABLED`: Enable email notifications (default: false)

## Removal

### Step 1: Remove Job Registration

Remove the job registration from your job runner.

### Step 2: Remove KEY Directory

```bash
rm -rf ./node-keys/background-reconciliation
```

## License

MIT
