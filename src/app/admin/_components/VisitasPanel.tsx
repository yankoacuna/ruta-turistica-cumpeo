'use client';

import React, { useMemo } from 'react';
import {
  Activity,
  RefreshCw,
  Users,
  Eye,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  BarChart3,
  AlertTriangle,
  CalendarRange,
} from 'lucide-react';
import { VisitStats, VisitRangoPreset } from '@/lib/types';
import { VisitasGrafico } from './VisitasGrafico';

const RANGOS: Array<{ preset: VisitRangoPreset; label: string }> = [
  { preset: 'hoy', label: 'Hoy' },
  { preset: '7d', label: '7 días' },
  { preset: '30d', label: '30 días' },
  { preset: 'mes-actual', label: 'Mes actual' },
  { preset: 'mes-pasado', label: 'Mes pasado' },
];

const SECCION_LABEL: Record<string, string> = {
  inicio: 'Portada',
  destino: 'Fichas de destinos',
  ruta: 'Circuitos',
  mapa: 'Mapa interactivo',
  categoria: 'Categorías',
  historia: 'Historia',
  contacto: 'Contacto',
  otro: 'Otras páginas',
};

const DEVICE_LABEL: Record<string, string> = {
  movil: 'Móvil',
  tablet: 'Tablet',
  escritorio: 'Escritorio',
  desconocido: 'Sin identificar',
};

const DEVICE_ICON: Record<string, React.ReactNode> = {
  movil: <Smartphone size={14} />,
  tablet: <Tablet size={14} />,
  escritorio: <Monitor size={14} />,
  desconocido: <Globe size={14} />,
};

const nf = new Intl.NumberFormat('es-CL');
const nf1 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });

/** Páginas fijas del sitio: su nombre no depende del contenido cargado. */
const NOMBRE_POR_RUTA: Record<string, string> = {
  '/': 'Portada',
  '/mapa': 'Mapa interactivo',
  '/historia': 'Historia de Cumpeo',
  '/contacto': 'Contacto',
  '/ruta': 'Circuitos y rutas',
};

const CONECTORES = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'a', 'con']);

/** "plaza-de-cumpeo" a "Plaza de Cumpeo": mayúscula inicial salvo en conectores. */
function titulizar(texto: string): string {
  return texto
    .split(' ')
    .filter(Boolean)
    .map((palabra, i) =>
      i > 0 && CONECTORES.has(palabra) ? palabra : palabra.charAt(0).toUpperCase() + palabra.slice(1)
    )
    .join(' ');
}

/**
 * Nombre legible deducido de la ruta, para cuando el título del navegador no
 * sirve. Nunca devuelve la URL: el panel es para el equipo municipal, y "/destino/
 * plaza-de-cumpeo" no le dice nada a quien gestiona el contenido.
 */
function nombreDesdeRuta(path: string): string {
  const limpio = path.split('?')[0].replace(/\/+$/, '') || '/';
  if (NOMBRE_POR_RUTA[limpio]) return NOMBRE_POR_RUTA[limpio];

  const partes = limpio.split('/').filter(Boolean);
  const slug = partes[partes.length - 1] || '';
  const nombre = titulizar(slug.replace(/[-_]+/g, ' '));

  if (partes[0] === 'categoria') return `Categoría: ${nombre}`;
  if (partes[0] === 'ruta') return `Circuito: ${nombre}`;
  return nombre || 'Portada';
}

/** Quita el sufijo del sitio del título del navegador: en una lista solo estorba. */
function nombreDesdeTitulo(titulo: string | null): string {
  if (!titulo) return '';
  const limpio = titulo.replace(/\s*[|–—-]\s*Turismo Cumpeo\s*$/i, '').trim();
  // "Turismo Cumpeo" a secas es el título por defecto: no identifica la página.
  return /^turismo cumpeo$/i.test(limpio) ? '' : limpio;
}

interface VisitasPanelProps {
  stats: VisitStats | null;
  preset: VisitRangoPreset;
  desde: string;
  hasta: string;
  cargando: boolean;
  error: boolean;
  onPresetChange: (preset: VisitRangoPreset) => void;
  onRangoPersonalizado: (desde: string, hasta: string) => void;
  onRecargar: () => void;
}

