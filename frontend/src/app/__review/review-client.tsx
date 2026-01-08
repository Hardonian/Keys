'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { RuntimeUiConfig } from '@/runtime-ui-config/shared';
import { DEFAULT_RUNTIME_UI_CONFIG, sanitizeRuntimeUiConfig } from '@/runtime-ui-config/shared';
import { useRuntimeUiConfig } from '@/runtime-ui-config/client';

type UiStateMode = 'normal' | 'loading' | 'empty' | 'error';

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

export function ReviewClient() {
  const { user } = useAuth();
  const { config: currentConfig, updatedAt } = useRuntimeUiConfig();
  const role = (user?.app_metadata as Record<string, unknown> | null | undefined)?.role;
  const isAdmin = role === 'admin' || role === 'superadmin';

  const [mode, setMode] = useState<UiStateMode>('normal');
  const [editorText, setEditorText] = useState(() => prettyJson(currentConfig));
  const [status, setStatus] = useState<string | null>(null);

  const criticalLinks = useMemo(
    () => [
      { href: '/', label: 'Home' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/signup', label: 'Sign up' },
      { href: '/signin', label: 'Sign in' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/chat', label: 'Chat' },
      { href: '/templates', label: 'Templates' },
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/account/billing', label: 'Billing' },
      { href: '/admin/dashboard', label: 'Admin' },
    ],
    []
  );

  async function reloadConfig() {
    setStatus(null);
    try {
      const res = await fetch('/api/ui-config', { cache: 'no-store' });
      const json = (await res.json()) as { config?: RuntimeUiConfig };
      setEditorText(prettyJson(sanitizeRuntimeUiConfig(json.config)));
      setStatus('Loaded latest runtime config.');
    } catch {
      setStatus('Failed to load runtime config (using defaults).');
      setEditorText(prettyJson(DEFAULT_RUNTIME_UI_CONFIG));
    }
  }

  async function saveConfig() {
    setStatus(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(editorText);
    } catch {
      setStatus('Config JSON is invalid.');
      return;
    }

    try {
      const res = await fetch('/api/internal/ui-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: parsed }),
      });
      const text = await res.text();
      if (!res.ok) {
        setStatus(`Save failed (HTTP ${res.status}): ${text}`);
        return;
      }
      setStatus('Saved. Refresh pages to confirm UI changes.');
      // Re-sync editor with what the backend accepted (sanitized).
      try {
        const json = JSON.parse(text) as { config?: RuntimeUiConfig };
        if (json?.config) setEditorText(prettyJson(sanitizeRuntimeUiConfig(json.config)));
      } catch {
        // ignore
      }
    } catch {
      setStatus('Save failed (network error).');
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-lg border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold">Critical links</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use these to quickly click through launch-critical flows in preview.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {criticalLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <h2 className="mt-8 text-base font-semibold">UI state toggles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Forces common states locally to validate empty/error/loading visuals.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['normal', 'loading', 'empty', 'error'] as UiStateMode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`rounded-md border px-3 py-2 text-sm ${
                mode === m ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-md border p-4">
          {mode === 'loading' ? (
            <div className="space-y-3">
              <div className="h-4 w-2/3 rounded bg-muted shimmer" />
              <div className="h-4 w-1/2 rounded bg-muted shimmer" />
              <div className="h-24 w-full rounded bg-muted shimmer" />
            </div>
          ) : mode === 'empty' ? (
            <div className="text-sm text-muted-foreground">
              Empty state: no items found. (Verify copy, spacing, and CTA affordance.)
            </div>
          ) : mode === 'error' ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
              Error state: a predictable failure occurred. (Verify tone, action, and accessibility.)
            </div>
          ) : (
            <div className="text-sm">
              Normal state: use this panel to rapidly toggle and sanity-check visual states.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Runtime UI config</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Current config is fetched at runtime (no rebuild). Only public-safe values are exposed.
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              Updated at: <span className="font-mono">{updatedAt || 'unknown'}</span>
            </div>
          </div>
          <button type="button" className="text-sm underline underline-offset-4" onClick={reloadConfig}>
            Reload
          </button>
        </div>

        <div className="mt-4">
          <textarea
            className="h-96 w-full rounded-md border bg-background p-3 font-mono text-xs leading-5"
            value={editorText}
            onChange={(e) => setEditorText(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">{status || (isAdmin ? ' ' : 'Admin required to save.')}</div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setEditorText(prettyJson(currentConfig))}
            >
              Reset editor
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-2 text-sm ${
                isAdmin ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground'
              }`}
              onClick={saveConfig}
              disabled={!isAdmin}
            >
              Save
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

