'use client';

import React, { useState } from 'react';
import { ExportButton } from './ExportButton';
import type { AgentOutput } from '@/types';

interface AgentScaffoldProps {
  output: AgentOutput;
  onExport?: (format: 'mindstudio' | 'json') => void;
}

export function AgentScaffold({ output, onExport }: AgentScaffoldProps) {
  const [expanded, setExpanded] = useState(false);
  const scaffold = output.content as Record<string, any>;

  if (output.outputType !== 'agent_scaffold') {
    return null;
  }

  const handleExport = (format: 'mindstudio' | 'json') => {
    if (onExport) {
      onExport(format);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">{scaffold.agentName || 'Generated Agent'}</h3>
          {scaffold.description && (
            <p className="text-sm text-gray-600">{scaffold.description}</p>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {scaffold.trigger && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Trigger</h4>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p>
              <span className="font-medium">Type:</span> {scaffold.trigger.type}
            </p>
            {scaffold.trigger.source && (
              <p>
                <span className="font-medium">Source:</span> {scaffold.trigger.source}
              </p>
            )}
            {scaffold.trigger.event && (
              <p>
                <span className="font-medium">Event:</span> {scaffold.trigger.event}
              </p>
            )}
          </div>
        </div>
      )}

      {scaffold.steps && scaffold.steps.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Steps ({scaffold.steps.length})</h4>
          <div className="space-y-2">
            {scaffold.steps.map((step: any, index: number) => (
              <div
                key={step.id || index}
                className="bg-gray-50 p-3 rounded text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-primary-600">
                    Step {index + 1}:
                  </span>
                  <span className="font-medium">{step.name || step.id}</span>
                </div>
                <p className="text-gray-600 text-xs">
                  Type: {step.type || 'action'}
                </p>
                {expanded && step.llm && (
                  <div className="mt-2 pl-4 border-l-2 border-gray-300">
                    <p className="text-xs text-gray-500">
                      Model: {step.llm.model || 'gpt-4-turbo'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Full JSON</h4>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-96">
            {JSON.stringify(scaffold, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <ExportButton
          content={scaffold}
          onExportMindStudio={() => handleExport('mindstudio')}
          onExportJSON={() => handleExport('json')}
        />
      </div>
    </div>
  );
}
