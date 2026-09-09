import { getDestinations, getAccommodations, getRestaurants, getTourRoutes, getAllPOIs } from '@/lib/data';
import { getAdminSession, getEvents, getAdminUsers } from './actions';
import AdminClient from './AdminClient';
import { AdminUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [destinos, restaurantes, alojamientos, eventos, rutas, allPois, session] = await Promise.all([
    getDestinations(),
    getRestaurants(),
    getAccommodations(),
    getEvents(),
    getTourRoutes(),
    getAllPOIs(),
    getAdminSession(),
  ]);

  let initialUsers: AdminUser[] = [];
  if (session && session.role === 'ADMIN') {
    try {
      initialUsers = await getAdminUsers();
    } catch (e) {
      console.error('Error fetching initial users:', e);
    }
  }

  return (
    <AdminClient
      initialDestinos={destinos}
      initialRestaurantes={restaurantes}
      initialAlojamientos={alojamientos}
      initialEventos={eventos as any}
      initialRutas={rutas}
      allPois={allPois}
      initialSession={session}
      initialUsers={initialUsers}
    />
  );
}
