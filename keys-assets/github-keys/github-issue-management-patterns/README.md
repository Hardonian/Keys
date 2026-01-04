# GitHub Keys: Issue Management Patterns

**Version**: 1.0.0  
**Tool**: GitHub  
**Maturity**: Operator  
**Outcome**: Automation

---

## What This Key Unlocks

Issue management automation for GitHub. This key unlocks:

- **Issue Labeling**: Automatic labeling based on content
- **Issue Triage**: Automated triage workflows
- **PR Review Assignment**: Automatic reviewer assignment
- **Issue Linking**: Link related issues automatically
- **Project Board Automation**: Update project boards

---

## Installation

Copy workflows to `.github/workflows/`:

```bash
cp .github/workflows/* /path/to/your/repo/.github/workflows/
```

---

## Included Workflows

### Issue Labeler
Automatically labels issues based on content and file paths.

### Issue Triage
Automatically triages issues and adds appropriate labels.

### PR Review Assignment
Assigns reviewers based on changed files.

---

## Usage

Workflows run automatically on:
- Issue opened/edited
- Pull request opened/updated

---

## License

MIT
