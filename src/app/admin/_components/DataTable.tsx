'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { Tooltip } from './Tooltip';
import { SearchableSelect } from '@/components/SearchableSelect';

export type FilterOption = { value: string; label: string };

export interface ColumnDef<T> {
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

/** Miniatura cuadrada con imagen o ícono de reemplazo si no hay foto real. */
export function Thumbnail({ url }: { url?: string | null }) {
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
          <ImageIcon size={14} className="text-text-muted/60" />
        </div>
      )}
    </div>
  );
}

/** Botones de editar/eliminar de una fila. Bloquea el borrado mientras el registro esté activo. */
export function RowActions({
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
          <Tooltip label={`Primero debes desactivarlo: edítalo y desmarca "Visible en el portal" o "Activo" antes de poder eliminarlo`}>
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

export const ESTADO_FILTER_OPTIONS: FilterOption[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
];

/** Badge de estado activo/en pausa, reutilizado en las columnas de cada catastro. */
export function EstadoBadge({ activo, inactiveLabel = 'En Pausa' }: { activo: boolean; inactiveLabel?: string }) {
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

interface DataTableProps<T extends { id: string }> {
  items: T[];
  columns: ColumnDef<T>[];
  /** Filtro de la barra de búsqueda; distinto por tipo de entidad (qué campos busca). */
  searchFn: (item: T, query: string) => boolean;
  sectionLabel: string;
  sectionIcon: React.ReactNode;
  sectionDescription: string;
  searchPlaceholder?: string;
  onNew?: () => void;
  canEdit?: boolean;
}

/**
 * Tabla genérica del panel: búsqueda, filtros por columna, orden y paginación.
 * No sabe qué es un destino, un restaurante o cualquier otra entidad — todo lo
 * propio de cada catastro entra por `columns` y `searchFn`.
 */
export function DataTable<T extends { id: string }>({
  items,
  columns,
  searchFn,
  sectionLabel,
  sectionIcon,
  sectionDescription,
  searchPlaceholder = 'Buscar…',
  onNew,
  canEdit = true,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const q = search.trim().toLowerCase();

  const searchFilteredItems = useMemo(
    () => (q ? items.filter((item) => searchFn(item, q)) : items),
    [items, q, searchFn]
  );

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
  }, [q, columnFilters, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

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
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {canEdit && onNew && (
            <button
              id="tour-table-new-btn"
              className="flex items-center gap-1.5 bg-rojo text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-rojo-dark transition-all shadow-[0_2px_8px_rgba(230,57,70,0.25)] whitespace-nowrap"
              onClick={onNew}
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
                      <SearchableSelect
                        value={columnFilters[col.key] || ''}
                        onChange={(v) => setColumnFilters((f) => ({ ...f, [col.key]: v }))}
                        placeholder="Todos"
                        triggerClassName="w-full flex items-center justify-between gap-1.5 px-2 py-1 rounded-md border border-border bg-white text-[11px] font-medium text-text-secondary outline-none focus:border-rojo cursor-pointer"
                        options={[{ value: '', label: 'Todos' }, ...(col.filterOptions || [])]}
                      />
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
            <SearchableSelect
              id="page-size"
              className="w-16"
              value={String(pageSize)}
              onChange={(v) => setPageSize(Number(v))}
              searchable={false}
              triggerClassName="w-full flex items-center justify-between gap-1 px-2 py-1 rounded-md border border-border bg-surface-soft text-xs font-medium text-text-primary outline-none focus:border-rojo cursor-pointer"
              options={PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: String(size) }))}
            />
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
