# CI/CD Setup Guide

This document provides a comprehensive guide to the automated CI/CD pipeline setup for the System Prompts - Cursor Companion project.

## 🎯 Overview

The CI/CD pipeline includes:
- ✅ Automated testing and linting
- ✅ Code review automation
- ✅ Vercel preview deployments on PRs
- ✅ Vercel production deployments
- ✅ Security scanning
- ✅ Dependency management with Dependabot
- ✅ PR status tracking
- ✅ Documentation automation

## 📋 Prerequisites

Before using the CI/CD workflows, ensure you have:

1. **GitHub Repository** with Actions enabled
2. **Vercel Account** (for deployments)
3. **Required GitHub Secrets** configured (see below)

## 🔐 Required GitHub Secrets

### Vercel Configuration
Add these secrets in GitHub Settings → Secrets and variables → Actions:

```
VERCEL_TOKEN          # Get from Vercel Dashboard → Settings → Tokens
VERCEL_ORG_ID         # Get from Vercel Dashboard → Settings → General
VERCEL_PROJECT_ID     # Get from Vercel project settings
```

### Application Secrets
```
SUPABASE_URL                      # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY         # Supabase service role key
NEXT_PUBLIC_SUPABASE_URL          # Public Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Public Supabase anonymous key
SNYK_TOKEN                        # Optional: Snyk API token for security scanning
```

## 🚀 Quick Start

### 1. Configure Vercel

1. Link your repository to Vercel:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link project (run from frontend directory)
   cd frontend
   vercel link
   ```

2. Get your Vercel credentials:
   - **VERCEL_TOKEN**: Create at https://vercel.com/account/tokens
   - **VERCEL_ORG_ID**: Found in Vercel Dashboard → Settings → General
   - **VERCEL_PROJECT_ID**: Found in project settings → General

### 2. Set Up GitHub Secrets

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add all required secrets listed above
3. Verify secrets are set correctly

### 3. Enable GitHub Actions

1. Go to repository Settings → Actions → General
2. Ensure "Allow all actions and reusable workflows" is selected
3. Enable "Read and write permissions" for workflows

### 4. Test the Pipeline

1. Create a test PR:
   ```bash
   git checkout -b test-ci-cd
   git commit --allow-empty -m "test: CI/CD pipeline"
   git push origin test-ci-cd
   ```

2. Open a PR and verify:
   - ✅ CI workflow runs
   - ✅ Code review comment appears
   - ✅ Vercel preview deploys
   - ✅ PR status table updates

## 📊 Workflow Details

### CI Pipeline (`ci.yml`)

**Runs on:** Push to main/develop, Pull Requests

**What it does:**
- Lints backend and frontend code
- Type checks TypeScript code
- Runs tests with coverage
- Builds frontend for production
- Scans for security vulnerabilities
- Uploads coverage to Codecov

**Duration:** ~5-10 minutes

### Vercel Preview (`vercel-preview.yml`)

**Runs on:** Pull Request events

**What it does:**
- Deploys preview environment for each PR
- Comments PR with preview URL
- Cleans up preview when PR closes

**Duration:** ~3-5 minutes

### Vercel Production (`vercel-production.yml`)

**Runs on:** Push to main, Manual dispatch

**What it does:**
- Deploys to production environment
- Creates deployment status
- Can be triggered manually

**Duration:** ~5-8 minutes

### Code Review (`code-review.yml`)

**Runs on:** Pull Request events

**What it does:**
- Analyzes code for linting issues
- Checks TypeScript types
- Detects security issues
- Calculates code metrics
- Posts review comment on PR

**Duration:** ~3-5 minutes

### PR Status (`pr-status.yml`)

**Runs on:** PR events, Workflow completion

**What it does:**
- Creates status table in PR comments
- Updates automatically on workflow completion
- Shows links to all checks

**Duration:** ~1 minute

## 🔄 Dependabot Configuration

Dependabot is configured to:
- Check for updates weekly (Mondays at 9 AM)
- Create PRs for patch and minor updates
- Auto-merge safe updates after CI passes
- Group related dependencies

**Configuration:** `.github/dependabot.yml`

## 🏷️ Automatic Labeling

PRs are automatically labeled based on changed files:
- `backend` - Backend code changes
- `frontend` - Frontend code changes
- `ci-cd` - Workflow changes
- `documentation` - Docs changes
- `dependencies` - Dependency updates
- `security` - Security-related changes

**Configuration:** `.github/labeler.yml`

## 📈 Monitoring & Maintenance

### Viewing Workflow Runs

1. Go to repository → Actions tab
2. Click on any workflow to see runs
3. Click on a run to see detailed logs

### Workflow Status Badge

Add to your README.md:
```markdown
![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI/badge.svg)
```

### Cleanup

The `cleanup.yml` workflow automatically:
- Deletes workflow runs older than 30 days
- Removes artifacts older than 7 days
- Runs weekly on Sundays

## 🐛 Troubleshooting

### Workflow Not Running

1. Check Actions are enabled: Settings → Actions → General
2. Verify workflow file syntax is correct
3. Check branch protection rules

### Vercel Deployment Fails

1. Verify `VERCEL_TOKEN` is valid
2. Check `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct
3. Ensure Vercel project is linked to repository
4. Check Vercel dashboard for detailed error logs

### Tests Failing

1. Check test logs in Actions tab
2. Verify environment variables are set
3. Ensure database migrations are applied
4. Check for flaky tests

### Code Review Not Posting

1. Verify workflow has `pull-requests: write` permission
2. Check GitHub token permissions
3. Review workflow logs for errors

## 🔒 Security Best Practices

1. **Never commit secrets** - Always use GitHub Secrets
2. **Review Dependabot PRs** - Especially major version updates
3. **Monitor security scans** - Address high-severity issues promptly
4. **Use branch protection** - Require PR reviews and CI checks
5. **Regular updates** - Keep actions and dependencies updated

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Workflow README](.github/workflows/README.md)

## 🎉 Success Indicators

Your CI/CD pipeline is working correctly when:

✅ PRs automatically get preview deployments  
✅ CI checks pass before merging  
✅ Code review comments appear on PRs  
✅ Production deploys automatically on merge to main  
✅ Dependabot creates PRs for updates  
✅ PRs are automatically labeled  

## 📝 Next Steps

1. ✅ Configure all required secrets
2. ✅ Test with a sample PR
3. ✅ Set up branch protection rules
4. ✅ Configure Codecov (optional)
5. ✅ Set up monitoring/alerting (optional)
6. ✅ Customize workflows for your needs

---

**Need Help?** Check the [Workflow README](.github/workflows/README.md) for detailed workflow documentation.
