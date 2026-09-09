'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import MapComponent from '@/components/MapComponent';
import { POI, TourRoute } from '@/lib/types';
import { calcDistanceKm, formatDistance, formatImgUrl, sortByDistance } from '@/lib/data';
import { useOpeningStatus } from '@/hooks/useOpeningStatus';
import { useToast } from '@/components/Toast';
import {
  Crosshair,
  Map as MapIcon,
  List,
  Palette,
  Landmark,
  Leaf,
  UtensilsCrossed,
  BedDouble,
  Award,
  Navigation,
  MapPin,
  X,
  ExternalLink,
  Search,
  Footprints,
  Car,
  Phone,
  Share2,
  Compass,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface MapaClientProps {
  initialPois: POI[];
  initialTourRoutes: TourRoute[];
}

const CUMPEO_CENTER = { lat: -35.267, lng: -71.25 };

/**
 * Badge "Abierto/Cerrado" en pildora, para la ficha del POI seleccionado.
 * Se extrae a un componente propio porque useOpeningStatus() es un hook: no
 * puede llamarse dentro de la IIFE que antes vivia inline en el JSX.
 */
function OpeningBadgePill({ horario }: { horario: unknown }) {
  const status = useOpeningStatus(horario as Parameters<typeof useOpeningStatus>[0]);
  if (status?.isOpen == null) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${
        status.isOpen
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
      {status.label}
    </span>
  );
}

/** Badge "Abierto/Cerrado" en la esquina de la tarjeta del listado. */
function OpeningBadgeCorner({ horario }: { horario: unknown }) {
  const status = useOpeningStatus(horario as Parameters<typeof useOpeningStatus>[0]);
  if (status?.isOpen == null) return null;
  return (
    <div className="absolute top-2 right-2 z-10">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-extrabold backdrop-blur-sm shadow-sm ${
          status.isOpen ? 'bg-green-600/90 text-white' : 'bg-red-600/90 text-white'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        {status.label}
      </span>
    </div>
  );
}

export default function MapaClient({ initialPois, initialTourRoutes }: MapaClientProps) {
  const { showToast } = useToast();
  const [pois] = useState<POI[]>(initialPois);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tourRoutes] = useState<TourRoute[]>(initialTourRoutes);
  const [activeRoute, setActiveRoute] = useState<TourRoute | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [resetCenterTrigger, setResetCenterTrigger] = useState<number>(0);

  // Filter POIs by category
  const filteredPois = useMemo(() => {
    if (activeRoute) {
      return pois.filter((p) => activeRoute.poiIds.includes(p.id));
    }
    if (activeCategory === 'todos') {
      return pois;
    }
    return pois.filter((p) => p.categoria === activeCategory);
  }, [pois, activeCategory, activeRoute]);

  // Search results for autocomplete
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return pois.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        (p.descripcionCorta && p.descripcionCorta.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [pois, searchQuery]);

  // POIs sorted by GPS distance if coordinates available
  const sortedPois = useMemo(() => {
    if (!userCoords) return filteredPois;
    return sortByDistance(filteredPois, userCoords);
  }, [filteredPois, userCoords]);

  const handleFilter = (cat: string) => {
    setActiveCategory(cat);
    setActiveRoute(null);
  };

  const handleRouteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const routeId = e.target.value;
    if (!routeId) {
      setActiveRoute(null);
      return;
    }
    const route = tourRoutes.find((r) => r.id === routeId) || null;
    setActiveRoute(route);
    setActiveCategory('rutas');
    if (route) {
      showToast(`Ruta activa: ${route.nombre}`, 'info');
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      showToast('Navegador sin soporte de GPS', 'error');
      return;
    }
    showToast('Obteniendo tu ubicación GPS en Cumpeo...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        showToast('Posición GPS actualizada con éxito', 'success');
      },
      (err) => {
        showToast(`Error GPS: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCenterCumpeo = () => {
    setSelectedPoi(null);
    setResetCenterTrigger((prev) => prev + 1);
    showToast('Mapa centrado en Cumpeo', 'info');
  };

  const handleSelectPoi = (poi: POI | null) => {
    setSelectedPoi(poi);
    if (poi) {
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };

  const handleSharePoi = (poi: POI) => {
    const slug = (poi._original as any)?.slug || poi.id;
    const url = typeof window !== 'undefined' ? `${window.location.origin}/destino/${slug}` : '';
    const shareText = `¡Mira este lugar en Cumpeo, el pueblo de Condorito! ${poi.nombre}: ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filterChips: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'todos',       label: 'Todos',       icon: <MapIcon size={14} /> },
    { id: 'cultural',   label: 'Cultural',    icon: <Palette size={14} /> },
    { id: 'historico',  label: 'Histórico',   icon: <Landmark size={14} /> },
    { id: 'naturaleza', label: 'Naturaleza',  icon: <Leaf size={14} /> },
    { id: 'gastronomia',label: 'Gastronomía', icon: <UtensilsCrossed size={14} /> },
    { id: 'alojamiento',label: 'Alojamiento', icon: <BedDouble size={14} /> },
    { id: 'patrimonio', label: 'Patrimonio',  icon: <Award size={14} /> },
  ];

  // Distances & travel times calculation for selected POI
  const distanceInfo = useMemo(() => {
    if (!userCoords || !selectedPoi?.coordenadas) return null;
    const km = calcDistanceKm(userCoords, selectedPoi.coordenadas);
    const walkMin = Math.max(1, Math.round((km / 4.5) * 60));
    const carMin = Math.max(1, Math.round((km / 35) * 60));
    return {
      formatted: formatDistance(km),
      walkMin,
      carMin,
    };
  }, [userCoords, selectedPoi]);

  return (
    <div className="relative w-full overflow-hidden bg-[#F4F3EF]" style={{ height: 'calc(100vh - 68px)' }}>
      {/* ── Top Floating Control Panel ─────── */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 py-2 flex flex-col gap-2">
          {/* Row 1: Search + View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                className="w-full pl-9 pr-4 py-2 rounded-full border border-border bg-surface-soft text-sm text-text-primary placeholder:text-text-muted focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none transition-all"
                placeholder="Buscar destino, restaurante o monumento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />

              {/* Autocomplete Dropdown */}
              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-border rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-border">
                  {searchResults.map((poi) => (
                    <button
                      key={poi.id}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-surface-soft transition-colors"
                      onClick={() => {
                        handleSelectPoi(poi);
                        setViewMode('map');
                      }}
                    >
                      <div>
                        <div className="text-sm font-bold text-text-primary">{poi.nombre}</div>
                        <div className="text-xs text-text-muted capitalize">{poi.categoria}</div>
                      </div>
                      <MapPin size={15} className="text-rojo shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Mode Toggle (Map / List) */}
            <div className="flex bg-surface-soft p-1 rounded-full border border-border shrink-0">
              <button
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  viewMode === 'map' ? 'bg-rojo text-white shadow-sm' : 'text-text-secondary hover:text-rojo'
                }`}
                onClick={() => setViewMode('map')}
                title="Vista Mapa"
              >
                <MapIcon size={13} />
                <span className="hidden sm:inline">Mapa</span>
              </button>
              <button
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  viewMode === 'list' ? 'bg-rojo text-white shadow-sm' : 'text-text-secondary hover:text-rojo'
                }`}
                onClick={() => setViewMode('list')}
                title="Vista Lista"
              >
                <List size={13} />
                <span className="hidden sm:inline">Lista ({filteredPois.length})</span>
              </button>
            </div>
          </div>

          {/* Row 2: Category Chips & Routes */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
              {filterChips.map((chip) => (
                <button
                  key={chip.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all border shrink-0 ${
                    activeCategory === chip.id
                      ? 'bg-rojo text-white border-rojo shadow-sm'
                      : 'bg-white text-text-secondary border-border hover:border-rojo hover:text-rojo hover:bg-[#FFF0F1]'
                  }`}
                  onClick={() => handleFilter(chip.id)}
                >
                  {chip.icon} {chip.label}
                </button>
              ))}
            </div>

            {/* Route Selector Dropdown */}
            {tourRoutes.length > 0 && (
              <div className="shrink-0">
                <select
                  className="px-3 py-1 rounded-full border border-border text-xs font-bold bg-white text-text-secondary outline-none focus:border-rojo cursor-pointer"
                  value={activeRoute?.id || ''}
                  onChange={handleRouteSelect}
                >
                  <option value="">Rutas Turísticas...</option>
                  {tourRoutes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} ({r.poiIds.length} paradas)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Active Route Banner */}
        {activeRoute && (
          <div className="bg-[#FFE0E2] border-t border-[#FFA8AE] px-4 py-2 flex items-center justify-between text-xs font-bold text-[#C1121F]">
            <div className="flex items-center gap-2">
              <Compass size={14} className="animate-spin-slow" />
              <span>
                Ruta Guiada: <strong>{activeRoute.nombre}</strong> - {activeRoute.poiIds.length} puntos temáticos
              </span>
            </div>
            <button
              onClick={() => setActiveRoute(null)}
              className="text-[#C1121F] hover:underline flex items-center gap-1"
            >
              <X size={13} /> Salir de la ruta
            </button>
          </div>
        )}
      </div>

      {/* ── Main View Area: Map or List ─────── */}
      {viewMode === 'map' ? (
        <>
          <MapComponent
            pois={activeRoute ? pois : filteredPois}
            selectedPoi={selectedPoi}
            onSelectPoi={handleSelectPoi}
            userCoords={userCoords}
            activeRoute={activeRoute}
            resetCenterTrigger={resetCenterTrigger}
            onGPSClick={handleGPS}
            onCenterCumpeoClick={handleCenterCumpeo}
          />

          {/* ── Enriched Selected POI Card (Placed safely above mobile nav) ─────── */}
          {selectedPoi && (
            <div className="absolute bottom-[76px] md:bottom-5 left-4 right-4 max-w-[500px] mx-auto z-30 bg-white border border-border rounded-2xl p-4 shadow-2xl animate-fade-in">
              {/* Header */}
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wider whitespace-nowrap bg-[#FFE0E2] text-[#C1121F] border border-[#FFA8AE]">
                    {selectedPoi.categoria}
                  </span>
                  <OpeningBadgePill horario={(selectedPoi._original as any)?.horario} />
                </div>
                <button
                  onClick={() => setSelectedPoi(null)}
                  className="text-text-muted hover:text-rojo p-1 rounded-lg transition-colors"
                  aria-label="Cerrar panel"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex gap-3 items-start mb-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-soft border border-border shrink-0">
                  <img
                    src={formatImgUrl(selectedPoi.imagenPrincipal)}
                    alt={selectedPoi.nombre}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-base text-text-primary truncate">
                    {selectedPoi.nombre}
                  </h3>
                  <p className="text-xs text-text-secondary line-clamp-2 mt-0.5 leading-relaxed">
                    {selectedPoi.descripcionCorta || 'Punto de interés turístico en Cumpeo.'}
                  </p>

                  {/* Real-time GPS distance badges */}
                  {distanceInfo && (
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold text-rojo">
                      <span className="flex items-center gap-1 bg-[#FFF0F1] px-2 py-0.5 rounded-full border border-[#FFCCD0]">
                        <MapPin size={10} /> {distanceInfo.formatted}
                      </span>
                      <span className="flex items-center gap-1 text-text-muted">
                        <Footprints size={11} /> ~{distanceInfo.walkMin} min
                      </span>
                      <span className="flex items-center gap-1 text-text-muted">
                        <Car size={11} /> ~{distanceInfo.carMin} min
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <div className="flex gap-2">
                  {selectedPoi.tipo === 'destino' && (
                    <Link
                      href={`/destino/${(selectedPoi._original as any)?.slug || selectedPoi.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-rojo text-white hover:bg-rojo-dark transition-all no-underline shadow-sm"
                    >
                      <ExternalLink size={13} /> Ver Ficha
                    </Link>
                  )}

                  {/* WhatsApp Direct Share */}
                  <button
                    onClick={() => handleSharePoi(selectedPoi)}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all"
                    title="Compartir por WhatsApp"
                  >
                    <Share2 size={13} /> Compartir
                  </button>

                  {/* Direct Phone Call if available */}
                  {(selectedPoi._original as any)?.contacto?.telefono && (
                    <a
                      href={`tel:${(selectedPoi._original as any).contacto.telefono}`}
                      className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold bg-surface-soft border border-border text-text-primary hover:border-rojo transition-all no-underline"
                      title="Llamar al local"
                    >
                      <Phone size={13} /> Llamar
                    </a>
                  )}
                </div>

                {/* Navigation Links: Google Maps & Waze */}
                <div className="flex gap-2">
                  <a
                    href={
                      userCoords
                        ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${selectedPoi.coordenadas.lat},${selectedPoi.coordenadas.lng}&travelmode=driving`
                        : `https://www.google.com/maps/dir/?api=1&destination=${selectedPoi.coordenadas.lat},${selectedPoi.coordenadas.lng}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-white text-text-primary border border-border hover:border-rojo hover:text-rojo transition-all no-underline"
                  >
                    <Navigation size={13} className="text-rojo" /> Google Maps
                  </a>
                  <a
                    href={`https://waze.com/ul?ll=${selectedPoi.coordenadas.lat},${selectedPoi.coordenadas.lng}&navigate=yes`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-cielo bg-white border border-border hover:border-cielo hover:bg-[#E0F2FE]/40 transition-all no-underline"
                  >
                    <MapPin size={13} className="text-cielo" /> Waze
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ── List View (sorted by distance if GPS active) ─────── */
        <div className="h-full overflow-y-auto pt-24 pb-16 px-4 max-w-[1000px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-text-primary flex items-center gap-2">
              Lugares en Cumpeo
              <span className="text-xs font-normal text-text-muted">({sortedPois.length} encontrados)</span>
            </h2>
            {userCoords ? (
              <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> Ordenados por cercanía GPS
              </span>
            ) : (
              <button
                onClick={handleGPS}
                className="text-xs font-bold text-rojo hover:underline flex items-center gap-1"
              >
                <Crosshair size={12} /> Ordenar por mi ubicación
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sortedPois.map((poi) => {
              const km = userCoords && poi.coordenadas ? calcDistanceKm(userCoords, poi.coordenadas) : null;
              return (
                <article
                  key={poi.id}
                  className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:border-rojo hover:shadow-md transition-all flex flex-col cursor-pointer"
                  onClick={() => {
                    handleSelectPoi(poi);
                    setViewMode('map');
                  }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-soft">
                    <img
                      src={formatImgUrl(poi.imagenPrincipal)}
                      alt={poi.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                      }}
                    />
                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6rem] font-extrabold uppercase tracking-wider bg-white/90 text-text-primary backdrop-blur-sm border border-border">
                        {poi.categoria}
                      </span>
                    </div>
                    <OpeningBadgeCorner horario={(poi._original as any)?.horario} />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base text-text-primary mb-1">
                        {poi.nombre}
                      </h3>
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-3">
                        {poi.descripcionCorta}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                      {km !== null ? (
                        <span className="font-bold text-rojo flex items-center gap-1">
                          <MapPin size={12} /> {formatDistance(km)}
                        </span>
                      ) : (
                        <span className="text-text-muted">Cumpeo</span>
                      )}
                      <span className="text-rojo font-bold flex items-center gap-1">
                        <span>Ver en Mapa</span>
                        <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
