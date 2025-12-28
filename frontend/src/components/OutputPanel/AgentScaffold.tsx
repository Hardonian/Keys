'use client';

import React, { useState } from 'react';
import { ExportButton } from './ExportButton';
import type { AgentOutput } from '@/types';

interface AgentScaffoldProps {
  output: AgentOutput & { content?: string | Record<string, unknown> };
  onExport?: (format: 'mindstudio' | 'json') => void;
}

export function AgentScaffold({ output, onExport }: AgentScaffoldProps) {
  const [expanded, setExpanded] = useState(false);
  const scaffold = output.content as Record<string, unknown>;

  if (output.outputType !== 'agent_scaffold') {
    return null;
  }

  const handleExport = (format: 'mindstudio' | 'json') => {
    if (onExport) {
      onExport(format);
    }
  };

  const agentName = typeof scaffold.agentName === 'string' ? scaffold.agentName : 'Generated Agent';
  const description = typeof scaffold.description === 'string' ? scaffold.description : null;
  const trigger = scaffold.trigger && typeof scaffold.trigger === 'object' ? scaffold.trigger as Record<string, unknown> : null;
  const triggerType = trigger && typeof trigger.type === 'string' ? trigger.type : null;
  const triggerSource = trigger && typeof trigger.source === 'string' ? trigger.source : null;
  const triggerEvent = trigger && typeof trigger.event === 'string' ? trigger.event : null;
  const steps = Array.isArray(scaffold.steps) ? scaffold.steps : null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">{agentName}</h3>
              {description && (
                <p className="text-sm text-gray-600">{description}</p>
              )}
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {trigger && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Trigger</h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                {triggerType && (
                  <p>
                    <span className="font-medium">Type:</span> {triggerType}
                  </p>
                )}
                {triggerSource && (
                  <p>
                    <span className="font-medium">Source:</span> {triggerSource}
                  </p>
                )}
                {triggerEvent && (
                  <p>
                    <span className="font-medium">Event:</span> {triggerEvent}
                  </p>
                )}
              </div>
            </div>
          )}

          {steps && steps.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Steps ({steps.length})</h4>
          <div className="space-y-2">
            {steps.map((step, index: number) => {
              const stepObj = step as Record<string, unknown>;
              const stepId = typeof stepObj.id === 'string' || typeof stepObj.id === 'number' ? String(stepObj.id) : `step-${index}`;
              const stepName = typeof stepObj.name === 'string' ? stepObj.name : (typeof stepObj.id === 'string' || typeof stepObj.id === 'number' ? String(stepObj.id) : 'Step');
              const stepType = typeof stepObj.type === 'string' ? stepObj.type : 'action';
              const stepLlm = stepObj.llm as Record<string, unknown> | undefined;
              const llmModel = stepLlm && typeof stepLlm.model === 'string' ? stepLlm.model : 'gpt-4-turbo';
              
              return (
                <div
                  key={stepId}
                  className="bg-gray-50 p-3 rounded text-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-primary-600">
                      Step {index + 1}:
                    </span>
                    <span className="font-medium">{stepName}</span>
                  </div>
                  <p className="text-gray-600 text-xs">
                    Type: {stepType}
                  </p>
                  {expanded && stepLlm && (
                    <div className="mt-2 pl-4 border-l-2 border-gray-300">
                      <p className="text-xs text-gray-500">
                        Model: {llmModel}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
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
