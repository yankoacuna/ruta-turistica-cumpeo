import { getDestinations, getAccommodations, getRestaurants, getTourRoutes, getAllPOIs } from '@/lib/data';
import { getAdminSession, getEvents, getAdminUsers } from './actions';
import { getSiteTextsAdmin } from './siteTextActions';
import AdminClient from './AdminClient';
import { AdminUser, SiteTextRecord } from '@/lib/types';

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

  // Textos del sitio ya modificados. Solo se piden con sesion: sin ella el
  // panel muestra el login y no hay nada que listar.
  let initialSiteTexts: SiteTextRecord[] = [];
  if (session) {
    try {
      initialSiteTexts = await getSiteTextsAdmin();
    } catch (e) {
      console.error('Error fetching site texts:', e);
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
      initialSiteTexts={initialSiteTexts}
    />
  );
}
