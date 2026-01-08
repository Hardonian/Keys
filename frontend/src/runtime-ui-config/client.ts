'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RuntimeUiConfig } from './shared';
import { DEFAULT_RUNTIME_UI_CONFIG, sanitizeRuntimeUiConfig } from './shared';

type RuntimeUiConfigResponse = {
  config: RuntimeUiConfig;
  updatedAt: string | null;
};

let cached: RuntimeUiConfigResponse | null = null;
let inflight: Promise<RuntimeUiConfigResponse> | null = null;

export async function fetchRuntimeUiConfig(): Promise<RuntimeUiConfigResponse> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch('/api/ui-config', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`ui-config HTTP ${res.status}`);

      const json = (await res.json()) as Partial<RuntimeUiConfigResponse>;
      const next: RuntimeUiConfigResponse = {
        config: sanitizeRuntimeUiConfig(json.config),
        updatedAt: typeof json.updatedAt === 'string' ? json.updatedAt : null,
      };
      cached = next;
      return next;
    } catch {
      cached = { config: DEFAULT_RUNTIME_UI_CONFIG, updatedAt: null };
      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function applyRuntimeUiTokens(config: RuntimeUiConfig): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--radius', config.tokens?.radius || DEFAULT_RUNTIME_UI_CONFIG.tokens.radius);
}

export function useRuntimeUiConfig(): RuntimeUiConfigResponse {
  const [state, setState] = useState<RuntimeUiConfigResponse>(() => cached || { config: DEFAULT_RUNTIME_UI_CONFIG, updatedAt: null });

  useEffect(() => {
    let mounted = true;
    fetchRuntimeUiConfig().then((data) => {
      if (!mounted) return;
      setState(data);
      applyRuntimeUiTokens(data.config);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Ensure we always expose a fully-formed object.
  return useMemo(() => {
    return {
      config: state?.config || DEFAULT_RUNTIME_UI_CONFIG,
      updatedAt: state?.updatedAt ?? null,
    };
  }, [state]);
}

