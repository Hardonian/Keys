# Deployment Guide

## Local Development

### Prerequisites
- Node.js 20+
- npm (or pnpm for CI parity)
- Supabase project (for auth + data) and Stripe credentials (for billing flows)

### Install
```bash
npm install
```

### Run (Frontend + Backend)
```bash
npm run dev
```

### Environment
Copy `.env.example` to `.env` and populate:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `REQUEST_SIGNING_SECRET`
- `CORS_ORIGINS`

## Production Deployment

### Frontend (Next.js)
```bash
cd frontend
npm run build
npm run start
```

### Backend (Express)
```bash
cd backend
npm run build
npm run start
```

### Required Environment Variables (Backend)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `REQUEST_SIGNING_SECRET`
- `CORS_ORIGINS`
- `REDIS_URL` (optional, improves cache/rate-limit scaling)
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` (optional overrides)
- `WEBHOOK_RATE_LIMIT_WINDOW_MS`, `WEBHOOK_RATE_LIMIT_MAX_REQUESTS` (optional overrides)

### Health Check
- `GET /health` returns status, timestamp, environment, and version.

### Stripe Webhook
- Ensure the webhook endpoint is configured to send raw JSON and is signed.
- Endpoint: `POST /billing/webhook`.
