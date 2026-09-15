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
import { getNotificacionesAdmin } from './notificacionesActions';
import AdminClient from './AdminClient';
import {
  AdminUser,
  SiteTextRecord,
  ThemeConfigRecord,
  NotificacionesConfigRecord,
  Destination,
  Restaurant,
  Accommodation,
  CumpeoEvent,
  TourRoute,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [allPois, session] = await Promise.all([
    getAllPOIs(),
    getAdminSession(),
  ]);

  // Todo lo que sigue son datos del catastro completo (incluidos registros
  // inactivos/no publicados) y configuración del panel: solo se piden con
  // sesión. AdminClient es un Client Component, así que cualquier prop que se
  // le pase acá viaja en la respuesta al navegador aunque luego decida mostrar
  // solo la pantalla de login — pedir esto sin sesión filtraría el catastro
  // completo a cualquier visitante anónimo que abra /admin.
  let destinos: Destination[] = [];
  let restaurantes: Restaurant[] = [];
  let alojamientos: Accommodation[] = [];
  let eventos: CumpeoEvent[] = [];
  let rutas: TourRoute[] = [];
  let initialUsers: AdminUser[] = [];
  let initialSiteTexts: SiteTextRecord[] = [];
  let initialTheme: ThemeConfigRecord | null = null;
  let initialNotificaciones: NotificacionesConfigRecord | null = null;

  if (session) {
    try {
      [destinos, restaurantes, alojamientos, eventos, rutas] = await Promise.all([
        getAdminDestinations(),
        getAdminRestaurants(),
        getAdminAccommodations(),
        getEvents(),
        getAdminTourRoutes(),
      ]);
    } catch (e) {
      console.error('Error fetching admin catalog data:', e);
    }

    if (session.role === 'ADMIN') {
      try {
        initialUsers = await getAdminUsers();
      } catch (e) {
        console.error('Error fetching initial users:', e);
      }
    }

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
    if (session.role === 'ADMIN') {
      try {
        initialNotificaciones = await getNotificacionesAdmin();
      } catch (e) {
        console.error('Error fetching notificaciones config:', e);
      }
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
      initialNotificaciones={initialNotificaciones}
    />
  );
}
