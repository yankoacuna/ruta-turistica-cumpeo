'use client';

/**
 * Sección "Orden de la Portada" del CMS.
 *
 * Define en qué orden aparecen los destinos, restaurantes, alojamientos y
 * eventos en el sitio público. Se guarda como un número de posición en cada
 * registro (campo `orden`), y las consultas públicas ordenan por
 * [orden, nombre]: quien no se toque nunca queda igual que antes, alfabético.
 *
 * Se puede reordenar arrastrando (escritorio) o con las flechas (móvil, y
 * también es la vía accesible por teclado).
 */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  BedDouble,
  CalendarDays,
  ExternalLink,
  GripVertical,
  Loader2,
  ListOrdered,
  MapPin,
  RotateCcw,
  Save,
  UtensilsCrossed,
} from 'lucide-react';
import type {
  Accommodation,
  CumpeoEvent,
  Destination,
  OrderableEntity,
  Restaurant,
  UserRole,
} from '@/lib/types';
import { updateEntityOrder } from '../actions';
import type { ToastFn } from '../_types';

/** Lo mínimo que necesita esta pantalla de cualquiera de los cuatro catastros. */
interface ItemOrdenable {
  id: string;
  nombre: string;
  detalle?: string | null;
  activo?: boolean;
}

interface OrdenPortadaManagerProps {
  destinos: Destination[];
  restaurantes: Restaurant[];
  alojamientos: Accommodation[];
  eventos: CumpeoEvent[];
  role: UserRole;
  showToast: ToastFn;
  onAuthError?: () => void;
  /** Deja el nuevo orden aplicado en las tablas del panel. */
  onReordered?: (tipo: OrderableEntity, orderedIds: string[]) => void;
}

const TABS: Array<{
  id: OrderableEntity;
  label: string;
  icon: typeof MapPin;
  color: string;
  seccion: string;
}> = [
  { id: 'destinos', label: 'Destinos', icon: MapPin, color: 'text-amber-500', seccion: 'Todos los destinos' },
  {
    id: 'restaurantes',
    label: 'Restaurantes',
    icon: UtensilsCrossed,
    color: 'text-rojo',
    seccion: 'Comidas y Alojamientos (pestaña Comer)',
  },
  {
    id: 'alojamientos',
    label: 'Alojamientos',
    icon: BedDouble,
    color: 'text-cielo',
    seccion: 'Comidas y Alojamientos (pestaña Dormir)',
  },
  {
    id: 'eventos',
    label: 'Eventos',
    icon: CalendarDays,
    color: 'text-emerald-500',
    seccion: 'Fiestas y eventos',
  },
];

