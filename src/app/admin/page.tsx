import { getDestinations, getAccommodations, getRestaurants } from '@/lib/data';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [destinos, restaurantes, alojamientos] = await Promise.all([
    getDestinations(),
    getRestaurants(),
    getAccommodations(),
  ]);

  return (
    <AdminClient
      initialDestinos={destinos}
      initialRestaurantes={restaurantes}
      initialAlojamientos={alojamientos}
    />
  );
}
