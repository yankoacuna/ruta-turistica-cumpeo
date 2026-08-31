'use client';

import React, { useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle, Lock } from 'lucide-react';
import { Field, inputCls } from './Field';

interface AdminLoginProps {
  onLogin: (password: string) => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (password.trim().length > 0) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onLogin(password);
      }, 500);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sol border-2 border-[#1E1E24] shadow-sm mb-3 relative">
            <img
              src="/assets/images/condorito-oficial.png"
              alt="Logo"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/images/condorito-oficial.png';
              }}
            />
          </div>
          <h1 className="font-display font-black text-2xl text-text-primary mb-1">
            Panel de Administración
          </h1>
          <p className="text-sm text-text-secondary">
            Gestor de Contenidos · Cumpeo Turismo
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border p-7 shadow-md">
          <div className="flex flex-col gap-4">
            <Field label="Contraseña de administración" required>
              <div className="relative">
                <input
                  type="password"
                  className={inputCls}
                  placeholder="Ingresa la clave de acceso..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  autoFocus
                />
                <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </Field>

            {error && (
              <div className="flex items-center gap-2 text-rojo text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                Por favor ingresa la contraseña para continuar.
              </div>
            )}

            <button
              className="w-full flex gap-2 items-center justify-center bg-rojo text-white py-3 rounded-xl font-bold hover:bg-rojo-dark transition-all shadow-[0_4px_12px_rgba(230,57,70,0.3)] disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              {loading ? 'Verificando…' : 'Acceder al Panel'}
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
            <ShieldCheck size={12} />
            Acceso restringido a administradores municipales
          </div>
        </div>
      </div>
    </div>
  );
}