/** Fecha de hoy en Chile como "YYYY-MM-DD": el tope de los selectores de fecha. */
function hoyEnChile(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());
}

/** "YYYY-MM-DD" de hace N días, para proponer un rango inicial razonable. */
function hace(dias: number): string {
  const hoy = hoyEnChile();
  const [anio, mes, dia] = hoy.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia - dias)).toISOString().slice(0, 10);
}

/**
 * Visitantes del sitio público dentro del dashboard del CMS.
 *
 * Todo el panel destaca VISITANTES (personas distintas) y deja las visitas
 * (páginas abiertas) como dato de apoyo: un mismo turista que recorre diez
 * fichas suma diez visitas sin que haya llegado más gente, así que liderar con
 * ese número da una sensación de alcance que no es real.
 *
 * Los datos llegan por props desde `useVisitStats`, porque el dashboard también
 * los usa en la tarjeta de visitantes del grid principal.
 */
export function VisitasPanel({
  stats,
  preset,
  desde,
  hasta,
  cargando,
  error,
  onPresetChange,
  onRangoPersonalizado,
  onRecargar,
}: VisitasPanelProps) {
  const esPersonalizado = preset === 'personalizado';
  const tope = hoyEnChile();
  const maxPagina = stats ? Math.max(1, ...stats.paginas.map((p) => p.visitantes)) : 1;
  const totalDispositivos = stats
    ? stats.dispositivos.reduce((acc, d) => acc + d.visitantes, 0)
    : 0;
  const sinDatosHistoricos = Boolean(stats?.disponible && stats.visitasTotal === 0);

  // Cuánto explora cada persona: el verdadero uso de las "visitas".
  const paginasPorVisitante =
    stats && stats.visitantesRango > 0 ? stats.visitasRango / stats.visitantesRango : 0;

  /**
   * Nombre de cada contenido del ranking, sin URLs.
   *
   * Se parte del título del navegador y, cuando dos páginas distintas comparten
   * título (la portada y otra sin título propio, por ejemplo), se cae al nombre
   * deducido de la ruta, que sí es único. Mostrar la URL para desempatar sería
   * más fácil, pero ensucia una lista que lee gente no técnica.
   */
  const nombresPaginas = useMemo(() => {
    const paginas = stats?.paginas ?? [];
    const preliminares = paginas.map((p) => nombreDesdeTitulo(p.titulo) || nombreDesdeRuta(p.path));

    const repetidos = new Set(
      preliminares.filter((nombre, i) => preliminares.indexOf(nombre) !== i)
    );

    return new Map(
      paginas.map((p, i) => [
        p.path,
        repetidos.has(preliminares[i]) ? nombreDesdeRuta(p.path) : preliminares[i],
      ])
    );
  }, [stats]);

  const kpis = stats
    ? [
        {
          label: 'Visitantes',
          value: stats.visitantesRango,
          sub: stats.rangoLabel,
        },
        {
          label: 'Páginas abiertas',
          value: stats.visitasRango,
          sub: `${nf.format(stats.sesionesRango)} sesiones`,
        },
        {
          label: 'Páginas por persona',
          value: nf1.format(paginasPorVisitante),
          sub: 'Cuánto explora cada visitante',
        },
        {
          label: 'Visitantes en total',
          value: stats.visitantesTotal,
          sub: stats.midiendoDesde
            ? `Desde el ${new Date(stats.midiendoDesde).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}`
            : 'Desde el inicio de la medición',
        },
      ]
    : [];

  return (
    <div id="tour-visitas" className="bg-white rounded-2xl border border-border shadow-2xs p-5 space-y-5">
      {/* Encabezado y selector de período */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-sky-50 text-cielo">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-sm">Visitantes de la Plataforma</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Cuánta gente distinta está usando el sitio público. Medición propia y anónima: no
              identifica personas ni usa servicios de terceros.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-start lg:self-auto">
          <div className="flex flex-wrap rounded-xl border border-border overflow-hidden">
            {RANGOS.map((r) => (
              <button
                key={r.preset}
                type="button"
                onClick={() => onPresetChange(r.preset)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${
                  preset === r.preset
                    ? 'bg-cielo text-white'
                    : 'bg-white text-text-secondary hover:bg-surface-soft'
                }`}
              >
                {r.label}
              </button>
            ))}
            {/* Al entrar al rango libre se propone una quincena: sin fechas no hay
                nada que consultar, y dos campos vacíos no dicen qué esperar. */}
            <button
              type="button"
              onClick={() => onRangoPersonalizado(desde || hace(13), hasta || tope)}
              title="Elegir fechas exactas"
              className={`px-2.5 py-1.5 text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
                esPersonalizado
                  ? 'bg-cielo text-white'
                  : 'bg-white text-text-secondary hover:bg-surface-soft'
              }`}
            >
              <CalendarRange size={13} />
              <span>Fechas</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onRecargar}
            disabled={cargando}
            title="Actualizar métricas"
            className="p-2 rounded-xl border border-border text-text-secondary hover:border-rojo hover:text-rojo transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Rango libre: se consulta apenas cambia una fecha, sin botón de aplicar */}
      {esPersonalizado && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-surface-soft/60 border border-border/60">
          <span className="text-xs font-bold text-text-secondary">Desde</span>
          <input
            type="date"
            value={desde}
            max={tope}
            onChange={(e) => onRangoPersonalizado(e.target.value, hasta)}
            className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-primary bg-white focus:outline-none focus:border-cielo"
          />
          <span className="text-xs font-bold text-text-secondary">hasta</span>
          <input
            type="date"
            value={hasta}
            max={tope}
            onChange={(e) => onRangoPersonalizado(desde, e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-primary bg-white focus:outline-none focus:border-cielo"
          />
          <span className="text-xs text-text-muted">
            Un solo día se muestra hora por hora. Máximo un año.
          </span>
        </div>
      )}

      {/* Error de lectura: casi siempre, la tabla todavía no existe en la base */}
      {(error || (stats && !stats.disponible)) && !cargando && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="block mb-0.5">No se pudieron leer las visitas.</strong>
          </div>
        </div>
      )}

      {cargando && !stats && (
        <div className="space-y-3 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-surface-soft border border-border/60" />
            ))}
          </div>
          <div className="h-40 rounded-xl bg-surface-soft border border-border/60" />
        </div>
      )}

      {stats && stats.disponible && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="p-3.5 rounded-xl bg-surface-soft/60 border border-border/60">
                <div className="text-xs font-bold text-text-muted uppercase tracking-wide">
                  {kpi.label}
                </div>
                <div className="text-2xl font-extrabold text-text-primary mt-1 tabular-nums">
                  {typeof kpi.value === 'number' ? nf.format(kpi.value) : kpi.value}
                </div>
                <div className="text-xs text-text-muted mt-0.5 truncate" title={kpi.sub}>
                  {kpi.sub}
                </div>
              </div>
            ))}
          </div>

          {sinDatosHistoricos ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-50/60 border border-sky-200">
              <Eye size={18} className="text-cielo shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="block mb-0.5 text-text-primary">
                  Aún no hay visitantes registrados.
                </strong>
                <span className="text-text-secondary">
                  El conteo empieza a correr apenas un turista abre el sitio público. Lo que se hace
                  dentro de este panel de administración nunca se cuenta.
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="pt-4 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary mb-3">
                  <BarChart3 size={13} className="text-cielo" />
                  <span>
                    Visitantes por {stats.granularidad === 'hora' ? 'hora' : 'día'} ·{' '}
                    <span className="text-text-muted font-semibold">{stats.rangoLabel}</span>
                  </span>
                </div>

                <VisitasGrafico serie={stats.serie} granularidad={stats.granularidad} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4 border-t border-border/60">
                {/* Contenidos que más gente distinta abrió */}
                <div>
                  <div className="text-xs font-bold text-text-secondary mb-3">
                    Contenidos que más gente abre
                  </div>
                  {stats.paginas.length > 0 ? (
                    <div className="space-y-2">
                      {stats.paginas.map((p) => {
                        const pct = (p.visitantes / maxPagina) * 100;
                        return (
                          <div key={p.path} className="space-y-1">
                            <div className="flex items-baseline justify-between gap-3 text-xs">
                              <span
                                className="text-text-primary font-medium truncate"
                                title={`${nf.format(p.visitas)} páginas abiertas`}
                              >
                                {nombresPaginas.get(p.path)}
                              </span>
                              <span className="text-text-secondary font-bold tabular-nums shrink-0">
                                {nf.format(p.visitantes)}
                                <span className="text-text-muted font-normal">
                                  {' '}
                                  {p.visitantes === 1 ? 'persona' : 'personas'}
                                </span>
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-soft rounded-full overflow-hidden border border-border/60">
                              <div
                                className="h-full bg-cielo rounded-full"
                                style={{ width: `${Math.max(pct, 2)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted leading-relaxed">
                      Nadie abrió contenidos en este período.
                    </p>
                  )}
                </div>

                {/* Secciones, dispositivos y origen del tráfico */}
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold text-text-secondary mb-2.5">
                      Secciones del sitio
                    </div>
                    {stats.secciones.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {stats.secciones.map((s) => (
                          <span
                            key={s.seccion}
                            className="text-xs font-semibold text-text-secondary bg-surface-soft border border-border px-2.5 py-1 rounded-full"
                            title={`${nf.format(s.visitantes)} personas · ${nf.format(s.visitas)} páginas abiertas`}
                          >
                            {SECCION_LABEL[s.seccion] || s.seccion}
                            <span className="ml-1.5 font-extrabold text-text-primary tabular-nums">
                              {nf.format(s.visitantes)}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted">Sin movimiento en este período.</p>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-text-secondary mb-2.5">
                      Desde qué dispositivo
                    </div>
                    {stats.dispositivos.length > 0 ? (
                      <div className="space-y-1.5">
                        {stats.dispositivos.map((d) => {
                          const pct =
                            totalDispositivos > 0
                              ? Math.round((d.visitantes / totalDispositivos) * 100)
                              : 0;
                          return (
                            <div
                              key={d.device}
                              className="flex items-center gap-2 text-xs text-text-secondary"
                            >
                              <span className="text-cielo shrink-0">
                                {DEVICE_ICON[d.device] || DEVICE_ICON.desconocido}
                              </span>
                              <span className="flex-1 truncate">
                                {DEVICE_LABEL[d.device] || d.device}
                              </span>
                              <span className="font-bold text-text-primary tabular-nums">
                                {pct}%
                              </span>
                              <span
                                className="text-text-muted tabular-nums w-20 text-right"
                                title={`${nf.format(d.visitas)} páginas abiertas`}
                              >
                                {nf.format(d.visitantes)}{' '}
                                {d.visitantes === 1 ? 'persona' : 'personas'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted">Sin movimiento en este período.</p>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-text-secondary mb-2.5">
                      Sitios de origen
                    </div>
                    {stats.origenes.length > 0 ? (
                      <div className="space-y-1.5">
                        {stats.origenes.map((o) => (
                          <div
                            key={o.referrer}
                            className="flex items-center gap-2 text-xs text-text-secondary"
                          >
                            <Globe size={14} className="text-cielo shrink-0" />
                            <span className="flex-1 truncate">{o.referrer}</span>
                            <span
                              className="font-bold text-text-primary tabular-nums"
                              title={`${nf.format(o.visitas)} páginas abiertas`}
                            >
                              {nf.format(o.visitantes)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted leading-relaxed">
                        Nadie llegó desde otros sitios en este período. Las visitas entran directo:
                        por el enlace, por los códigos QR de los tótems o navegando dentro del sitio.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <p className="text-xs text-text-muted leading-relaxed pt-3 border-t border-border/60 flex items-start gap-1.5">
            <Users size={12} className="shrink-0 mt-0.5" />
            <span>
              Todas las cifras destacadas cuentan <strong>personas distintas</strong>. Las páginas
              abiertas se muestran aparte porque un mismo turista que recorre varias fichas las
              multiplica: sirven para saber cuánto explora cada uno, no cuánta gente llegó.
            </span>
          </p>
        </>
      )}
    </div>
  );
}
