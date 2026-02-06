'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

type JobForgeStatus = {
  enabled: boolean;
  bundleExecutionEnabled: boolean;
  baseUrlConfigured: boolean;
  apiKeyConfigured: boolean;
  mappingConfigured: boolean;
  mappingCount: number;
  sdkAvailable: boolean;
};

type ApiResponse = {
  status: string;
  result?: unknown;
  error?: string;
};

const defaultJson = JSON.stringify({ sample: 'value' }, null, 2);

export default function AdminJobForgePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<JobForgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tenantId, setTenantId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventPayload, setEventPayload] = useState(defaultJson);

  const [moduleId, setModuleId] = useState('');
  const [moduleInput, setModuleInput] = useState(defaultJson);

  const [reportId, setReportId] = useState('');
  const [bundleId, setBundleId] = useState('');
  const [bundleConfirm, setBundleConfirm] = useState(false);

  const [submitResponse, setSubmitResponse] = useState<ApiResponse | null>(null);
  const [moduleResponse, setModuleResponse] = useState<ApiResponse | null>(null);
  const [reportResponse, setReportResponse] = useState<ApiResponse | null>(null);
  const [bundleResponse, setBundleResponse] = useState<ApiResponse | null>(null);

  const API_BASE_URL = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
    []
  );

  const fetchStatus = useCallback(async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${API_BASE_URL}/admin/jobforge/status`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch JobForge status.');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    fetchStatus();
  }, [user, router, fetchStatus]);

  const parseJson = (value: string, label: string) => {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      throw new Error(`${label} must be valid JSON.`);
    }
  };

  const runRequest = async (path: string, body?: Record<string, unknown>) => {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseJson = (await response.json()) as ApiResponse;

    if (!response.ok) {
      throw new Error(responseJson.error || 'Request failed.');
    }

    return responseJson;
  };

  const handleSubmitEvent = async () => {
    setSubmitResponse(null);
    try {
      const payload = parseJson(eventPayload, 'Event payload');
      const response = await runRequest('/admin/jobforge/events', {
        tenantId,
        projectId,
        eventType,
        payload,
      });
      setSubmitResponse(response);
    } catch (err) {
      setSubmitResponse({ status: 'error', error: err instanceof Error ? err.message : 'Failed.' });
    }
  };

  const handleModuleDryRun = async () => {
    setModuleResponse(null);
    try {
      const input = parseJson(moduleInput, 'Module input');
      const response = await runRequest('/admin/jobforge/modules/dry-run', {
        tenantId,
        projectId,
        moduleId,
        input,
      });
      setModuleResponse(response);
    } catch (err) {
      setModuleResponse({ status: 'error', error: err instanceof Error ? err.message : 'Failed.' });
    }
  };

  const handleViewReport = async () => {
    setReportResponse(null);
    try {
      const response = await runRequest(
        `/admin/jobforge/reports/${encodeURIComponent(reportId)}?tenantId=${encodeURIComponent(tenantId)}&projectId=${encodeURIComponent(projectId)}`
      );
      setReportResponse(response);
    } catch (err) {
      setReportResponse({ status: 'error', error: err instanceof Error ? err.message : 'Failed.' });
    }
  };

  const handleBundleExecution = async () => {
    setBundleResponse(null);
    try {
      const response = await runRequest(
        `/admin/jobforge/reports/${encodeURIComponent(reportId)}/bundle-execution`,
        {
          tenantId,
          projectId,
          bundleId,
          confirm: bundleConfirm,
        }
      );
      setBundleResponse(response);
    } catch (err) {
      setBundleResponse({ status: 'error', error: err instanceof Error ? err.message : 'Failed.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading JobForge status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">JobForge Admin</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Submit events, run dry-runs, and review JobForge reports safely.
          </p>
        </header>

        {error && (
          <div className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 p-4 rounded-lg">
            {error}
          </div>
        )}

        {status && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Integration Status</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <span className="font-medium">Enabled:</span> {status.enabled ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Bundle Execution Enabled:</span>{' '}
                {status.bundleExecutionEnabled ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Base URL Configured:</span>{' '}
                {status.baseUrlConfigured ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">API Key Configured:</span>{' '}
                {status.apiKeyConfigured ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Mapping Configured:</span>{' '}
                {status.mappingConfigured ? `Yes (${status.mappingCount})` : 'No'}
              </div>
              <div>
                <span className="font-medium">SDK Available:</span> {status.sdkAvailable ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Submit Event</h2>
            <div className="space-y-2">
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Tenant ID"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              />
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Event Type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              />
              <textarea
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2 font-mono text-xs"
                rows={6}
                value={eventPayload}
                onChange={(e) => setEventPayload(e.target.value)}
              />
            </div>
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSubmitEvent}
            >
              Submit Event
            </button>
            {submitResponse && (
              <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded-lg overflow-auto">
                {JSON.stringify(submitResponse, null, 2)}
              </pre>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Module Dry-Run</h2>
            <div className="space-y-2">
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Tenant ID"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              />
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Module ID"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
              />
              <textarea
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2 font-mono text-xs"
                rows={6}
                value={moduleInput}
                onChange={(e) => setModuleInput(e.target.value)}
              />
            </div>
            <button
              className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
              onClick={handleModuleDryRun}
            >
              Run Dry-Run
            </button>
            {moduleResponse && (
              <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded-lg overflow-auto">
                {JSON.stringify(moduleResponse, null, 2)}
              </pre>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">View Report</h2>
            <div className="space-y-2">
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Tenant ID"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              />
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Report ID"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
              />
            </div>
            <button
              className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleViewReport}
            >
              Fetch Report
            </button>
            {reportResponse && (
              <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded-lg overflow-auto">
                {JSON.stringify(reportResponse, null, 2)}
              </pre>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request Bundle Execution</h2>
            <div className="space-y-2">
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Tenant ID"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              />
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Report ID"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
              />
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2"
                placeholder="Bundle ID"
                value={bundleId}
                onChange={(e) => setBundleId(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={bundleConfirm}
                  onChange={(e) => setBundleConfirm(e.target.checked)}
                />
                Confirm bundle execution
              </label>
            </div>
            <button
              className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700"
              onClick={handleBundleExecution}
            >
              Request Execution
            </button>
            {bundleResponse && (
              <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded-lg overflow-auto">
                {JSON.stringify(bundleResponse, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
