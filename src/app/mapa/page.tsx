'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MapComponent from '@/components/MapComponent';
import { getAllPOIs, getTourRoutes } from '@/lib/data';
import { POI, TourRoute } from '@/lib/types';
import { useToast } from '@/components/Toast';
import { Crosshair, Map, Palette, Landmark, Leaf, UtensilsCrossed, BedDouble, Award, Navigation, MapPin, X, ExternalLink } from 'lucide-react';

export default function MapaPage() {
  const { showToast } = useToast();
  const [pois, setPois] = useState<POI[]>([]);
  const [filteredPois, setFilteredPois] = useState<POI[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tourRoutes, setTourRoutes] = useState<TourRoute[]>([]);
  const [activeRoute, setActiveRoute] = useState<TourRoute | null>(null);

  useEffect(() => {
    async function loadPOIs() {
      try {
        const [data, routesData] = await Promise.all([getAllPOIs(), getTourRoutes()]);
        setPois(data);
        setFilteredPois(data);
        setTourRoutes(routesData);
      } catch (err) {
        console.error('Error cargando POIs:', err);
      }
    }
    loadPOIs();
  }, []);

  const handleFilter = (cat: string) => {
    setActiveCategory(cat);
    setActiveRoute(null); // Clear active route when filtering categories
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
      setFilteredPois(pois); // Reset
      return;
    }
    const route = tourRoutes.find(r => r.id === routeId) || null;
    setActiveRoute(route);
    setActiveCategory('rutas'); // Set a custom category state
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
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
      {/* ── Filter Chips ─────── */}
      <div className="map-filters">
        <div className="map-filters-scroll">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              className={`chip ${activeCategory === chip.id ? 'active' : ''}`}
              onClick={() => handleFilter(chip.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              {chip.icon} {chip.label}
            </button>
          ))}
        </div>
        
        {/* Route Selector */}
        {tourRoutes.length > 0 && (
          <div style={{ padding: '8px 16px' }}>
            <select 
              className="input" 
              style={{ padding: '8px', width: '100%', borderRadius: '20px', border: '2px solid var(--color-border)', fontWeight: 'bold' }}
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
        style={{
          position: 'absolute',
          bottom: selectedPoi ? '180px' : '90px',
          right: '20px',
          zIndex: 10,
          background: 'var(--color-sol)',
          color: 'var(--color-text-primary)',
          border: '2px solid #1E1E24',
          borderRadius: '50%',
          width: '52px',
          height: '52px',
          fontSize: '1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="Mi posición GPS"
        aria-label="Activar GPS"
      >
        <Crosshair size={22} />
      </button>

      {/* ── Selected POI Drawer Panel ─────── */}
      {selectedPoi && (
        <div
          className="poi-mini-panel active"
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '16px',
            right: '16px',
            maxWidth: '480px',
            margin: '0 auto',
            zIndex: 20,
            background: 'var(--color-surface)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="badge badge-rojo">{selectedPoi.categoria}</span>
            <button
              onClick={() => setSelectedPoi(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              aria-label="Cerrar panel"
            >
              <X size={20} />
            </button>
          </div>

          <h3 className="h3 mt-2 mb-1">{selectedPoi.nombre}</h3>
          <p className="text-sm text-muted mb-3">{selectedPoi.descripcionCorta}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Row 1: ver ficha (destinos) or navigation buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {selectedPoi.tipo === 'destino' && (selectedPoi._original as { slug?: string })?.slug && (
                <Link
                  href={`/destino/${(selectedPoi._original as { slug?: string }).slug}`}
                  className="btn btn-primary btn-sm flex-1"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}
                >
                  <ExternalLink size={14} /> Ver Ficha Completa
                </Link>
              )}
            </div>

            {/* Row 2: Navigation options — always shown */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={
                  userCoords
                    ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${selectedPoi.coordenadas.lat},${selectedPoi.coordenadas.lng}&travelmode=driving`
                    : `https://www.google.com/maps/dir/?api=1&destination=${selectedPoi.coordenadas.lat},${selectedPoi.coordenadas.lng}`
                }
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm flex-1"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}
                title={userCoords ? 'Ruta desde tu posición GPS' : 'Abrir en Google Maps'}
              >
                <Navigation size={14} /> Google Maps
              </a>
              <a
                href={`https://waze.com/ul?ll=${selectedPoi.coordenadas.lat},${selectedPoi.coordenadas.lng}&navigate=yes`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm flex-1"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center', borderColor: 'var(--color-cielo)', color: 'var(--color-cielo)' }}
              >
                <MapPin size={14} /> Waze
              </a>
            </div>
            {userCoords && (
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 }}>
                Ruta calculada desde tu posición GPS actual
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
