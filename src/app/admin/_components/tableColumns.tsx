import React from 'react';
import { MapPin, UtensilsCrossed, BedDouble, CalendarDays, Star, Clock } from 'lucide-react';
import { Destination, Restaurant, Accommodation, CumpeoEvent } from '@/lib/types';
import { formatHorario } from '@/lib/openingHours';
import { ColumnDef, FilterOption, Thumbnail, RowActions, EstadoBadge, ESTADO_FILTER_OPTIONS } from './DataTable';

interface EntityHandlers<T> {
  onNew: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string, nombre: string) => void;
}

interface ColumnasOpts<T> {
  handlers: EntityHandlers<T>;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const categoriaOptionsDe = (destinos: Destination[]): FilterOption[] =>
  Array.from(new Set(destinos.map((d) => d.categoria)))
    .sort()
    .map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }));

export const tipoOptionsDe = (eventos: CumpeoEvent[]): FilterOption[] =>
  Array.from(new Set(eventos.map((e) => e.tipo)))
    .sort()
    .map((t) => ({ value: t, label: t.replace(/-/g, ' ') }));

export const SECTION_META = {
  destinos: {
    label: 'Destinos Turísticos',
    icon: <MapPin size={18} className="text-rojo" />,
    description: 'Administra los puntos de interés, esculturas de Condorito y atractivos turísticos.',
  },
  restaurantes: {
    label: 'Restaurantes',
    icon: <UtensilsCrossed size={18} className="text-rojo" />,
    description: 'Gestiona la oferta gastronómica típica, horarios de atención y contactos.',
  },
  alojamientos: {
    label: 'Alojamientos',
    icon: <BedDouble size={18} className="text-rojo" />,
    description: 'Administra hoteles, cabañas y opciones de hospedaje en Cumpeo.',
  },
  eventos: {
    label: 'Eventos, Ferias y Celebraciones',
    icon: <CalendarDays size={18} className="text-rojo" />,
    description: 'Programa fiestas religiosas, ferias libres y centros de evento.',
  },
} as const;

export function buscarDestino(d: Destination, q: string): boolean {
  return d.nombre.toLowerCase().includes(q) || d.categoria.toLowerCase().includes(q);
}

export function columnasDestino({
  handlers,
  canEdit = true,
  canDelete = true,
  categoriaOptions,
}: ColumnasOpts<Destination> & { categoriaOptions: FilterOption[] }): ColumnDef<Destination>[] {
  return [
    { key: 'thumb', label: '', thClassName: 'w-12', render: (d) => <Thumbnail url={d.imagenPrincipal} /> },
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      filterable: true,
      filterType: 'text',
      getSortValue: (d) => d.nombre.toLowerCase(),
      getFilterValue: (d) => d.nombre,
      render: (d) => (
        <>
          <div className="font-semibold text-text-primary">{d.nombre}</div>
          <div className="text-[11px] text-text-muted line-clamp-1 mt-0.5">{d.descripcionCorta}</div>
        </>
      ),
    },
    {
      key: 'categoria',
      label: 'Categoría',
      thClassName: 'hidden md:table-cell',
      tdClassName: 'hidden md:table-cell',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: categoriaOptions,
      getSortValue: (d) => d.categoria,
      getFilterValue: (d) => d.categoria,
      render: (d) => (
        <span className="inline-block text-xs font-semibold capitalize px-2.5 py-0.5 rounded-full bg-surface-soft text-text-secondary border border-border">
          {d.categoria}
        </span>
      ),
    },
    {
      key: 'horario',
      label: 'Horario',
      thClassName: 'hidden lg:table-cell',
      tdClassName: 'hidden lg:table-cell text-text-secondary',
      sortable: true,
      filterable: true,
      filterType: 'text',
      getSortValue: (d) => formatHorario(d.horario).toLowerCase(),
      getFilterValue: (d) => formatHorario(d.horario),
      render: (d) => formatHorario(d.horario) || <span className="text-text-muted">No especificado</span>,
    },
    {
      key: 'destacado',
      label: 'Destacado',
      thClassName: 'hidden sm:table-cell',
      tdClassName: 'hidden sm:table-cell',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' },
      ],
      getSortValue: (d) => (d.destacado ? 1 : 0),
      getFilterValue: (d) => (d.destacado ? 'si' : 'no'),
      render: (d) => (
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
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      thClassName: 'hidden md:table-cell',
      tdClassName: 'hidden md:table-cell',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: ESTADO_FILTER_OPTIONS,
      getSortValue: (d) => ((d.activo ?? true) ? 1 : 0),
      getFilterValue: (d) => ((d.activo ?? true) ? 'activo' : 'inactivo'),
      render: (d) => <EstadoBadge activo={d.activo ?? true} />,
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'right',
      render: (d) => (
        <RowActions
          onEdit={() => handlers.onEdit(d)}
          onDelete={() => handlers.onDelete(d.id, d.nombre)}
          canEdit={canEdit}
          canDelete={canDelete}
          activo={d.activo ?? true}
        />
      ),
    },
  ];
}

