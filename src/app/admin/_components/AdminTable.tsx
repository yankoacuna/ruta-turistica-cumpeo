'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  MapPin,
  UtensilsCrossed,
  BedDouble,
  CalendarDays,
  Image,
  Pencil,
  Trash2,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Destination, Restaurant, Accommodation, CumpeoEvent } from '@/lib/types';
import { formatHorario } from '@/lib/openingHours';
import { AdminSection } from '../_types';
import { Tooltip } from './Tooltip';

interface EntityHandlers<T> {
  onNew: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string, nombre: string) => void;
}

interface AdminTableProps {
  activeSection: Exclude<AdminSection, 'dashboard' | 'qrcodes' | 'backups' | 'usuarios'>;
  destinos: Destination[];
  restaurantes: Restaurant[];
  alojamientos: Accommodation[];
  eventos: CumpeoEvent[];
  canEdit?: boolean;
  canDelete?: boolean;
  handlers: {
    destinos: EntityHandlers<Destination>;
    restaurantes: EntityHandlers<Restaurant>;
    alojamientos: EntityHandlers<Accommodation>;
    eventos: EntityHandlers<CumpeoEvent>;
  };
}

type FilterOption = { value: string; label: string };

interface ColumnDef<T> {
  key: string;
  label: string;
  thClassName?: string;
  tdClassName?: string;
  align?: 'left' | 'right';
  sortable?: boolean;
  getSortValue?: (item: T) => string | number;
  filterable?: boolean;
  filterType?: 'text' | 'select';
  filterOptions?: FilterOption[];
  getFilterValue?: (item: T) => string;
  render: (item: T) => React.ReactNode;
}

const PAGE_SIZE_OPTIONS = [10, 15, 20, 50];

function Thumbnail({ url }: { url?: string | null }) {
  const hasRealImage = Boolean(url && !url.includes('placeholder'));
  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-soft border border-border shrink-0">
      {hasRealImage ? (
        <img
          src={url!.startsWith('/') || url!.startsWith('http') ? url! : `/${url!}`}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#FAF8F5]" title="Sin imagen asignada">
          <Image size={14} className="text-text-muted/60" />
        </div>
      )}
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  activo = true,
}: {
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  /** Mientras el registro esté activo, no se puede eliminar: primero hay que desactivarlo. */
  activo?: boolean;
}) {
  if (!canEdit && !canDelete) {
    return (
      <div className="flex justify-end text-[11px] text-text-muted italic py-1">
        Solo lectura
      </div>
    );
  }

  return (
    <div className="flex gap-1 justify-end">
      {canEdit && (
        <button
          onClick={onEdit}
          className="p-2 text-cielo hover:bg-[#E0F2FE] rounded-lg transition-colors"
          title="Editar registro"
        >
          <Pencil size={15} />
        </button>
      )}
      {canDelete && (
        activo ? (
          <Tooltip label={`Primero debes desactivarlo (edítalo y desmarca "Activo") antes de poder eliminarlo`}>
            <button disabled className="p-2 text-text-muted/40 rounded-lg cursor-not-allowed">
              <Trash2 size={15} />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={onDelete}
            className="p-2 text-rojo hover:bg-[#FFE0E2] rounded-lg transition-colors"
            title="Eliminar registro"
          >
            <Trash2 size={15} />
          </button>
        )
      )}
    </div>
  );
}

function EstadoBadge({ activo, inactiveLabel = 'En Pausa' }: { activo: boolean; inactiveLabel?: string }) {
  return activo ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
      <CheckCircle2 size={11} /> Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-text-muted bg-surface-soft px-2 py-0.5 rounded-full border border-border">
      <XCircle size={11} /> {inactiveLabel}
    </span>
  );
}

const ESTADO_FILTER_OPTIONS: FilterOption[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
];

