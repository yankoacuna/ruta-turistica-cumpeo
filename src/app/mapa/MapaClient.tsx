'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MapComponent from '@/components/MapComponent';
// import removed here
import { POI, TourRoute } from '@/lib/types';
import { useToast } from '@/components/Toast';
import { Crosshair, Map, Palette, Landmark, Leaf, UtensilsCrossed, BedDouble, Award, Navigation, MapPin, X, ExternalLink } from 'lucide-react';

interface MapaClientProps {
  initialPois: POI[];
  initialTourRoutes: TourRoute[];
}

export default function MapaClient({ initialPois, initialTourRoutes }: MapaClientProps) {
  const { showToast } = useToast();
  const [pois, setPois] = useState<POI[]>(initialPois);
  const [filteredPois, setFilteredPois] = useState<POI[]>(initialPois);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tourRoutes, setTourRoutes] = useState<TourRoute[]>(initialTourRoutes);
  const [activeRoute, setActiveRoute] = useState<TourRoute | null>(null);

  // useEffect for loadPOIs removed since data comes from props

  const handleFilter = (cat: string) => {
    setActiveCategory(cat);
    setActiveRoute(null);
    if (cat === 'todos') {
      setFilteredPois(pois);
    } else {
      setFilteredPois(pois.filter((p) => p.categoria === cat));
    }
  };

  const handleRouteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const routeId = e.target.value;
    if (!routeId) {
      setActiveRoute(null);
      setFilteredPois(pois);
      return;
    }
    const route = tourRoutes.find(r => r.id === routeId) || null;
    setActiveRoute(route);
    setActiveCategory('rutas');
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      showToast('Navegador sin soporte de GPS', 'error');
      return;
    }
    showToast('Obteniendo tu ubicación actual...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        showToast('Posición GPS actualizada', 'success');
      },
      (err) => {
        showToast('Error GPS: ' + err.message, 'error');
      }
    );
  };

  const filterChips: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'todos',       label: 'Todos',       icon: <Map size={15} /> },
    { id: 'cultural',   label: 'Cultural',    icon: <Palette size={15} /> },
    { id: 'historico',  label: 'Histórico',   icon: <Landmark size={15} /> },
    { id: 'naturaleza', label: 'Naturaleza',  icon: <Leaf size={15} /> },
    { id: 'gastronomia',label: 'Gastronomía', icon: <UtensilsCrossed size={15} /> },
    { id: 'alojamiento',label: 'Alojamiento', icon: <BedDouble size={15} /> },
    { id: 'patrimonio', label: 'Patrimonio',  icon: <Award size={15} /> },
  ];

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 'calc(100vh - 70px)' }}>

      {/* ── Filter Chips ─────── */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all border shrink-0 ${
                activeCategory === chip.id
                  ? 'bg-rojo text-white border-rojo shadow-rojo'
                  : 'bg-white text-text-secondary border-border hover:border-rojo hover:text-rojo hover:bg-[#FFF0F1]'
              }`}
              onClick={() => handleFilter(chip.id)}
            >
              {chip.icon} {chip.label}
            </button>
          ))}
        </div>

        {/* Route Selector */}
        {tourRoutes.length > 0 && (
          <div className="px-4 pb-2">
            <select
              className="w-full px-3 py-2 rounded-full border-2 border-border font-bold text-sm bg-white text-text-primary outline-none focus:border-rojo transition-colors"
              value={activeRoute?.id || ''}
              onChange={handleRouteSelect}
            >
              <option value="">Explorar libremente (Sin Ruta)</option>
              {tourRoutes.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Leaflet/Google Map ─────── */}
      <MapComponent
        pois={activeRoute ? pois : filteredPois}
        selectedPoi={selectedPoi}
        onSelectPoi={setSelectedPoi}
        userCoords={userCoords}
        activeRoute={activeRoute}
      />

      {/* ── GPS Floating Button ─────── */}
      <button
        onClick={handleGPS}
        className={`absolute right-5 z-10 bg-sol text-text-primary border-2 border-[#1E1E24] rounded-full w-[52px] h-[52px] flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all ${selectedPoi ? 'bottom-[180px]' : 'bottom-[90px]'}`}
        title="Mi posición GPS"
        aria-label="Activar GPS"
      >
        <Crosshair size={22} />
      </button>

      {/* ── Selected POI Panel ─────── */}
      {selectedPoi && (
        <div className="absolute bottom-[80px] left-4 right-4 max-w-[480px] mx-auto z-20 bg-white border-2 border-border rounded-[22px] p-4 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider whitespace-nowrap border bg-[#FFE0E2] text-[#C1121F] border-[#FFA8AE]">
              {selectedPoi.categoria}
            </span>
            <button
              onClick={() => setSelectedPoi(null)}
              className="bg-transparent border-none cursor-pointer text-text-muted hover:text-rojo transition-colors"
              aria-label="Cerrar panel"
            >
              <X size={20} />
            </button>
          </div>

          <h3 className="font-display font-bold text-[1.3rem] text-text-primary mt-2 mb-1">{selectedPoi.nombre}</h3>
          <p className="text-sm text-text-muted mb-3">{selectedPoi.descripcionCorta}</p>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {selectedPoi.tipo === 'destino' && (selectedPoi._original as { slug?: string })?.slug && (
                <Link
                  href={`/destino/${(selectedPoi._original as { slug?: string }).slug}`}
                  className="inline-flex items-center justify-center gap-1.5 flex-1 py-2 px-4 rounded-full text-xs font-bold bg-rojo text-white hover:bg-rojo-dark shadow-rojo transition-all no-underline"
                >
                  <ExternalLink size={14} /> Ver Ficha Completa
                </Link>
              )}
            </div>

            <div className="flex gap-2">
              <a
                href={
                  userCoords
                    ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${selectedPoi.coordenadas.lat},${selectedPoi.coordenadas.lng}&travelmode=driving`
                    : `https://www.google.com/maps/dir/?api=1&destination=${selectedPoi.coordenadas.lat},${selectedPoi.coordenadas.lng}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 flex-1 py-2 px-4 rounded-full text-xs font-bold bg-white text-text-primary border-2 border-border hover:border-rojo hover:text-rojo transition-all no-underline"
                title={userCoords ? 'Ruta desde tu posición GPS' : 'Abrir en Google Maps'}
              >
                <Navigation size={14} /> Google Maps
              </a>
              <a
                href={`https://waze.com/ul?ll=${selectedPoi.coordenadas.lat},${selectedPoi.coordenadas.lng}&navigate=yes`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 flex-1 py-2 px-4 rounded-full text-xs font-bold text-cielo border-2 border-cielo hover:bg-[#E0F2FE] transition-all no-underline"
              >
                <MapPin size={14} /> Waze
              </a>
            </div>
            {userCoords && (
              <p className="text-[0.72rem] text-text-muted text-center m-0">
                Ruta calculada desde tu posición GPS actual
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
