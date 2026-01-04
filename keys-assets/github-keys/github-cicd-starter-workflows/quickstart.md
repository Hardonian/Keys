# Quick Start: GitHub CI/CD Starter Workflows

Get CI/CD automation set up in 2 minutes.

---

## Step 1: Copy Workflows

Copy the workflow files to your repository:

```bash
# If cloning this key
cp -r .github/workflows/* /path/to/your/repo/.github/workflows/

# Or manually copy individual workflows you need
```

---

## Step 2: Choose Your Workflow

### For Node.js Projects

Copy `nodejs-ci.yml`:
```bash
cp .github/workflows/nodejs-ci.yml /path/to/your/repo/.github/workflows/
```

### For Python Projects

Copy `python-ci.yml`:
```bash
cp .github/workflows/python-ci.yml /path/to/your/repo/.github/workflows/
```

### For Docker Projects

Copy `docker-build.yml`:
```bash
cp .github/workflows/docker-build.yml /path/to/your/repo/.github/workflows/
```

---

## Step 3: Customize (Optional)

Edit the workflow file to match your project:

- Update branch names (`main`, `develop`)
- Adjust versions (Node.js, Python)
- Modify commands (test, lint, build)

---

## Step 4: Push and Test

```bash
git add .github/workflows/
git commit -m "Add CI/CD workflows"
git push
```

Check the Actions tab in GitHub to see workflows running!

---

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Customize workflows for your specific needs
- Add deployment workflows if needed

---

**That's it!** Your CI/CD is now automated.
