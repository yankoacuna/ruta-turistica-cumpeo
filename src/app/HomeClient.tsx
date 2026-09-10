'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { UtensilsCrossed, BedDouble, Camera } from 'lucide-react';
import {
  Destination,
  Accommodation,
  Restaurant,
  AppConfig,
  EmergencyContact,
  CumpeoEvent,
} from '@/lib/types';
import { useToast } from '@/components/Toast';
import { useNearbyDestinations } from '@/hooks/useNearbyDestinations';

// Componentes modulares de la portada
import { HeroSection } from '@/components/home/HeroSection';
import { QuickActions } from '@/components/home/QuickActions';
import { NearbySection } from '@/components/home/NearbySection';
import { RutaShowcase } from '@/components/home/RutaShowcase';
import { FeaturedSection } from '@/components/home/FeaturedSection';
import { CatalogSection } from '@/components/home/CatalogSection';
import { EventsSection } from '@/components/home/EventsSection';
import { MunicipalBanner } from '@/components/home/MunicipalBanner';
import { EmergencyModal } from '@/components/home/EmergencyModal';
import {
  destinationToCard,
  restaurantToCard,
  accommodationToCard,
} from '@/components/home/adapters';

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
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const categories = initialConfig.categorias || [];

  const notify = useCallback(
    (msg: string, type: 'info' | 'success' | 'error') => showToast(msg, type),
    [showToast]
  );

  const { nearbyList, isLocating, hasGPS, locate } = useNearbyDestinations({
    destinations: initialDestinations,
    onMessage: notify,
  });

  const restaurantCards = useMemo(
    () => initialRestaurants.map(restaurantToCard),
    [initialRestaurants]
  );
  const lodgingCards = useMemo(
    () => initialAccommodations.map(accommodationToCard),
    [initialAccommodations]
  );
  const destinationCards = useMemo(
    () => initialDestinations.map(destinationToCard),
    [initialDestinations]
  );

  const openEmergencyModal = useCallback(() => setShowEmergencyModal(true), []);

  return (
    <div className="w-full bg-bg">
      {/* 1. Hero compacto: identidad + buscador. Nada mas compite por la pantalla. */}
      <HeroSection destinations={initialDestinations} />

      {/* 2. Accesos directos superpuestos al borde del hero */}
      <QuickActions
        onGPSClick={locate}
        isLocating={isLocating}
        onOpenEmergencyModal={openEmergencyModal}
      />

      {/* 3. Resultados GPS (solo tras pedir ubicacion) */}
      {hasGPS && <NearbySection nearbyList={nearbyList} onRefresh={locate} />}

      {/* 4. Bloque de acento: el producto estrella de la comuna */}
      <RutaShowcase />

      {/* 5. Destacados en carrusel */}
      <FeaturedSection featured={initialFeatured} />

      {/* 6-8. Catastro comunal, acotado: 3 tarjetas + "ver mas" en cada bloque */}
      <CatalogSection
        id="section-comer"
        tone="soft"
        eyebrow="Gastronomia Local"
        icon={UtensilsCrossed}
        title="Donde Comer"
        subtitle="Restaurantes criollos y picadas registradas en el catastro comunal."
        items={restaurantCards}
        initialCount={3}
        cols={3}
        nounPlural="locales"
      />

      <CatalogSection
        id="section-dormir"
        tone="base"
        eyebrow="Hospedaje"
        icon={BedDouble}
        title="Donde Dormir"
        subtitle="Cabañas y hospedajes campesinos para quedarse mas de un dia."
        items={lodgingCards}
        initialCount={3}
        cols={3}
        nounPlural="alojamientos"
      />

      <CatalogSection
        id="section-destinos"
        tone="soft"
        eyebrow="Explorar por Categoria"
        icon={Camera}
        title="Todos los Destinos"
        subtitle="Filtra el catastro turistico completo de la comuna."
        items={destinationCards}
        filters={categories}
        initialCount={6}
        cols={3}
        action={{ href: '/mapa', label: 'Abrir mapa GPS' }}
        nounPlural="destinos"
      />

      {/* 9. Calendario tradicional */}
      <EventsSection events={initialEvents} />

      {/* 10. Cierre institucional */}
      <MunicipalBanner onOpenEmergencyModal={openEmergencyModal} />

      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        config={initialConfig}
        emergencyContacts={initialEmergency}
      />
    </div>
  );
}
