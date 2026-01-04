# Quick Start

## Prerequisites

- Node.js 18+
- Stripe account
- Job runner (node-cron, Bull, etc.)

## Quick Install

```bash
npm install stripe
```

Copy `node-keys/background-reconciliation` to your project.

## Basic Usage

### 1. Configure Environment

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
```

### 2. Register Job

```typescript
import { reconciliationJob } from '@/node-keys/background-reconciliation/src';
import cron from 'node-cron';

cron.schedule('0 2 * * *', reconciliationJob);
```

## Next Steps

See [README.md](./README.md) for full documentation.
