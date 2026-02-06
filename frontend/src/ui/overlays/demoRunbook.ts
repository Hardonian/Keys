import type { EnterpriseConfig, RunbookAnnotation, RunbookManifest } from './types';

export const demoRunbookManifest: RunbookManifest = {
  name: 'Stripe Webhook Failure Recovery',
  description: 'Diagnose and recover from webhook delivery failures with clear checkpoints and verification.',
  inputs: [
    {
      name: 'endpointUrl',
      type: 'url',
      description: 'Public webhook endpoint to validate reachability.',
      required: true,
    },
    {
      name: 'stripeSecret',
      type: 'secret',
      description: 'Stripe signing secret for verifying payloads.',
      required: true,
    },
    {
      name: 'incidentChannel',
      type: 'string',
      description: 'Slack channel for coordinating recovery.',
      required: true,
      defaultValue: '#inc-payments',
    },
  ],
  sideEffects: ['May replay webhooks from Stripe CLI', 'May pause downstream job queues during recovery'],
  riskLevel: 'high',
  steps: [
    {
      id: 'step-verify-endpoint',
      title: 'Verify endpoint reachability',
      summary: 'Confirm the webhook endpoint is reachable and returns a 2xx status.',
      checklist: [
        'Ping the endpoint from the Stripe CLI',
        'Validate TLS certificate and DNS',
        'Capture response payload for evidence',
      ],
      expectedOutcome: 'Endpoint responds with 2xx consistently.',
    },
    {
      id: 'step-verify-signature',
      title: 'Verify webhook signature',
      summary: 'Ensure the signing secret matches Stripe and signatures validate.',
      checklist: [
        'Fetch latest signing secret from vault',
        'Validate signature using local verifier',
        'Rotate secret if mismatch is detected',
      ],
      expectedOutcome: 'Signatures validate for new events.',
    },
    {
      id: 'step-replay',
      title: 'Replay missed events',
      summary: 'Replay failed webhooks and monitor downstream processing.',
      checklist: [
        'Queue replay batch in Stripe CLI',
        'Monitor worker backlog',
        'Confirm downstream job completion',
      ],
      expectedOutcome: 'All missed events processed without errors.',
    },
  ],
  tags: ['stripe', 'webhook', 'recovery', 'incident'],
};

export const demoAnnotations: RunbookAnnotation[] = [
  {
    id: 'anno-1',
    cellId: 'cell-001',
    stepId: 'step-verify-endpoint',
    kind: 'warning',
    message: 'Endpoint returned intermittent 500 responses during peak traffic.',
    author: 'stitch-ops',
    tags: ['latency', 'http-500'],
    status: 'in-progress',
  },
  {
    id: 'anno-2',
    cellId: 'cell-002',
    stepId: 'step-verify-signature',
    kind: 'note',
    message: 'Secret rotated last week; ensure staging/prod values are aligned.',
    author: 'stitch-ops',
    tags: ['secrets'],
  },
  {
    id: 'anno-3',
    cellId: 'cell-003',
    stepId: 'step-replay',
    kind: 'decision',
    message: 'Replay only the last 2 hours while backlog stabilizes.',
    author: 'stitch-ops',
    tags: ['replay', 'risk'],
    status: 'todo',
  },
];

export const demoEnterpriseConfig: EnterpriseConfig = {
  enabled: true,
  orgName: 'Stitch Labs',
  ctaUrl: 'https://keys.run/enterprise',
  progress: 0.6,
  nextMilestone: 'Promote to enterprise runbook catalog',
};
