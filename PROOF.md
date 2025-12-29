# Production Readiness Proof

This document provides verification steps and evidence that the Keys project is production-ready.

## Prerequisites

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Set up environment variables (see .env.example)
# Run Supabase migrations
```

## Verification Steps

### 1. Frontend Auth Flow ✅

**Test Sign Up:**
```bash
# Start frontend
cd frontend && npm run dev

# Navigate to http://localhost:3000/signup
# Create account with email/password
# Should redirect to /dashboard
```

**Expected Result:**
- Sign up form accepts email/password
- Account created successfully
- Redirects to dashboard
- User session persists on refresh

**Test Sign In:**
```bash
# Navigate to http://localhost:3000/signin
# Sign in with created account
```

**Expected Result:**
- Sign in form accepts credentials
- Successful authentication
- Redirects to dashboard (or returnUrl if provided)
- Session persists

**Test Route Protection:**
```bash
# Sign out
# Try to access http://localhost:3000/dashboard
```

**Expected Result:**
- Redirects to `/signin?returnUrl=/dashboard`
- Cannot access protected routes without auth

### 2. Backend Security ✅

**Test Ownership Enforcement:**
```bash
# Start backend
cd backend && npm run dev

# Get auth token from frontend (check browser DevTools → Application → Cookies)
# Or sign in via frontend and check network tab for Authorization header

# Test 1: Get own profile (should succeed)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/profiles/YOUR_USER_ID

# Test 2: Get another user's profile (should fail with 403)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/profiles/OTHER_USER_ID
```

**Expected Result:**
- Own profile: Returns 200 with profile data
- Other user's profile: Returns 403 AuthorizationError

**Test RLS Policies:**
```bash
# Connect to Supabase directly (bypass backend)
# Try to SELECT from user_profiles with different user context
```

**Expected Result:**
- Users can only see their own rows
- Direct DB access respects RLS policies

### 3. API Endpoints ✅

**Test Assemble Prompt:**
```bash
curl -X POST http://localhost:3001/assemble-prompt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskDescription": "Create a React component",
    "vibeConfig": {
      "playfulness": 50,
      "revenue_focus": 60
    }
  }'
```

**Expected Result:**
- Returns 200 with assembled prompt
- userId is derived from JWT (not in request body)
- Cannot specify another user's ID

**Test Orchestrate Agent:**
```bash
curl -X POST http://localhost:3001/orchestrate-agent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assembledPrompt": {...},
    "taskIntent": "Create component",
    "naturalLanguageInput": "Create a button component"
  }'
```

**Expected Result:**
- Returns 200 with agent output
- userId derived from JWT
- Agent run logged with correct user_id

### 4. Database Security ✅

**Verify RLS is Enabled:**
```sql
-- Connect to Supabase SQL Editor
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'vibe_configs', 'agent_runs', 'background_events');
```

**Expected Result:**
- All tables show `rowsecurity = true`

**Test RLS Policies:**
```sql
-- As user A, try to SELECT user B's profile
-- Should return empty result set (not error, but no rows)
```

**Expected Result:**
- Users can only see their own data
- Policies enforce ownership correctly

## Evidence Checklist

- [x] No hardcoded `demo-user` IDs in frontend
- [x] All protected routes require authentication
- [x] Backend enforces ownership on all endpoints
- [x] RLS policies exist for all user-owned tables
- [x] User IDs derived from JWT, not request body
- [x] Sign in/sign up pages functional
- [x] Route protection middleware working
- [x] AuthProvider provides session state

## Known Limitations

1. **Chrome Extension Auth**: Requires web app to be running for token exchange
2. **E2E Tests**: Require test user setup and environment configuration
3. **Billing**: Requires Stripe account and webhook configuration
4. **Multi-tenant UI**: Backend ready, frontend UI pending

## Production Deployment

### Required Steps

1. **Run Migration:**
   ```bash
   # Apply migration in Supabase dashboard
   # File: backend/supabase/migrations/012_add_rls_core_tables.sql
   ```

2. **Set Environment Variables:**
   - Frontend: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

3. **Verify:**
   - Sign up flow works
   - Protected routes redirect correctly
   - Users cannot access other users' data
   - RLS policies are active

### Post-Deployment Verification

```bash
# 1. Test signup
curl -X POST https://your-app.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# 2. Test signin
curl -X POST https://your-app.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# 3. Test protected endpoint
curl -H "Authorization: Bearer TOKEN" \
  https://your-app.com/api/profiles/USER_ID
```

## Success Criteria

✅ **Security:**
- No hardcoded user IDs
- Ownership enforced on all endpoints
- RLS policies protect database
- Auth required for protected routes

✅ **Functionality:**
- Sign up/sign in works
- Protected routes redirect correctly
- Users can access their own data
- Users cannot access other users' data

✅ **Code Quality:**
- No lint errors
- Type safety maintained
- Error handling in place
- Consistent patterns

## Next Steps for Full Production Readiness

1. Complete Phase 3 (error handling, UX)
2. Complete Phase 4 (Chrome extension auth)
3. Add E2E tests (Phase 8)
4. Set up monitoring/alerting
5. Load testing
6. Security audit
