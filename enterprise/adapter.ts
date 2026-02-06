import type { RunbookManifest } from '../contracts/runbook';

export interface EnterprisePromotionMetadata {
  requestedBy: string;
  environment: 'staging' | 'production' | 'sandbox';
  notes?: string;
}

export interface EnterpriseAdapter {
  promoteRunbook(manifest: RunbookManifest, metadata: EnterprisePromotionMetadata): Promise<void>;
  listOrgApproved(): Promise<RunbookManifest[]>;
}

export class NoopEnterpriseAdapter implements EnterpriseAdapter {
  async promoteRunbook(_manifest: RunbookManifest, _metadata: EnterprisePromotionMetadata): Promise<void> {
    return;
  }

  async listOrgApproved(): Promise<RunbookManifest[]> {
    return [];
  }
}

export interface EnterpriseConfig {
  enabled: boolean;
  orgId?: string;
  orgName?: string;
}

export function resolveEnterpriseAdapter(
  config?: EnterpriseConfig,
  adapter: EnterpriseAdapter = new NoopEnterpriseAdapter(),
): EnterpriseAdapter {
  if (config?.enabled) {
    return adapter;
  }
  return new NoopEnterpriseAdapter();
}
