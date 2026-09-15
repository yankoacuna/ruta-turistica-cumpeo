import React from 'react';
import { Metadata } from 'next';
import MapaClient from './MapaClient';
import { getAllPOIs, getTourRoutes } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mapa interactivo — Turismo Cumpeo',
  description: 'Explora el mapa interactivo de Cumpeo con GPS: destinos, restaurantes, alojamientos y eventos cerca de ti.',
};

export default async function MapaPage() {
  const [pois, tourRoutes] = await Promise.all([
    getAllPOIs(),
    getTourRoutes(),
  ]);

  return <MapaClient initialPois={pois} initialTourRoutes={tourRoutes} />;
}
