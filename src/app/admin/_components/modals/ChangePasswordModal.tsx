import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field } from '../Field';
import { PasswordInput } from '../PasswordInput';
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
          <PasswordInput
            required
            placeholder="Tu contraseña actual..."
            value={currentPassword}
            onChange={(v) => {
              setCurrentPassword(v);
              setError(null);
            }}
            autoFocus
          />
        </Field>

        {/* New password */}
        <Field label="Nueva Contraseña" required hint="Mínimo 6 caracteres">
          <PasswordInput
            required
            minLength={6}
            placeholder="Ingresa tu nueva clave..."
            value={newPassword}
            onChange={(v) => {
              setNewPassword(v);
              setError(null);
            }}
          />
        </Field>

        {/* Confirm new password */}
        <Field label="Confirmar Nueva Contraseña" required>
          <PasswordInput
            required
            minLength={6}
            placeholder="Vuelve a escribir la nueva clave..."
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

        <ModalActions
          onClose={onClose}
          isPending={isPending}
          submitLabel="Actualizar Contraseña"
        />
      </form>
    </ModalWrapper>
  );
}
