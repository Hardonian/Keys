import { z } from 'zod';
import { logger } from '../utils/logger.js';

const mappingSchema = z.object({
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  jobforgeTenantId: z.string().min(1),
  jobforgeProjectId: z.string().min(1),
});

const mappingListSchema = z.array(mappingSchema);

export type JobForgeMapping = z.infer<typeof mappingSchema>;

export interface JobForgeEventRequest {
  tenantId: string;
  projectId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface JobForgeModuleDryRunRequest {
  tenantId: string;
  projectId: string;
  moduleId: string;
  input: Record<string, unknown>;
}

export interface JobForgeReportRequest {
  tenantId: string;
  projectId: string;
  reportId: string;
}

export interface JobForgeBundleExecutionRequest {
  tenantId: string;
  projectId: string;
  reportId: string;
  bundleId: string;
}

export class JobForgeError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'JobForgeError';
    this.statusCode = statusCode;
  }
}

class JobForgeAdapter {
  private sdkModule: string;
  private sdkClient: any | null = null;
  private sdkChecked = false;

  constructor() {
    this.sdkModule = process.env.JOBFORGE_SDK_MODULE || 'jobforge-sdk';
  }

  isEnabled(): boolean {
    return process.env.JOBFORGE_INTEGRATION_ENABLED === '1';
  }

  isBundleExecutionEnabled(): boolean {
    return process.env.JOBFORGE_BUNDLE_EXECUTION_ENABLED === '1';
  }

  private baseUrl(): string {
    return process.env.JOBFORGE_BASE_URL || '';
  }

  private apiKey(): string {
    return process.env.JOBFORGE_API_KEY || '';
  }

  private requireEnabled(): void {
    if (!this.isEnabled()) {
      throw new JobForgeError('JobForge integration is disabled.', 403);
    }
  }

  private requireConfigured(): void {
    if (!this.baseUrl()) {
      throw new JobForgeError('JobForge base URL is not configured.', 400);
    }
    if (!this.apiKey()) {
      throw new JobForgeError('JobForge API key is not configured.', 400);
    }
  }

  private parseMappings(): JobForgeMapping[] {
    const raw = process.env.JOBFORGE_TENANT_PROJECT_MAP;
    if (!raw) {
      throw new JobForgeError('JobForge tenant/project mapping is not configured.', 400);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new JobForgeError('JobForge tenant/project mapping is invalid JSON.', 400);
    }

    const result = mappingListSchema.safeParse(parsed);
    if (!result.success) {
      throw new JobForgeError('JobForge tenant/project mapping is invalid.', 400);
    }

    return result.data;
  }

  resolveMapping(tenantId: string, projectId: string): JobForgeMapping {
    const mappings = this.parseMappings();
    const mapping = mappings.find(
      (entry) => entry.tenantId === tenantId && entry.projectId === projectId
    );

    if (!mapping) {
      throw new JobForgeError('Tenant/project mapping not found.', 404);
    }

    return mapping;
  }

  private async ensureSdkClient(): Promise<any | null> {
    if (this.sdkChecked) {
      return this.sdkClient;
    }

    this.sdkChecked = true;
    try {
      const module = await import(this.sdkModule);
      const ClientCtor =
        (module as any).JobForgeClient ||
        (module as any).default ||
        (module as any).Client ||
        null;

      if (!ClientCtor) {
        return null;
      }

      this.sdkClient = new ClientCtor({
        apiKey: this.apiKey(),
        baseUrl: this.baseUrl(),
      });

      logger.info('JobForge SDK client initialized.');
      return this.sdkClient;
    } catch (error) {
      logger.warn('JobForge SDK not available, falling back to HTTP.', {
        module: this.sdkModule,
      });
      return null;
    }
  }

  async getStatus(): Promise<{
    enabled: boolean;
    bundleExecutionEnabled: boolean;
    baseUrlConfigured: boolean;
    apiKeyConfigured: boolean;
    mappingConfigured: boolean;
    mappingCount: number;
    sdkAvailable: boolean;
  }> {
    let mappingConfigured = false;
    let mappingCount = 0;

    try {
      const mappings = this.parseMappings();
      mappingConfigured = mappings.length > 0;
      mappingCount = mappings.length;
    } catch {
      mappingConfigured = false;
      mappingCount = 0;
    }

    const sdkClient = await this.ensureSdkClient();

    return {
      enabled: this.isEnabled(),
      bundleExecutionEnabled: this.isBundleExecutionEnabled(),
      baseUrlConfigured: Boolean(this.baseUrl()),
      apiKeyConfigured: Boolean(this.apiKey()),
      mappingConfigured,
      mappingCount,
      sdkAvailable: Boolean(sdkClient),
    };
  }

