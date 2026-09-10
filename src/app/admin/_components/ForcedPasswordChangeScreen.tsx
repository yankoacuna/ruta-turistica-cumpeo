'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { Field } from './Field';
import { PasswordInput } from './PasswordInput';
import { changeOwnPassword, logoutAdmin } from '../actions';
import { AdminSessionUser } from '@/lib/types';

interface ForcedPasswordChangeScreenProps {
  currentUser: AdminSessionUser;
  onSuccess: () => void;
}

/**
 * Pantalla de paso obligado cuando la clave actual la asignó un admin (alta o
 * reseteo): no se puede cerrar ni omitir. Reemplaza al resto del panel hasta
 * que el usuario elige su propia contraseña.
 */
export function ForcedPasswordChangeScreen({ currentUser, onSuccess }: ForcedPasswordChangeScreenProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Ingresa la contraseña temporal que te entregaron');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setIsPending(true);
    try {
      const res = await changeOwnPassword(currentPassword, newPassword);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Error al cambiar la contraseña');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-border shadow-lg p-6 sm:p-8">
        <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-4">
          <ShieldAlert size={26} className="text-amber-600" />
        </div>

        <h1 className="font-display font-black text-xl text-text-primary mb-1.5">
          Elige tu propia contraseña
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-6">
          Hola {currentUser.nombre}, tu acceso se creó con una contraseña temporal. Por seguridad, antes de
          continuar debes reemplazarla por una propia.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Contraseña Temporal Actual" required>
            <PasswordInput
              required
              placeholder="La que te entregaron..."
              value={currentPassword}
              onChange={(v) => {
                setCurrentPassword(v);
                setError(null);
              }}
              autoFocus
            />
          </Field>

          <Field label="Nueva Contraseña" required hint="Mínimo 6 caracteres">
            <PasswordInput
              required
              minLength={6}
              placeholder="Elige tu nueva clave..."
              value={newPassword}
              onChange={(v) => {
                setNewPassword(v);
                setError(null);
              }}
            />
          </Field>

          <Field label="Confirmar Nueva Contraseña" required>
            <PasswordInput
              required
              minLength={6}
              placeholder="Vuelve a escribirla..."
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v);
                setError(null);
              }}
            />
          </Field>

          {error && (
            <div className="flex items-center gap-2 text-rojo text-xs bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2 bg-rojo text-white py-3 rounded-xl font-bold shadow-[0_4px_12px_rgba(230,57,70,0.3)] hover:bg-rojo-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 size={17} className="animate-spin" /> : null}
            {isPending ? 'Guardando…' : 'Guardar y continuar'}
          </button>

          <button
            type="button"
            onClick={() => logoutAdmin().then(() => (window.location.href = '/admin'))}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <LogOut size={13} /> Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
