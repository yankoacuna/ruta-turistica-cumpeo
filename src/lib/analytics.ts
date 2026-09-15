import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { VisitStats, VisitRangoPreset, VisitasDetalle } from '@/lib/types';

/** Todo el panel razona en hora de Chile, no en UTC: "hoy" es hoy en Cumpeo. */
const TZ = 'America/Santiago';

/**
 * Agrupa la ruta visitada en una sección legible para el panel.
 * Se calcula al guardar (y no al consultar) para que las consultas del
 * dashboard sean un simple GROUP BY sobre una columna indexada.
 */
export function seccionDesdePath(path: string): string {
  const limpio = path.split('?')[0].split('#')[0];
  if (limpio === '/' || limpio === '') return 'inicio';
  const primero = limpio.split('/').filter(Boolean)[0];
  switch (primero) {
    case 'destino':
      return 'destino';
    case 'ruta':
      return 'ruta';
    case 'mapa':
      return 'mapa';
    case 'categoria':
      return 'categoria';
    case 'historia':
      return 'historia';
    case 'contacto':
      return 'contacto';
    default:
      return 'otro';
  }
}

/** Cuánto adelanta o atrasa Chile respecto de UTC en ese instante (maneja el horario de verano). */
function offsetChileMs(instante: Date): number {
  const enChile = new Date(instante.toLocaleString('en-US', { timeZone: TZ }));
  const enUtc = new Date(instante.toLocaleString('en-US', { timeZone: 'UTC' }));
  return enChile.getTime() - enUtc.getTime();
}

/**
 * Offset de Chile respecto de UTC como string "+HH:MM"/"-HH:MM", para pasarlo
 * a CONVERT_TZ de MySQL. No se usa el nombre de zona ("America/Santiago")
 * porque este hosting no tiene cargadas las tablas de zonas horarias de MySQL
 * (mysql_tzinfo_to_sql) y CONVERT_TZ con un nombre de zona ahí devuelve NULL
 * en silencio. Un offset fijo no reproduce cada cambio de horario de verano
 * dentro del rango consultado, pero es exacto para el uso real del panel.
 */
