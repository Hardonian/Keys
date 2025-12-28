'use client';

import React from 'react';
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
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded">
            {output.outputType.replace('_', ' ')}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {formatDateTime(output.generatedAt)} • {output.modelUsed} •{' '}
            {formatCurrency(output.costUsd)}
          </p>
        </div>
      </div>

      <div className="mb-4">{renderContent()}</div>

      {output.requiresApproval && (
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          {onApprove && (
            <button
              onClick={onApprove}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Edit
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}