export function buscarRestaurante(r: Restaurant, q: string): boolean {
  return r.nombre.toLowerCase().includes(q) || (r.propietario || '').toLowerCase().includes(q);
}

export function columnasRestaurante({
  handlers,
  canEdit = true,
  canDelete = true,
}: ColumnasOpts<Restaurant>): ColumnDef<Restaurant>[] {
  return [
    { key: 'thumb', label: '', thClassName: 'w-12', render: (r) => <Thumbnail url={r.imagenPrincipal} /> },
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      filterable: true,
      filterType: 'text',
      getSortValue: (r) => r.nombre.toLowerCase(),
      getFilterValue: (r) => r.nombre,
      render: (r) => (
        <>
          <div className="font-semibold text-text-primary">{r.nombre}</div>
          {r.tipo && <div className="text-[11px] text-text-muted mt-0.5 capitalize">{r.tipo}</div>}
          {r.especialidad && !r.tipo && <div className="text-[11px] text-text-muted mt-0.5">{r.especialidad}</div>}
        </>
      ),
    },
    {
      key: 'propietario',
      label: 'Propietario',
      thClassName: 'hidden sm:table-cell',
      tdClassName: 'hidden sm:table-cell text-text-secondary text-xs',
      sortable: true,
      filterable: true,
      filterType: 'text',
      getSortValue: (r) => (r.propietario || '').toLowerCase(),
      getFilterValue: (r) => r.propietario || '',
      render: (r) =>
        r.propietario ? <span className="font-medium text-text-primary">{r.propietario}</span> : <span className="text-text-muted">—</span>,
    },
    {
      key: 'horario',
      label: 'Horario',
      thClassName: 'hidden md:table-cell',
      tdClassName: 'hidden md:table-cell text-text-secondary text-xs',
      sortable: true,
      filterable: true,
      filterType: 'text',
      getSortValue: (r) => formatHorario(r.horario).toLowerCase(),
      getFilterValue: (r) => formatHorario(r.horario),
      render: (r) => formatHorario(r.horario) || <span className="text-text-muted">—</span>,
    },
    {
      key: 'estado',
      label: 'Estado',
      thClassName: 'hidden md:table-cell',
      tdClassName: 'hidden md:table-cell',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: ESTADO_FILTER_OPTIONS,
      getSortValue: (r) => ((r.activo ?? true) ? 1 : 0),
      getFilterValue: (r) => ((r.activo ?? true) ? 'activo' : 'inactivo'),
      render: (r) => <EstadoBadge activo={r.activo ?? true} />,
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'right',
      render: (r) => (
        <RowActions
          onEdit={() => handlers.onEdit(r)}
          onDelete={() => handlers.onDelete(r.id, r.nombre)}
          canEdit={canEdit}
          canDelete={canDelete}
          activo={r.activo ?? true}
        />
      ),
    },
  ];
}

export function buscarAlojamiento(a: Accommodation, q: string): boolean {
  return a.nombre.toLowerCase().includes(q) || (a.propietario || '').toLowerCase().includes(q);
}

