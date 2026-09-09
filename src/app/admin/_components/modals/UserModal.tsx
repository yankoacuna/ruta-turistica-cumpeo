import React from 'react';
import { Shield, ShieldAlert, Eye, UserCheck, Key } from 'lucide-react';
import { AdminUser, UserRole } from '@/lib/types';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field, inputCls, selectCls } from '../Field';

interface UserModalProps {
  editing: Partial<AdminUser> & { password?: string };
  onChange: (updated: Partial<AdminUser> & { password?: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
}

export function UserModal({
  editing,
  onChange,
  onSubmit,
  onClose,
  isPending,
}: UserModalProps) {
  const set = (patch: Partial<AdminUser> & { password?: string }) =>
    onChange({ ...editing, ...patch });

  const isEditing = Boolean(editing.id);

  return (
    <ModalWrapper
      title={isEditing ? `Editar Usuario: ${editing.nombre || ''}` : 'Nuevo Usuario del CMS'}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Nombre */}
        <Field label="Nombre Completo" required hint="Ej: María González">
          <input
            required
            className={inputCls}
            placeholder="Nombre y Apellido"
            value={editing.nombre || ''}
            onChange={(e) => set({ nombre: e.target.value })}
            autoFocus
          />
        </Field>

        {/* Email */}
        <Field
          label="Correo Electrónico"
          required
          hint={isEditing ? 'El correo es el identificador único del usuario.' : 'Se utilizará para iniciar sesión en el panel.'}
        >
          <input
            type="email"
            required
            disabled={isEditing}
            className={`${inputCls} ${isEditing ? 'bg-surface-soft text-text-muted cursor-not-allowed' : ''}`}
            placeholder="ejemplo@cumpeo.cl"
            value={editing.email || ''}
            onChange={(e) => set({ email: e.target.value })}
          />
        </Field>

        {/* Rol */}
        <Field
          label="Rol y Permisos de Acceso"
          required
          hint="Determina qué acciones puede realizar este usuario en el panel"
        >
          <select
            className={selectCls}
            value={editing.role || 'LECTOR'}
            onChange={(e) => set({ role: e.target.value as UserRole })}
          >
            <option value="LECTOR">Lector (Solo consulta y visualización, sin edición)</option>
            <option value="EDITOR">Editor (Crear y editar atractivos, gastronomía, eventos y circuitos)</option>
            <option value="ADMIN">Administrador (Control total: eliminar registros, respaldos y gestión de usuarios)</option>
          </select>
        </Field>

        {/* Role Explanation Card */}
        <div className="p-3.5 rounded-xl border border-border/80 bg-[#FAF8F5] text-xs">
          {editing.role === 'ADMIN' && (
            <div className="flex items-start gap-2.5 text-rojo">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <div className="text-text-secondary">
                <span className="font-bold text-rojo">Rol Administrador:</span> Tiene control irrestricto sobre todo el sistema, incluyendo eliminación permanente de datos, copias de seguridad y administración de otros usuarios.
              </div>
            </div>
          )}
          {editing.role === 'EDITOR' && (
            <div className="flex items-start gap-2.5 text-purple-600">
              <Shield size={16} className="shrink-0 mt-0.5" />
              <div className="text-text-secondary">
                <span className="font-bold text-purple-700">Rol Editor:</span> Puede crear y actualizar cualquier atractivo, restaurante, alojamiento, evento y ruta turística. No puede eliminar registros ni acceder a la lista de usuarios.
              </div>
            </div>
          )}
          {(!editing.role || editing.role === 'LECTOR') && (
            <div className="flex items-start gap-2.5 text-emerald-600">
              <Eye size={16} className="shrink-0 mt-0.5" />
              <div className="text-text-secondary">
                <span className="font-bold text-emerald-700">Rol Lector:</span> Acceso de solo lectura al CMS. Puede ver las tablas, métricas y generar códigos QR sin modificar ningún dato.
              </div>
            </div>
          )}
        </div>

        {/* Contraseña */}
        <Field
          label={isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso'}
          required={!isEditing}
          hint={
            isEditing
              ? 'Déjala en blanco si deseas mantener la contraseña actual del usuario.'
              : 'Mínimo 6 caracteres.'
          }
        >
          <div className="relative">
            <input
              type="password"
              required={!isEditing}
              minLength={isEditing ? undefined : 6}
              className={inputCls}
              placeholder={isEditing ? '•••••••• (sin cambios)' : 'Ingresa una contraseña segura...'}
              value={editing.password || ''}
              onChange={(e) => set({ password: e.target.value })}
            />
            <Key size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          </div>
        </Field>

        {/* Estado Activo / Inactivo */}
        {isEditing && (
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <UserCheck size={14} className="text-emerald-600" />
                Cuenta Activa
              </span>
              <p className="text-[11px] text-text-muted">
                Si desactivas esta cuenta, el usuario no podrá iniciar sesión en el CMS.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={editing.activo !== false}
                onChange={(e) => set({ activo: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        )}

        <ModalActions
          onClose={onClose}
          isPending={isPending}
          submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
        />
      </form>
    </ModalWrapper>
  );
}
