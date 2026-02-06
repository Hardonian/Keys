import type { RunbookManifest } from './types';

interface NotebookHeaderOverlayProps {
  manifest: RunbookManifest;
  runState?: 'draft' | 'active' | 'complete';
}

const riskStyles: Record<RunbookManifest['riskLevel'], string> = {
  low: 'bg-emerald-100 text-emerald-900',
  medium: 'bg-amber-100 text-amber-900',
  high: 'bg-orange-100 text-orange-900',
  critical: 'bg-rose-100 text-rose-900',
};

export function NotebookHeaderOverlay({ manifest, runState = 'draft' }: NotebookHeaderOverlayProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notebook Runbook</p>
          <h1 className="text-2xl font-semibold text-slate-900">{manifest.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{manifest.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${riskStyles[manifest.riskLevel]}`}
          >
            {manifest.riskLevel.toUpperCase()} RISK
          </span>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            {runState === 'draft' && 'Draft'}
            {runState === 'active' && 'Active'}
            {runState === 'complete' && 'Complete'}
          </span>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Inputs</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {manifest.inputs.length === 0 ? (
              <li>No runtime inputs required.</li>
            ) : (
              manifest.inputs.map(input => (
                <li key={input.name} className="flex items-center justify-between">
                  <span>{input.name}</span>
                  <span className="text-xs text-slate-500">{input.type}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Side Effects</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {manifest.sideEffects.length === 0 ? (
              <li>None declared.</li>
            ) : (
              manifest.sideEffects.map(effect => <li key={effect}>• {effect}</li>)
            )}
          </ul>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Steps</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{manifest.steps.length}</p>
          <p className="text-sm text-slate-600">Checklist-driven recovery flow.</p>
        </div>
      </div>
    </section>
  );
}
