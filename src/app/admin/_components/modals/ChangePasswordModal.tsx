import React, { useState } from 'react';
import { KeyRound, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field, inputCls } from '../Field';
import { changeOwnPassword } from '../../actions';
import { useToast } from '@/components/Toast';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Por favor ingresa tu contraseña actual');
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
        showToast('Tu contraseña ha sido actualizada con éxito', 'success');
        onClose();
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
    <ModalWrapper title="Cambiar mi Contraseña" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-text-secondary leading-relaxed">
          Para proteger la seguridad de tu cuenta, ingresa tu clave actual y luego escribe tu nueva contraseña personal.
        </p>

        {/* Current password */}
        <Field label="Contraseña Actual" required>
          <div className="relative">
            <input
              type="password"
              required
              className={inputCls}
              placeholder="Tu contraseña actual..."
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setError(null);
              }}
              autoFocus
            />
            <KeyRound size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          </div>
        </Field>

        {/* New password */}
        <Field label="Nueva Contraseña" required hint="Mínimo 6 caracteres">
          <div className="relative">
            <input
              type="password"
              required
              minLength={6}
              className={inputCls}
              placeholder="Ingresa tu nueva clave..."
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError(null);
              }}
            />
            <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          </div>
        </Field>

        {/* Confirm new password */}
        <Field label="Confirmar Nueva Contraseña" required>
          <div className="relative">
            <input
              type="password"
              required
              minLength={6}
              className={inputCls}
              placeholder="Vuelve a escribir la nueva clave..."
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
            />
            <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          </div>
        </Field>

        {error && (
          <div className="flex items-center gap-2 text-rojo text-xs bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ModalActions
          onClose={onClose}
          isPending={isPending}
          submitLabel="Actualizar Contraseña"
        />
      </form>
    </ModalWrapper>
  );
}
