'use client';

import { motion } from 'framer-motion';
import { ViewType } from './KeyViewTabs';

interface KeyViewContentProps {
  view: ViewType;
  keyData: {
    title: string;
    description?: string;
    whenYouNeedThis: string;
    whatThisPrevents: string;
    outcome?: string;
    keyType: string;
    category?: string;
  };
}

export function KeyViewContent({ view, keyData }: KeyViewContentProps) {
  const SkimView = () => (
    <div className="space-y-6">
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">What</h3>
        <p className="text-base text-blue-800 dark:text-blue-200 leading-relaxed">
          {keyData.description || `${keyData.title} provides practical patterns for ${keyData.keyType}.`}
        </p>
      </div>
      <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3">When</h3>
        <p className="text-base text-amber-800 dark:text-amber-200 leading-relaxed">
          {keyData.whenYouNeedThis}
        </p>
      </div>
      <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">Prevents</h3>
        <p className="text-base text-green-800 dark:text-green-200 leading-relaxed">
          {keyData.whatThisPrevents}
        </p>
      </div>
      {keyData.outcome && (
        <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">Outcome</h3>
          <p className="text-base text-purple-800 dark:text-purple-200 leading-relaxed">
            {keyData.outcome}
          </p>
        </div>
      )}
    </div>
  );

  const VisualView = () => (
    <div className="space-y-6">
      <div className="p-6 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Quick Checklist</h3>
        <ul className="space-y-3">
          {[
            'Understand the situation',
            'Identify the right Key',
            'Add to Keyring',
            'Download and review',
            'Apply to your context',
          ].map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </span>
              <span className="text-base text-gray-700 dark:text-gray-300 pt-0.5">{step}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Scope</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>• This Key covers: {keyData.category || keyData.keyType} patterns</p>
          <p>• Bounded to: Practical, repeatable workflows</p>
          <p>• Not included: Custom implementation details</p>
        </div>
      </div>
    </div>
  );

  const StepByStepView = () => (
    <div className="space-y-6">
      <div className="prose dark:prose-invert max-w-none">
        <ol className="space-y-6 list-decimal list-inside">
          <li className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong className="text-gray-900 dark:text-gray-100">Identify your need:</strong> Confirm that{' '}
            <em>{keyData.whenYouNeedThis.toLowerCase()}</em>
          </li>
          <li className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong className="text-gray-900 dark:text-gray-100">Add to Keyring:</strong> Click "Add to Keyring" to unlock this Key
          </li>
          <li className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong className="text-gray-900 dark:text-gray-100">Download:</strong> Once unlocked, download the Key files
          </li>
          <li className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong className="text-gray-900 dark:text-gray-100">Review:</strong> Examine the structure and patterns included
          </li>
          <li className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong className="text-gray-900 dark:text-gray-100">Adapt:</strong> Apply the patterns to your specific context
          </li>
          <li className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong className="text-gray-900 dark:text-gray-100">Use:</strong> Reference the Key whenever you need these patterns
          </li>
        </ol>
      </div>
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Stopping points:</strong> You can pause at any step. The Key remains in your Keyring for future reference.
        </p>
      </div>
    </div>
  );

  const NarrativeView = () => (
    <div className="space-y-6">
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3">
          What usually goes wrong
        </h3>
        <ul className="space-y-2 text-base text-red-800 dark:text-red-200">
          <li>• People try to build from scratch without proven patterns</li>
          <li>• Common mistakes get repeated across projects</li>
          <li>• Knowledge isn't captured in reusable form</li>
          <li>• Teams reinvent solutions that already exist</li>
        </ul>
      </div>
      <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
          How this avoids it
        </h3>
        <p className="text-base text-green-800 dark:text-green-200 leading-relaxed mb-3">
          {keyData.whatThisPrevents}
        </p>
        <p className="text-base text-green-800 dark:text-green-200 leading-relaxed">
          This Key provides structured, tested patterns that you can adapt rather than starting from zero.
        </p>
      </div>
      <div className="p-6 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          The difference
        </h3>
        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          Instead of searching for solutions when problems arise, you have proven patterns ready in your Keyring.
          This reduces uncertainty and helps you move forward with confidence.
        </p>
      </div>
    </div>
  );

  const renderView = () => {
    switch (view) {
      case 'skim':
        return <SkimView />;
      case 'visual':
        return <VisualView />;
      case 'step-by-step':
        return <StepByStepView />;
      case 'narrative':
        return <NarrativeView />;
      default:
        return <SkimView />;
    }
  };

  return (
    <motion.div
      key={view}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="tabpanel"
      id={`${view}-panel`}
      aria-labelledby={`${view}-tab`}
    >
      {renderView()}
    </motion.div>
  );
}
