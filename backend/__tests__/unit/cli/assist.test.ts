import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { buildAssistPayload, formatAssistOutput } from '../../../../cli/assist';
import { RunbookManifestSchema, type RunbookAnnotation } from '../../../../contracts/runbook';

describe('assist CLI output', () => {
  it('formats structured assist output', () => {
    const fixturePath = path.resolve(process.cwd(), '..', 'fixtures', 'demo-runbook.json');
    const raw = fs.readFileSync(fixturePath, 'utf-8');
    const parsed = JSON.parse(raw) as { manifest: unknown; annotations: RunbookAnnotation[] };
    const manifest = RunbookManifestSchema.parse(parsed.manifest);
    const payload = buildAssistPayload(manifest, parsed.annotations, 'dry-run');
    const output = formatAssistOutput(payload);
    expect(output).toMatchInlineSnapshot(`
      "Keys Assist Report
      Runbook: Stripe Webhook Failure Recovery
      Mode: Dry Run
      Risk: high

      Warnings:
        - [HIGH] RISK-HIGH — Elevated runbook risk
          Risk level is high.
          Recommendation: Confirm change window and assign an incident lead.
        - [MEDIUM] SIDE-EFFECTS — Runbook includes side effects
          May replay webhooks from Stripe CLI; May pause downstream job queues during recovery
          Recommendation: Notify impacted teams before executing irreversible actions.

      Dry Run Summary:
        Steps: 3
        Inputs: 3
          - endpointUrl (url)
          - stripeSecret (secret)
          - incidentChannel (string)
        Side Effects:
          - May replay webhooks from Stripe CLI
          - May pause downstream job queues during recovery

      Annotations:
        - cell-001 [warning] Endpoint returned intermittent 500 responses during peak traffic. (by stitch-ops)
        - cell-002 [note] Secret rotated last week; ensure staging/prod values are aligned. (by stitch-ops)
        - cell-003 [decision] Replay only the last 2 hours while backlog stabilizes. (by stitch-ops)"
    `);
  });
});
