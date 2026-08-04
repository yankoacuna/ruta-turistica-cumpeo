import React from 'react';
import MapaClient from './MapaClient';
import { getAllPOIs, getTourRoutes } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function MapaPage() {
  const [pois, tourRoutes] = await Promise.all([
    getAllPOIs(),
    getTourRoutes(),
  ]);

  return <MapaClient initialPois={pois} initialTourRoutes={tourRoutes} />;
}
