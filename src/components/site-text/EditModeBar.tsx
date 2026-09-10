'use client';

/**
 * Barra que indica que el sitio está en modo edición.
 *
 * Va abajo a la izquierda: el botón flotante del mapa ocupa la derecha y en
 * móvil hay una barra de navegación de 64px, así que se sube por encima de
 * ella para no tapar nada.
 */

import React from 'react';
import Link from 'next/link';
import { Pencil, History, X } from 'lucide-react';
import type { UserRole } from '@/lib/types';

interface EditModeBarProps {
  usuario: { nombre: string; email: string; role: UserRole } | null;
  editados: number;
  onSalir: () => void;
}

export function EditModeBar({ usuario, editados, onSalir }: EditModeBarProps) {
  return (
    <div className="fixed left-3 bottom-[76px] md:bottom-4 z-[200] max-w-[calc(100vw-1.5rem)]">
      <div className="flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-full bg-ink text-white border-2 border-sol shadow-comic-sol">
        <span className="w-7 h-7 rounded-full bg-sol text-ink flex items-center justify-center shrink-0">
          <Pencil size={14} />
        </span>

        <div className="min-w-0 leading-tight">
          <div className="text-xs font-bold whitespace-nowrap">
            Modo edición
            {editados > 0 && (
              <span className="ml-1.5 font-semibold text-sol">
                · {editados} {editados === 1 ? 'texto' : 'textos'}
              </span>
            )}
          </div>
          <div className="text-[10px] text-paper-deep/80 truncate max-w-[190px]">
            {usuario ? `${usuario.nombre} · ${usuario.role}` : 'Sesión del CMS'}
          </div>
        </div>

        <Link
          href="/admin"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white no-underline transition-colors shrink-0"
          title="Ver el historial de cambios en el panel"
        >
          <History size={13} /> Historial
        </Link>

        <button
          type="button"
          onClick={onSalir}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-white text-ink hover:bg-paper-deep transition-colors shrink-0 cursor-pointer"
          title="Salir del modo edición"
        >
          <X size={13} /> Salir
        </button>
      </div>

      <p className="mt-1.5 ml-1 text-[10px] font-semibold text-text-secondary bg-white/85 backdrop-blur-sm rounded-full px-2.5 py-1 inline-block border border-border">
        Haz clic en cualquier texto marcado para cambiarlo
      </p>
    </div>
  );
}
