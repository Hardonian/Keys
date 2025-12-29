'use client';

import { useState, useEffect } from 'react';
import { defaultShortcuts } from '@/hooks/useKeyboardShortcuts';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === '?') {
        setIsOpen(true);
        setIsVisible(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsVisible(false);
        setTimeout(() => setIsOpen(false), 200);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="keyboard-shortcuts-help"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={() => {
        setIsVisible(false);
        setTimeout(() => setIsOpen(false), 200);
      }}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Keyboard Shortcuts</h2>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => setIsOpen(false), 200);
            }}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {defaultShortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
            >
              <span className="text-sm text-slate-600 dark:text-slate-400">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.ctrl && (
                  <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-sm">
                    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                  </kbd>
                )}
                {shortcut.shift && (
                  <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-sm">
                    Shift
                  </kbd>
                )}
                {shortcut.alt && (
                  <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-sm">
                    Alt
                  </kbd>
                )}
                <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-sm">
                  {shortcut.key === 'Escape' ? 'Esc' : shortcut.key === '/' ? '/' : shortcut.key.toUpperCase()}
                </kbd>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
