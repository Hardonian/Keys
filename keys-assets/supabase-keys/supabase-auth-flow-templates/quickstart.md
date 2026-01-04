# Quick Start: Supabase Auth Flow Templates

Get authentication working in 5 minutes.

---

## Step 1: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

---

## Step 2: Set Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Step 3: Copy Templates

```bash
cp frontend/*.tsx /path/to/your/components/auth/
```

---

## Step 4: Run Migration

In Supabase SQL Editor, run:

```sql
-- Copy contents of migrations/001_auth_setup.sql
```

---

## Step 5: Use Components

```typescript
import { SignUpForm } from './components/auth/signup';
import { SignInForm } from './components/auth/signin';

// In your pages
<SignUpForm />
<SignInForm />
```

---

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Customize components for your design
- Configure email templates in Supabase Dashboard

---

**That's it!** Authentication is ready to use.
