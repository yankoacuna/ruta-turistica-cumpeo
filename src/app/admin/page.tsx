import { getDestinations, getAccommodations, getRestaurants, getTourRoutes, getAllPOIs } from '@/lib/data';
import { verifyAdminSession, getEvents } from './actions';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [destinos, restaurantes, alojamientos, eventos, rutas, allPois, isAuthenticated] = await Promise.all([
    getDestinations(),
    getRestaurants(),
    getAccommodations(),
    getEvents(),
    getTourRoutes(),
    getAllPOIs(),
    verifyAdminSession(),
  ]);

  return (
    <AdminClient
      initialDestinos={destinos}
      initialRestaurantes={restaurantes}
      initialAlojamientos={alojamientos}
      initialEventos={eventos as any}
      initialRutas={rutas}
      allPois={allPois}
      initialAuthenticated={isAuthenticated}
    />
  );
}

