# Quick Start: Supabase Real-time Subscriptions

Get real-time subscriptions working in 3 minutes.

---

## Step 1: Install

```bash
npm install @supabase/supabase-js
```

---

## Step 2: Enable Realtime

In Supabase Dashboard:
1. Go to Database > Replication
2. Enable replication for your table

---

## Step 3: Subscribe

```typescript
import { subscribeToTable } from './realtime';

const channel = subscribeToTable('messages', (payload) => {
  console.log('New message:', payload);
});
```

---

**That's it!** Real-time subscriptions are working.
