import React from 'react';
import Link from 'next/link';
import { Compass, ArrowRight, Footprints, Clock, Route, MapPin } from 'lucide-react';
import { TourRoute } from '@/lib/types';
import { Editable, useSiteText } from '@/components/site-text';

interface RutaShowcaseProps {
  /** Ruta destacada del catastro. Si no hay, el bloque usa el texto base. */
  route?: TourRoute | null;
  /**
   * Paradas resueltas desde poiIds, en orden. `href` solo viene para los
   * destinos, que son los unicos con ficha propia; una parada puede ser
   * tambien un restaurante o un alojamiento del catastro.
   */
  stops?: Array<{ id: string; nombre: string; href?: string }>;
}

/**
 * Viñeta de acento para el producto estrella de la comuna.
 *
 * Cambios respecto de la version anterior:
 * - Ya no muestra un mosaico 2x2 de cuatro fotos sueltas, sino el plano
 *   turistico ilustrado, que es justamente la pieza que pide el EETT.
 * - Los "atributos" eran etiquetas decorativas fijas ("Con mapa GPS"). Ahora
 *   son datos reales de la ruta: paradas, duracion y distancia.
 * - Lista las primeras paradas numeradas: da una razon concreta para entrar,
 *   en vez de un CTA a ciegas.
 */
export function RutaShowcase({ route, stops = [] }: RutaShowcaseProps) {
  const { get } = useSiteText();

  // El titulo y la descripcion salen de la ruta del catastro. Los textos
  // editables son el respaldo para cuando no hay ninguna ruta destacada: no
  // tiene sentido editar en el sitio un dato que se administra en /admin.
  const titulo = route?.nombre || get('home.ruta.tituloFallback');
  const descripcion = route?.descripcion || get('home.ruta.descripcionFallback');
  const mapa = route?.mapaImagen || '/assets/images/mapa-ilustrado-ruta-condorito.png';

  // El conteo sale de poiIds, que es el dato autoritativo: `stops` puede ser
  // mas corto si alguna parada todavia no esta cargada en el catastro.
  const paradas = route?.poiIds?.length || stops.length;

  const datos = [
    paradas > 0 && { icon: MapPin, valor: String(paradas), etiqueta: paradas === 1 ? 'parada' : 'paradas' },
    route?.duracionEstimada && { icon: Clock, valor: route.duracionEstimada, etiqueta: 'de recorrido' },
    route?.distanciaKm && { icon: Route, valor: `${route.distanciaKm} km`, etiqueta: 'de trazado' },
    route?.dificultad && { icon: Footprints, valor: route.dificultad, etiqueta: 'dificultad' },
  ].filter(Boolean) as Array<{ icon: typeof MapPin; valor: string; etiqueta: string }>;

  return (
    <section className="relative w-full bg-ink text-white overflow-hidden py-14 md:py-24">
      {/* Trama de historieta: la textura de marca que hace que esta viñeta no
          parezca un bloque oscuro genérico. */}
      <div className="absolute inset-0 bg-halftone-sol opacity-70 pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-shell mx-auto px-4 grid lg:grid-cols-12 lg:gap-12 lg:items-center">
        {/* Plano ilustrado. Primero en mobile: comunica de inmediato "esto es
            un recorrido", antes de leer una línea. */}
        <div className="lg:col-span-6 lg:order-2 mb-8 lg:mb-0">
          <div className="rounded-xl overflow-hidden border-2 border-sol bg-paper shadow-comic-sol">
            <img
              src={mapa}
              alt={`Plano ilustrado de ${titulo}`}
              loading="lazy"
              className="w-full h-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/images/mapa-ilustrado-ruta-condorito.png';
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-6 lg:order-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.14em] bg-sol text-ink mb-4">
            <Compass size={14} /> <Editable k="home.ruta.kicker" />
          </div>

          <h2 className="font-display font-bold text-display-lg text-white text-balance">
            {titulo}
          </h2>
          <div className="w-11 h-1 rounded-full bg-sol mt-4" aria-hidden="true" />

          <p className="text-base text-paper-deep mt-5 leading-relaxed max-w-xl">{descripcion}</p>

          {/* Datos reales de la ruta, no etiquetas decorativas. */}
          {datos.length > 0 && (
            <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-4">
              {datos.map(({ icon: Icon, valor, etiqueta }) => (
                <div key={etiqueta} className="flex items-center gap-2.5">
                  <Icon size={18} className="text-sol shrink-0" />
                  <div>
                    <dt className="sr-only">{etiqueta}</dt>
                    <dd className="font-display font-bold text-xl text-white leading-none capitalize">
                      {valor}
                    </dd>
                    <dd className="text-xs text-paper-deep/80 mt-1">{etiqueta}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}

          {/* Primeras paradas: prueba concreta de que hay contenido detrás. */}
          {stops.length > 0 && (
            <ol className="mt-7 flex flex-wrap gap-2">
              {stops.slice(0, 4).map((s, i) => {
                const inner = (
                  <>
                    <span className="w-6 h-6 rounded-full bg-sol text-ink text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate max-w-[170px]">{s.nombre}</span>
                  </>
                );
                const chip =
                  'inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-white';

                return (
                  <li key={s.id}>
                    {s.href ? (
                      <Link href={s.href} className={`${chip} hover:bg-white/20 no-underline transition-colors`}>
                        {inner}
                      </Link>
                    ) : (
                      <span className={chip}>{inner}</span>
                    )}
                  </li>
                );
              })}
              {stops.length > 4 && (
                <li className="inline-flex items-center px-3 py-1.5 text-sm font-semibold text-paper-deep/80">
                  +{stops.length - 4} más
                </li>
              )}
            </ol>
          )}

          <Link
            href="/ruta"
            className="mt-8 w-full sm:w-auto min-h-[54px] px-6 inline-flex items-center justify-center gap-2.5 rounded-full text-base font-bold bg-rojo hover:bg-rojo-light text-white border-2 border-sol no-underline transition-all"
          >
            <Compass size={19} /> <Editable k="home.ruta.cta" /> <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
