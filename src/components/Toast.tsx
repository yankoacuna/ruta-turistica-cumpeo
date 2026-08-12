'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastMessage {
  id: string;
  msg: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface ToastContextType {
  showToast: (msg: string, type?: 'info' | 'success' | 'error' | 'warning', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((msg: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const TOAST_STYLES: Record<string, string> = {
    info:    'bg-[#1E3A5F] border border-[#023E8A]',
    success: 'bg-[#1B4332] border border-[#2D6A4F]',
    error:   'bg-[#7F1D1D] border border-[#C1121F]',
    warning: 'bg-[#78350F] border border-[#D97706]',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        id="toast-container"
        className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-lg pointer-events-auto max-w-[340px] animate-[toastIn_0.3s_ease] ${TOAST_STYLES[t.type] || TOAST_STYLES.info}`}
          >
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (msg: string) => console.log('Toast:', msg)
    };
  }
  return context;
}
