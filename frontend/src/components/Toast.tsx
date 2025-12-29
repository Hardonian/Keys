/**
 * Toast Notification Component
 * 
 * Simple toast notification system
 */

'use client';

import { useEffect, useState } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

let toastId = 0;
const toastListeners = new Set<(toasts: Toast[]) => void>();
let toasts: Toast[] = [];

export function showToast(message: string, type: Toast['type'] = 'info', duration = 3000) {
  const id = `toast-${toastId++}`;
  const toast: Toast = { id, message, type, duration };
  
  toasts = [...toasts, toast];
  toastListeners.forEach(listener => listener([...toasts]));

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

export function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  toastListeners.forEach(listener => listener([...toasts]));
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts);
    };
    
    toastListeners.add(listener);
    setCurrentToasts([...toasts]);

    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full sm:w-auto">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            relative px-4 py-3 rounded-lg shadow-lg cursor-pointer
            transform transition-all duration-300 ease-in-out
            animate-in slide-in-from-top-5 fade-in
            ${
              toast.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                : toast.type === 'warning'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
            }
          `}
          onClick={() => removeToast(toast.id)}
          role="alert"
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg" aria-hidden="true">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="text-current opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Convenience functions
export const toast = {
  success: (message: string) => showToast(message, 'success'),
  error: (message: string) => showToast(message, 'error'),
  info: (message: string) => showToast(message, 'info'),
  warning: (message: string) => showToast(message, 'warning'),
};
