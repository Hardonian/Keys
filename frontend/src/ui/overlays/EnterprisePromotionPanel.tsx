import type { EnterpriseConfig } from './types';

interface EnterprisePromotionPanelProps {
  config?: EnterpriseConfig;
  onPromote?: () => void;
}

export function EnterprisePromotionPanel({ config, onPromote }: EnterprisePromotionPanelProps) {
  if (!config?.enabled) {
    return null;
  }

  const progressValue = config.progress ?? 0;

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Enterprise</p>
          <h2 className="text-xl font-semibold text-indigo-900">
            Promote to {config.orgName} catalog
          </h2>
          <p className="mt-2 max-w-xl text-sm text-indigo-800">
            Publish this runbook to the enterprise catalog once approvals are complete. No login
            required for OSS users—this panel only renders with enterprise configuration.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {config.ctaUrl ? (
            <a
              className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
              href={config.ctaUrl}
              target="_blank"
              rel="noreferrer"
            >
              Request Promotion
            </a>
          ) : (
            <button
              className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
              type="button"
              onClick={onPromote}
            >
              Request Promotion
            </button>
          )}
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-indigo-700">
          <span>Approval progress</span>
          <span>{Math.round(progressValue * 100)}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-indigo-200">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${progressValue * 100}%` }} />
        </div>
        {config.nextMilestone && (
          <p className="mt-2 text-xs text-indigo-700">Next: {config.nextMilestone}</p>
        )}
      </div>
    </section>
  );
}
