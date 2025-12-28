# CI/CD Quick Reference

## 🚀 Quick Commands

### View Workflow Status
```bash
# View all workflows
gh workflow list

# View workflow runs
gh run list

# View specific workflow
gh run view <run-id>
```

### Trigger Manual Deployment
1. Go to Actions → Vercel Production Deployment
2. Click "Run workflow"
3. Select branch and environment

### Check PR Status
- View PR comments for status table
- Check Actions tab for workflow runs
- Review automated code review comments

## 📋 Workflow Triggers

| Workflow | Trigger | Frequency |
|----------|---------|-----------|
| CI | Push/PR | Every commit |
| Vercel Preview | PR events | Every PR |
| Vercel Production | Push to main | On merge |
| Code Review | PR events | Every PR |
| PR Status | PR/Workflow | On events |
| Dependabot | Schedule | Weekly |
| Cleanup | Schedule | Weekly |
| Docs | Push to main | On merge |

## 🔍 Common Issues

### Workflow Not Running
- Check Actions enabled in repo settings
- Verify workflow file syntax
- Check branch protection rules

### Deployment Failed
- Verify Vercel secrets are set
- Check Vercel project is linked
- Review Vercel dashboard logs

### Tests Failing
- Check test logs in Actions
- Verify environment variables
- Ensure dependencies installed

## 📞 Support

- **Workflow Issues**: Check `.github/workflows/README.md`
- **Setup Help**: See `CI_CD_SETUP.md`
- **Full Summary**: See `AUTOMATION_SUMMARY.md`
