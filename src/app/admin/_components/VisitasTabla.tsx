'use client';

import React from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { VisitasDetalle } from '@/lib/types';
import { ubicacionLegible } from '@/lib/geoLabels';

const DEVICE_LABEL: Record<string, string> = {
  movil: 'Móvil',
  tablet: 'Tablet',
  escritorio: 'Escritorio',
};

const nf = new Intl.NumberFormat('es-CL');

/** Quita el sufijo del sitio del título del navegador: en una tabla solo estorba. */
function limpiarTitulo(titulo: string | null): string | null {
  if (!titulo) return null;
  const limpio = titulo.replace(/\s*[|–—-]\s*Turismo Cumpeo\s*$/i, '').trim();
  return /^turismo cumpeo$/i.test(limpio) ? null : limpio || null;
}

function fechaHoraChile(iso: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

interface VisitasTablaProps {
  datos: VisitasDetalle | null;
  cargando: boolean;
  error: boolean;
  pagina: number;
  onPaginaChange: (pagina: number) => void;
}

/**
 * Listado crudo de visitas individuales (no agregadas) del mismo período que
 * el resto del panel. Es la vista alternativa al gráfico, no un bloque aparte:
 * `VisitasPanel` decide cuál de las dos mostrar y le da el encabezado.
 */
export function VisitasTabla({ datos, cargando, error, pagina, onPaginaChange }: VisitasTablaProps) {
  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.porPagina)) : 1;

  if (error && !cargando) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="block mb-0.5">No se pudo leer el detalle de visitas.</strong>
        </div>
      </div>
    );
  }

  if (cargando && !datos) {
    return (
      <div className="space-y-2 animate-pulse">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 rounded-lg bg-surface-soft border border-border/60" />
        ))}
      </div>
    );
  }

  if (!datos || !datos.disponible) return null;

  return (
    <div className="space-y-3">
      {datos.filas.length > 0 ? (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left text-text-muted uppercase tracking-wide">
                <th className="font-bold py-2 pr-3 whitespace-nowrap">Fecha</th>
                <th className="font-bold py-2 pr-3">Página</th>
                <th className="font-bold py-2 pr-3 whitespace-nowrap">Dispositivo</th>
                <th className="font-bold py-2 pr-3">Ubicación</th>
                <th className="font-bold py-2 pr-3">Origen</th>
              </tr>
            </thead>
            <tbody>
              {datos.filas.map((fila) => {
                const titulo = limpiarTitulo(fila.titulo);
                return (
                  <tr key={fila.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 whitespace-nowrap text-text-secondary tabular-nums">
                      {fechaHoraChile(fila.createdAt)}
                    </td>
                    <td className="py-2 pr-3 max-w-[260px]">
                      {titulo && (
                        <div className="text-text-primary font-medium truncate" title={titulo}>
                          {titulo}
                        </div>
                      )}
                      <div className="text-text-muted truncate" title={fila.path}>
                        {fila.path}
                      </div>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-text-secondary">
                      {fila.device ? DEVICE_LABEL[fila.device] || fila.device : '—'}
                    </td>
                    <td className="py-2 pr-3 text-text-secondary truncate max-w-[200px]">
                      {ubicacionLegible(fila.pais, fila.region, fila.ciudad)}
                    </td>
                    <td className="py-2 pr-3 text-text-secondary truncate max-w-[160px]">
                      {fila.referrer || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-text-muted leading-relaxed">
          No hay visitas registradas en este período.
        </p>
      )}

      {datos.total > 0 && (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
          <span className="text-xs text-text-muted">
            {nf.format(datos.total)} {datos.total === 1 ? 'visita' : 'visitas'} · página {datos.pagina} de{' '}
            {nf.format(totalPaginas)}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPaginaChange(pagina - 1)}
              disabled={cargando || pagina <= 1}
              className="p-1.5 rounded-lg border border-border text-text-secondary hover:border-cielo hover:text-cielo transition-colors disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-secondary"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => onPaginaChange(pagina + 1)}
              disabled={cargando || pagina >= totalPaginas}
              className="p-1.5 rounded-lg border border-border text-text-secondary hover:border-cielo hover:text-cielo transition-colors disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-secondary"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
