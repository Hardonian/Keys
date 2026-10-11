import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), '..');
const toolDir = path.join(repoRoot, 'tools', 'keys-indexer');
const artifactsDir = path.join(repoRoot, 'docs', 'library');
const outputDir = path.join(repoRoot, 'frontend', 'public');
const schemaDir = path.join(toolDir, 'schemas');

// Skip if Go is not available
function checkGo() {
  return new Promise((resolve) => {
    const child = spawn('go', ['version'], { stdio: 'ignore' });
    child.on('exit', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

// Skip if artifacts directory doesn't exist or is empty
function checkArtifacts() {
  if (!fs.existsSync(artifactsDir)) {
    console.log('ℹ️ Skipping keys-index: docs/library/ directory not found');
    return false;
  }
  const files = fs.readdirSync(artifactsDir);
  const hasMetadata = files.some(f => f.endsWith('.metadata.json'));
  if (!hasMetadata) {
    console.log('ℹ️ Skipping keys-index: No metadata files found in docs/library/');
    return false;
  }
  return true;
}

async function main() {
  const hasGo = await checkGo();
  if (!hasGo) {
    console.log('ℹ️ Skipping keys-index: Go not installed');
    process.exit(0);
  }

  if (!checkArtifacts()) {
    process.exit(0);
  }

  const args = ['run', '.', '--artifacts-dir', artifactsDir, '--output-dir', outputDir, '--schema-dir', schemaDir, '--repo-root', repoRoot];
  const strictFlag = process.argv.includes('--strict') || process.env.KEYS_INDEX_STRICT === '1';
  if (strictFlag) {
    args.push('--strict');
  }

  console.log('🔍 Running keys-index...');
  
  const child = spawn('go', args, { cwd: toolDir, stdio: 'inherit' });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.log('⚠️ keys-index failed, but continuing build...');
      process.exit(0); // Don't fail the build
    }
    process.exit(0);
  });

  child.on('error', (err) => {
    console.log('⚠️ keys-index error:', err.message);
    console.log('Continuing build...');
    process.exit(0);
  });
}

main();
