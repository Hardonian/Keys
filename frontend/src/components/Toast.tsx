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
    <div className="toast-container">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
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