function offsetChileStr(instante: Date = new Date()): string {
  const totalMin = Math.round(offsetChileMs(instante) / 60000);
  const signo = totalMin >= 0 ? '+' : '-';
  const abs = Math.abs(totalMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${signo}${hh}:${mm}`;
}

/** Fecha de calendario en Chile (año, mes 1-12, día) del instante dado. */
function ymdChile(instante: Date = new Date()): [number, number, number] {
  const texto = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(instante);
  const [anio, mes, dia] = texto.split('-').map(Number);
  return [anio, mes, dia];
}

/**
 * Instante exacto (UTC) en que empieza, en hora de Chile, la fecha indicada.
 * Se calcula así y no con `setDate` local porque el servidor puede correr en
 * cualquier zona horaria. Los valores fuera de rango se normalizan solos
 * (mes 0 = diciembre anterior, día 32 = el 1 del mes siguiente).
 */
function inicioDiaChile(anio: number, mes: number, dia: number): Date {
  const nominal = Date.UTC(anio, mes - 1, dia, 0, 0, 0, 0);
  // Una pasada con el desfase actual y una corrección con el del día objetivo,
  // por si entre medio hubo cambio de horario de verano.
  const aproximado = new Date(nominal - offsetChileMs(new Date()));
  return new Date(nominal - offsetChileMs(aproximado));
}

/** Clave de calendario "YYYY-MM-DD", normalizando desbordes de día o mes. */
function claveDia(anio: number, mes: number, dia: number): string {
  return new Date(Date.UTC(anio, mes - 1, dia)).toISOString().slice(0, 10);
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Tope de barras del gráfico: más de un año no se lee, solo pesa. */
const MAX_DIAS_RANGO = 366;

/** "2026-09-14" a [2026, 9, 14]; null si no es una fecha de calendario válida. */
function leerYmd(texto?: string): [number, number, number] | null {
  if (!texto || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  const [anio, mes, dia] = texto.split('-').map(Number);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  // Rechaza fechas que no existen (31 de febrero y similares).
  if (claveDia(anio, mes, dia) !== texto) return null;
  return [anio, mes, dia];
}

/** Días que abarca el rango, contando ambos extremos. */
function diasEntre(desde: [number, number, number], hasta: [number, number, number]): number {
  const ms = Date.UTC(hasta[0], hasta[1] - 1, hasta[2]) - Date.UTC(desde[0], desde[1] - 1, desde[2]);
  return Math.floor(ms / 86400000) + 1;
}

/** "12 ago – 3 sep 2026", o "3 sep 2026" cuando es un solo día. */
function etiquetaRango(desde: [number, number, number], hasta: [number, number, number]): string {
  const corto = (ymd: [number, number, number]) =>
    `${ymd[2]} ${MESES[ymd[1] - 1].slice(0, 3)}`;
  if (claveDia(...desde) === claveDia(...hasta)) return `${corto(desde)} ${hasta[0]}`;
  const mismoAnio = desde[0] === hasta[0];
  return `${corto(desde)}${mismoAnio ? '' : ` ${desde[0]}`} – ${corto(hasta)} ${hasta[0]}`;
}

export interface RangoResuelto {
  desde: Date;
  hasta: Date;
  label: string;
  granularidad: 'dia' | 'hora';
  /** Claves de cada tramo del gráfico, en orden, incluidos los tramos sin tráfico. */
  claves: string[];
}

/**
 * Traduce el período elegido en el panel a un rango concreto de fechas.
 *
 * El preset viaja como texto y se resuelve acá, en el servidor, para que el
 * corte de "hoy" o de "mes pasado" sea siempre el de Chile y no el del reloj
 * del computador que abrió el panel.
 */
export function resolverRango(
  preset: VisitRangoPreset,
  desdeYmd?: string,
  hastaYmd?: string
): RangoResuelto {
  const ahora = new Date();
  const [anio, mes, dia] = ymdChile(ahora);

  const claveDias = (inicio: [number, number, number], cantidad: number): string[] => {
    const [a, m, d] = inicio;
    return Array.from({ length: cantidad }, (_, i) => claveDia(a, m, d + i));
  };

  /** Días que tiene el mes indicado (día 0 del siguiente = último del actual). */
  const diasDelMes = (a: number, m: number) => new Date(Date.UTC(a, m, 0)).getUTCDate();

  switch (preset) {
    case 'personalizado': {
      // Fechas de calendario "YYYY-MM-DD" elegidas en el panel. Si vienen mal,
      // se cae a los últimos 30 días en vez de fallar: es una métrica, no un
      // formulario que deba retar al usuario.
      const inicio = leerYmd(desdeYmd);
      const fin = leerYmd(hastaYmd);
      if (!inicio || !fin) break;

      // Al revés también sirve: el usuario puede elegir las fechas en cualquier orden.
      const [ini, ter] = claveDia(...inicio) <= claveDia(...fin) ? [inicio, fin] : [fin, inicio];

      const dias = diasEntre(ini, ter);
      if (dias > MAX_DIAS_RANGO) break;

      return {
        desde: inicioDiaChile(...ini),
        // El día final entra completo: el rango termina al empezar el día siguiente.
        hasta: inicioDiaChile(ter[0], ter[1], ter[2] + 1),
        label: etiquetaRango(ini, ter),
        // Un solo día se ve mejor hora por hora que como una barra única.
        granularidad: dias === 1 ? 'hora' : 'dia',
        claves:
          dias === 1
            ? Array.from(
                { length: 24 },
                (_, h) => `${claveDia(...ini)}T${String(h).padStart(2, '0')}`
              )
            : claveDias(ini, dias),
      };
    }

    case 'hoy': {
      const desde = inicioDiaChile(anio, mes, dia);
      const base = claveDia(anio, mes, dia);
      return {
        desde,
        hasta: ahora,
        label: 'Hoy',
        granularidad: 'hora',
        // Las 24 horas del día, aunque las de más tarde todavía no hayan pasado:
        // un eje fijo evita que el gráfico cambie de forma cada vez que se abre.
        claves: Array.from({ length: 24 }, (_, h) => `${base}T${String(h).padStart(2, '0')}`),
      };
    }

    case '7d': {
      const desde = inicioDiaChile(anio, mes, dia - 6);
      return {
        desde,
        hasta: ahora,
        label: 'Últimos 7 días',
        granularidad: 'dia',
        claves: claveDias([anio, mes, dia - 6], 7),
      };
    }

    case 'mes-actual': {
      const desde = inicioDiaChile(anio, mes, 1);
      return {
        desde,
        hasta: ahora,
        // Solo los días transcurridos: dibujar el mes completo dejaría media
        // mitad vacía que parece caída de tráfico.
        label: `${capitalizar(MESES[mes - 1])} ${anio}`,
        granularidad: 'dia',
        claves: claveDias([anio, mes, 1], dia),
      };
    }

    case 'mes-pasado': {
      const anioPrevio = mes === 1 ? anio - 1 : anio;
      const mesPrevio = mes === 1 ? 12 : mes - 1;
      return {
        desde: inicioDiaChile(anioPrevio, mesPrevio, 1),
        hasta: inicioDiaChile(anio, mes, 1), // exclusivo: el mes pasado no llega a hoy
        label: `${capitalizar(MESES[mesPrevio - 1])} ${anioPrevio}`,
        granularidad: 'dia',
        claves: claveDias([anioPrevio, mesPrevio, 1], diasDelMes(anioPrevio, mesPrevio)),
      };
    }

    case '30d':
    default:
      break;
  }

  // Por defecto —y como refugio de un rango libre inválido— los últimos 30 días.
  {
    const desde = inicioDiaChile(anio, mes, dia - 29);
    return {
      desde,
      hasta: ahora,
      label: 'Últimos 30 días',
      granularidad: 'dia',
      claves: claveDias([anio, mes, dia - 29], 30),
    };
  }
}

const PRESETS_VALIDOS: VisitRangoPreset[] = [
  'hoy',
  '7d',
  '30d',
  'mes-actual',
  'mes-pasado',
  'personalizado',
];

const num = (valor: unknown): number => Number(valor ?? 0);

/** Respuesta vacía para cuando la consulta falla: el panel avisa en vez de mostrar ceros. */
function statsVacias(preset: VisitRangoPreset, rango: RangoResuelto): VisitStats {
  return {
    disponible: false,
    preset,
    rangoLabel: rango.label,
    granularidad: rango.granularidad,
    visitasHoy: 0,
    visitantesHoy: 0,
    visitas7: 0,
    visitantes7: 0,
    visitasRango: 0,
    visitantesRango: 0,
    sesionesRango: 0,
    visitasTotal: 0,
    visitantesTotal: 0,
    midiendoDesde: null,
    serie: [],
    paginas: [],
    secciones: [],
    dispositivos: [],
    origenes: [],
    ubicaciones: [],
  };
}

/**
 * Métricas de visitantes del sitio público para el dashboard del CMS.
 *
 * El indicador que manda es "visitantes" (dispositivos distintos). Las visitas
 * (páginas abiertas) se devuelven igual, pero como dato de apoyo: un mismo
 * turista recorriendo diez fichas las multiplica sin que haya llegado más gente.
 */
export async function getVisitStats(
  preset: VisitRangoPreset = '30d',
  desdeYmd?: string,
  hastaYmd?: string
): Promise<VisitStats> {
  const presetSeguro = PRESETS_VALIDOS.includes(preset) ? preset : '30d';
  const rango = resolverRango(presetSeguro, desdeYmd, hastaYmd);
  const { desde, hasta } = rango;

  const [anio, mes, dia] = ymdChile();
  const desdeHoy = inicioDiaChile(anio, mes, dia);
  const desde7 = inicioDiaChile(anio, mes, dia - 6);

  // En el gráfico por hora la clave incluye la hora local; por día, solo la fecha.
  const formatoClave = rango.granularidad === 'hora' ? '%Y-%m-%dT%H' : '%Y-%m-%d';
  const tzOffset = offsetChileStr();
  // Separador que jamás va a aparecer en un título de página, para poder
  // sacar "el título más reciente" de un GROUP_CONCAT (MySQL/MariaDB no
  // tienen array_agg). Va como literal SQL (Prisma.raw), no como parámetro
  // bindeado: GROUP_CONCAT ... SEPARATOR de MariaDB no acepta un placeholder ahí.
  const sepLiteral = Prisma.raw(`'${String.fromCharCode(1)}'`);

  try {
    const [totales, serieRaw, paginasRaw, seccionesRaw, dispositivosRaw, origenesRaw, ubicacionesRaw] =
      await Promise.all([
        prisma.$queryRaw<Array<Record<string, unknown>>>`
          SELECT
            COUNT(CASE WHEN \`createdAt\` >= ${desdeHoy} THEN 1 END)                              AS visitas_hoy,
            COUNT(DISTINCT CASE WHEN \`createdAt\` >= ${desdeHoy} THEN \`visitorId\` END)           AS visitantes_hoy,
            COUNT(CASE WHEN \`createdAt\` >= ${desde7} THEN 1 END)                               AS visitas_7,
            COUNT(DISTINCT CASE WHEN \`createdAt\` >= ${desde7} THEN \`visitorId\` END)             AS visitantes_7,
            COUNT(CASE WHEN \`createdAt\` >= ${desde} AND \`createdAt\` < ${hasta} THEN 1 END)      AS visitas_rango,
            COUNT(DISTINCT CASE WHEN \`createdAt\` >= ${desde} AND \`createdAt\` < ${hasta} THEN \`visitorId\` END) AS visitantes_rango,
            COUNT(DISTINCT CASE WHEN \`createdAt\` >= ${desde} AND \`createdAt\` < ${hasta} THEN \`sessionId\` END) AS sesiones_rango,
            COUNT(*)                                                                          AS visitas_total,
            COUNT(DISTINCT \`visitorId\`)                                                       AS visitantes_total,
            MIN(\`createdAt\`)                                                                  AS primera_visita
          FROM \`PageView\`
        `,

        prisma.$queryRaw<Array<Record<string, unknown>>>`
          SELECT
            -- createdAt se guarda en UTC sin zona: se reinterpreta como UTC y
            -- se desplaza al offset actual de Chile (ver offsetChileStr).
            DATE_FORMAT(CONVERT_TZ(\`createdAt\`, '+00:00', ${tzOffset}), ${formatoClave}) AS clave,
            COUNT(*)                    AS visitas,
            COUNT(DISTINCT \`visitorId\`) AS visitantes
          FROM \`PageView\`
          WHERE \`createdAt\` >= ${desde} AND \`createdAt\` < ${hasta}
          GROUP BY 1
          ORDER BY 1
        `,

        prisma.$queryRaw<Array<Record<string, unknown>>>`
          SELECT
            \`path\`,
            SUBSTRING_INDEX(GROUP_CONCAT(\`titulo\` ORDER BY \`createdAt\` DESC SEPARATOR ${sepLiteral}), ${sepLiteral}, 1) AS titulo,
            COUNT(*)                    AS visitas,
            COUNT(DISTINCT \`visitorId\`) AS visitantes
          FROM \`PageView\`
          WHERE \`createdAt\` >= ${desde} AND \`createdAt\` < ${hasta}
          GROUP BY \`path\`
          ORDER BY visitantes DESC, visitas DESC
          LIMIT 10
        `,

        prisma.$queryRaw<Array<Record<string, unknown>>>`
          SELECT \`seccion\`,
                 COUNT(*)                    AS visitas,
                 COUNT(DISTINCT \`visitorId\`) AS visitantes
          FROM \`PageView\`
          WHERE \`createdAt\` >= ${desde} AND \`createdAt\` < ${hasta}
          GROUP BY \`seccion\`
          ORDER BY visitantes DESC, visitas DESC
        `,

        prisma.$queryRaw<Array<Record<string, unknown>>>`
          SELECT COALESCE(\`device\`, 'desconocido') AS device,
                 COUNT(*)                    AS visitas,
                 COUNT(DISTINCT \`visitorId\`) AS visitantes
          FROM \`PageView\`
          WHERE \`createdAt\` >= ${desde} AND \`createdAt\` < ${hasta}
          GROUP BY 1
          ORDER BY visitantes DESC, visitas DESC
        `,

        prisma.$queryRaw<Array<Record<string, unknown>>>`
          SELECT \`referrer\`,
                 COUNT(*)                    AS visitas,
                 COUNT(DISTINCT \`visitorId\`) AS visitantes
          FROM \`PageView\`
          WHERE \`createdAt\` >= ${desde} AND \`createdAt\` < ${hasta} AND \`referrer\` IS NOT NULL
          GROUP BY \`referrer\`
          ORDER BY visitantes DESC, visitas DESC
          LIMIT 5
        `,

        prisma.$queryRaw<Array<Record<string, unknown>>>`
          SELECT \`pais\`,
                 \`region\`,
                 COUNT(*)                    AS visitas,
                 COUNT(DISTINCT \`visitorId\`) AS visitantes
          FROM \`PageView\`
          WHERE \`createdAt\` >= ${desde} AND \`createdAt\` < ${hasta} AND \`pais\` IS NOT NULL
          GROUP BY \`pais\`, \`region\`
          ORDER BY visitantes DESC, visitas DESC
          LIMIT 8
        `,
      ]);

    const t = totales[0] ?? {};

    // La consulta solo devuelve tramos con tráfico: se rellenan los vacíos para
    // que el gráfico tenga una barra por día (u hora), incluidos los de cero.
    const porClave = new Map(
      serieRaw.map((fila) => [
        String(fila.clave),
        { visitas: num(fila.visitas), visitantes: num(fila.visitantes) },
      ])
    );
    const serie = rango.claves.map((clave) => {
      const datos = porClave.get(clave);
      return {
        clave,
        visitas: datos?.visitas ?? 0,
        visitantes: datos?.visitantes ?? 0,
      };
    });

    const primeraVisita = t.primera_visita ? new Date(t.primera_visita as string) : null;

    return {
      disponible: true,
      preset: presetSeguro,
      rangoLabel: rango.label,
      granularidad: rango.granularidad,
      visitasHoy: num(t.visitas_hoy),
      visitantesHoy: num(t.visitantes_hoy),
      visitas7: num(t.visitas_7),
      visitantes7: num(t.visitantes_7),
      visitasRango: num(t.visitas_rango),
      visitantesRango: num(t.visitantes_rango),
      sesionesRango: num(t.sesiones_rango),
      visitasTotal: num(t.visitas_total),
      visitantesTotal: num(t.visitantes_total),
      midiendoDesde: primeraVisita ? primeraVisita.toISOString() : null,
      serie,
      paginas: paginasRaw.map((fila) => ({
        path: String(fila.path),
        titulo: fila.titulo ? String(fila.titulo) : null,
        visitas: num(fila.visitas),
        visitantes: num(fila.visitantes),
      })),
      secciones: seccionesRaw.map((fila) => ({
        seccion: String(fila.seccion),
        visitas: num(fila.visitas),
        visitantes: num(fila.visitantes),
      })),
      dispositivos: dispositivosRaw.map((fila) => ({
        device: String(fila.device),
        visitas: num(fila.visitas),
        visitantes: num(fila.visitantes),
      })),
      origenes: origenesRaw.map((fila) => ({
        referrer: String(fila.referrer),
        visitas: num(fila.visitas),
        visitantes: num(fila.visitantes),
      })),
      ubicaciones: ubicacionesRaw.map((fila) => ({
        pais: fila.pais ? String(fila.pais) : null,
        region: fila.region ? String(fila.region) : null,
        visitas: num(fila.visitas),
        visitantes: num(fila.visitantes),
      })),
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de visitas:', error);
    return statsVacias(presetSeguro, rango);
  }
}

