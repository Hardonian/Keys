# CI/CD Workflows Documentation

This directory contains all GitHub Actions workflows for automated CI/CD, code review, and deployment.

## Workflows Overview

### 🔄 CI (`ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests, Manual dispatch

**Jobs:**
- **Backend CI**: Lint, type-check, test backend with PostgreSQL and Redis services
- **Frontend CI**: Lint, type-check, test, and build Next.js frontend
- **Security Scan**: Snyk security scanning and npm audit for both frontend and backend
- **CI Summary**: Aggregates results from all jobs

**Features:**
- Parallel job execution for faster CI
- Caching for node_modules and Next.js builds
- Test coverage upload to Codecov
- Artifact uploads for test results and builds
- Timeout protection (15 minutes per job)

### 🚀 Vercel Preview Deployment (`vercel-preview.yml`)
**Triggers:** Pull Request events (opened, synchronize, reopened, closed)

**Features:**
- Automatic preview deployment for every PR
- PR comment with preview URL
- Automatic cleanup when PR is closed
- Uses Vercel CLI for deployments

**Required Secrets:**
- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### 🏭 Vercel Production Deployment (`vercel-production.yml`)
**Triggers:** Push to `main`, Manual dispatch

**Features:**
- Production deployment to Vercel
- Deployment status tracking
- Manual deployment option with environment selection

**Required Secrets:**
- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### 🤖 Automated Code Review (`code-review.yml`)
**Triggers:** Pull Request events (opened, synchronize, reopened)

**Features:**
- ESLint analysis for frontend and backend
- TypeScript type checking analysis
- Security checks (secret detection, dependency vulnerabilities)
- Code quality metrics (files changed, lines added/removed, large files)
- Test coverage reporting
- Automatic PR comment with review summary

### 📊 PR Status Summary (`pr-status.yml`)
**Triggers:** Pull Request events, Workflow completion

**Features:**
- Real-time status table for all CI/CD checks
- Links to workflow runs and preview deployments
- Automatic updates on workflow completion
- Visual status indicators (✅ ❌ 🔄 ⏳)

### 🔄 Dependabot Auto-merge (`dependabot-auto-merge.yml`)
**Triggers:** Pull Request opened/synchronized by Dependabot

**Features:**
- Automatic merging of patch and minor updates
- CI check validation before merging
- Squash merge strategy

### 📚 Documentation Updates (`docs.yml`)
**Triggers:** Push to `main` (docs changes), Manual dispatch

**Features:**
- Markdown linting validation
- Broken link detection
- Automatic documentation index generation

### 🏷️ Labeler (`label.yml`)
**Triggers:** Pull Request events

**Features:**
- Automatic PR labeling based on changed files
- Labels: `backend`, `frontend`, `ci-cd`, `documentation`, `dependencies`, etc.

## Required GitHub Secrets

### CI/CD Secrets
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public Supabase anonymous key
- `SNYK_TOKEN`: Snyk API token (optional)

### Vercel Secrets
- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

## Workflow Dependencies

```
┌─────────────────┐
│   PR Created    │
└────────┬────────┘
         │
         ├──► Labeler (auto-label)
         ├──► CI (lint, test, build)
         ├──► Code Review (analysis)
         ├──► Vercel Preview (deploy)
         └──► PR Status (summary)
              │
              └──► Updates on completion
```

## Best Practices

1. **Always check PR status table** before merging
2. **Review automated code review comments** for issues
3. **Test preview deployments** before merging to main
4. **Monitor security scans** for vulnerabilities
5. **Keep dependencies updated** via Dependabot

## Troubleshooting

### Vercel Deployment Fails
- Check that `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are set
- Verify Vercel project is linked to the repository
- Check Vercel dashboard for deployment logs

### CI Tests Fail
- Check test logs in GitHub Actions
- Verify environment variables are set correctly
- Ensure database migrations are up to date

### Code Review Not Posting
- Check workflow permissions (needs `pull-requests: write`)
- Verify GitHub token has correct permissions
- Check workflow logs for errors

## Workflow Optimization

- **Caching**: Node modules and Next.js builds are cached for faster runs
- **Parallel Jobs**: Backend, frontend, and security run in parallel
- **Conditional Steps**: Steps skip on errors where appropriate
- **Artifact Retention**: Test results and builds retained for 7 days

## Maintenance

- Review workflow logs monthly for optimization opportunities
- Update action versions quarterly
- Monitor workflow execution times
- Review and update Dependabot configuration as needed
