import { describe, it, expect } from 'vitest';
import {
  validateDestinationRow,
  validateRestaurantRow,
  validateAccommodationRow,
  validateEventRow,
  validateBulkDataset,
} from './bulkValidator';

const CUMPEO_COORDS = { lat: -35.281739, lng: -71.258714 };

describe('validateDestinationRow', () => {
  it('una fila completa y válida no genera issues', () => {
    const row = {
      nombre: 'Mural de Condorito',
      categoria: 'cultural',
      descripcionCorta: 'El mural más visitado de Cumpeo',
      latitud: '-35.28',
      longitud: '-71.25',
      imagenprincipal: 'condorito.webp',
    };
    const result = validateDestinationRow(row, 2, new Set(), new Set());
    expect(result.status).toBe('VALID');
    expect(result.issues).toHaveLength(0);
    expect(result.data.id).toBe('mural-de-condorito');
  });

  it('falta el nombre, la categoría y la descripción corta: tres errores', () => {
    const result = validateDestinationRow({}, 2, new Set(), new Set());
    expect(result.status).toBe('ERROR');
    const campos = result.issues.map((i) => i.field);
    expect(campos).toEqual(expect.arrayContaining(['nombre', 'categoria', 'descripcionCorta']));
  });

  it('una categoría fuera del catálogo es solo advertencia, no bloquea', () => {
    const row = { nombre: 'Algo', categoria: 'aventura', descripcionCorta: 'Desc' };
    const result = validateDestinationRow(row, 2, new Set(), new Set());
    expect(result.status).toBe('WARNING');
    expect(result.data.categoria).toBe('aventura');
  });

  it('sin coordenadas usa el centro de Cumpeo y avisa', () => {
    const row = { nombre: 'Algo', categoria: 'cultural', descripcionCorta: 'Desc' };
    const result = validateDestinationRow(row, 2, new Set(), new Set());
    expect(result.data.coordenadas).toEqual(CUMPEO_COORDS);
    expect(result.issues.find((i) => i.field === 'coordenadas')?.severity).toBe('WARNING');
  });

  it('detecta que va a actualizar un registro existente por id o por slug', () => {
    const row = { nombre: 'Plaza de Cumpeo', categoria: 'cultural', descripcionCorta: 'Desc' };
    const porId = validateDestinationRow(row, 2, new Set(), new Set(['plaza-de-cumpeo']));
    expect(porId.willUpdate).toBe(true);

    const porSlug = validateDestinationRow(row, 2, new Set(['plaza-de-cumpeo']), new Set());
    expect(porSlug.willUpdate).toBe(true);

    const nuevo = validateDestinationRow(row, 2, new Set(), new Set());
    expect(nuevo.willUpdate).toBe(false);
  });

  it('sin descripción larga, usa la corta como respaldo', () => {
    const row = { nombre: 'Algo', categoria: 'cultural', descripcionCorta: 'La corta' };
    const result = validateDestinationRow(row, 2, new Set(), new Set());
    expect(result.data.descripcionLarga).toBe('La corta');
  });

  it('admite nombres de columna alternativos (mayúsculas, con tilde, sinónimos)', () => {
    const row = { Atractivo: 'Mural', Rubro: 'cultural', Resumen: 'Desc' };
    const result = validateDestinationRow(row, 2, new Set(), new Set());
    expect(result.data.nombre).toBe('Mural');
    expect(result.status).not.toBe('ERROR');
  });
});

describe('validateRestaurantRow', () => {
  it('junta teléfono y whatsapp en el objeto contacto', () => {
    const row = {
      nombre: 'Donde la Mary',
      descripcion: 'Comida típica',
      telefono: '+56911112222',
      whatsapp: '+56933334444',
    };
    const result = validateRestaurantRow(row, 2, new Set());
    expect(result.data.contacto).toEqual({ telefono: '+56911112222', whatsapp: '+56933334444' });
  });

  it('sin teléfono, el whatsapp se autocompleta con el teléfono si existe', () => {
    const row = { nombre: 'Local', descripcion: 'Desc', telefono: '+56911112222' };
    const result = validateRestaurantRow(row, 2, new Set());
    expect(result.data.contacto).toEqual({ telefono: '+56911112222', whatsapp: '+56911112222' });
  });

  it('sin ningún contacto, el campo contacto queda null y avisa', () => {
    const row = { nombre: 'Local', descripcion: 'Desc' };
    const result = validateRestaurantRow(row, 2, new Set());
    expect(result.data.contacto).toBeNull();
    expect(result.issues.some((i) => i.field === 'telefono')).toBe(true);
  });

  it('sin medios de pago, usa Efectivo y Débito por defecto', () => {
    const row = { nombre: 'Local', descripcion: 'Desc' };
    const result = validateRestaurantRow(row, 2, new Set());
    expect(result.data.mediosPago).toEqual(['Efectivo', 'Débito']);
  });

  it('nombre y descripción son obligatorios', () => {
    const result = validateRestaurantRow({}, 2, new Set());
    expect(result.status).toBe('ERROR');
    expect(result.issues.map((i) => i.field)).toEqual(expect.arrayContaining(['nombre', 'descripcion']));
  });
});