const PAGINA_POR_DEFECTO = 1;
const FILAS_POR_PAGINA = 25;
const MAX_FILAS_POR_PAGINA = 100;

/**
 * Listado paginado de visitas individuales (no agregadas), para la tabla del
 * panel. Usa el mismo rango que `getVisitStats`, ordenado de la más reciente a
 * la más antigua.
 */
export async function getVisitasDetalle(
  preset: VisitRangoPreset = '30d',
  desdeYmd?: string,
  hastaYmd?: string,
  pagina: number = PAGINA_POR_DEFECTO,
  porPagina: number = FILAS_POR_PAGINA
): Promise<VisitasDetalle> {
  const presetSeguro = PRESETS_VALIDOS.includes(preset) ? preset : '30d';
  const { desde, hasta } = resolverRango(presetSeguro, desdeYmd, hastaYmd);

  const paginaSegura = Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : PAGINA_POR_DEFECTO;
  const porPaginaSegura =
    Number.isFinite(porPagina) && porPagina > 0
      ? Math.min(Math.floor(porPagina), MAX_FILAS_POR_PAGINA)
      : FILAS_POR_PAGINA;
  const offset = (paginaSegura - 1) * porPaginaSegura;

  try {
    const [filasRaw, totalRaw] = await Promise.all([
      prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT \`id\`, \`createdAt\`, \`path\`, \`titulo\`, \`seccion\`, \`device\`, \`referrer\`,
               \`pais\`, \`region\`, \`ciudad\`
        FROM \`PageView\`
        WHERE \`createdAt\` >= ${desde} AND \`createdAt\` < ${hasta}
        ORDER BY \`createdAt\` DESC
        LIMIT ${porPaginaSegura} OFFSET ${offset}
      `,
      prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT COUNT(*) AS total
        FROM \`PageView\`
        WHERE \`createdAt\` >= ${desde} AND \`createdAt\` < ${hasta}
      `,
    ]);

    return {
      disponible: true,
      filas: filasRaw.map((fila) => ({
        id: String(fila.id),
        createdAt: new Date(fila.createdAt as string).toISOString(),
        path: String(fila.path),
        titulo: fila.titulo ? String(fila.titulo) : null,
        seccion: String(fila.seccion),
        device: fila.device ? String(fila.device) : null,
        referrer: fila.referrer ? String(fila.referrer) : null,
        pais: fila.pais ? String(fila.pais) : null,
        region: fila.region ? String(fila.region) : null,
        ciudad: fila.ciudad ? String(fila.ciudad) : null,
      })),
      total: num(totalRaw[0]?.total),
      pagina: paginaSegura,
      porPagina: porPaginaSegura,
    };
  } catch (error) {
    console.error('Error obteniendo el detalle de visitas:', error);
    return { disponible: false, filas: [], total: 0, pagina: paginaSegura, porPagina: porPaginaSegura };
  }
}
