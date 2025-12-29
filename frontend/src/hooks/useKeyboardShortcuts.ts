'use client';

import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        (target.tagName === 'BUTTON' && !target.hasAttribute('data-shortcut-enabled'))
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

export const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrl: true,
    action: () => {
      const input = document.querySelector('#message-input') as HTMLInputElement;
      input?.focus();
    },
    description: 'Focus chat input',
  },
  {
    key: '/',
    action: () => {
      const input = document.querySelector('#message-input') as HTMLInputElement;
      input?.focus();
    },
    description: 'Focus chat input',
  },
  {
    key: 'Escape',
    action: () => {
      const modals = document.querySelectorAll('[role="dialog"]');
      modals.forEach((modal) => {
        (modal as HTMLElement).style.display = 'none';
      });
    },
    description: 'Close modals',
  },
  {
    key: '?',
    shift: true,
    action: () => {
      const helpModal = document.querySelector('#keyboard-shortcuts-help');
      if (helpModal) {
        (helpModal as HTMLElement).classList.toggle('hidden');
      }
    },
    description: 'Show keyboard shortcuts',
  },
];
