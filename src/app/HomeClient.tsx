'use client';

import React, { useState } from 'react';
import { Destination, Accommodation, Restaurant, AppConfig, EmergencyContact, CumpeoEvent } from '@/lib/types';
import { sortByDistance } from '@/lib/data';
import { useToast } from '@/components/Toast';

// Componentes modulares de la portada
import { HeroSection } from '@/components/home/HeroSection';
import { NearbySection } from '@/components/home/NearbySection';
import { RutaShowcase } from '@/components/home/RutaShowcase';
import { FeaturedSection } from '@/components/home/FeaturedSection';
import { EventsSection } from '@/components/home/EventsSection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { EmergencyModal } from '@/components/home/EmergencyModal';

interface HomeClientProps {
  initialConfig: AppConfig;
  initialDestinations: Destination[];
  initialFeatured: Destination[];
  initialAccommodations: Accommodation[];
  initialRestaurants: Restaurant[];
  initialEmergency?: EmergencyContact[];
  initialEvents?: CumpeoEvent[];
}

export default function HomeClient({
  initialConfig,
  initialDestinations,
  initialFeatured,
  initialAccommodations,
  initialRestaurants,
  initialEmergency = [],
  initialEvents = [],
}: HomeClientProps) {
  const { showToast } = useToast();

  // Estados de datos iniciales
  const [config] = useState<AppConfig | null>(initialConfig);
  const [categories] = useState<any[]>(initialConfig.categorias || []);
  const [destinations] = useState<Destination[]>(initialDestinations);
  const [featured] = useState<Destination[]>(initialFeatured);
  const [accommodations] = useState<Accommodation[]>(initialAccommodations);
  const [restaurants] = useState<Restaurant[]>(initialRestaurants);
  const [emergencyContacts] = useState<EmergencyContact[]>(initialEmergency);
  const [events] = useState<CumpeoEvent[]>(initialEvents);

  // Estados de geolocalización GPS
  const [, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyList, setNearbyList] = useState<Destination[]>([]);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [hasGPS, setHasGPS] = useState<boolean>(false);

  // Estados de modales
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      showToast('Tu navegador no soporta geolocalización GPS', 'error');
      return;
    }
    setIsLocating(true);
    showToast('Obteniendo tu posición GPS...', 'info');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setIsLocating(false);
        setHasGPS(true);

        const pois = destinations.map((d) => ({
          ...d,
          tipo: 'destino' as const,
          descripcionCorta: d.descripcionCorta,
        }));
        const sorted = sortByDistance(pois as any, coords);
        setNearbyList(sorted.slice(0, 6) as any);
        showToast('Destinos cercanos calculados exitosamente', 'success');
        setTimeout(() => {
          document.getElementById('section-nearby')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
      (err) => {
        setIsLocating(false);
        showToast('No se pudo obtener el GPS: ' + err.message, 'error');
      }
    );
  };

  return (
    <div className="w-full pb-16 bg-[#F8F7F4]">
      {/* 1. Hero con buscador inteligente y accesos directos */}
      <HeroSection
        destinations={destinations}
        onGPSClick={handleGPSLocation}
        isLocating={isLocating}
      />

      {/* 2. Sección condicional por detección GPS */}
      {hasGPS && (
        <NearbySection
          nearbyList={nearbyList}
          onRefresh={handleGPSLocation}
        />
      )}

      {/* 3. Showcase editorial: La Ruta Oficial de Condorito y mosaico fotográfico */}
      <RutaShowcase />

      {/* 4. Galería patrimonial: Atractivos destacados */}
      <FeaturedSection featured={featured} />

      {/* 5. Calendario tradicional: Eventos y festividades costumbristas */}
      <EventsSection events={events} />

      {/* 6. Catastro comunal por pestañas (Gastronomía, Alojamientos, Destinos) + Banner */}
      <ServicesSection
        restaurants={restaurants}
        accommodations={accommodations}
        destinations={destinations}
        categories={categories}
        onOpenEmergencyModal={() => setShowEmergencyModal(true)}
      />

      {/* 7. Modal de Asistencia y Contacto Municipal */}
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        config={config}
        emergencyContacts={emergencyContacts}
      />
    </div>
  );
}
