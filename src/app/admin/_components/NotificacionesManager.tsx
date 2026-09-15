'use client';

/**
 * Sección "Notificaciones" del CMS: quién recibe el aviso por correo cuando
 * llega una Solicitud nueva (contacto o postulación de /sumate).
 */

import React, { useState } from 'react';
import { Loader2, Mail, Plus, Save, Trash2 } from 'lucide-react';
import type { NotificacionesConfigRecord, UserRole } from '@/lib/types';
import { saveNotificaciones } from '../notificacionesActions';
import type { ToastFn } from '../_types';

interface NotificacionesManagerProps {
  initial: NotificacionesConfigRecord | null;
  role: UserRole;
  showToast: ToastFn;
  onAuthError?: () => void;
}

function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

export function NotificacionesManager({ initial, role, showToast, onAuthError }: NotificacionesManagerProps) {
  const canEdit = role === 'ADMIN';
  const [emails, setEmails] = useState<string[]>(initial?.emails || []);
  const [nuevo, setNuevo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const agregar = () => {
    const valor = nuevo.trim().toLowerCase();
    if (!valor) return;
    if (!emailValido(valor)) {
      showToast('Ese correo no parece válido.', 'error');
      return;
    }
    if (emails.includes(valor)) {
      showToast('Ese correo ya está en la lista.', 'error');
      return;
    }
    setEmails((prev) => [...prev, valor]);
    setNuevo('');
  };

  const quitar = (email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await saveNotificaciones(emails);
      showToast('Destinatarios actualizados', 'success');
    } catch (error: any) {
      const msg = error?.message || 'Ocurrió un error al guardar';
      if (/no autorizado|sesión|sesion/i.test(msg) && onAuthError) onAuthError();
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div id="tour-notif-header" className="bg-white rounded-2xl border border-border p-5 shadow-2xs">
        <h2 className="font-display font-extrabold text-xl text-text-primary flex items-center gap-2">
          <Mail size={20} className="text-rojo" /> Notificaciones por Correo
        </h2>
        <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
          Cuando alguien manda el formulario de contacto o postula un negocio desde
          &quot;Súmate&quot;, la solicitud queda guardada en el panel y además se avisa por
          correo a los destinatarios de esta lista.
        </p>
        {!canEdit && (
          <p className="mt-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Solo un administrador puede ver y modificar esta sección.
          </p>
        )}
      </div>

      {canEdit && (
        <div id="tour-notif-lista" className="bg-white rounded-2xl border border-border p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
            Destinatarios ({emails.length})
          </h3>

          {emails.length === 0 ? (
            <p className="text-xs text-text-muted italic">
              Sin destinatarios configurados: por ahora no se manda ningún aviso por correo.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {emails.map((email) => (
                <li
                  key={email}
                  className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-[#FAF8F5]"
                >
                  <span className="text-sm font-mono text-text-primary truncate">{email}</span>
                  <button
                    type="button"
                    onClick={() => quitar(email)}
                    disabled={guardando}
                    className="p-1.5 rounded-lg text-text-muted hover:text-rojo hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                    aria-label={`Quitar ${email}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <input
              type="email"
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  agregar();
                }
              }}
              disabled={guardando}
              placeholder="correo@ejemplo.cl"
              className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={agregar}
              disabled={guardando}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-surface-soft border border-border text-text-primary transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Plus size={14} /> Agregar
            </button>
          </div>

          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rojo hover:bg-rojo-dark text-white transition-colors disabled:opacity-50"
            >
              {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
