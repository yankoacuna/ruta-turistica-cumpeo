'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MapComponent from '@/components/MapComponent';
import { getAllPOIs } from '@/lib/data';
import { POI } from '@/lib/types';
import { useToast } from '@/components/Toast';

export default function MapaPage() {
  const { showToast } = useToast();
  const [pois, setPois] = useState<POI[]>([]);
  const [filteredPois, setFilteredPois] = useState<POI[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    async function loadPOIs() {
      try {
        const data = await getAllPOIs();
        setPois(data);
        setFilteredPois(data);
      } catch (err) {
        console.error('Error cargando POIs:', err);
      }
    }
    loadPOIs();
  }, []);

  const handleFilter = (cat: string) => {
    setActiveCategory(cat);
    if (cat === 'todos') {
      setFilteredPois(pois);
    } else {
      setFilteredPois(pois.filter((p) => p.categoria === cat));
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      showToast('Navegador sin soporte de GPS', 'error');
      return;
    }
    showToast('📡 Obteniendo tu ubicación actual...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        showToast('📍 Posición GPS actualizada', 'success');
      },
      (err) => {
        showToast('Error GPS: ' + err.message, 'error');
      }
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
      {/* ── Filter Chips ─────── */}
      <div className="map-filters">
        <div className="map-filters-scroll">
          {[
            { id: 'todos', label: 'Todos', emoji: '🗺️' },
            { id: 'cultural', label: 'Cultural', emoji: '🎨' },
            { id: 'historico', label: 'Histórico', emoji: '🏛️' },
            { id: 'naturaleza', label: 'Naturaleza', emoji: '🌿' },
            { id: 'gastronomia', label: 'Gastronomía', emoji: '🍽️' },
            { id: 'alojamiento', label: 'Alojamiento', emoji: '🛏️' },
            { id: 'patrimonio', label: 'Patrimonio', emoji: '🏺' },
          ].map((chip) => (
            <button
              key={chip.id}
              className={`chip ${activeCategory === chip.id ? 'active' : ''}`}
              onClick={() => handleFilter(chip.id)}
            >
              <span>{chip.emoji}</span> {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Leaflet Map ─────── */}
      <MapComponent
        pois={filteredPois}
        selectedPoi={selectedPoi}
        onSelectPoi={setSelectedPoi}
        userCoords={userCoords}
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
      >
        🎯
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
              style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}
            >
              &times;
            </button>
          </div>

          <h3 className="h3 mt-2 mb-1">{selectedPoi.nombre}</h3>
          <p className="text-sm text-muted mb-3">{selectedPoi.descripcionCorta}</p>

          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedPoi.tipo === 'destino' && (selectedPoi._original as any)?.slug ? (
              <Link href={`/destino/${(selectedPoi._original as any).slug}`} className="btn btn-primary btn-sm flex-1" style={{ textAlign: 'center' }}>
                Ver Ficha Completa →
              </Link>
            ) : (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPoi.coordenadas.lat},${selectedPoi.coordenadas.lng}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm flex-1"
                style={{ textAlign: 'center' }}
              >
                📍 Cómo Llegar (Google Maps)
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
