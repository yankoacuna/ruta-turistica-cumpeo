'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Estilo destructivo (rojo) para acciones irreversibles como eliminar. */
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  message: string;
}

interface ConfirmContextType {
  /** Reemplazo del `confirm()` nativo del navegador, con la estética del CMS. */
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((message: string, options: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ message, ...options });
    });
  }, []);

  const handleClose = (result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9998] flex items-center justify-center p-4"
          onClick={() => handleClose(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  state.danger
                    ? 'bg-red-50 text-rojo border-red-200'
                    : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}
              >
                <AlertTriangle size={22} />
              </div>
              <div className="pt-1.5 min-w-0">
                {state.title && (
                  <h3 className="font-display font-bold text-base text-text-primary mb-1">
                    {state.title}
                  </h3>
                )}
                <p className="text-sm text-text-secondary leading-relaxed">{state.message}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface-soft transition-all"
              >
                {state.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => handleClose(true)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all ${
                  state.danger ? 'bg-rojo hover:bg-rojo-dark' : 'bg-ink hover:bg-black'
                }`}
              >
                {state.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    // Fallback defensivo si algún componente se renderiza fuera del provider.
    return { confirm: async (message: string) => window.confirm(message) };
  }
  return context;
}
