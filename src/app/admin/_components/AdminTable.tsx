'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  MapPin,
  UtensilsCrossed,
  BedDouble,
  Image,
  Pencil,
  Trash2,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Destination, Restaurant, Accommodation } from '@/lib/types';
import { AdminSection } from '../_types';

interface EntityHandlers<T> {
  onNew: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string, nombre: string) => void;
}

interface AdminTableProps {
  activeSection: Exclude<AdminSection, 'dashboard' | 'qrcodes' | 'backups'>;
  destinos: Destination[];
  restaurantes: Restaurant[];
  alojamientos: Accommodation[];
  handlers: {
    destinos: EntityHandlers<Destination>;
    restaurantes: EntityHandlers<Restaurant>;
    alojamientos: EntityHandlers<Accommodation>;
  };
}

function Thumbnail({ url }: { url?: string | null }) {
  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-soft border border-border shrink-0">
      {url ? (
        <img
          src={url.startsWith('/') || url.startsWith('http') ? url : `/${url}`}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Image size={14} className="text-text-muted" />
        </div>
      )}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1 justify-end">
      <button
        onClick={onEdit}
        className="p-2 text-cielo hover:bg-[#E0F2FE] rounded-lg transition-colors"
        title="Editar registro"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={onDelete}
        className="p-2 text-rojo hover:bg-[#FFE0E2] rounded-lg transition-colors"
        title="Eliminar registro"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function formatDate(dateVal?: string | Date) {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  } catch {
    return '—';
  }
}

export function AdminTable({
  activeSection,
  destinos,
  restaurantes,
  alojamientos,
  handlers,
}: AdminTableProps) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();

  const filteredDestinos = useMemo(
    () =>
      q
        ? destinos.filter(
            (d) =>
              d.nombre.toLowerCase().includes(q) ||
              d.categoria.toLowerCase().includes(q)
          )
        : destinos,
    [destinos, q]
  );

  const filteredRestaurantes = useMemo(
    () =>
      q
        ? restaurantes.filter((r) => r.nombre.toLowerCase().includes(q))
        : restaurantes,
    [restaurantes, q]
  );

  const filteredAlojamientos = useMemo(
    () =>
      q
        ? alojamientos.filter((a) => a.nombre.toLowerCase().includes(q))
        : alojamientos,
    [alojamientos, q]
  );

  const currentHandler =
    activeSection === 'destinos'
      ? handlers.destinos
      : activeSection === 'restaurantes'
      ? handlers.restaurantes
      : handlers.alojamientos;

  const totalFiltered =
    activeSection === 'destinos'
      ? filteredDestinos.length
      : activeSection === 'restaurantes'
      ? filteredRestaurantes.length
      : filteredAlojamientos.length;

  const sectionLabel = {
    destinos: 'Destinos Turísticos',
    restaurantes: 'Restaurantes',
    alojamientos: 'Alojamientos',
  }[activeSection];

  const sectionIcon = {
    destinos: <MapPin size={18} className="text-rojo" />,
    restaurantes: <UtensilsCrossed size={18} className="text-rojo" />,
    alojamientos: <BedDouble size={18} className="text-rojo" />,
  }[activeSection];

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-border">
        <h3 className="font-display font-bold text-lg text-text-primary flex items-center gap-2">
          {sectionIcon}
          {sectionLabel}
          <span className="text-sm font-normal text-text-muted">({totalFiltered})</span>
        </h3>

        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="search"
              className="pl-8 pr-3 py-2 rounded-lg border border-border bg-surface-soft text-sm focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none transition-all w-48 text-text-primary"
              placeholder="Buscar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="flex items-center gap-1.5 bg-rojo text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-rojo-dark transition-all shadow-[0_2px_8px_rgba(230,57,70,0.25)] whitespace-nowrap"
            onClick={currentHandler.onNew}
          >
            <Plus size={15} /> Nuevo
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-soft text-text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-bold w-12" />
              <th className="px-4 py-3 text-left font-bold">Nombre</th>
              {activeSection === 'destinos' && (
                <>
                  <th className="px-4 py-3 text-left font-bold hidden md:table-cell">Categoría</th>
                  <th className="px-4 py-3 text-left font-bold hidden lg:table-cell">Precio</th>
                  <th className="px-4 py-3 text-left font-bold hidden sm:table-cell">Destacado</th>
                </>
              )}
              {activeSection !== 'destinos' && (
                <th className="px-4 py-3 text-left font-bold hidden sm:table-cell">Dirección</th>
              )}
              <th className="px-4 py-3 text-left font-bold hidden md:table-cell">Estado</th>
              <th className="px-4 py-3 text-right font-bold">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {/* ── Destinos ────────────────────────────────────────────────────── */}
            {activeSection === 'destinos' &&
              filteredDestinos.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-border hover:bg-surface-soft/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Thumbnail url={d.imagenPrincipal} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text-primary">{d.nombre}</div>
                    <div className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                      {d.descripcionCorta}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-block text-xs font-semibold capitalize px-2.5 py-0.5 rounded-full bg-surface-soft text-text-secondary border border-border">
                      {d.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">
                    {d.precio || <span className="text-text-muted">Gratuito</span>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                        d.destacado
                          ? 'bg-[#FFF3C4] text-[#B47900] border border-[#FDE68A]'
                          : 'bg-surface-soft text-text-muted border border-border'
                      }`}
                    >
                      {d.destacado && <Star size={9} />}
                      {d.destacado ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle2 size={11} /> Publicado
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      onEdit={() => handlers.destinos.onEdit(d)}
                      onDelete={() => handlers.destinos.onDelete(d.id, d.nombre)}
                    />
                  </td>
                </tr>
              ))}

            {/* ── Restaurantes ────────────────────────────────────────────────── */}
            {activeSection === 'restaurantes' &&
              filteredRestaurantes.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border hover:bg-surface-soft/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Thumbnail url={r.imagenPrincipal} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text-primary">{r.nombre}</div>
                    {r.especialidad && (
                      <div className="text-[11px] text-text-muted mt-0.5">{r.especialidad}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs hidden sm:table-cell">
                    {r.direccion || <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle2 size={11} /> Publicado
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      onEdit={() => handlers.restaurantes.onEdit(r)}
                      onDelete={() => handlers.restaurantes.onDelete(r.id, r.nombre)}
                    />
                  </td>
                </tr>
              ))}

            {/* ── Alojamientos ─────────────────────────────────────────────────── */}
            {activeSection === 'alojamientos' &&
              filteredAlojamientos.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-border hover:bg-surface-soft/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Thumbnail url={a.imagenPrincipal} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text-primary">{a.nombre}</div>
                    {a.tipo && (
                      <div className="text-[11px] text-text-muted mt-0.5">{a.tipo}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs hidden sm:table-cell">
                    {a.direccion || <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle2 size={11} /> Publicado
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      onEdit={() => handlers.alojamientos.onEdit(a)}
                      onDelete={() => handlers.alojamientos.onDelete(a.id, a.nombre)}
                    />
                  </td>
                </tr>
              ))}

            {/* Empty state */}
            {totalFiltered === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <Search size={28} className="text-border" />
                    <span className="text-sm font-medium">
                      {search
                        ? `Sin resultados para "${search}"`
                        : 'No hay elementos registrados'}
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