  private async request<T>(
    path: string,
    options: RequestInit,
    context: Record<string, unknown>
  ): Promise<T> {
    this.requireEnabled();
    this.requireConfigured();

    const url = new URL(path, this.baseUrl());
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${this.apiKey()}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url.toString(), {
      ...options,
      headers,
    });

    if (!response.ok) {
      logger.warn('JobForge request failed.', {
        status: response.status,
        path: url.pathname,
        ...context,
      });
      throw new JobForgeError('JobForge request failed.', response.status);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  }

  async submitEvent(request: JobForgeEventRequest): Promise<unknown> {
    this.requireEnabled();
    this.requireConfigured();

    const mapping = this.resolveMapping(request.tenantId, request.projectId);
    const payload = {
      tenantId: mapping.jobforgeTenantId,
      projectId: mapping.jobforgeProjectId,
      eventType: request.eventType,
      payload: request.payload,
    };

    const sdkClient = await this.ensureSdkClient();
    if (sdkClient?.submitEvent) {
      return await sdkClient.submitEvent(payload);
    }

    return await this.request('/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, {
      action: 'submit_event',
      tenantId: request.tenantId,
      projectId: request.projectId,
    });
  }

  async runModuleDryRun(request: JobForgeModuleDryRunRequest): Promise<unknown> {
    this.requireEnabled();
    this.requireConfigured();

    const mapping = this.resolveMapping(request.tenantId, request.projectId);
    const payload = {
      tenantId: mapping.jobforgeTenantId,
      projectId: mapping.jobforgeProjectId,
      moduleId: request.moduleId,
      input: request.input,
      dryRun: true,
    };

    const sdkClient = await this.ensureSdkClient();
    if (sdkClient?.runModuleDryRun) {
      return await sdkClient.runModuleDryRun(payload);
    }

    if (sdkClient?.runModule) {
      return await sdkClient.runModule({
        ...payload,
        dryRun: true,
      });
    }

    return await this.request(`/modules/${encodeURIComponent(request.moduleId)}/dry-run`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, {
      action: 'run_module_dry_run',
      tenantId: request.tenantId,
      projectId: request.projectId,
    });
  }

  async getReport(request: JobForgeReportRequest): Promise<unknown> {
    this.requireEnabled();
    this.requireConfigured();

    const mapping = this.resolveMapping(request.tenantId, request.projectId);
    const payload = {
      tenantId: mapping.jobforgeTenantId,
      projectId: mapping.jobforgeProjectId,
      reportId: request.reportId,
    };

    const sdkClient = await this.ensureSdkClient();
    if (sdkClient?.getReport) {
      return await sdkClient.getReport(payload);
    }

    if (sdkClient?.fetchReport) {
      return await sdkClient.fetchReport(payload);
    }

    const query = new URLSearchParams({
      tenantId: mapping.jobforgeTenantId,
      projectId: mapping.jobforgeProjectId,
    });

    return await this.request(`/reports/${encodeURIComponent(request.reportId)}?${query.toString()}`, {
      method: 'GET',
    }, {
      action: 'get_report',
      tenantId: request.tenantId,
      projectId: request.projectId,
    });
  }

  async requestBundleExecution(request: JobForgeBundleExecutionRequest): Promise<unknown> {
    this.requireEnabled();
    this.requireConfigured();

    if (!this.isBundleExecutionEnabled()) {
      throw new JobForgeError('JobForge bundle execution is disabled.', 403);
    }

    const mapping = this.resolveMapping(request.tenantId, request.projectId);
    const payload = {
      tenantId: mapping.jobforgeTenantId,
      projectId: mapping.jobforgeProjectId,
      reportId: request.reportId,
      bundleId: request.bundleId,
    };

    const sdkClient = await this.ensureSdkClient();
    if (sdkClient?.requestBundleExecution) {
      return await sdkClient.requestBundleExecution(payload);
    }

    if (sdkClient?.executeBundle) {
      return await sdkClient.executeBundle(payload);
    }

    return await this.request(
      `/reports/${encodeURIComponent(request.reportId)}/bundles/${encodeURIComponent(request.bundleId)}/execute`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      {
        action: 'request_bundle_execution',
        tenantId: request.tenantId,
        projectId: request.projectId,
      }
    );
  }
}

export const jobForgeAdapter = new JobForgeAdapter();
