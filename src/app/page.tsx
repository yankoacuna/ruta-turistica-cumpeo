import React from 'react';
import HomeClient from './HomeClient';
import {
  getConfig,
  getDestinations,
  getFeaturedDestinations,
  getAccommodations,
  getRestaurants,
} from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [cfg, dests, feat, accomm, rests] = await Promise.all([
    getConfig(),
    getDestinations(),
    getFeaturedDestinations(),
    getAccommodations(),
    getRestaurants(),
  ]);

  return (
    <HomeClient 
      initialConfig={cfg}
      initialDestinations={dests}
      initialFeatured={feat}
      initialAccommodations={accomm}
      initialRestaurants={rests}
    />
  );
}
