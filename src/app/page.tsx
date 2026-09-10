import React from 'react';
import HomeClient from './HomeClient';
import {
  getConfig,
  getDestinations,
  getFeaturedDestinations,
  getAccommodations,
  getRestaurants,
  getEmergencyContacts,
  getEvents,
  getTourRoutes,
} from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [cfg, dests, feat, accomm, rests, emergency, events, routes] = await Promise.all([
    getConfig(),
    getDestinations(),
    getFeaturedDestinations(),
    getAccommodations(),
    getRestaurants(),
    getEmergencyContacts(),
    getEvents(),
    getTourRoutes(),
  ]);

  return (
    <HomeClient
      initialConfig={cfg}
      initialDestinations={dests}
      initialFeatured={feat}
      initialAccommodations={accomm}
      initialRestaurants={rests}
      initialEmergency={emergency}
      initialEvents={events}
      initialRoutes={routes}
    />
  );
}
