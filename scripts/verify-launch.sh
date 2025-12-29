#!/bin/bash
# Pre-Launch Verification Script
# Run this before deploying to production

set -e

echo "🚀 Launch Readiness Verification"
echo "================================"
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $1"
    else
        echo -e "${RED}❌${NC} $1"
        ERRORS=$((ERRORS + 1))
    fi
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

echo "1. Environment Variables"
echo "------------------------"

# Check backend env vars
if [ -f "backend/.env" ]; then
    source backend/.env
    [ -n "$SUPABASE_URL" ] && check "SUPABASE_URL is set" || warn "SUPABASE_URL not set"
    [ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && check "SUPABASE_SERVICE_ROLE_KEY is set" || warn "SUPABASE_SERVICE_ROLE_KEY not set"
    [ -n "$FRONTEND_URL" ] && check "FRONTEND_URL is set" || warn "FRONTEND_URL not set (needed for billing redirects)"
else
    warn "backend/.env file not found"
fi

# Check frontend env vars
if [ -f "frontend/.env.local" ] || [ -f "frontend/.env" ]; then
    [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && check "NEXT_PUBLIC_SUPABASE_URL is set" || warn "NEXT_PUBLIC_SUPABASE_URL not set"
    [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] && check "NEXT_PUBLIC_SUPABASE_ANON_KEY is set" || warn "NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
    [ -n "$NEXT_PUBLIC_API_BASE_URL" ] && check "NEXT_PUBLIC_API_BASE_URL is set" || warn "NEXT_PUBLIC_API_BASE_URL not set"
else
    warn "frontend/.env file not found"
fi

echo ""
echo "2. Dependencies"
echo "---------------"

if [ -d "backend/node_modules" ]; then
    check "Backend dependencies installed"
else
    warn "Backend dependencies not installed (run: cd backend && npm install)"
fi

if [ -d "frontend/node_modules" ]; then
    check "Frontend dependencies installed"
else
    warn "Frontend dependencies not installed (run: cd frontend && npm install)"
fi

echo ""
echo "3. Type Checking"
echo "----------------"

if command -v npm &> /dev/null; then
    cd backend
    if npm run type-check &> /dev/null; then
        check "Backend type check passes"
    else
        warn "Backend type check failed (run: cd backend && npm run type-check)"
    fi
    cd ..
    
    cd frontend
    if npm run type-check &> /dev/null; then
        check "Frontend type check passes"
    else
        warn "Frontend type check failed (run: cd frontend && npm run type-check)"
    fi
    cd ..
else
    warn "npm not found, skipping type checks"
fi

echo ""
echo "4. Build Verification"
echo "--------------------"

if command -v npm &> /dev/null; then
    cd backend
    if npm run build &> /dev/null; then
        check "Backend builds successfully"
    else
        warn "Backend build failed (run: cd backend && npm run build)"
    fi
    cd ..
    
    cd frontend
    if npm run build &> /dev/null; then
        check "Frontend builds successfully"
    else
        warn "Frontend build failed (run: cd frontend && npm run build)"
    fi
    cd ..
else
    warn "npm not found, skipping builds"
fi

echo ""
echo "5. Database Migrations"
echo "----------------------"
echo "⚠️  Manual check required:"
echo "   - Verify all migrations are applied in Supabase dashboard"
echo "   - Check migration files: backend/supabase/migrations/"
echo "   - Verify RLS policies are enabled"

echo ""
echo "6. Stripe Configuration"
echo "----------------------"

if [ -n "$STRIPE_SECRET_KEY" ]; then
    check "STRIPE_SECRET_KEY is set"
    [ -n "$STRIPE_WEBHOOK_SECRET" ] && check "STRIPE_WEBHOOK_SECRET is set" || warn "STRIPE_WEBHOOK_SECRET not set (billing webhooks won't work)"
    echo "⚠️  Manual check required:"
    echo "   - Verify webhook URL is configured in Stripe dashboard"
    echo "   - Test webhook endpoint receives events"
else
    warn "STRIPE_SECRET_KEY not set (billing features disabled)"
fi

echo ""
echo "7. Security Checks"
echo "-----------------"

# Check for hardcoded secrets (basic check)
if grep -r "password.*=.*['\"].*[a-zA-Z0-9]" backend/src --include="*.ts" 2>/dev/null | grep -v "//" | grep -v "example" > /dev/null; then
    warn "Potential hardcoded passwords found (review manually)"
else
    check "No obvious hardcoded passwords found"
fi

# Check for localhost in production code
if grep -r "localhost:3001" backend/src --include="*.ts" 2>/dev/null | grep -v "//" | grep -v "example" > /dev/null; then
    warn "localhost URLs found in backend code (may be acceptable for local LLM)"
else
    check "No hardcoded localhost URLs in backend"
fi

echo ""
echo "================================"
echo "Summary"
echo "================================"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for launch.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Some warnings found. Review before launch.${NC}"
    exit 0
else
    echo -e "${RED}❌ Errors found. Fix before launch.${NC}"
    exit 1
fi
