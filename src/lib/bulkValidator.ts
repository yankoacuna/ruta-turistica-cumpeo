import * as XLSX from 'xlsx';
import { slugify } from './slug';

export type BulkEntityType = 'destinos' | 'restaurantes' | 'alojamientos' | 'eventos';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ParsedBulkItem<T = any> {
  rowNumber: number;
  status: 'VALID' | 'WARNING' | 'ERROR';
  issues: ValidationIssue[];
  data: T;
  raw: Record<string, any>;
  willUpdate?: boolean;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  itemsToCreate: number;
  itemsToUpdate: number;
}

// Coordenadas céntricas por defecto de Cumpeo, Maule
const DEFAULT_CUMPEO_COORDS = { lat: -35.281739, lng: -71.258714 };

/**
 * Normaliza claves de encabezados para soportar variaciones comunes de los usuarios
 */
function normalizeKey(key: string): string {
  return key
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Normaliza valores booleanos desde textos como 'SI', 'NO', 'TRUE', '1', etc.
 */
function parseBoolean(val: any, defaultVal = false): boolean {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  const str = String(val).trim().toUpperCase();
  if (['SI', 'SÍ', 'TRUE', '1', 'YES', 'Y', 'VERDADERO'].includes(str)) return true;
  if (['NO', 'FALSE', '0', 'N', 'FALSO'].includes(str)) return false;
  return defaultVal;
}

/**
 * Normaliza listas separadas por comas, barras o punto y coma
 */
function parseList(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
  return String(val)
    .split(/[,;/|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Extrae y valida coordenadas lat/lng desde columnas sueltas o formatos combinados
 */
function parseCoordinates(row: Record<string, any>): {
  coords: { lat: number; lng: number };
  isDefault: boolean;
  hasError: boolean;
} {
  let latVal: any = undefined;
  let lngVal: any = undefined;

  for (const [k, v] of Object.entries(row)) {
    const nk = normalizeKey(k);
    if (nk === 'lat' || nk === 'latitud' || nk === 'latitude' || nk === 'coordenadala') latVal = v;
    if (nk === 'lng' || nk === 'lon' || nk === 'longitud' || nk === 'longitude' || nk === 'coordenadalo') lngVal = v;
    if (nk === 'coordenadas' || nk === 'coords') {
      if (typeof v === 'object' && v !== null && 'lat' in v && 'lng' in v) {
        latVal = v.lat;
        lngVal = v.lng;
      } else if (typeof v === 'string') {
        const parts = v.split(/[,;\s]+/).map((p) => p.trim());
        if (parts.length >= 2) {
          latVal = parts[0];
          lngVal = parts[1];
        }
      }
    }
  }

  if (latVal === undefined || lngVal === undefined || latVal === '' || lngVal === '') {
    return { coords: DEFAULT_CUMPEO_COORDS, isDefault: true, hasError: false };
  }

  const lat = parseFloat(String(latVal).replace(',', '.'));
  const lng = parseFloat(String(lngVal).replace(',', '.'));

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { coords: DEFAULT_CUMPEO_COORDS, isDefault: true, hasError: true };
  }

  return { coords: { lat, lng }, isDefault: false, hasError: false };
}

/**
 * Busca el valor de una columna admitiendo múltiples nombres alternativos
 */
function getColValue(row: Record<string, any>, possibleKeys: string[]): any {
  const normKeys = possibleKeys.map(normalizeKey);
  for (const [k, v] of Object.entries(row)) {
    const nk = normalizeKey(k);
    if (normKeys.includes(nk)) {
      return v;
    }
  }
  return undefined;
}

// ─── VALIDACIÓN POR ENTIDAD ───────────────────────────────────────────────────

export function validateDestinationRow(
  row: Record<string, any>,
  rowNumber: number,
  existingSlugs: Set<string>,
  existingIds: Set<string>
): ParsedBulkItem {
  const issues: ValidationIssue[] = [];

  const rawNombre = getColValue(row, ['nombre', 'atractivo', 'destino', 'titulo', 'name']);
  const nombre = rawNombre ? String(rawNombre).trim() : '';

  if (!nombre) {
    issues.push({ field: 'nombre', message: 'El nombre del atractivo es obligatorio.', severity: 'ERROR' });
  }

  const rawCategoria = getColValue(row, ['categoria', 'cat', 'rubro', 'tipo']);
  const categoria = rawCategoria ? String(rawCategoria).trim().toLowerCase() : '';
  const validCategorias = ['cultural', 'historico', 'naturaleza', 'gastronomia', 'patrimonio', 'entretencion'];

  if (!categoria) {
    issues.push({
      field: 'categoria',
      message: 'La categoría es obligatoria. Ej: cultural, historico, naturaleza, patrimonio, entretencion.',
      severity: 'ERROR',
    });
  } else if (!validCategorias.includes(categoria)) {
    issues.push({
      field: 'categoria',
      message: `Categoría "${categoria}" no estándar. Se aceptará pero se sugiere: ${validCategorias.join(', ')}.`,
      severity: 'WARNING',
    });
  }

  const rawDescCorta = getColValue(row, ['descripcioncorta', 'descripcion_corta', 'resumen', 'bajada', 'descripcion']);
  const descripcionCorta = rawDescCorta ? String(rawDescCorta).trim() : '';
  if (!descripcionCorta) {
    issues.push({ field: 'descripcionCorta', message: 'La descripción corta es obligatoria.', severity: 'ERROR' });
  }

  const { coords, isDefault, hasError } = parseCoordinates(row);
  if (hasError) {
    issues.push({
      field: 'coordenadas',
      message: 'Las coordenadas provistas no tienen formato numérico válido. Se asignó centro de Cumpeo.',
      severity: 'WARNING',
    });
  } else if (isDefault) {
    issues.push({
      field: 'coordenadas',
      message: 'Sin coordenadas GPS: Se asignaron las coordenadas céntricas de Cumpeo (-35.281739, -71.258714).',
      severity: 'WARNING',
    });
  }

  const rawId = getColValue(row, ['id', 'identificador']);
  const rawSlug = getColValue(row, ['slug']);
  const slug = rawSlug ? slugify(String(rawSlug)) : slugify(nombre);
  const id = rawId ? String(rawId).trim() : slug;

  const willUpdate = existingIds.has(id) || (slug ? existingSlugs.has(slug) : false);

  const descripcionLarga = String(getColValue(row, ['descripcionlarga', 'descripcion_larga', 'detalle']) || '');
  const historia = String(getColValue(row, ['historia', 'antecedentes']) || '');
  const direccion = String(getColValue(row, ['direccion', 'ubicacion', 'calle']) || '');
  const horario = String(getColValue(row, ['horario', 'atencion', 'horas']) || '');
  const precio = String(getColValue(row, ['precio', 'tarifa', 'valor']) || '');
  const duracionVisita = String(getColValue(row, ['duracionvisita', 'duracion_visita', 'duracion']) || '');
  const comoLlegar = String(getColValue(row, ['comollegar', 'como_llegar', 'acceso']) || '');
  const tags = parseList(getColValue(row, ['tags', 'etiquetas']));
  const imagenPrincipal = String(getColValue(row, ['imagenprincipal', 'imagen_principal', 'imagen', 'foto', 'url_imagen']) || '');
  const destacado = parseBoolean(getColValue(row, ['destacado', 'es_destacado', 'principal']), false);
  const activo = parseBoolean(getColValue(row, ['activo', 'publicado', 'visible']), true);

  if (!imagenPrincipal) {
    issues.push({ field: 'imagenPrincipal', message: 'No tiene imagen principal asignada.', severity: 'WARNING' });
  }

  const hasErrorIssue = issues.some((i) => i.severity === 'ERROR');
  const hasWarningIssue = issues.some((i) => i.severity === 'WARNING');

  return {
    rowNumber,
    status: hasErrorIssue ? 'ERROR' : hasWarningIssue ? 'WARNING' : 'VALID',
    issues,
    raw: row,
    willUpdate,
    data: {
      id,
      slug,
      nombre,
      categoria: categoria || 'cultural',
      descripcionCorta,
      descripcionLarga: descripcionLarga || descripcionCorta,
      historia,
      coordenadas: coords,
      direccion,
      horario,
      precio,
      duracionVisita,
      comoLlegar,
      tags,
      imagenPrincipal: imagenPrincipal || null,
      destacado,
      activo,
    },
  };
}

export function validateRestaurantRow(
  row: Record<string, any>,
  rowNumber: number,
  existingIds: Set<string>
): ParsedBulkItem {
  const issues: ValidationIssue[] = [];

  const rawNombre = getColValue(row, ['nombre', 'local', 'restaurante', 'fantasia', 'name']);
  const nombre = rawNombre ? String(rawNombre).trim() : '';

  if (!nombre) {
    issues.push({ field: 'nombre', message: 'El nombre del restaurante/local es obligatorio.', severity: 'ERROR' });
  }

  const rawDesc = getColValue(row, ['descripcion', 'detalle', 'descripcioncorta', 'resumen']);
  const descripcion = rawDesc ? String(rawDesc).trim() : '';
  if (!descripcion) {
    issues.push({ field: 'descripcion', message: 'La descripción del restaurante es obligatoria.', severity: 'ERROR' });
  }

  const tipo = String(getColValue(row, ['tipo', 'rubro', 'subtipo']) || 'restaurante').toLowerCase();
  const propietario = String(getColValue(row, ['propietario', 'dueno', 'titular']) || '');
  const especialidad = String(getColValue(row, ['especialidad', 'platoestrella', 'plato_estrella']) || '');
  const direccion = String(getColValue(row, ['direccion', 'ubicacion', 'calle']) || '');
  const telefono = String(getColValue(row, ['telefono', 'fono', 'celular']) || '');
  const whatsapp = String(getColValue(row, ['whatsapp', 'wsp']) || telefono || '');
  const mediosPago = parseList(getColValue(row, ['mediospago', 'medios_pago', 'pago', 'formas_pago']));
  const tags = parseList(getColValue(row, ['tags', 'etiquetas']));
  const imagenPrincipal = String(getColValue(row, ['imagenprincipal', 'imagen_principal', 'imagen', 'foto']) || '');
  const activo = parseBoolean(getColValue(row, ['activo', 'publicado', 'abierto']), true);

  const { coords, isDefault, hasError } = parseCoordinates(row);
  if (hasError || isDefault) {
    issues.push({
      field: 'coordenadas',
      message: 'Coordenadas no definidas o inválidas. Se asignó centro de Cumpeo.',
      severity: 'WARNING',
    });
  }

  const rawId = getColValue(row, ['id', 'identificador']);
  const id = rawId ? String(rawId).trim() : slugify(nombre);
  const willUpdate = existingIds.has(id);

  if (!telefono && !whatsapp) {
    issues.push({ field: 'telefono', message: 'Sin número de contacto ni WhatsApp registrado.', severity: 'WARNING' });
  }

  const hasErrorIssue = issues.some((i) => i.severity === 'ERROR');
  const hasWarningIssue = issues.some((i) => i.severity === 'WARNING');

  return {
    rowNumber,
    status: hasErrorIssue ? 'ERROR' : hasWarningIssue ? 'WARNING' : 'VALID',
    issues,
    raw: row,
    willUpdate,
    data: {
      id,
      nombre,
      tipo,
      descripcion,
      especialidad,
      propietario,
      coordenadas: coords,
      direccion,
      telefono,
      whatsapp,
      mediosPago: mediosPago.length > 0 ? mediosPago : ['Efectivo', 'Débito'],
      tags,
      imagenPrincipal: imagenPrincipal || null,
      activo,
    },
  };
}

export function validateAccommodationRow(
  row: Record<string, any>,
  rowNumber: number,
  existingIds: Set<string>
): ParsedBulkItem {
  const issues: ValidationIssue[] = [];

  const rawNombre = getColValue(row, ['nombre', 'hospedaje', 'alojamiento', 'hotel', 'cabana', 'name']);
  const nombre = rawNombre ? String(rawNombre).trim() : '';

  if (!nombre) {
    issues.push({ field: 'nombre', message: 'El nombre del alojamiento es obligatorio.', severity: 'ERROR' });
  }

  const rawDesc = getColValue(row, ['descripcion', 'detalle', 'descripcioncorta', 'resumen']);
  const descripcion = rawDesc ? String(rawDesc).trim() : '';
  if (!descripcion) {
    issues.push({ field: 'descripcion', message: 'La descripción del alojamiento es obligatoria.', severity: 'ERROR' });
  }

  const tipo = String(getColValue(row, ['tipo', 'subtipo', 'categoria']) || 'cabaña').toLowerCase();
  const propietario = String(getColValue(row, ['propietario', 'dueno', 'titular']) || '');
  const direccion = String(getColValue(row, ['direccion', 'ubicacion']) || '');
  const telefono = String(getColValue(row, ['telefono', 'fono', 'celular']) || '');
  const whatsapp = String(getColValue(row, ['whatsapp', 'wsp']) || telefono || '');
  const servicios = parseList(getColValue(row, ['servicios', 'amenidades', 'prestaciones']));
  const imagenPrincipal = String(getColValue(row, ['imagenprincipal', 'imagen_principal', 'imagen', 'foto']) || '');
  const activo = parseBoolean(getColValue(row, ['activo', 'publicado', 'disponible']), true);

  const { coords, isDefault, hasError } = parseCoordinates(row);
  if (hasError || isDefault) {
    issues.push({
      field: 'coordenadas',
      message: 'Sin coordenadas GPS precisas. Se asignó centro de Cumpeo.',
      severity: 'WARNING',
    });
  }

  const rawId = getColValue(row, ['id', 'identificador']);
  const id = rawId ? String(rawId).trim() : slugify(nombre);
  const willUpdate = existingIds.has(id);

  if (!telefono && !whatsapp) {
    issues.push({ field: 'telefono', message: 'Sin teléfono o WhatsApp de contacto.', severity: 'WARNING' });
  }

  const hasErrorIssue = issues.some((i) => i.severity === 'ERROR');
  const hasWarningIssue = issues.some((i) => i.severity === 'WARNING');

  return {
    rowNumber,
    status: hasErrorIssue ? 'ERROR' : hasWarningIssue ? 'WARNING' : 'VALID',
    issues,
    raw: row,
    willUpdate,
    data: {
      id,
      nombre,
      tipo,
      propietario,
      descripcion,
      coordenadas: coords,
      direccion,
      telefono,
      whatsapp,
      servicios: servicios.length > 0 ? servicios : ['Wifi', 'Estacionamiento'],
      imagenPrincipal: imagenPrincipal || null,
      activo,
    },
  };
}

export function validateEventRow(
  row: Record<string, any>,
  rowNumber: number,
  existingIds: Set<string>
): ParsedBulkItem {
  const issues: ValidationIssue[] = [];

  const rawNombre = getColValue(row, ['nombre', 'evento', 'fiesta', 'actividad', 'name']);
  const nombre = rawNombre ? String(rawNombre).trim() : '';

  if (!nombre) {
    issues.push({ field: 'nombre', message: 'El nombre del evento es obligatorio.', severity: 'ERROR' });
  }

  const rawTipo = getColValue(row, ['tipo', 'categoria']);
  const tipo = rawTipo ? String(rawTipo).trim().toLowerCase() : 'ferias-libres';

  const rawDesc = getColValue(row, ['descripcion', 'detalle', 'resumen']);
  const descripcion = rawDesc ? String(rawDesc).trim() : '';
  if (!descripcion) {
    issues.push({ field: 'descripcion', message: 'La descripción del evento es obligatoria.', severity: 'ERROR' });
  }

  const fecha = String(getColValue(row, ['fecha', 'dia', 'cuandosehace']) || '');
  const recurrente = parseBoolean(getColValue(row, ['recurrente', 'es_recurrente']), true);
  const direccion = String(getColValue(row, ['direccion', 'lugar', 'ubicacion']) || 'Cumpeo, Río Claro');
  const tags = parseList(getColValue(row, ['tags', 'etiquetas']));
  const imagenPrincipal = String(getColValue(row, ['imagenprincipal', 'imagen_principal', 'imagen', 'foto']) || '');
  const destacado = parseBoolean(getColValue(row, ['destacado', 'es_destacado']), false);
  const activo = parseBoolean(getColValue(row, ['activo', 'publicado']), true);

  const { coords } = parseCoordinates(row);

  const rawId = getColValue(row, ['id', 'identificador']);
  const id = rawId ? String(rawId).trim() : slugify(nombre);
  const willUpdate = existingIds.has(id);

  const hasErrorIssue = issues.some((i) => i.severity === 'ERROR');
  const hasWarningIssue = issues.some((i) => i.severity === 'WARNING');

  return {
    rowNumber,
    status: hasErrorIssue ? 'ERROR' : hasWarningIssue ? 'WARNING' : 'VALID',
    issues,
    raw: row,
    willUpdate,
    data: {
      id,
      nombre,
      tipo,
      descripcion,
      fecha,
      recurrente,
      coordenadas: coords,
      direccion,
      tags,
      imagenPrincipal: imagenPrincipal || null,
      destacado,
      activo,
    },
  };
}

// ─── PARSEO Y AUDITORÍA DE ARCHIVOS ──────────────────────────────────────────

export async function parseUploadedFile(file: File): Promise<Record<string, any>[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
    if (typeof parsed === 'object') {
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
    }
    throw new Error('El archivo JSON debe contener un arreglo de registros.');
  }

  // Parseo Excel / CSV con SheetJS
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('El libro de cálculo no contiene ninguna hoja con datos.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    defval: '',
    raw: false, // Convierte todo a strings para un formateo uniforme
  });

  if (!jsonRows || jsonRows.length === 0) {
    throw new Error('No se encontraron filas con datos en la primera hoja del archivo.');
  }

  return jsonRows;
}

export function validateBulkDataset(
  entityType: BulkEntityType,
  rawRows: Record<string, any>[],
  existingItems: { id: string; slug?: string }[] = []
): { items: ParsedBulkItem[]; summary: ValidationSummary } {
  const existingIds = new Set(existingItems.map((i) => i.id));
  const existingSlugs = new Set(existingItems.map((i) => i.slug || '').filter(Boolean));

  const items: ParsedBulkItem[] = [];

  rawRows.forEach((row, idx) => {
    // Si la fila está completamente vacía, saltarla
    const values = Object.values(row).map((v) => String(v || '').trim()).filter(Boolean);
    if (values.length === 0) return;

    let parsed: ParsedBulkItem;
    const rowNum = idx + 2; // Considerando fila 1 como encabezado de Excel

    switch (entityType) {
      case 'destinos':
        parsed = validateDestinationRow(row, rowNum, existingSlugs, existingIds);
        break;
      case 'restaurantes':
        parsed = validateRestaurantRow(row, rowNum, existingIds);
        break;
      case 'alojamientos':
        parsed = validateAccommodationRow(row, rowNum, existingIds);
        break;
      case 'eventos':
        parsed = validateEventRow(row, rowNum, existingIds);
        break;
    }

    items.push(parsed);
  });

  const summary: ValidationSummary = {
    totalRows: items.length,
    validRows: items.filter((i) => i.status === 'VALID').length,
    warningRows: items.filter((i) => i.status === 'WARNING').length,
    errorRows: items.filter((i) => i.status === 'ERROR').length,
    itemsToCreate: items.filter((i) => i.status !== 'ERROR' && !i.willUpdate).length,
    itemsToUpdate: items.filter((i) => i.status !== 'ERROR' && i.willUpdate).length,
  };

  return { items, summary };
}

// ─── GENERADOR DE PLANTILLAS OFICIALES Y EXPORTADOR ─────────────────────────

export const TEMPLATE_SCHEMAS: Record<
  BulkEntityType,
  {
    headers: string[];
    sampleRows: Record<string, any>[];
    filename: string;
    label: string;
  }
> = {
  destinos: {
    label: 'Atractivos y Destinos Turísticos',
    filename: 'plantilla-cumpeo-destinos.xlsx',
    headers: [
      'Nombre*',
      'Categoria*',
      'Descripcion_Corta*',
      'Descripcion_Larga',
      'Direccion',
      'Latitud',
      'Longitud',
      'Horario',
      'Precio',
      'Duracion_Visita',
      'Destacado (SI/NO)',
      'Tags',
      'Imagen_URL',
    ],
    sampleRows: [
      {
        'Nombre*': 'Mural Central de Condorito',
        'Categoria*': 'cultural',
        'Descripcion_Corta*': 'Mural gigante emblemático con los personajes de Pelotillehue en la plaza principal.',
        'Descripcion_Larga': 'Inaugurado con el objetivo de preservar la memoria gráfica de René Ríos Boettiger (Pepo).',
        Direccion: 'Plaza de Armas de Cumpeo s/n',
        Latitud: -35.2671,
        Longitud: -71.2498,
        Horario: 'Todo el día',
        Precio: 'Gratuito',
        Duracion_Visita: '30 min',
        'Destacado (SI/NO)': 'SI',
        Tags: 'Condorito, Fotografía, Familiar, Plaza',
        Imagen_URL: '/assets/images/mural-condorito.jpg',
      },
      {
        'Nombre*': 'Monolito Coné y Yuyín',
        'Categoria*': 'patrimonio',
        'Descripcion_Corta*': 'Escultura al aire libre ideal para fotografías familiares y recuerdos turísticos.',
        'Descripcion_Larga': 'Hito turístico ubicado frente al edificio consistorial municipal.',
        Direccion: 'Av. Circunvalación esquina Los Copihues',
        Latitud: -35.2685,
        Longitud: -71.2512,
        Horario: 'Todo el día',
        Precio: 'Gratuito',
        Duracion_Visita: '20 min',
        'Destacado (SI/NO)': 'NO',
        Tags: 'Escultura, Niños, Condorito',
        Imagen_URL: '',
      },
    ],
  },
  restaurantes: {
    label: 'Restaurantes y Gastronomía',
    filename: 'plantilla-cumpeo-restaurantes.xlsx',
    headers: [
      'Nombre*',
      'Tipo (restaurante/picada/bar/cafeteria)',
      'Especialidad',
      'Propietario',
      'Descripcion*',
      'Direccion',
      'Telefono',
      'WhatsApp',
      'Medios_Pago',
      'Latitud',
      'Longitud',
      'Activo (SI/NO)',
      'Imagen_URL',
    ],
    sampleRows: [
      {
        'Nombre*': 'El Pollo Farsante de Cumpeo',
        'Tipo (restaurante/picada/bar/cafeteria)': 'picada',
        Especialidad: 'Pollo al jugo con papas doradas y pastel de choclo',
        Propietario: 'Familia González Mardones',
        'Descripcion*': 'Restaurante típico de comida chilena campesina inspirado en el mítico local de Pepo.',
        Direccion: 'Camino a Cumpeo Km 1.5',
        Telefono: '+56 9 9876 5432',
        WhatsApp: '+56 9 9876 5432',
        Medios_Pago: 'Efectivo, Débito, Transferencia',
        Latitud: -35.2665,
        Longitud: -71.2482,
        'Activo (SI/NO)': 'SI',
        Imagen_URL: '/assets/images/pollo-farsante.jpg',
      },
      {
        'Nombre*': 'Cafetería Doña Tremebunda',
        'Tipo (restaurante/picada/bar/cafeteria)': 'cafeteria',
        Especialidad: 'Tortas caseras, café de grano y churrascas maulinas',
        Propietario: 'María Elena Morales',
        'Descripcion*': 'Punto de encuentro dulce con repostería tradicional chilena y té de hierbas.',
        Direccion: 'Calle Comercio 340',
        Telefono: '+56 71 234 5678',
        WhatsApp: '+56 9 8765 4321',
        Medios_Pago: 'Efectivo, Débito, Crédito',
        Latitud: -35.2678,
        Longitud: -71.2505,
        'Activo (SI/NO)': 'SI',
        Imagen_URL: '',
      },
    ],
  },
  alojamientos: {
    label: 'Alojamientos y Cabañas',
    filename: 'plantilla-cumpeo-alojamientos.xlsx',
    headers: [
      'Nombre*',
      'Tipo (hotel/cabana/hostal)',
      'Propietario',
      'Descripcion*',
      'Direccion',
      'Telefono',
      'WhatsApp',
      'Servicios',
      'Latitud',
      'Longitud',
      'Activo (SI/NO)',
      'Imagen_URL',
    ],
    sampleRows: [
      {
        'Nombre*': 'Cabañas El Descanso de Don Chuma',
        'Tipo (hotel/cabana/hostal)': 'cabana',
        Propietario: 'Héctor Tapia Valdés',
        'Descripcion*': 'Cabañas equipadas para familias, inmersas en entorno campestre y cercano al centro.',
        Direccion: 'Ruta K-15 s/n, Sector Los Canelos',
        Telefono: '+56 9 7654 3210',
        WhatsApp: '+56 9 7654 3210',
        Servicios: 'Wifi, Piscina, Estacionamiento, Quincho',
        Latitud: -35.2692,
        Longitud: -71.2534,
        'Activo (SI/NO)': 'SI',
        Imagen_URL: '/assets/images/cabanas-don-chuma.jpg',
      },
    ],
  },
  eventos: {
    label: 'Eventos y Festividades',
    filename: 'plantilla-cumpeo-eventos.xlsx',
    headers: [
      'Nombre*',
      'Tipo (fiestas-religiosas/ferias-libres/centros-de-evento)*',
      'Descripcion*',
      'Fecha',
      'Recurrente (SI/NO)',
      'Lugar_Direccion',
      'Latitud',
      'Longitud',
      'Destacado (SI/NO)',
      'Activo (SI/NO)',
      'Imagen_URL',
    ],
    sampleRows: [
      {
        'Nombre*': 'Fiesta de la Vendimia de Río Claro',
        'Tipo (fiestas-religiosas/ferias-libres/centros-de-evento)*': 'ferias-libres',
        'Descripcion*': 'Celebración anual con degustación de vinos locales, música folclórica y gastronomía típica.',
        Fecha: 'Fines de Marzo',
        'Recurrente (SI/NO)': 'SI',
        Lugar_Direccion: 'Estadio Municipal de Cumpeo',
        Latitud: -35.2659,
        Longitud: -71.252,
        'Destacado (SI/NO)': 'SI',
        'Activo (SI/NO)': 'SI',
        Imagen_URL: '/assets/images/vendimia.jpg',
      },
    ],
  },
};

/**
 * Descarga en el navegador una plantilla oficial pre-formateada en formato Excel (.xlsx) o JSON
 */
export function downloadEntityTemplate(entityType: BulkEntityType, format: 'xlsx' | 'json' = 'xlsx') {
  const schema = TEMPLATE_SCHEMAS[entityType];
  const dateStr = new Date().toISOString().split('T')[0];

  if (format === 'json') {
    const jsonStr = JSON.stringify(schema.sampleRows, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla-${entityType}-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  // Generar Excel con SheetJS
  const ws = XLSX.utils.json_to_sheet(schema.sampleRows, { header: schema.headers });

  // Auto-calcular ancho de columnas
  const colWidths = schema.headers.map((h) => ({
    wch: Math.max(h.length + 4, 18),
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Oficial');

  // Hoja de instrucciones
  const instrucciones = [
    {
      Instrucción: '1. Columnas obligatorias',
      Detalle: 'Las columnas marcadas con asterisco (*) son de llenado obligatorio.',
    },
    {
      Instrucción: '2. Formato de Coordenadas',
      Detalle: 'Indicar valores decimales en Latitud y Longitud (Ej: -35.281739, -71.258714). Si se omite, se usa el centro de Cumpeo.',
    },
    {
      Instrucción: '3. Valores Sí / No',
      Detalle: 'Usar "SI" o "NO" en campos booleanos (Destacado, Activo, Recurrente).',
    },
    {
      Instrucción: '4. Listas y etiquetas',
      Detalle: 'Separar múltiples elementos con comas o barras (Ej: Wifi, Estacionamiento, Quincho).',
    },
    {
      Instrucción: '5. Guardado',
      Detalle: 'Guarda el archivo en formato Excel (.xlsx) y súbelo en la sección de Carga Masiva para validar los datos.',
    },
  ];
  const wsGuia = XLSX.utils.json_to_sheet(instrucciones);
  wsGuia['!cols'] = [{ wch: 28 }, { wch: 75 }];
  XLSX.utils.book_append_sheet(wb, wsGuia, 'Instrucciones de Llenado');

  XLSX.writeFile(wb, `plantilla-cumpeo-${entityType}-${dateStr}.xlsx`);
}

/**
 * Exporta los datos actuales de una entidad directamente a formato Excel (.xlsx) estilizado
 */
export function exportDatasetToXLSX(entityType: BulkEntityType, items: any[]) {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `cumpeo-${entityType}-${dateStr}.xlsx`;

  let exportRows: Record<string, any>[] = [];

  if (entityType === 'destinos') {
    exportRows = items.map((d) => ({
      ID: d.id,
      Slug: d.slug,
      Nombre: d.nombre,
      Categoria: d.categoria,
      Descripcion_Corta: d.descripcionCorta || '',
      Descripcion_Larga: d.descripcionLarga || '',
      Direccion: d.direccion || '',
      Latitud: d.coordenadas?.lat ?? '',
      Longitud: d.coordenadas?.lng ?? '',
      Horario: d.horario || '',
      Precio: d.precio || '',
      Duracion_Visita: d.duracionVisita || '',
      Como_Llegar: d.comoLlegar || '',
      Tags: (d.tags || []).join(', '),
      Destacado: d.destacado ? 'SI' : 'NO',
      Activo: d.activo !== false ? 'SI' : 'NO',
      Imagen_Principal: d.imagenPrincipal || '',
    }));
  } else if (entityType === 'restaurantes') {
    exportRows = items.map((r) => ({
      ID: r.id,
      Nombre: r.nombre,
      Tipo: r.tipo || '',
      Propietario: r.propietario || '',
      Especialidad: r.especialidad || '',
      Descripcion: r.descripcion || '',
      Direccion: r.direccion || '',
      Telefono: r.telefono || r.contacto?.telefono || '',
      WhatsApp: r.whatsapp || r.contacto?.whatsapp || '',
      Medios_Pago: (r.mediosPago || []).join(', '),
      Latitud: r.coordenadas?.lat ?? '',
      Longitud: r.coordenadas?.lng ?? '',
      Tags: (r.tags || []).join(', '),
      Activo: r.activo !== false ? 'SI' : 'NO',
      Imagen_Principal: r.imagenPrincipal || '',
    }));
  } else if (entityType === 'alojamientos') {
    exportRows = items.map((a) => ({
      ID: a.id,
      Nombre: a.nombre,
      Tipo: a.tipo || '',
      Propietario: a.propietario || '',
      Descripcion: a.descripcion || '',
      Direccion: a.direccion || '',
      Telefono: a.telefono || a.contacto?.telefono || '',
      WhatsApp: a.whatsapp || a.contacto?.whatsapp || '',
      Servicios: (a.servicios || []).join(', '),
      Latitud: a.coordenadas?.lat ?? '',
      Longitud: a.coordenadas?.lng ?? '',
      Activo: a.activo !== false ? 'SI' : 'NO',
      Imagen_Principal: a.imagenPrincipal || '',
    }));
  } else if (entityType === 'eventos') {
    exportRows = items.map((e) => ({
      ID: e.id,
      Nombre: e.nombre,
      Tipo: e.tipo || '',
      Descripcion: e.descripcion || '',
      Fecha: e.fecha || '',
      Recurrente: e.recurrente ? 'SI' : 'NO',
      Lugar_Direccion: e.direccion || '',
      Latitud: e.coordenadas?.lat ?? '',
      Longitud: e.coordenadas?.lng ?? '',
      Destacado: e.destacado ? 'SI' : 'NO',
      Activo: e.activo !== false ? 'SI' : 'NO',
      Imagen_Principal: e.imagenPrincipal || '',
    }));
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportRows);

  if (exportRows.length > 0) {
    const keys = Object.keys(exportRows[0]);
    ws['!cols'] = keys.map((k) => ({
      wch: Math.max(k.length + 4, 16),
    }));
  }

  XLSX.utils.book_append_sheet(wb, ws, `Catastro ${entityType}`);
  XLSX.writeFile(wb, filename);
}
