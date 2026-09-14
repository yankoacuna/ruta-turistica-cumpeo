import { getAllPOIs } from '@/lib/data';
import {
  getAdminSession,
  getEvents,
  getAdminUsers,
  getAdminDestinations,
  getAdminRestaurants,
  getAdminAccommodations,
  getAdminTourRoutes,
} from './actions';
import { getSiteTextsAdmin } from './siteTextActions';
import { getThemeConfigAdmin } from './themeActions';
import AdminClient from './AdminClient';
import { AdminUser, SiteTextRecord, ThemeConfigRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [destinos, restaurantes, alojamientos, eventos, rutas, allPois, session] = await Promise.all([
    getAdminDestinations(),
    getAdminRestaurants(),
    getAdminAccommodations(),
    getEvents(),
    getAdminTourRoutes(),
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
  let initialTheme: ThemeConfigRecord | null = null;
  if (session) {
    try {
      initialSiteTexts = await getSiteTextsAdmin();
    } catch (e) {
      console.error('Error fetching site texts:', e);
    }
    try {
      initialTheme = await getThemeConfigAdmin();
    } catch (e) {
      console.error('Error fetching theme config:', e);
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
      initialTheme={initialTheme}
    />
  );
}
