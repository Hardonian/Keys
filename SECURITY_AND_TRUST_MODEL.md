# Security & Trust Model

**Last Updated:** $(date)  
**Purpose:** Explicit documentation of what this tool does, doesn't do, and how it handles data.

---

## Threat Model

### What Data Is Read

**User Profile Data:**
- Role (e.g., "CTO", "EM", "Developer")
- Stack (e.g., React, Node.js, Supabase)
- Vertical (e.g., "SaaS", "E-commerce")
- Stored in: Supabase database (`user_profiles` table)
- Access: Only by authenticated user (RLS enforced)

**Chat History:**
- Messages sent by user
- AI-generated outputs
- Stored in: Supabase database (`agent_runs` table)
- Access: Only by authenticated user (RLS enforced)

**Vibe Configuration:**
- Output style preferences (playfulness, revenue focus, etc.)
- Stored in: Supabase database (`vibe_configs` table)
- Access: Only by authenticated user (RLS enforced)

### What Is Never Written

**This tool cannot and will not:**
- ❌ Write code files
- ❌ Modify repository files
- ❌ Access your file system
- ❌ Execute commands or scripts
- ❌ Make changes to your codebase
- ❌ Access external systems (except LLM APIs)

**Read-Only Mode:**
This tool operates in read-only mode. It never writes to your codebase, repositories, or files. It is safe to use in production environments.

### What Is Logged

**For History & Analytics:**
- Chat messages (stored in `agent_runs` table)
- Agent runs (for analytics and history)
- Usage metrics (for billing and limits)

**For Debugging:**
- Errors (with request IDs)
- Performance metrics (latency, token usage)
- Sent to: Sentry (error tracking)

**What Is NOT Logged:**
- ❌ Passwords or authentication tokens
- ❌ API keys or secrets
- ❌ Sensitive business data (beyond what user explicitly inputs)

### Permission Scope

**What This Tool Can Do:**
- ✅ Read user's own profile and chat history
- ✅ Write user's own chat history and runs
- ✅ Send user input to LLM providers (OpenAI/Anthropic)
- ✅ Store outputs in user's account

**What This Tool Cannot Do:**
- ❌ Access external systems (except LLM APIs)
- ❌ Read files from your file system
- ❌ Access your repositories
- ❌ Execute commands
- ❌ Make network calls (except to LLM providers)

### Third-Party Data Sharing

**LLM API Calls:**
- User input is sent to LLM providers (OpenAI, Anthropic, etc.)
- This is necessary for generating outputs
- LLM providers have their own privacy policies
- No other data is shared with third parties

**No Data Sold or Shared:**
- ❌ We do not sell user data
- ❌ We do not share user data with third parties (except LLM APIs)
- ❌ We do not use user data for training models (except as needed for the service)

---

## Deterministic Behavior Guarantees

### Same Input = Same Output (Within LLM Variance)

- Same user input + same profile + same vibe config = similar output
- LLM outputs may vary slightly due to model randomness
- Prompt assembly is deterministic (same inputs = same prompt)

### No Side Effects

- ✅ Read-only: No file system operations
- ✅ No external API calls (except LLM)
- ✅ No command execution
- ✅ No repository access

### No External Dependencies (Except LLM)

- ✅ No calls to GitHub, GitLab, or other code repositories
- ✅ No calls to external APIs (except LLM providers)
- ✅ No file system access
- ✅ No network access (except LLM APIs)

---

## Data Flow

```
User Input
  ↓
Frontend (Next.js)
  ↓
Backend API (Express)
  ↓
Prompt Assembly Service
  ├─ Reads: User profile, vibe config, prompt atoms
  └─ Outputs: Assembled prompt
  ↓
LLM Service
  ├─ Sends: User input + assembled prompt
  └─ Receives: AI-generated output
  ↓
Backend API
  ├─ Stores: Chat history, run metadata
  └─ Returns: Structured output
  ↓
Frontend
  └─ Displays: Output to user
```

**Data Storage:**
- Supabase (PostgreSQL): User profiles, chat history, runs
- No local storage of sensitive data
- No caching of user data (except temporary Redis cache for performance)

---

## Security Measures

### Authentication
- Supabase Auth (JWT-based)
- Session management via cookies
- Row-level security (RLS) on all user-owned tables

### Authorization
- Users can only access their own data
- RLS policies enforce tenant isolation
- Backend middleware validates ownership

### Input Validation
- Zod schemas validate all inputs
- TypeScript enforces type safety
- Rate limiting prevents abuse

### Error Handling
- Errors are logged (not exposed to users)
- No sensitive data in error messages
- Request IDs for tracing

---

## Compliance

### GDPR
- Users can request data deletion
- Users can export their data
- No data sharing without consent

### SOC 2 (Future)
- Not yet certified
- Working toward compliance

---

## What If Something Goes Wrong?

### If Data Is Breached
1. Immediate notification to affected users
2. Investigation and remediation
3. Transparent communication

### If LLM Provider Has Issue
1. Fallback to alternative provider (if configured)
2. Error message to user
3. No data loss (chat history preserved)

### If Service Is Down
1. No data loss (all data stored in Supabase)
2. Service restoration priority
3. Status page updates

---

## Questions?

If you have questions about security or data handling, please contact: [security@yourdomain.com]

---

*This document is updated as the product evolves. Last review: $(date)*
