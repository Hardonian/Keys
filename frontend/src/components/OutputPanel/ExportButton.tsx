'use client';

import React, { useState } from 'react';

interface ExportButtonProps {
  onExportMindStudio?: () => void;
  onExportJSON?: () => void;
  onCopy?: () => void;
  content?: string | Record<string, any>;
}

export function ExportButton({
  onExportMindStudio,
  onExportJSON,
  onCopy,
  content,
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (content) {
      const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    onCopy?.();
  };

  const handleExportJSON = () => {
    if (content && typeof content === 'object') {
      const blob = new Blob([JSON.stringify(content, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-scaffold-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    onExportJSON?.();
  };

  const handleExportMindStudio = () => {
    // Format for MindStudio import
    if (content && typeof content === 'object') {
      // Convert to MindStudio format
      const mindstudioFormat = {
        agentName: content.agentName || 'Generated Agent',
        description: content.description || '',
        trigger: content.trigger || { type: 'manual' },
        steps: (content.steps || []).map((step: any) => ({
          id: step.id || `step_${Date.now()}`,
          name: step.name || 'Step',
          type: step.type || 'action',
          ...(step.action && { action: step.action }),
          ...(step.llm && {
            llm: {
              model: step.llm.model || 'gpt-4-turbo',
              systemPrompt: step.llm.systemPrompt || '',
              userPrompt: step.llm.userPrompt || '',
              temperature: step.llm.temperature || 0.7,
              maxTokens: step.llm.maxTokens || 2000,
            },
          }),
          ...(step.humanInTheLoop && { humanInTheLoop: step.humanInTheLoop }),
          ...(step.condition && { condition: step.condition }),
          ...(step.nextStep && { nextStep: step.nextStep }),
        })),
        variables: content.variables || {},
        metadata: {
          version: '1.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const blob = new Blob([JSON.stringify(mindstudioFormat, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindstudio-agent-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    onExportMindStudio?.();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        Export
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <button
              onClick={() => {
                handleCopy();
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button
              onClick={() => {
                handleExportJSON();
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export as JSON
            </button>
            <button
              onClick={() => {
                handleExportMindStudio();
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Export to MindStudio
            </button>
          </div>
        </>
      )}
    </div>
  );
}
