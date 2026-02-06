import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { RunbookManifestSchema } from '../../../../contracts/runbook';

describe('RunbookManifest schema', () => {
  it('validates the demo runbook fixture', () => {
    const fixturePath = path.resolve(process.cwd(), '..', 'fixtures', 'demo-runbook.json');
    const raw = fs.readFileSync(fixturePath, 'utf-8');
    const parsed = JSON.parse(raw) as { manifest: unknown };
    const result = RunbookManifestSchema.safeParse(parsed.manifest);
    expect(result.success).toBe(true);
  });
});