describe('validateAccommodationRow', () => {
  it('junta teléfono y whatsapp en el objeto contacto, igual que restaurantes', () => {
    const row = { nombre: 'Cabañas del Río', descripcion: 'Desc', whatsapp: '+56955556666' };
    const result = validateAccommodationRow(row, 2, new Set());
    expect(result.data.contacto).toEqual({ telefono: '', whatsapp: '+56955556666' });
  });

  it('sin servicios, usa Wifi y Estacionamiento por defecto', () => {
    const row = { nombre: 'Cabañas', descripcion: 'Desc' };
    const result = validateAccommodationRow(row, 2, new Set());
    expect(result.data.servicios).toEqual(['Wifi', 'Estacionamiento']);
  });

  it('respeta los servicios provistos, separados por coma', () => {
    const row = { nombre: 'Cabañas', descripcion: 'Desc', servicios: 'Piscina, Quincho, Wifi' };
    const result = validateAccommodationRow(row, 2, new Set());
    expect(result.data.servicios).toEqual(['Piscina', 'Quincho', 'Wifi']);
  });
});

describe('validateEventRow', () => {
  it('una fila mínima válida usa los valores por defecto', () => {
    const row = { nombre: 'Fiesta de San Sebastián', descripcion: 'Fiesta religiosa anual' };
    const result = validateEventRow(row, 2, new Set());
    expect(result.status).toBe('VALID');
    expect(result.data.tipo).toBe('ferias-libres');
    expect(result.data.recurrente).toBe(true);
    expect(result.data.activo).toBe(true);
  });

  it('nombre y descripción son obligatorios', () => {
    const result = validateEventRow({}, 2, new Set());
    expect(result.status).toBe('ERROR');
    expect(result.issues.map((i) => i.field)).toEqual(expect.arrayContaining(['nombre', 'descripcion']));
  });

  it('interpreta "NO" como falso para recurrente y activo', () => {
    const row = { nombre: 'Feria única', descripcion: 'Desc', recurrente: 'NO', activo: 'NO' };
    const result = validateEventRow(row, 2, new Set());
    expect(result.data.recurrente).toBe(false);
    expect(result.data.activo).toBe(false);
  });
});

describe('validateBulkDataset', () => {
  it('salta las filas completamente vacías sin contarlas', () => {
    const rows = [
      { nombre: 'Local Uno', descripcion: 'Desc' },
      { nombre: '', descripcion: '' },
      { nombre: 'Local Dos', descripcion: 'Desc' },
    ];
    const { items, summary } = validateBulkDataset('restaurantes', rows, []);
    expect(items).toHaveLength(2);
    expect(summary.totalRows).toBe(2);
  });

  it('cuenta correctamente válidos, con advertencia y con error', () => {
    const rows = [
      // válido: con contacto y coordenadas, para no arrastrar el warning de "sin coordenadas"
      { nombre: 'Válido', descripcion: 'Desc', telefono: '+56911112222', latitud: '-35.28', longitud: '-71.25' },
      { nombre: 'Con advertencia', descripcion: 'Desc' }, // sin contacto ni coordenadas -> warning
      { descripcion: 'Sin nombre' }, // error
    ];
    const { summary } = validateBulkDataset('restaurantes', rows, []);
    expect(summary.validRows).toBe(1);
    expect(summary.warningRows).toBe(1);
    expect(summary.errorRows).toBe(1);
  });

  it('las filas con error no se cuentan para crear ni actualizar', () => {
    const rows = [{ descripcion: 'Sin nombre, va a fallar' }];
    const { summary } = validateBulkDataset('restaurantes', rows, []);
    expect(summary.itemsToCreate).toBe(0);
    expect(summary.itemsToUpdate).toBe(0);
  });

  it('reconoce actualizaciones contra los registros existentes', () => {
    const rows = [
      { nombre: 'Ya existe', descripcion: 'Desc', telefono: '+56911112222' },
      { nombre: 'Es nuevo', descripcion: 'Desc', telefono: '+56911112222' },
    ];
    const { summary } = validateBulkDataset('restaurantes', rows, [{ id: 'ya-existe' }]);
    expect(summary.itemsToUpdate).toBe(1);
    expect(summary.itemsToCreate).toBe(1);
  });
});
