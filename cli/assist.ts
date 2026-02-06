import fs from 'node:fs';
import path from 'node:path';
import { RunbookManifestSchema, type RunbookManifest, type RunbookAnnotation } from '../contracts/runbook';

export interface AssistWarning {
  code: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  detail: string;
  recommendation: string;
}

export interface AssistSummary {
  runbook: string;
  riskLevel: RunbookManifest['riskLevel'];
  sideEffects: string[];
  steps: number;
  inputs: Array<{ name: string; required: boolean; type: string }>;
}

export interface AssistPayload {
  mode: 'standard' | 'dry-run';
  summary: AssistSummary;
  warnings: AssistWarning[];
  annotations: RunbookAnnotation[];
}

const DEFAULT_FIXTURE_PATH = path.join(process.cwd(), 'fixtures', 'demo-runbook.json');

export function loadRunbookFixture(filePath = DEFAULT_FIXTURE_PATH): {
  manifest: RunbookManifest;
  annotations: RunbookAnnotation[];
} {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as { manifest: RunbookManifest; annotations: RunbookAnnotation[] };
  const manifest = RunbookManifestSchema.parse(parsed.manifest);
  return { manifest, annotations: parsed.annotations ?? [] };
}

export function buildAssistPayload(
  manifest: RunbookManifest,
  annotations: RunbookAnnotation[],
  mode: AssistPayload['mode'],
): AssistPayload {
  const warnings: AssistWarning[] = [];
  if (manifest.riskLevel === 'high' || manifest.riskLevel === 'critical') {
    warnings.push({
      code: 'RISK-HIGH',
      severity: 'high',
      title: 'Elevated runbook risk',
      detail: `Risk level is ${manifest.riskLevel}.`,
      recommendation: 'Confirm change window and assign an incident lead.',
    });
  }
  if (manifest.sideEffects.length > 0) {
    warnings.push({
      code: 'SIDE-EFFECTS',
      severity: 'medium',
      title: 'Runbook includes side effects',
      detail: manifest.sideEffects.join('; '),
      recommendation: 'Notify impacted teams before executing irreversible actions.',
    });
  }
  const summary: AssistSummary = {
    runbook: manifest.name,
    riskLevel: manifest.riskLevel,
    sideEffects: manifest.sideEffects,
    steps: manifest.steps.length,
    inputs: manifest.inputs.map(input => ({
      name: input.name,
      required: input.required ?? true,
      type: input.type,
    })),
  };

  return {
    mode,
    summary,
    warnings,
    annotations,
  };
}

export function formatAssistOutput(payload: AssistPayload): string {
  const lines: string[] = [];
  lines.push('Keys Assist Report');
  lines.push(`Runbook: ${payload.summary.runbook}`);
  lines.push(`Mode: ${payload.mode === 'dry-run' ? 'Dry Run' : 'Standard'}`);
  lines.push(`Risk: ${payload.summary.riskLevel}`);
  lines.push('');
  lines.push('Warnings:');
  if (payload.warnings.length === 0) {
    lines.push('  - None');
  } else {
    for (const warning of payload.warnings) {
      lines.push(`  - [${warning.severity.toUpperCase()}] ${warning.code} — ${warning.title}`);
      lines.push(`    ${warning.detail}`);
      lines.push(`    Recommendation: ${warning.recommendation}`);
    }
  }
  lines.push('');
  lines.push(payload.mode === 'dry-run' ? 'Dry Run Summary:' : 'Summary:');
  lines.push(`  Steps: ${payload.summary.steps}`);
  lines.push(`  Inputs: ${payload.summary.inputs.length}`);
  for (const input of payload.summary.inputs) {
    lines.push(`    - ${input.name} (${input.type})${input.required ? '' : ' [optional]'}`);
  }
  if (payload.summary.sideEffects.length > 0) {
    lines.push('  Side Effects:');
    for (const effect of payload.summary.sideEffects) {
      lines.push(`    - ${effect}`);
    }
  }
  if (payload.annotations.length > 0) {
    lines.push('');
    lines.push('Annotations:');
    for (const annotation of payload.annotations) {
      lines.push(
        `  - ${annotation.cellId} [${annotation.kind}] ${annotation.message} (by ${annotation.author})`,
      );
    }
  }
  return lines.join('\n');
}

export function runAssistCli(argv = process.argv.slice(2)): void {
  const args = new Set(argv);
  if (args.has('--help')) {
    // eslint-disable-next-line no-console
    console.log(
      [
        'Usage: tsx cli/assist.ts [--dry-run] [--json] [--fixture path]',
        '',
        'Options:',
        '  --dry-run       Print summary output only.',
        '  --json          Emit JSON payload for automation.',
        '  --fixture       Path to a runbook fixture JSON file.',
      ].join('\n'),
    );
    return;
  }

  const fixtureIndex = argv.findIndex(arg => arg === '--fixture');
  const fixturePath = fixtureIndex >= 0 ? argv[fixtureIndex + 1] : undefined;
  const { manifest, annotations } = loadRunbookFixture(fixturePath ?? DEFAULT_FIXTURE_PATH);
  const mode: AssistPayload['mode'] = args.has('--dry-run') ? 'dry-run' : 'standard';
  const payload = buildAssistPayload(manifest, annotations, mode);

  if (args.has('--json')) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const output = formatAssistOutput(payload);
  // eslint-disable-next-line no-console
  console.log(output);
}

const invokedDirectly = process.argv[1]?.includes('assist');
if (invokedDirectly) {
  runAssistCli();
}
