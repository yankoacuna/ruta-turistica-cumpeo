'use client';

import React from 'react';
import { Compass, Plus, Pencil, Trash2, MapPin, Clock, Gauge, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { TourRoute, POI } from '@/lib/types';
import Link from 'next/link';
import { Tooltip } from './Tooltip';

interface RutasManagerProps {
  rutas: TourRoute[];
  allPois: POI[];
  canEdit?: boolean;
  canDelete?: boolean;
  onNew: () => void;
  onEdit: (ruta: TourRoute) => void;
  onDelete: (id: string, nombre: string) => void;
}

export function RutasManager({
  rutas,
  allPois,
  canEdit = true,
  canDelete = true,
  onNew,
  onEdit,
  onDelete,
}: RutasManagerProps) {
  const poiMap = new Map(allPois.map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="font-display font-extrabold text-xl text-text-primary flex items-center gap-2">
            <Compass className="text-rojo" size={22} /> Circuitos y Rutas Turísticas ({rutas.length})
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Configura las paradas secuenciales de cada circuito, tiempo estimado y lugares a visitar. Todo se refleja de inmediato en el portal y en el mapa GPS.
          </p>
        </div>

        {canEdit && (
          <button
            id="tour-new-route-btn"
            onClick={onNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rojo hover:bg-rojo-dark text-white transition-all shadow-sm shrink-0 self-start sm:self-auto"
          >
            <Plus size={16} /> Crear Nueva Ruta
          </button>
        )}
      </div>

      {/* Grid of routes */}
      {rutas.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-border text-text-muted text-sm">
          No hay rutas configuradas todavía. Haz clic en &ldquo;Crear Nueva Ruta&rdquo; para armar el primer circuito.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rutas.map((ruta) => {
            const stopsCount = (ruta.poiIds || []).length;
            return (
              <div
                key={ruta.id}
                className="bg-white rounded-2xl border border-border p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-inner"
                        style={{ backgroundColor: ruta.color || '#E63946' }}
                      />
                      <h3 className="font-display font-bold text-base text-text-primary">
                        {ruta.nombre}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {ruta.destacada && (
                        <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-black bg-sol/20 text-[#B47900] border border-sol/30">
                          Principal
                        </span>
                      )}
                      {ruta.activo !== false ? (
                        <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                          <CheckCircle2 size={10} /> Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                          <XCircle size={10} /> Inactiva
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-4">
                    {ruta.descripcion}
                  </p>

                  {/* Metadata chips */}
                  <div className="flex flex-wrap gap-2 text-[0.7rem] text-text-muted mb-4">
                    {ruta.duracionEstimada && (
                      <span className="inline-flex items-center gap-1 bg-surface-soft px-2.5 py-1 rounded-lg border border-border">
                        <Clock size={11} /> {ruta.duracionEstimada}
                      </span>
                    )}
                    {ruta.distanciaKm && (
                      <span className="inline-flex items-center gap-1 bg-surface-soft px-2.5 py-1 rounded-lg border border-border">
                        <Gauge size={11} /> {ruta.distanciaKm} km
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 bg-surface-soft px-2.5 py-1 rounded-lg border border-border font-bold text-text-primary">
                      <MapPin size={11} className="text-rojo" /> {stopsCount} {stopsCount === 1 ? 'parada' : 'paradas'}
                    </span>
                  </div>

                  {/* Paradas configuradas preview */}
                  <div className="p-3 bg-surface-soft rounded-xl border border-border mb-4">
                    <div className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2">
                      Secuencia de Paradas:
                    </div>
                    {stopsCount === 0 ? (
                      <div className="text-xs text-text-muted italic">Sin paradas agregadas</div>
                    ) : (
                      <ol className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {ruta.poiIds.map((poiId, idx) => {
                          const poi = poiMap.get(poiId);
                          return (
                            <li
                              key={poiId}
                              className="text-xs flex items-center gap-2 text-text-secondary"
                            >
                              <span className="w-4 h-4 rounded-full bg-white border border-border text-[0.65rem] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-text-primary truncate">
                                {poi?.nombre || poiId}
                              </span>
                              <span className="text-[0.65rem] text-text-muted">
                                ({poi?.categoria || poi?.tipo || 'lugar'})
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                </div>

                {/* Card actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <Link
                    href={`/ruta?slug=${ruta.slug || ruta.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-rojo transition-colors no-underline"
                  >
                    <ExternalLink size={13} /> Ver en el portal
                  </Link>

                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <button
                        onClick={() => onEdit(ruta)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-border hover:border-rojo text-text-primary transition-all shadow-2xs"
                      >
                        <Pencil size={12} /> Configurar Paradas
                      </button>
                    )}
                    {canDelete && (
                      ruta.activo !== false ? (
                        <Tooltip label={`Primero debes desactivarla (edítala y desmarca "Activo") antes de poder eliminarla`}>
                          <button disabled className="p-1.5 rounded-lg text-text-muted/40 cursor-not-allowed">
                            <Trash2 size={14} />
                          </button>
                        </Tooltip>
                      ) : (
                        <button
                          onClick={() => onDelete(ruta.id, ruta.nombre)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar ruta"
                        >
                          <Trash2 size={14} />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
