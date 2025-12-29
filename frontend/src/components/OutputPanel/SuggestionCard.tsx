'use client';
import type { AgentOutput } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';

interface SuggestionCardProps {
  output: AgentOutput;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
}

export function SuggestionCard({
  output,
  onApprove,
  onReject,
  onEdit,
}: SuggestionCardProps) {
  const renderContent = () => {
    if (typeof output.content === 'string') {
      return <p className="whitespace-pre-wrap">{output.content}</p>;
    }

    // Handle structured content
    if (output.outputType === 'content_generation') {
      const content = output.content as Record<string, unknown>;
      const hook = typeof content.hook === 'string' ? content.hook : null;
      const script = typeof content.script === 'string' ? content.script : null;
      const cta = typeof content.cta === 'string' ? content.cta : null;
      
      return (
        <div className="space-y-3">
          {hook && (
            <div>
              <h4 className="font-semibold text-sm mb-1">Hook:</h4>
              <p className="text-sm">{hook}</p>
            </div>
          )}
          {script && (
            <div>
              <h4 className="font-semibold text-sm mb-1">Script:</h4>
              <p className="text-sm">{script}</p>
            </div>
          )}
          {cta && (
            <div>
              <h4 className="font-semibold text-sm mb-1">CTA:</h4>
              <p className="text-sm">{cta}</p>
            </div>
          )}
        </div>
      );
    }

    if (output.outputType === 'agent_scaffold') {
      return (
        <div>
          <h4 className="font-semibold text-sm mb-2">Agent Scaffold:</h4>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
            {JSON.stringify(output.content, null, 2)}
          </pre>
        </div>
      );
    }

    return <pre>{JSON.stringify(output.content, null, 2)}</pre>;
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1">
          <span className="inline-block px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-200 rounded-lg">
            {output.outputType.replace('_', ' ')}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDateTime(output.generatedAt)}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>{output.modelUsed}</span>
            <span className="hidden sm:inline">•</span>
            <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(output.costUsd)}</span>
          </p>
        </div>
      </div>

      <div className="mb-4 sm:mb-5 prose prose-sm dark:prose-invert max-w-none">{renderContent()}</div>

      {output.requiresApproval && (
        <div className="flex flex-wrap gap-2 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
          {onApprove && (
            <button
              onClick={onApprove}
              className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Approve
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Edit
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}
