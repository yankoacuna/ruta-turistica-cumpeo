import React, { useState } from 'react';
import { Lock, AlertTriangle, LogOut, Loader2, ArrowRight } from 'lucide-react';
import { loginAdmin } from '../../actions';
import { AdminSessionUser } from '@/lib/types';

interface SessionExpiredModalProps {
  currentUser?: AdminSessionUser | null;
  onSuccess: (user: AdminSessionUser) => void;
  onLogout: () => void;
}

export function SessionExpiredModal({
  currentUser,
  onSuccess,
  onLogout,
}: SessionExpiredModalProps) {
  const [identifier, setIdentifier] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const res = await loginAdmin(identifier, password);
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setError(res.error || 'Credenciales incorrectas');
      }
    } catch (err: any) {
      setError(err.message || 'Error al validar credenciales');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-border max-w-md w-full overflow-hidden flex flex-col">
        {/* Header con advertencia */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-3 shadow-md">
            <Lock size={28} className="text-white" />
          </div>
          <h3 className="font-display font-black text-xl tracking-tight">
            Tu sesión ha expirado
          </h3>
          <p className="text-amber-100 text-xs mt-1 max-w-xs leading-relaxed">
            Por seguridad, tu sesión caducó. Ingresa tu clave para reanudarla sin perder los datos que estás editando.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rojo" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Usuario o Correo
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-soft text-xs text-text-primary focus:outline-none focus:border-amber-500"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-soft text-xs text-text-primary focus:outline-none focus:border-amber-500"
              placeholder="••••••••"
              autoFocus
              required
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Reanudar Sesión y Continuar</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-text-muted hover:text-rojo transition-colors"
            >
              <LogOut size={13} />
              <span>Salir y cerrar sesión definitivamente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
