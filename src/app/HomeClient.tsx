'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Destination,
  Accommodation,
  Restaurant,
  AppConfig,
  EmergencyContact,
  CumpeoEvent,
  TourRoute,
} from '@/lib/types';
import { useToast } from '@/components/Toast';
import { Editable } from '@/components/site-text';
import { useNearbyDestinations } from '@/hooks/useNearbyDestinations';

// Componentes modulares de la portada
import { HeroSection } from '@/components/home/HeroSection';
import { QuickActions } from '@/components/home/QuickActions';
import { NearbySection } from '@/components/home/NearbySection';
import { RutaShowcase } from '@/components/home/RutaShowcase';
import { FeaturedSection } from '@/components/home/FeaturedSection';
import { ServicesSection } from '@/components/home/ServicesSection';
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
  initialRoutes?: TourRoute[];
}

export default function HomeClient({
  initialConfig,
  initialDestinations,
  initialFeatured,
  initialAccommodations,
  initialRestaurants,
  initialEmergency = [],
  initialEvents = [],
  initialRoutes = [],
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

  // Ruta a mostrar en el bloque de acento: la marcada como destacada, o la primera.
  const featuredRoute = useMemo(
    () => initialRoutes.find((r) => r.destacada) || initialRoutes[0] || null,
    [initialRoutes]
  );

  // Resuelve los poiIds de la ruta, en su orden, para listar las paradas por
  // nombre. Igual que /ruta, se busca contra los tres catastros: una parada
  // puede ser un destino, un restaurante o un alojamiento. Solo los destinos
  // tienen ficha propia (/destino/[slug]), asi que el resto va sin enlace.
  const routeStops = useMemo(() => {
    if (!featuredRoute?.poiIds?.length) return [];
    const byId = new Map<string, { nombre: string; href?: string }>();
    initialDestinations.forEach((d) => byId.set(d.id, { nombre: d.nombre, href: `/destino/${d.slug}` }));
    initialRestaurants.forEach((r) => byId.set(r.id, { nombre: r.nombre }));
    initialAccommodations.forEach((a) => byId.set(a.id, { nombre: a.nombre }));

    return featuredRoute.poiIds.flatMap((id) => {
      const poi = byId.get(id);
      return poi ? [{ id, nombre: poi.nombre, href: poi.href }] : [];
    });
  }, [featuredRoute, initialDestinations, initialRestaurants, initialAccommodations]);

  const openEmergencyModal = useCallback(() => setShowEmergencyModal(true), []);

  return (
    <div className="w-full bg-bg">
      {/* 1. Hero: identidad + una sola accion primaria (la Ruta). */}
      <HeroSection destinations={initialDestinations} />

      {/* 2. Orientacion para quien llega escaneando un QR en la calle. */}
      <QuickActions
        onGPSClick={locate}
        isLocating={isLocating}
        onOpenEmergencyModal={openEmergencyModal}
      />

      {/* 3. Respuesta del GPS, pegada al boton que la dispara. */}
      {hasGPS && <NearbySection nearbyList={nearbyList} onRefresh={locate} />}

      {/* 4. La Ruta: el producto del proyecto, con datos reales del catastro.
             Subio de la posicion 4 a ser el primer bloque de contenido. */}
      <RutaShowcase route={featuredRoute} stops={routeStops} />

      {/* 5. Destacados en composicion editorial (1 grande + filas). */}
      <FeaturedSection featured={initialFeatured} />

      {/* 6. Servicios: comer y dormir unificados en pestañas y filas compactas.
             Antes eran dos secciones de tarjetas-foto casi identicas. */}
      <ServicesSection restaurants={restaurantCards} lodging={lodgingCards} />

      {/* 7. Catastro turistico completo, filtrable. */}
      <CatalogSection
        id="section-destinos"
        tone="paper"
        kicker={<Editable k="home.catalogo.kicker" />}
        title={<Editable k="home.catalogo.titulo" />}
        lead={<Editable k="home.catalogo.lead" multiline />}
        items={destinationCards}
        filters={categories}
        initialCount={6}
        cols={3}
        action={{ href: '/mapa', label: <Editable k="home.catalogo.accion" /> }}
        nounPlural="destinos"
      />

      {/* 8. Calendario tradicional en formato agenda. */}
      <EventsSection events={initialEvents} />

      {/* 9. Cierre institucional. */}
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