export function OrdenPortadaManager({
  destinos,
  restaurantes,
  alojamientos,
  eventos,
  role,
  showToast,
  onAuthError,
  onReordered,
}: OrdenPortadaManagerProps) {
  const canEdit = role === 'ADMIN' || role === 'EDITOR';
  const [tab, setTab] = useState<OrderableEntity>('destinos');
  const [guardando, setGuardando] = useState(false);
  const [arrastrando, setArrastrando] = useState<number | null>(null);

  const listasOriginales = useMemo<Record<OrderableEntity, ItemOrdenable[]>>(
    () => ({
      destinos: destinos.map((d) => ({
        id: d.id,
        nombre: d.nombre,
        detalle: d.categoria,
        activo: d.activo,
      })),
      restaurantes: restaurantes.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        detalle: r.tipo || r.especialidad,
        activo: r.activo,
      })),
      alojamientos: alojamientos.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        detalle: a.tipo,
        activo: a.activo,
      })),
      eventos: eventos.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        detalle: e.fecha || e.tipo,
        activo: e.activo,
      })),
    }),
    [destinos, restaurantes, alojamientos, eventos]
  );

  const [lista, setLista] = useState<ItemOrdenable[]>(listasOriginales[tab]);

  // Al cambiar de pestaña (o cuando el panel recibe datos nuevos) se parte del
  // orden que hay guardado, descartando cualquier reordenamiento sin guardar.
  useEffect(() => {
    setLista(listasOriginales[tab]);
  }, [tab, listasOriginales]);

  const hayCambios = useMemo(() => {
    const original = listasOriginales[tab];
    if (original.length !== lista.length) return true;
    return lista.some((item, i) => item.id !== original[i]?.id);
  }, [lista, listasOriginales, tab]);

  const mover = (desde: number, hasta: number) => {
    if (!canEdit) return;
    if (hasta < 0 || hasta >= lista.length || desde === hasta) return;
    setLista((prev) => {
      const copia = [...prev];
      const [item] = copia.splice(desde, 1);
      copia.splice(hasta, 0, item);
      return copia;
    });
  };

  const guardar = async () => {
    if (!hayCambios || guardando) return;
    setGuardando(true);
    try {
      const ids = lista.map((i) => i.id);
      const res = await updateEntityOrder(tab, ids);
      onReordered?.(tab, ids);
      showToast(
        `Orden guardado: ${res.actualizados} ${res.actualizados === 1 ? 'ficha' : 'fichas'} en la portada`,
        'success'
      );
    } catch (error: any) {
      const msg = error?.message || 'No se pudo guardar el orden';
      if (/no autorizado|sesión|sesion/i.test(msg) && onAuthError) onAuthError();
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const ordenarAlfabetico = () => {
    if (!canEdit) return;
    setLista((prev) =>
      [...prev].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    );
  };

  const tabActual = TABS.find((t) => t.id === tab)!;

  return (
    <div className="space-y-5">
      <div id="tour-orden-header" className="bg-white rounded-2xl border border-border p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display font-extrabold text-xl text-text-primary flex items-center gap-2">
              <ListOrdered size={20} className="text-rojo" /> Orden de la Portada
            </h2>
            <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Define el orden en que se muestran las fichas en el sitio. Arrastra para
              reordenar o usa las flechas, y guarda. Lo que no reordenes se mantiene en orden
              alfabético, como hasta ahora.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FAF8F5] border border-border text-text-secondary hover:text-rojo hover:border-rojo/40 no-underline transition-colors whitespace-nowrap"
            >
              Ver la portada <ExternalLink size={12} />
            </Link>
            {canEdit && (
              <button
                type="button"
                onClick={guardar}
                disabled={!hayCambios || guardando}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rojo hover:bg-rojo-dark text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Guardar orden
              </button>
            )}
          </div>
        </div>

        {!canEdit && (
          <p className="mt-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Tu rol es de solo lectura: puedes revisar el orden actual, pero no cambiarlo.
          </p>
        )}

        {/* Pestañas por catastro */}
        <div id="tour-orden-tabs" className="flex items-center gap-2 mt-4 overflow-x-auto pb-1" role="tablist">
          {TABS.map((t) => {
            const Icon = t.icon;
            const activa = tab === t.id;
            const total = listasOriginales[t.id].length;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 border ${
                  activa
                    ? 'bg-rojo text-white border-rojo shadow-sm shadow-rojo/20'
                    : 'bg-white text-text-secondary border-border hover:border-rojo/40 hover:text-text-primary'
                }`}
              >
                <Icon size={14} className={activa ? 'text-white' : t.color} />
                {t.label}
                <span
                  className={`text-[10px] font-bold rounded-full px-1.5 ${
                    activa ? 'bg-white/25' : 'bg-surface-soft border border-border text-text-muted'
                  }`}
                >
                  {total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista ordenable */}
      <div id="tour-orden-list" className="bg-white rounded-2xl border border-border overflow-hidden shadow-2xs">
        <div className="px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F5]">
          <div className="text-[11px] font-semibold text-text-secondary">
            Aparece en la portada como{' '}
            <span className="font-bold text-text-primary">{tabActual.seccion}</span>
          </div>
          <div className="flex items-center gap-2">
            {hayCambios && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                orden sin guardar
              </span>
            )}
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={ordenarAlfabetico}
                  className="text-[10px] font-bold text-text-muted hover:text-rojo transition-colors"
                  title="Reordenar de la A a la Z"
                >
                  Orden alfabético
                </button>
                {hayCambios && (
                  <button
                    type="button"
                    onClick={() => setLista(listasOriginales[tab])}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-rojo transition-colors"
                  >
                    <RotateCcw size={11} /> Descartar
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {lista.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-muted">
            No hay fichas cargadas en este catastro todavía.
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {lista.map((item, index) => (
              <li
                key={item.id}
                draggable={canEdit}
                onDragStart={() => setArrastrando(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (arrastrando === null || arrastrando === index) return;
                  mover(arrastrando, index);
                  setArrastrando(index);
                }}
                onDragEnd={() => setArrastrando(null)}
                className={`flex items-center gap-3 px-4 sm:px-5 py-3 transition-colors ${
                  arrastrando === index ? 'bg-red-50' : 'hover:bg-[#FAF8F5]'
                } ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                {canEdit && (
                  <GripVertical size={16} className="text-text-muted shrink-0 hidden sm:block" />
                )}

                <span className="w-7 h-7 rounded-lg bg-ink text-sol text-xs font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-text-primary truncate">
                    {item.nombre}
                    {item.activo === false && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-text-muted bg-surface-soft border border-border rounded px-1.5 py-0.5">
                        oculto
                      </span>
                    )}
                  </div>
                  {item.detalle && (
                    <div className="text-[11px] text-text-muted capitalize truncate">
                      {item.detalle}
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => mover(index, index - 1)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-text-muted hover:text-rojo hover:bg-white border border-transparent hover:border-border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={`Subir ${item.nombre}`}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(index, index + 1)}
                      disabled={index === lista.length - 1}
                      className="p-1.5 rounded-lg text-text-muted hover:text-rojo hover:bg-white border border-transparent hover:border-border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={`Bajar ${item.nombre}`}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="text-[11px] text-text-muted px-1 leading-relaxed">
        Nota: la portada no muestra todas las fichas de una vez (por ejemplo los destinos
        parten con 6 y el resto queda detrás de &quot;ver más&quot;), así que el orden define
        sobre todo qué aparece primero. Los destacados de la sección{' '}
        <span className="font-semibold">&quot;Lo que no te puedes perder&quot;</span> también
        siguen este orden, entre las fichas marcadas como destacadas.
      </p>
    </div>
  );
}
