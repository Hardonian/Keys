#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..');
const readmePath = path.join(repoRoot, 'README.md');
const contributingPath = path.join(repoRoot, 'CONTRIBUTING.md');

const errors: string[] = [];

function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing required file: ${path.relative(repoRoot, filePath)}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function collectSection(markdown: string, heading: string): string[] {
  const lines = markdown.split(/\r?\n/);
  let inSection = false;
  const sectionLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (inSection) {
        break;
      }
      inSection = line.slice(3).trim() === heading;
      continue;
    }

    if (inSection) {
      sectionLines.push(line);
    }
  }

  return sectionLines;
}

function extractCommands(lines: string[]): string[] {
  const commands: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        codeBlockLang = '';
        continue;
      }
      inCodeBlock = true;
      codeBlockLang = line.replace(/```/, '').trim();
      continue;
    }

    if (inCodeBlock) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      if (codeBlockLang === '' || ['bash', 'sh', 'shell', 'zsh'].includes(codeBlockLang)) {
        commands.push(trimmed);
      }
    }
  }

  return commands;
}

function getPnpmScript(command: string, scripts: Record<string, string>): string | null {
  const tokens = command.split(/\s+/);
  if (tokens[0] !== 'pnpm') {
    return null;
  }

  if (tokens[1] === 'run' && tokens[2]) {
    return tokens[2];
  }

  const optionIndex = tokens.findIndex((token) => token === '--filter');
  if (optionIndex !== -1 && tokens[optionIndex + 2]) {
    return tokens[optionIndex + 2];
  }

  if (tokens[1] && !tokens[1].startsWith('-') && tokens[1] !== 'install') {
    return tokens[1];
  }

  return null;
}

function getNpmScript(command: string, scripts: Record<string, string>): string | null {
  const tokens = command.split(/\s+/);
  if (tokens[0] !== 'npm') {
    return null;
  }

  if (tokens[1] === 'run' && tokens[2]) {
    return tokens[2];
  }

  return null;
}

function verifyQuickStartCommands(readme: string) {
  const quickStartLines = collectSection(readme, 'Quick Start');
  if (quickStartLines.length === 0) {
    errors.push('README.md is missing a "## Quick Start" section.');
    return;
  }

  const commands = extractCommands(quickStartLines);
  if (commands.length === 0) {
    errors.push('README.md Quick Start section does not include any command blocks.');
    return;
  }

  const packageJsonPath = path.join(repoRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const scripts = packageJson.scripts ?? {};

  for (const command of commands) {
    if (command.startsWith('pnpm')) {
      const script = getPnpmScript(command, scripts);
      if (script && !scripts[script]) {
        errors.push(`README Quick Start references pnpm script "${script}" which is not defined.`);
      }
      continue;
    }

    if (command.startsWith('npm')) {
      const script = getNpmScript(command, scripts);
      if (script && !scripts[script]) {
        errors.push(`README Quick Start references npm script "${script}" which is not defined.`);
      }
      continue;
    }
  }
}

function verifyReferencedFiles(readme: string) {
  const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(readme)) !== null) {
    const rawLink = match[1];
    if (rawLink.startsWith('http://') || rawLink.startsWith('https://') || rawLink.startsWith('mailto:')) {
      continue;
    }
    if (rawLink.startsWith('#')) {
      continue;
    }

    const linkPath = rawLink.split('#')[0];
    const resolvedPath = path.resolve(repoRoot, linkPath);
    if (!fs.existsSync(resolvedPath)) {
      errors.push(`README.md link target does not exist: ${rawLink}`);
    }
  }
}

function verifyNoTodoMarkers(markdown: string, fileLabel: string) {
  if (/TODO/i.test(markdown)) {
    errors.push(`${fileLabel} contains TODO markers. Remove them before publishing.`);
  }
}

const readme = readFile(readmePath);
const contributing = readFile(contributingPath);

if (readme) {
  verifyQuickStartCommands(readme);
  verifyReferencedFiles(readme);
  verifyNoTodoMarkers(readme, 'README.md');
}

if (contributing) {
  verifyNoTodoMarkers(contributing, 'CONTRIBUTING.md');
}

if (errors.length > 0) {
  console.error('Documentation verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('✅ Documentation verification passed.');