export function AdminTable({
  activeSection,
  destinos,
  restaurantes,
  alojamientos,
  eventos,
  canEdit = true,
  canDelete = true,
  handlers,
}: AdminTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
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
        ? restaurantes.filter((r) => r.nombre.toLowerCase().includes(q) || (r.propietario || '').toLowerCase().includes(q))
        : restaurantes,
    [restaurantes, q]
  );

  const filteredAlojamientos = useMemo(
    () =>
      q
        ? alojamientos.filter((a) => a.nombre.toLowerCase().includes(q) || (a.propietario || '').toLowerCase().includes(q))
        : alojamientos,
    [alojamientos, q]
  );

  const filteredEventos = useMemo(
    () =>
      q
        ? eventos.filter((e) => e.nombre.toLowerCase().includes(q) || e.tipo.toLowerCase().includes(q))
        : eventos,
    [eventos, q]
  );

  const categoriaOptions = useMemo<FilterOption[]>(
    () =>
      Array.from(new Set(destinos.map((d) => d.categoria)))
        .sort()
        .map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
    [destinos]
  );

  const eventoTipoOptions = useMemo<FilterOption[]>(
    () =>
      Array.from(new Set(eventos.map((e) => e.tipo)))
        .sort()
        .map((t) => ({ value: t, label: t.replace(/-/g, ' ') })),
    [eventos]
  );

  const currentHandler =
    activeSection === 'destinos'
      ? handlers.destinos
      : activeSection === 'restaurantes'
      ? handlers.restaurantes
      : activeSection === 'eventos'
      ? handlers.eventos
      : handlers.alojamientos;

  const columns = useMemo<ColumnDef<any>[]>(() => {
    switch (activeSection) {
      case 'destinos':
        return [
          { key: 'thumb', label: '', thClassName: 'w-12', render: (d: Destination) => <Thumbnail url={d.imagenPrincipal} /> },
          {
            key: 'nombre',
            label: 'Nombre',
            sortable: true,
            filterable: true,
            filterType: 'text',
            getSortValue: (d: Destination) => d.nombre.toLowerCase(),
            getFilterValue: (d: Destination) => d.nombre,
            render: (d: Destination) => (
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
            getSortValue: (d: Destination) => d.categoria,
            getFilterValue: (d: Destination) => d.categoria,
            render: (d: Destination) => (
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
            getSortValue: (d: Destination) => formatHorario(d.horario).toLowerCase(),
            getFilterValue: (d: Destination) => formatHorario(d.horario),
            render: (d: Destination) => formatHorario(d.horario) || <span className="text-text-muted">No especificado</span>,
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
            getSortValue: (d: Destination) => (d.destacado ? 1 : 0),
            getFilterValue: (d: Destination) => (d.destacado ? 'si' : 'no'),
            render: (d: Destination) => (
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
            getSortValue: (d: Destination) => ((d.activo ?? true) ? 1 : 0),
            getFilterValue: (d: Destination) => ((d.activo ?? true) ? 'activo' : 'inactivo'),
            render: (d: Destination) => <EstadoBadge activo={d.activo ?? true} />,
          },
          {
            key: 'actions',
            label: 'Acciones',
            align: 'right',
            render: (d: Destination) => (
              <RowActions
                onEdit={() => handlers.destinos.onEdit(d)}
                onDelete={() => handlers.destinos.onDelete(d.id, d.nombre)}
                canEdit={canEdit}
                canDelete={canDelete}
                activo={d.activo ?? true}
              />
            ),
          },
        ];

      case 'restaurantes':
        return [
          { key: 'thumb', label: '', thClassName: 'w-12', render: (r: Restaurant) => <Thumbnail url={r.imagenPrincipal} /> },
          {
            key: 'nombre',
            label: 'Nombre',
            sortable: true,
            filterable: true,
            filterType: 'text',
            getSortValue: (r: Restaurant) => r.nombre.toLowerCase(),
            getFilterValue: (r: Restaurant) => r.nombre,
            render: (r: Restaurant) => (
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
            getSortValue: (r: Restaurant) => (r.propietario || '').toLowerCase(),
            getFilterValue: (r: Restaurant) => r.propietario || '',
            render: (r: Restaurant) =>
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
            getSortValue: (r: Restaurant) => formatHorario(r.horario).toLowerCase(),
            getFilterValue: (r: Restaurant) => formatHorario(r.horario),
            render: (r: Restaurant) => formatHorario(r.horario) || <span className="text-text-muted">—</span>,
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
            getSortValue: (r: Restaurant) => ((r.activo ?? true) ? 1 : 0),
            getFilterValue: (r: Restaurant) => ((r.activo ?? true) ? 'activo' : 'inactivo'),
            render: (r: Restaurant) => <EstadoBadge activo={r.activo ?? true} />,
          },
          {
            key: 'actions',
            label: 'Acciones',
            align: 'right',
            render: (r: Restaurant) => (
              <RowActions
                onEdit={() => handlers.restaurantes.onEdit(r)}
                onDelete={() => handlers.restaurantes.onDelete(r.id, r.nombre)}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ),
          },
        ];

      case 'alojamientos':
        return [
          { key: 'thumb', label: '', thClassName: 'w-12', render: (a: Accommodation) => <Thumbnail url={a.imagenPrincipal} /> },
          {
            key: 'nombre',
            label: 'Nombre',
            sortable: true,
            filterable: true,
            filterType: 'text',
            getSortValue: (a: Accommodation) => a.nombre.toLowerCase(),
            getFilterValue: (a: Accommodation) => a.nombre,
            render: (a: Accommodation) => (
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
            getSortValue: (a: Accommodation) => (a.propietario || '').toLowerCase(),
            getFilterValue: (a: Accommodation) => a.propietario || '',
            render: (a: Accommodation) =>
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
            getSortValue: (a: Accommodation) => (a.direccion || '').toLowerCase(),
            getFilterValue: (a: Accommodation) => a.direccion || '',
            render: (a: Accommodation) => a.direccion || <span className="text-text-muted">—</span>,
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
            getSortValue: (a: Accommodation) => ((a.activo ?? true) ? 1 : 0),
            getFilterValue: (a: Accommodation) => ((a.activo ?? true) ? 'activo' : 'inactivo'),
            render: (a: Accommodation) => <EstadoBadge activo={a.activo ?? true} />,
          },
          {
            key: 'actions',
            label: 'Acciones',
            align: 'right',
            render: (a: Accommodation) => (
              <RowActions
                onEdit={() => handlers.alojamientos.onEdit(a)}
                onDelete={() => handlers.alojamientos.onDelete(a.id, a.nombre)}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ),
          },
        ];

      case 'eventos':
      default:
        return [
          { key: 'thumb', label: '', thClassName: 'w-12', render: (ev: CumpeoEvent) => <Thumbnail url={ev.imagenPrincipal} /> },
          {
            key: 'nombre',
            label: 'Nombre',
            sortable: true,
            filterable: true,
            filterType: 'text',
            getSortValue: (ev: CumpeoEvent) => ev.nombre.toLowerCase(),
            getFilterValue: (ev: CumpeoEvent) => ev.nombre,
            render: (ev: CumpeoEvent) => (
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
            getSortValue: (ev: CumpeoEvent) => ev.tipo,
            getFilterValue: (ev: CumpeoEvent) => ev.tipo,
            render: (ev: CumpeoEvent) => (
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
            getSortValue: (ev: CumpeoEvent) => (ev.fecha || '').toLowerCase(),
            getFilterValue: (ev: CumpeoEvent) => ev.fecha || '',
            render: (ev: CumpeoEvent) => ev.fecha || <span className="text-text-muted">—</span>,
          },
          {
            key: 'estado',
            label: 'Estado',
            thClassName: 'hidden md:table-cell',
            tdClassName: 'hidden md:table-cell',
            sortable: true,
            filterable: true,
            filterType: 'select',
            filterOptions: [
              { value: 'activo', label: 'Activo' },
              { value: 'inactivo', label: 'Inactivo' },
            ],
            getSortValue: (ev: CumpeoEvent) => (ev.activo ? 1 : 0),
            getFilterValue: (ev: CumpeoEvent) => (ev.activo ? 'activo' : 'inactivo'),
            render: (ev: CumpeoEvent) => <EstadoBadge activo={ev.activo} inactiveLabel="Inactivo" />,
          },
          {
            key: 'actions',
            label: 'Acciones',
            align: 'right',
            render: (ev: CumpeoEvent) => (
              <RowActions
                onEdit={() => handlers.eventos.onEdit(ev)}
                onDelete={() => handlers.eventos.onDelete(ev.id, ev.nombre)}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ),
          },
        ];
    }
  }, [activeSection, handlers, canEdit, canDelete, categoriaOptions, eventoTipoOptions]);

  const searchFilteredItems: any[] =
    activeSection === 'destinos'
      ? filteredDestinos
      : activeSection === 'restaurantes'
      ? filteredRestaurantes
      : activeSection === 'eventos'
      ? filteredEventos
      : filteredAlojamientos;

  const columnFilteredItems = useMemo(() => {
    const activeFilters = Object.entries(columnFilters).filter(([, v]) => v);
    if (activeFilters.length === 0) return searchFilteredItems;
    return searchFilteredItems.filter((item) =>
      activeFilters.every(([key, value]) => {
        const col = columns.find((c) => c.key === key);
        if (!col || !col.getFilterValue) return true;
        const itemValue = col.getFilterValue(item);
        return col.filterType === 'select'
          ? itemValue === value
          : itemValue.toLowerCase().includes(value.toLowerCase());
      })
    );
  }, [searchFilteredItems, columnFilters, columns]);

  const sortedItems = useMemo(() => {
    if (!sortKey) return columnFilteredItems;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.getSortValue) return columnFilteredItems;
    const getSortValue = col.getSortValue;
    const sorted = [...columnFilteredItems].sort((a, b) => {
      const va = getSortValue(a);
      const vb = getSortValue(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    });
    if (sortDir === 'desc') sorted.reverse();
    return sorted;
  }, [columnFilteredItems, sortKey, sortDir, columns]);

  const totalFiltered = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(
    () => sortedItems.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sortedItems, safePage, pageSize]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSection, q, columnFilters, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sectionLabel = {
    destinos: 'Destinos Turísticos',
    restaurantes: 'Restaurantes',
    alojamientos: 'Alojamientos',
    eventos: 'Eventos, Ferias y Celebraciones',
  }[activeSection];

  const sectionIcon = {
    destinos: <MapPin size={18} className="text-rojo" />,
    restaurantes: <UtensilsCrossed size={18} className="text-rojo" />,
    alojamientos: <BedDouble size={18} className="text-rojo" />,
    eventos: <CalendarDays size={18} className="text-rojo" />,
  }[activeSection];

  const sectionDescription = {
    destinos: 'Administra los puntos de interés, esculturas de Condorito y atractivos turísticos.',
    restaurantes: 'Gestiona la oferta gastronómica típica, horarios de atención y contactos.',
    alojamientos: 'Administra hoteles, cabañas y opciones de hospedaje en Cumpeo.',
    eventos: 'Programa fiestas religiosas, ferias libres y centros de evento.',
  }[activeSection];

  const rangeStart = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalFiltered);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-border bg-gradient-to-b from-white to-[#FAF8F5]/40">
        <div>
          <h3 className="font-display font-extrabold text-xl text-text-primary flex items-center gap-2">
            {sectionIcon}
            <span>{sectionLabel}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rojo/10 text-rojo">
              {totalFiltered} {totalFiltered === 1 ? 'registro' : 'registros'}
            </span>
          </h3>
          <p className="text-xs text-text-secondary mt-1 max-w-xl">
            {sectionDescription}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
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

          {canEdit && (
            <button
              id="tour-table-new-btn"
              className="flex items-center gap-1.5 bg-rojo text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-rojo-dark transition-all shadow-[0_2px_8px_rgba(230,57,70,0.25)] whitespace-nowrap"
              onClick={currentHandler.onNew}
            >
              <Plus size={15} /> Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-soft text-text-muted text-xs uppercase tracking-wider">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-bold ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.thClassName || ''}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className={`inline-flex items-center gap-1 hover:text-text-primary transition-colors ${
                        col.align === 'right' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <span>{col.label}</span>
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )
                      ) : (
                        <ChevronsUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
            <tr className="normal-case tracking-normal">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 pb-3 pt-0 font-normal ${col.thClassName || ''}`}>
                  {col.filterable &&
                    (col.filterType === 'select' ? (
                      <select
                        value={columnFilters[col.key] || ''}
                        onChange={(e) => setColumnFilters((f) => ({ ...f, [col.key]: e.target.value }))}
                        className="w-full px-2 py-1 rounded-md border border-border bg-white text-[11px] font-medium text-text-secondary outline-none focus:border-rojo"
                      >
                        <option value="">Todos</option>
                        {col.filterOptions?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={columnFilters[col.key] || ''}
                        onChange={(e) => setColumnFilters((f) => ({ ...f, [col.key]: e.target.value }))}
                        placeholder="Filtrar…"
                        className="w-full px-2 py-1 rounded-md border border-border bg-white text-[11px] font-medium text-text-secondary outline-none focus:border-rojo placeholder:text-text-muted/60"
                      />
                    ))}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item.id} className="border-t border-border hover:bg-surface-soft/60 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''} ${col.tdClassName || ''}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}

            {/* Empty state */}
            {totalFiltered === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <Search size={28} className="text-border" />
                    <span className="text-sm font-medium">
                      {search || Object.values(columnFilters).some(Boolean)
                        ? 'Sin resultados para los filtros aplicados'
                        : 'No hay elementos registrados'}
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-border bg-white">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>
            {totalFiltered === 0
              ? 'Sin registros'
              : `Mostrando ${rangeStart}–${rangeEnd} de ${totalFiltered}`}
          </span>
          <span className="flex items-center gap-1.5 ml-2">
            <label htmlFor="page-size" className="text-text-muted">
              Filas por página:
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 rounded-md border border-border bg-surface-soft text-xs font-medium text-text-primary outline-none focus:border-rojo"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Página anterior"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-semibold text-text-primary px-1">
            Página {safePage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Página siguiente"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
