# GitHub Keys: CI/CD Starter Workflows

**Version**: 1.0.0  
**Tool**: GitHub  
**Maturity**: Starter  
**Outcome**: Automation

---

## What This Key Unlocks

Pre-built GitHub Actions workflows for common development stacks. This key unlocks:

- **Node.js CI**: Automated testing and linting for Node.js projects
- **Python CI**: Automated testing and linting for Python projects
- **Node.js Deploy**: Deployment automation for Node.js applications
- **Docker Build**: Automated Docker image building and pushing
- **Security Scan**: Automated security vulnerability scanning

---

## Installation

1. **Copy workflows** to your repository:
   ```bash
   cp -r .github/workflows/* /path/to/your/repo/.github/workflows/
   ```

2. **Customize workflows** for your project:
   - Update branch names if different from `main`/`develop`
   - Adjust Node.js/Python versions as needed
   - Add deployment steps specific to your hosting provider

---

## Included Workflows

### Node.js CI (`nodejs-ci.yml`)

Runs tests and linting on multiple Node.js versions (18.x, 20.x).

**Features**:
- Matrix testing across Node.js versions
- Automatic dependency caching
- Linting and testing
- Build step (if present)

### Python CI (`python-ci.yml`)

Runs tests and linting on multiple Python versions (3.9-3.12).

**Features**:
- Matrix testing across Python versions
- Flake8 linting
- Pytest testing
- Flexible dependency installation

### Node.js Deploy (`nodejs-deploy.yml`)

Deploys Node.js applications on push to main or version tags.

**Features**:
- Automatic deployment on main branch
- Version tag support
- Build step before deployment
- Customizable deployment commands

### Docker Build (`docker-build.yml`)

Builds and pushes Docker images to GitHub Container Registry.

**Features**:
- Multi-platform builds
- Automatic tagging (branch, PR, semver, SHA)
- GitHub Container Registry integration
- Buildx support

### Security Scan (`security-scan.yml`)

Scans codebase for security vulnerabilities using Trivy.

**Features**:
- File system scanning
- SARIF output
- GitHub Security integration
- Weekly scheduled scans

---

## Usage

### Using Node.js CI

1. Copy `nodejs-ci.yml` to `.github/workflows/`
2. Ensure your `package.json` has test and lint scripts:
   ```json
   {
     "scripts": {
       "test": "vitest",
       "lint": "eslint .",
       "build": "tsc"
     }
   }
   ```

### Using Python CI

1. Copy `python-ci.yml` to `.github/workflows/`
2. Create `requirements.txt` and `requirements-dev.txt` if needed
3. Ensure pytest is installed for testing

### Using Deployment Workflows

1. Copy deployment workflow to `.github/workflows/`
2. Set up secrets in GitHub repository settings:
   - `DEPLOY_TOKEN`: Token for deployment
3. Customize deployment commands in the workflow

---

## Customization

All workflows are templates and should be customized for your project:

- **Branch names**: Update `branches` in `on.push` and `on.pull_request`
- **Versions**: Adjust Node.js/Python versions in matrix
- **Commands**: Modify run commands to match your project structure
- **Secrets**: Add required secrets in repository settings

---

## Removal

To remove workflows:

1. Delete workflow files from `.github/workflows/`
2. Remove any GitHub secrets if no longer needed

---

## Requirements

- GitHub repository
- GitHub Actions enabled
- Project-specific requirements (Node.js, Python, Docker, etc.)

---

## License

MIT
