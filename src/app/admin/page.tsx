import { getDestinations, getAccommodations, getRestaurants } from '@/lib/data';
import { verifyAdminSession } from './actions';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [destinos, restaurantes, alojamientos, isAuthenticated] = await Promise.all([
    getDestinations(),
    getRestaurants(),
    getAccommodations(),
    verifyAdminSession(),
  ]);

  return (
    <AdminClient
      initialDestinos={destinos}
      initialRestaurantes={restaurantes}
      initialAlojamientos={alojamientos}
      initialAuthenticated={isAuthenticated}
    />
  );
}
