#!/bin/bash

# CI/CD Setup Verification Script
# This script helps verify that the CI/CD pipeline is properly configured

set -e

echo "🔍 Verifying CI/CD Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Git repository detected${NC}"
echo ""

# Check workflow files
echo "📋 Checking workflow files..."
WORKFLOWS=(
    ".github/workflows/ci.yml"
    ".github/workflows/vercel-preview.yml"
    ".github/workflows/vercel-production.yml"
    ".github/workflows/code-review.yml"
    ".github/workflows/pr-status.yml"
)

for workflow in "${WORKFLOWS[@]}"; do
    if [ -f "$workflow" ]; then
        echo -e "${GREEN}✅ $workflow exists${NC}"
    else
        echo -e "${RED}❌ $workflow is missing${NC}"
    fi
done

echo ""

# Check configuration files
echo "⚙️  Checking configuration files..."
CONFIGS=(
    ".github/dependabot.yml"
    ".github/labeler.yml"
    "frontend/vercel.json"
)

for config in "${CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        echo -e "${GREEN}✅ $config exists${NC}"
    else
        echo -e "${YELLOW}⚠️  $config is missing (may be optional)${NC}"
    fi
done

echo ""

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI (gh) is installed${NC}"
    
    # Check if authenticated
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✅ GitHub CLI is authenticated${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub CLI is not authenticated. Run: gh auth login${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) is not installed (optional)${NC}"
fi

echo ""

# Check if Vercel CLI is available
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI is installed${NC}"
    
    # Check if authenticated
    if vercel whoami &> /dev/null; then
        echo -e "${GREEN}✅ Vercel CLI is authenticated${NC}"
        echo "   Authenticated as: $(vercel whoami)"
    else
        echo -e "${YELLOW}⚠️  Vercel CLI is not authenticated. Run: vercel login${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Vercel CLI is not installed (optional for local testing)${NC}"
fi

echo ""

# Check package.json files
echo "📦 Checking package.json files..."
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ Root package.json exists${NC}"
fi
if [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✅ Frontend package.json exists${NC}"
fi
if [ -f "backend/package.json" ]; then
    echo -e "${GREEN}✅ Backend package.json exists${NC}"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Setup Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To verify GitHub secrets are configured:"
echo "  1. Go to: https://github.com/YOUR_REPO/settings/secrets/actions"
echo "  2. Verify these secrets are set:"
echo "     - VERCEL_TOKEN"
echo "     - VERCEL_ORG_ID"
echo "     - VERCEL_PROJECT_ID"
echo "     - SUPABASE_URL (optional for CI)"
echo "     - NEXT_PUBLIC_SUPABASE_URL (required for builds)"
echo ""
echo "To test the pipeline:"
echo "  1. Create a test branch: git checkout -b test-ci-cd"
echo "  2. Make a small change and commit"
echo "  3. Push and create a PR"
echo "  4. Check the Actions tab for workflow runs"
echo ""
echo "For more information, see:"
echo "  - CI_CD_SETUP.md"
echo "  - .github/workflows/README.md"
echo ""
