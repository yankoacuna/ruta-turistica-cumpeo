import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getAllPOIs, getTourRoutes, formatImgUrl } from '@/lib/data';
import {
  Map as MapIcon,
  MapPin,
  Compass,
  Navigation,
  ExternalLink,
  Info,
  Clock,
  Gauge,
  Sparkles,
  ArrowRight,
} from 'lucide-react';


export const metadata: Metadata = {
  title: 'Circuitos y Rutas Turísticas Oficiales — Cumpeo, Río Claro',
  description:
    'Recorre los circuitos turísticos y la Ruta de Condorito en Cumpeo, Región del Maule. Hitos temáticos, estatuas, gastronomía típica y coordenadas GPS guiadas.',
};

interface RutaPageProps {
  searchParams?: {
    ruta?: string;
    slug?: string;
  };
}

export default async function RutaPage({ searchParams }: RutaPageProps) {
  // ── CARGA DINÁMICA DE LA BASE DE DATOS Y CONFIGURACIÓN ──
  const [routes, allPois] = await Promise.all([
    getTourRoutes(),
    getAllPOIs(),
  ]);

  const targetSlug = searchParams?.slug || searchParams?.ruta;
  const currentRoute =
    (targetSlug ? routes.find((r) => r.slug === targetSlug || r.id === targetSlug) : null) ||
    routes.find((r) => r.destacada) ||
    routes[0];

  const poiMap = new Map(allPois.map((p) => [p.id, p]));

  // Paradas resueltas dinámicamente desde el array poiIds configurado en la base de datos
  const stops = (currentRoute?.poiIds || [])
    .map((id, index) => {
      const poi = poiMap.get(id);
      if (!poi) return null;
      return {
        numero: String(index + 1).padStart(2, '0'),
        id: poi.id,
        nombre: poi.nombre,
        categoria: poi.categoria,
        tipo: poi.tipo,
        descripcion: poi.descripcionCorta || (poi._original as any)?.descripcion || '',
        direccion: (poi._original as any)?.direccion || 'Cumpeo, Río Claro',
        imagen: formatImgUrl(poi.imagenPrincipal),
        coordenadas: poi.coordenadas,
      };
    })
    .filter(Boolean) as Array<{
      numero: string;
      id: string;
      nombre: string;
      categoria: string;
      tipo: string;
      descripcion: string;
      direccion: string;
      imagen: string;
      coordenadas: { lat: number; lng: number };
    }>;

  return (
    <div className="w-full pb-16">
      {/* ── HERO DE LA RUTA SELECCIONADA ─────── */}
      <section className="relative w-full bg-[#1E1E24] text-white py-12 md:py-16 border-b-4 border-rojo overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#E63946_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-sol text-[#1E1E24] mb-3 shadow-sm">
                <Compass size={14} /> Circuito Turístico Oficial
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl leading-tight text-white mb-3">
                {currentRoute?.nombre || 'Circuito Turístico de Cumpeo'} <br />
                <span className="text-sol">Río Claro, Maule</span>
              </h1>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-xl">
                {currentRoute?.descripcion ||
                  'Descubre los hitos patrimoniales, gastronómicos y culturales de Cumpeo, ambientados en las tradiciones maulinas y la historieta de Condorito.'}
              </p>

              {/* Indicadores clave configurables */}
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-semibold text-gray-300">
                {currentRoute?.duracionEstimada && (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
                    <Clock size={14} className="text-sol" /> {currentRoute.duracionEstimada}
                  </span>
                )}
                {currentRoute?.distanciaKm && (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
                    <Gauge size={14} className="text-sol" /> {currentRoute.distanciaKm} km aprox.
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
                  <MapPin size={14} className="text-rojo" /> {stops.length} paradas configuradas
                </span>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href={`/mapa?ruta=${currentRoute?.slug || currentRoute?.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-extrabold bg-rojo text-white hover:bg-rojo-dark transition-all shadow-md text-sm no-underline"
                >
                  <MapIcon size={18} /> Navegar en Mapa GPS en Vivo
                </Link>
                {currentRoute?.mapaImagen && (
                  <a
                    href="#mapa-oficial"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all text-sm no-underline"
                  >
                    Ver Mapa Ilustrado ↓
                  </a>
                )}
              </div>
            </div>

            {/* Sello de respaldo municipal */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl md:max-w-[280px] shrink-0 backdrop-blur-sm">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">
                Iniciativa Turística Oficial
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="/assets/images/logo-muni-rio-claro.png"
                  alt="Ilustre Municipalidad de Río Claro"
                  className="h-10 object-contain brightness-110"
                />
              </div>
              <p className="text-[0.75rem] text-gray-300 mt-2.5 leading-snug">
                Coordinado por la Ilustre Municipalidad de Río Claro para el fomento del turismo comunal y el comercio local.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SELECTOR DINÁMICO DE RUTAS (TABS) ─────── */}
      {routes.length > 1 && (
        <section className="w-full bg-[#F5F4F0] border-b border-border py-4">
          <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Sparkles size={14} className="text-rojo" /> Circuitos Disponibles:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {routes.map((r) => {
                const isSelected = r.id === currentRoute?.id;
                return (
                  <Link
                    key={r.id}
                    href={`/ruta?slug=${r.slug || r.id}`}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 no-underline ${
                      isSelected
                        ? 'bg-rojo text-white shadow-xs'
                        : 'bg-white text-text-secondary hover:text-text-primary border border-border shadow-2xs'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: isSelected ? '#FFFFFF' : (r.color || '#E63946') }}
                    />
                    {r.nombre}
                    <span className={`text-[0.65rem] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-surface-soft text-text-muted'}`}>
                      {r.poiIds?.length || 0}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── MAPA ILUSTRADO PATRIMONIAL (SI APLICA A LA RUTA) ─────── */}
      {currentRoute?.mapaImagen && (
        <section id="mapa-oficial" className="py-10 md:py-14 w-full max-w-[1200px] mx-auto px-4">
          <div className="bg-white border-2 border-border rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rojo uppercase tracking-wider mb-1">
                  <Compass size={14} /> Mapa Cartográfico Patrimonial
                </div>
                <h2 className="font-display font-extrabold text-2xl md:text-3xl text-text-primary">
                  El Mapa Ilustrado del Circuito
                </h2>
                <p className="text-sm text-text-secondary mt-1 max-w-xl">
                  Guía cartográfica oficial de los hitos y paradas desde el acceso en Camarico (Ruta 5 Sur Km 222) hasta el centro cívico de Cumpeo.
                </p>
              </div>

              <a
                href={currentRoute.mapaImagen}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rojo hover:text-rojo-dark bg-[#FFF0F1] hover:bg-[#FFE0E2] border border-[#FFCCD0] px-4 py-2 rounded-full transition-all self-start md:self-auto no-underline"
                title="Abrir imagen en alta resolución"
              >
                <ExternalLink size={14} /> Abrir mapa en tamaño completo
              </a>
            </div>

            {/* Imagen del mapa */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-[#F5F8F4] shadow-inner group">
              <img
                src={currentRoute.mapaImagen}
                alt={`Mapa Ilustrado de ${currentRoute.nombre}`}
                className="w-full h-auto object-contain max-h-[550px] mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                <span>Ilustración oficial comunal</span>
              </div>
            </div>

            {/* Hitos clave dinámicos desde la base de datos */}
            {currentRoute.hitos && Array.isArray(currentRoute.hitos) && currentRoute.hitos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                {currentRoute.hitos.map((hito: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-sol/30 text-[#B47900] font-black text-sm flex items-center justify-center shrink-0">
                      {hito.numero || idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-text-primary">{hito.titulo}</div>
                      <div className="text-xs text-text-muted mt-0.5">{hito.descripcion}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── PARADAS DINÁMICAS RESUELTAS DESDE LA BD ─────── */}
      <section className="py-8 w-full max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rojo uppercase tracking-wider mb-1">
              <MapPin size={14} /> Itinerario Oficial ({stops.length} Paradas Configuradas)
            </div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-text-primary">
              Las Paradas del Circuito
            </h2>
            <p className="text-sm text-text-secondary mt-1 max-w-xl">
              Recorrido sugerido en orden secuencial. Configurado en la base de datos y administrable por el equipo de turismo.
            </p>
          </div>

          <Link
            href={`/mapa?ruta=${currentRoute?.slug || currentRoute?.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold bg-[#1E1E24] hover:bg-black text-white transition-all shadow-sm self-start sm:self-auto no-underline"
          >
            <MapIcon size={15} />
            <span>Ver paradas en Mapa Interactivo</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {stops.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-border rounded-3xl p-10 text-center text-text-muted">
            <Compass size={32} className="mx-auto mb-2 text-text-muted opacity-50" />
            <div className="font-bold text-base text-text-primary mb-1">
              Aún no hay paradas configuradas en este circuito
            </div>
            <p className="text-xs max-w-md mx-auto">
              Puedes agregar o reordenar los destinos, restaurantes y locales para esta ruta ingresando al Panel de Administración.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stops.map((parada) => (
              <article
                key={parada.id}
                className="bg-white border-[1.5px] border-border rounded-3xl overflow-hidden shadow-sm hover:border-rojo hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-[16/10] w-full bg-surface-soft overflow-hidden">
                  <img
                    src={parada.imagen}
                    alt={parada.nombre}
                    className="w-full h-full object-cover object-center"
                  />

                  <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                    <span className="w-7 h-7 rounded-full bg-rojo text-white font-black text-xs flex items-center justify-center shadow-md">
                      {parada.numero}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wide bg-white/95 text-text-primary border border-border shadow-sm backdrop-blur-sm">
                      {parada.categoria}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-text-primary leading-tight">
                      {parada.nombre}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1 font-medium">
                      <MapPin size={12} className="text-rojo shrink-0" />
                      <span>{parada.direccion}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-3">
                      {parada.descripcion}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <Link
                      href={`/destino/${parada.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-rojo hover:text-rojo-dark transition-colors no-underline"
                    >
                      Ver ficha completa <ArrowRight size={12} />
                    </Link>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${parada.coordenadas.lat},${parada.coordenadas.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-sky-700 transition-colors no-underline"
                    >
                      <Navigation size={12} /> Cómo llegar
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── CONSEJOS DINÁMICOS DE LA RUTA ─────── */}
      {currentRoute?.consejos && Array.isArray(currentRoute.consejos) && currentRoute.consejos.length > 0 && (
        <section className="py-8 w-full max-w-[1200px] mx-auto px-4">
          <div className="bg-[#FFFDF7] border-2 border-[#FFE8A3] rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#B47900] uppercase tracking-wider mb-2">
              <Info size={16} /> Consejos Prácticos para tu Visita
            </div>
            <h3 className="font-display font-extrabold text-xl text-text-primary mb-4">
              Recomendaciones para recorrer este circuito
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm text-text-secondary">
              {currentRoute.consejos.map((tip: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-border">
                  <div className="font-bold text-text-primary mb-1 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-sol shrink-0" />
                    <span>{tip.titulo}</span>
                  </div>
                  <div className="text-xs leading-relaxed text-text-secondary">
                    {tip.texto}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
