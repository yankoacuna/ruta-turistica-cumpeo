'use client';

import React from 'react';

const nf = new Intl.NumberFormat('es-CL');

/**
 * Un promedio de 0,03 personas por día redondeado da "0", que se lee como si no
 * hubiera venido nadie. Bajo 0,1 se dice explícitamente que es menos que eso.
 */
function formatearPromedio(valor: number): string {
  if (valor > 0 && valor < 0.1) return 'menos de 0,1';
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(valor);
}

interface Punto {
  clave: string;
  visitas: number;
  visitantes: number;
}

interface VisitasGraficoProps {
  serie: Punto[];
  granularidad: 'dia' | 'hora';
}

/** Partes de la clave "2026-09-13" o "2026-09-13T14", sin pasar por Date (evita saltos de zona). */
function partes(clave: string) {
  const [fecha, hora] = clave.split('T');
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return { anio, mes, dia, hora: hora ? Number(hora) : null };
}

/** Etiqueta breve del eje: "13/09" por día, "14h" por hora. */
function etiquetaEje(clave: string, granularidad: 'dia' | 'hora'): string {
  const { mes, dia, hora } = partes(clave);
  if (granularidad === 'hora') return `${String(hora ?? 0).padStart(2, '0')}h`;
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
}

/** Etiqueta completa del globo: "sáb 13 de sep" o "de 14:00 a 14:59". */
function etiquetaCompleta(clave: string, granularidad: 'dia' | 'hora'): string {
  const { anio, mes, dia, hora } = partes(clave);
  if (granularidad === 'hora') {
    const h = String(hora ?? 0).padStart(2, '0');
    return `De ${h}:00 a ${h}:59`;
  }
  const texto = new Date(anio, mes - 1, dia).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Cuáles columnas muestran etiqueta: con 30 barras no caben todas, y rotarlas
 * las vuelve ilegibles. Se reparten hasta 6 marcas, siempre incluyendo la
 * primera y la última para que el período quede acotado a simple vista.
 */
function indicesConEtiqueta(total: number, granularidad: 'dia' | 'hora'): Set<number> {
  if (total === 0) return new Set();
  if (granularidad === 'hora') {
    const marcas = new Set<number>();
    for (let h = 0; h < total; h += 6) marcas.add(h);
    marcas.add(total - 1);
    return marcas;
  }
  if (total <= 8) return new Set(Array.from({ length: total }, (_, i) => i));
  const paso = Math.ceil(total / 6);
  const marcas = new Set<number>();
  for (let i = 0; i < total; i += paso) marcas.add(i);
  marcas.add(total - 1);
  return marcas;
}

/**
 * Visitantes por día (o por hora, en el período "Hoy").
 *
 * Una sola serie —personas distintas—, así que no lleva leyenda: el título del
 * bloque ya dice qué se está midiendo. Las páginas abiertas aparecen solo en el
 * globo, como contexto del dato principal.
 */
export function VisitasGrafico({ serie, granularidad }: VisitasGraficoProps) {
  const valores = serie.map((p) => p.visitantes);
  const max = Math.max(0, ...valores);
  const totalVisitantes = valores.reduce((acc, v) => acc + v, 0);
  const promedio = serie.length > 0 ? totalVisitantes / serie.length : 0;
  const indicePico = max > 0 ? valores.indexOf(max) : -1;
  const etiquetas = indicesConEtiqueta(serie.length, granularidad);

  // Escala con aire arriba: si la barra más alta toca el techo, el número que la
  // rotula queda pegado al borde del recuadro.
  const tope = max > 0 ? max * 1.15 : 1;
  const alturaPct = (valor: number) => (valor / tope) * 100;

  const unidad = granularidad === 'hora' ? 'hora' : 'día';

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 text-xs">
        <span className="text-text-muted">
          {max > 0 ? (
            <>
              Mejor {unidad}:{' '}
              <strong className="text-text-primary tabular-nums">{nf.format(max)}</strong>{' '}
              {max === 1 ? 'persona' : 'personas'}
            </>
          ) : (
            'Sin visitantes en este período'
          )}
        </span>
        {max > 0 && (
          <span className="text-text-muted">
            Promedio por {unidad}:{' '}
            <strong className="text-text-primary tabular-nums">{formatearPromedio(promedio)}</strong>
          </span>
        )}
      </div>

      <div
        className="relative h-40"
        role="img"
        aria-label={`Visitantes por ${unidad}: ${nf.format(totalVisitantes)} personas en ${serie.length} ${unidad === 'hora' ? 'horas' : 'días'}`}
      >
        {/* Rejilla de referencia, deliberadamente tenue: orienta sin competir con las barras */}
        <div className="absolute inset-0 pointer-events-none">
          {[0, 0.5, 1].map((fraccion) => (
            <div
              key={fraccion}
              className="absolute left-0 right-0 border-t border-border/50"
              style={{ bottom: `${fraccion * (100 / 1.15)}%` }}
            />
          ))}
        </div>

        {/* Línea de promedio: separa los días buenos de los flojos de un vistazo */}
        {max > 0 && promedio > 0 && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-cielo/45 pointer-events-none"
            style={{ bottom: `${alturaPct(promedio)}%` }}
          />
        )}

        <div className="absolute inset-0 flex items-end gap-0.5">
          {serie.map((p, i) => {
            const esPico = i === indicePico && max > 0;
            // El globo se ancla hacia adentro en los extremos para que no se
            // corte contra el borde de la tarjeta.
            const anclaje =
              i < 2
                ? 'left-0'
                : i > serie.length - 3
                  ? 'right-0'
                  : 'left-1/2 -translate-x-1/2';

            return (
              <div
                key={p.clave}
                className="group relative flex-1 min-w-0 h-full flex flex-col justify-end"
              >
                {/* Franja invisible que agranda el área donde responde el globo:
                    en barras de pocos píxeles, apuntarle a la barra es imposible.
                    No lleva color propio —solo el realce al pasar el mouse—
                    porque cualquier relleno de columna se lee como un dato más. */}
                <div className="absolute inset-0 rounded-t transition-colors group-hover:bg-cielo/10" />

                {esPico && (
                  <div className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold text-cielo-dark tabular-nums pointer-events-none"
                    style={{ bottom: `calc(${alturaPct(p.visitantes)}% + 2px)` }}
                  >
                    {nf.format(p.visitantes)}
                  </div>
                )}

                <div
                  className={`relative w-full rounded-t-[4px] transition-colors ${
                    p.visitantes > 0
                      ? 'bg-cielo group-hover:bg-cielo-dark'
                      : 'bg-border group-hover:bg-border-strong'
                  }`}
                  style={{
                    height: p.visitantes > 0 ? `${Math.max(alturaPct(p.visitantes), 3)}%` : '3px',
                  }}
                />

                <div
                  className={`pointer-events-none absolute bottom-full mb-1.5 hidden group-hover:block z-20 whitespace-nowrap rounded-lg bg-ink text-white text-xs px-2.5 py-1.5 shadow-lg ${anclaje}`}
                >
                  <div className="font-bold">{etiquetaCompleta(p.clave, granularidad)}</div>
                  <div className="text-white/80">
                    {nf.format(p.visitantes)} {p.visitantes === 1 ? 'persona' : 'personas'} ·{' '}
                    {nf.format(p.visitas)} {p.visitas === 1 ? 'página' : 'páginas'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Eje horizontal: las etiquetas se posicionan sobre su propia columna y
          pueden desbordarla, así no se recortan cuando las barras son angostas */}
      <div className="flex gap-0.5 mt-1.5 h-4">
        {serie.map((p, i) => (
          <div key={p.clave} className="relative flex-1 min-w-0">
            {etiquetas.has(i) && (
              <span className="absolute left-1/2 -translate-x-1/2 text-[10px] text-text-muted whitespace-nowrap">
                {etiquetaEje(p.clave, granularidad)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
