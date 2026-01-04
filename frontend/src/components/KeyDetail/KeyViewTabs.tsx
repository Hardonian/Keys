'use client';

export type ViewType = 'skim' | 'visual' | 'step-by-step' | 'narrative';

interface KeyViewTabsProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const VIEWS: Array<{ id: ViewType; label: string; description: string }> = [
  {
    id: 'skim',
    label: 'Skim',
    description: '60-second overview',
  },
  {
    id: 'visual',
    label: 'Visual',
    description: 'Flow diagram or checklist',
  },
  {
    id: 'step-by-step',
    label: 'Step-by-Step',
    description: 'Procedural, numbered',
  },
  {
    id: 'narrative',
    label: 'Narrative',
    description: 'What usually goes wrong',
  },
];

export function KeyViewTabs({ activeView, onViewChange }: KeyViewTabsProps) {
  return (
    <div className="border-b border-gray-200 dark:border-slate-700 mb-6" role="tablist" aria-label="Key view options">
      <div className="flex flex-wrap gap-2 sm:gap-4">
        {VIEWS.map(view => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            role="tab"
            aria-selected={activeView === view.id}
            aria-controls={`${view.id}-panel`}
            className={`px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
              activeView === view.id
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="text-left">
              <div>{view.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                {view.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