export function columnasAlojamiento({
  handlers,
  canEdit = true,
  canDelete = true,
}: ColumnasOpts<Accommodation>): ColumnDef<Accommodation>[] {
  return [
    { key: 'thumb', label: '', thClassName: 'w-12', render: (a) => <Thumbnail url={a.imagenPrincipal} /> },
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      filterable: true,
      filterType: 'text',
      getSortValue: (a) => a.nombre.toLowerCase(),
      getFilterValue: (a) => a.nombre,
      render: (a) => (
        <>
          <div className="font-semibold text-text-primary">{a.nombre}</div>
          {a.tipo && <div className="text-[11px] text-text-muted mt-0.5">{a.tipo}</div>}
        </>
      ),
    },
    {
      key: 'propietario',
      label: 'Propietario',
      thClassName: 'hidden sm:table-cell',
      tdClassName: 'hidden sm:table-cell text-text-secondary text-xs',
      sortable: true,
      filterable: true,
      filterType: 'text',
      getSortValue: (a) => (a.propietario || '').toLowerCase(),
      getFilterValue: (a) => a.propietario || '',
      render: (a) =>
        a.propietario ? <span className="font-medium text-text-primary">{a.propietario}</span> : <span className="text-text-muted">—</span>,
    },
    {
      key: 'direccion',
      label: 'Dirección',
      thClassName: 'hidden md:table-cell',
      tdClassName: 'hidden md:table-cell text-text-secondary text-xs',
      sortable: true,
      filterable: true,
      filterType: 'text',
      getSortValue: (a) => (a.direccion || '').toLowerCase(),
      getFilterValue: (a) => a.direccion || '',
      render: (a) => a.direccion || <span className="text-text-muted">—</span>,
    },
    {
      key: 'estado',
      label: 'Estado',
      thClassName: 'hidden md:table-cell',
      tdClassName: 'hidden md:table-cell',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: ESTADO_FILTER_OPTIONS,
      getSortValue: (a) => ((a.activo ?? true) ? 1 : 0),
      getFilterValue: (a) => ((a.activo ?? true) ? 'activo' : 'inactivo'),
      render: (a) => <EstadoBadge activo={a.activo ?? true} />,
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'right',
      render: (a) => (
        <RowActions
          onEdit={() => handlers.onEdit(a)}
          onDelete={() => handlers.onDelete(a.id, a.nombre)}
          canEdit={canEdit}
          canDelete={canDelete}
          activo={a.activo ?? true}
        />
      ),
    },
  ];
}

export function buscarEvento(e: CumpeoEvent, q: string): boolean {
  return e.nombre.toLowerCase().includes(q) || e.tipo.toLowerCase().includes(q);
}

export function columnasEvento({
  handlers,
  canEdit = true,
  canDelete = true,
  eventoTipoOptions,
}: ColumnasOpts<CumpeoEvent> & { eventoTipoOptions: FilterOption[] }): ColumnDef<CumpeoEvent>[] {
  return [
    { key: 'thumb', label: '', thClassName: 'w-12', render: (ev) => <Thumbnail url={ev.imagenPrincipal} /> },
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      filterable: true,
      filterType: 'text',
      getSortValue: (ev) => ev.nombre.toLowerCase(),
      getFilterValue: (ev) => ev.nombre,
      render: (ev) => (
        <>
          <div className="font-semibold text-text-primary">{ev.nombre}</div>
          {ev.recurrente && (
            <div className="text-[11px] text-[#4A7C59] mt-0.5 flex items-center gap-1">
              <Clock size={10} /> Anual
            </div>
          )}
        </>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      thClassName: 'hidden sm:table-cell',
      tdClassName: 'hidden sm:table-cell',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: eventoTipoOptions,
      getSortValue: (ev) => ev.tipo,
      getFilterValue: (ev) => ev.tipo,
      render: (ev) => (
        <span className="inline-block text-xs font-semibold capitalize px-2.5 py-0.5 rounded-full bg-surface-soft text-text-secondary border border-border">
          {ev.tipo.replace(/-/g, ' ')}
        </span>
      ),
    },
    {
      key: 'fecha',
      label: 'Fecha',
      thClassName: 'hidden md:table-cell',
      tdClassName: 'hidden md:table-cell text-text-secondary text-xs',
      sortable: true,
      filterable: true,
      filterType: 'text',
      getSortValue: (ev) => (ev.fecha || '').toLowerCase(),
      getFilterValue: (ev) => ev.fecha || '',
      render: (ev) => ev.fecha || <span className="text-text-muted">—</span>,
    },
    {
      key: 'estado',
      label: 'Estado',
      thClassName: 'hidden md:table-cell',
      tdClassName: 'hidden md:table-cell',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: ESTADO_FILTER_OPTIONS,
      getSortValue: (ev) => (ev.activo ? 1 : 0),
      getFilterValue: (ev) => (ev.activo ? 'activo' : 'inactivo'),
      render: (ev) => <EstadoBadge activo={ev.activo} inactiveLabel="Inactivo" />,
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'right',
      render: (ev) => (
        <RowActions
          onEdit={() => handlers.onEdit(ev)}
          onDelete={() => handlers.onDelete(ev.id, ev.nombre)}
          canEdit={canEdit}
          canDelete={canDelete}
          activo={ev.activo}
        />
      ),
    },
  ];
}
