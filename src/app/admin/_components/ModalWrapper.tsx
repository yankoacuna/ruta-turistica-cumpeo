import React from 'react';
import { X, Save, Loader2 } from 'lucide-react';

// ─── Modal shell ───────────────────────────────────────────────────────────────
interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function ModalWrapper({ title, onClose, children }: ModalWrapperProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-[680px] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] my-8">
        {/* Sticky header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-display font-bold text-lg text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-rojo hover:bg-[#FFE0E2] transition-all p-1.5 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-160px)]">{children}</div>
      </div>
    </div>
  );
}

// ─── Modal action bar ──────────────────────────────────────────────────────────
interface ModalActionsProps {
  onClose: () => void;
  isPending: boolean;
}

export function ModalActions({ onClose, isPending }: ModalActionsProps) {
  return (
    <div className="flex gap-3 pt-4 border-t border-border mt-2">
      <button
        type="submit"
        disabled={isPending}
        className="flex-1 flex items-center justify-center gap-2 bg-rojo text-white py-3 rounded-xl font-bold shadow-[0_4px_12px_rgba(230,57,70,0.3)] hover:bg-rojo-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
        {isPending ? 'Guardando…' : 'Guardar Cambios'}
      </button>
      <button
        type="button"
        disabled={isPending}
        className="px-6 py-3 rounded-xl border-2 border-border font-bold text-text-secondary hover:bg-surface-soft hover:border-text-muted transition-all disabled:opacity-50"
        onClick={onClose}
      >
        Cancelar
      </button>
    </div>
  );
}
