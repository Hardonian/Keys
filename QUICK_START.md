# Quick Start Guide - Getting Everything Running

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose (optional, for Redis)
- Supabase account and database

## Step 1: Install Dependencies

```bash
# Root level
npm install

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

## Step 2: Set Up Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit .env and fill in:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - OPENAI_API_KEY (or ANTHROPIC_API_KEY)
# - SENTRY_DSN (optional)
# - REDIS_URL (optional, defaults to localhost:6379)
```

## Step 3: Set Up Database

1. Apply migrations to your Supabase database:
   - `001_create_user_profiles.sql`
   - `002_create_prompt_atoms.sql`
   - `003_create_vibe_configs.sql`
   - `004_create_agent_runs.sql`
   - `005_create_background_events.sql`
   - `006_add_indexes.sql` (NEW)
   - `007_add_constraints.sql` (NEW)

2. Run seed data:
   ```sql
   -- Run backend/supabase/seed.sql in Supabase SQL editor
   ```

## Step 4: Start Redis (Optional but Recommended)

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or use docker-compose
cd backend
docker-compose up redis -d
```

## Step 5: Verify Type Checking

```bash
# Backend
cd backend
npm run type-check

# Frontend
cd frontend
npm run type-check
```

## Step 6: Run Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Step 7: Start Development Servers

### Option 1: Using Root Scripts
```bash
npm run dev
```

### Option 2: Individual Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Option 3: Docker Compose
```bash
cd backend
docker-compose up
```

## Step 8: Verify Everything Works

1. **Health Check**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Frontend**
   - Open http://localhost:3000
   - Should see the chat interface

3. **WebSocket**
   - Connect to `ws://localhost:3001/ws?userId=test-user`
   - Should receive connection confirmation

## Common Issues

### TypeScript Not Found
```bash
# Make sure dependencies are installed
npm install
```

### Redis Connection Error
- Redis is optional - caching will gracefully degrade
- Set `REDIS_URL` in `.env` or leave unset

### Supabase Connection Error
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Check Supabase dashboard for correct values

### Port Already in Use
- Backend default: 3001
- Frontend default: 3000
- Change in `.env` or `package.json` scripts

## Production Deployment

### Build
```bash
npm run build
```

### Start Production
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm start
```

### Docker Production
```bash
cd backend
docker-compose -f docker-compose.prod.yml up -d
```

## Next Steps

1. Set up GitHub Actions secrets for CI/CD
2. Configure Sentry for error tracking
3. Set up production Redis instance
4. Configure production Supabase database
5. Set up monitoring and alerts
6. Review and customize rate limits
7. Set up SSL/TLS certificates
8. Configure domain and DNS

---

**All infrastructure is in place. Just install dependencies, configure environment variables, and you're ready to go!**
