# Quick Start

## Prerequisites

- Node.js 18+
- Supabase project
- Database access

## Quick Install

```bash
npm install @supabase/supabase-js
```

Copy `node-keys/supabase-rls-guard` to your project.

## Basic Usage

### 1. Configure Environment

```bash
# .env.local
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Run Migration

```typescript
import { createRLSPolicies } from '@/node-keys/supabase-rls-guard/src';

await createRLSPolicies();
```

## Next Steps

See [README.md](./README.md) for full documentation.
