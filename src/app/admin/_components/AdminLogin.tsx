'use client';

import React, { useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle, Lock, Mail, KeyRound } from 'lucide-react';
import { Field, inputCls } from './Field';

interface AdminLoginProps {
  onLogin: (identifier: string, password?: string) => Promise<boolean | void>;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [emergencyPass, setEmergencyPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (isEmergencyMode) {
      if (!emergencyPass.trim()) {
        setError('Por favor ingresa la clave de acceso de emergencia');
        return;
      }
      setLoading(true);
      try {
        await onLogin(emergencyPass.trim());
      } catch (err: any) {
        setError(err.message || 'Error al iniciar sesión');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa tanto el correo como la contraseña');
      return;
    }

    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
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
            Gestor de Contenidos - Turismo Cumpeo
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border p-7 shadow-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isEmergencyMode ? (
              <>
                <Field label="Correo Electrónico" required>
                  <div className="relative">
                    <input
                      type="email"
                      className={inputCls}
                      placeholder="ej: correo@turismocumpeo.cl"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      autoFocus
                    />
                    <Mail size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  </div>
                </Field>

                <Field label="Contraseña" required>
                  <div className="relative">
                    <input
                      type="password"
                      className={inputCls}
                      placeholder="Ingresa tu contraseña personal..."
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                    />
                    <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  </div>
                </Field>
              </>
            ) : (
              <Field label="Clave Maestra de Respaldo" required>
                <div className="relative">
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="Clave maestra de emergencia..."
                    value={emergencyPass}
                    onChange={(e) => {
                      setEmergencyPass(e.target.value);
                      setError(null);
                    }}
                    autoFocus
                  />
                  <KeyRound size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500" />
                </div>
                <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed">
                  Modo de acceso directo usando la clave maestra de configuración.
                </p>
              </Field>
            )}

            {error && (
              <div className="flex items-center gap-2 text-rojo text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex gap-2 items-center justify-center bg-rojo text-white py-3 rounded-xl font-bold hover:bg-rojo-dark transition-all shadow-[0_4px_12px_rgba(230,57,70,0.3)] disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-1"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              {loading ? 'Verificando…' : 'Acceder al Panel'}
            </button>

            {/* Toggle Emergency mode */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsEmergencyMode(!isEmergencyMode);
                  setError(null);
                }}
                className="text-xs text-text-muted hover:text-rojo transition-colors underline decoration-dotted"
              >
                {isEmergencyMode
                  ? '← Volver al acceso con Correo y Contraseña'
                  : '¿Acceder con clave de rescate del servidor?'}
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
            <ShieldCheck size={12} />
            Control de acceso por roles: Administrador, Editor y Lector
          </div>
        </div>
      </div>
    </div>
  );
}
