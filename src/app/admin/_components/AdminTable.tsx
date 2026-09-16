'use client';

import React, { useMemo } from 'react';
import { Destination, Restaurant, Accommodation, CumpeoEvent } from '@/lib/types';
import { CatastroSection } from '../_types';
import { DataTable } from './DataTable';
import {
  SECTION_META,
  categoriaOptionsDe,
  tipoOptionsDe,
  columnasDestino,
  columnasRestaurante,
  columnasAlojamiento,
  columnasEvento,
  buscarDestino,
  buscarRestaurante,
  buscarAlojamiento,
  buscarEvento,
} from './tableColumns';

interface EntityHandlers<T> {
  onNew: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string, nombre: string) => void;
}

interface AdminTableProps {
  activeSection: CatastroSection;
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

/**
 * Selector de la tabla del catastro activo: arma columnas y filtro de búsqueda
 * según la sección, y delega el resto (orden, filtros, paginación) en `DataTable`.
 * Agregar un catastro nuevo es sumar un `case` acá y su `columnasX`/`buscarX` en
 * `tableColumns.tsx`, sin tocar `DataTable`.
 */
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
  const categoriaOptions = useMemo(() => categoriaOptionsDe(destinos), [destinos]);
  const eventoTipoOptions = useMemo(() => tipoOptionsDe(eventos), [eventos]);
  const meta = SECTION_META[activeSection];

  switch (activeSection) {
    case 'destinos':
      return (
        <DataTable
          key={activeSection}
          items={destinos}
          columns={columnasDestino({ handlers: handlers.destinos, canEdit, canDelete, categoriaOptions })}
          searchFn={buscarDestino}
          sectionLabel={meta.label}
          sectionIcon={meta.icon}
          sectionDescription={meta.description}
          onNew={handlers.destinos.onNew}
          canEdit={canEdit}
        />
      );
    case 'restaurantes':
      return (
        <DataTable
          key={activeSection}
          items={restaurantes}
          columns={columnasRestaurante({ handlers: handlers.restaurantes, canEdit, canDelete })}
          searchFn={buscarRestaurante}
          sectionLabel={meta.label}
          sectionIcon={meta.icon}
          sectionDescription={meta.description}
          onNew={handlers.restaurantes.onNew}
          canEdit={canEdit}
        />
      );
    case 'alojamientos':
      return (
        <DataTable
          key={activeSection}
          items={alojamientos}
          columns={columnasAlojamiento({ handlers: handlers.alojamientos, canEdit, canDelete })}
          searchFn={buscarAlojamiento}
          sectionLabel={meta.label}
          sectionIcon={meta.icon}
          sectionDescription={meta.description}
          onNew={handlers.alojamientos.onNew}
          canEdit={canEdit}
        />
      );
    case 'eventos':
    default:
      return (
        <DataTable
          key={activeSection}
          items={eventos}
          columns={columnasEvento({ handlers: handlers.eventos, canEdit, canDelete, eventoTipoOptions })}
          searchFn={buscarEvento}
          sectionLabel={meta.label}
          sectionIcon={meta.icon}
          sectionDescription={meta.description}
          onNew={handlers.eventos.onNew}
          canEdit={canEdit}
        />
      );
  }
}
