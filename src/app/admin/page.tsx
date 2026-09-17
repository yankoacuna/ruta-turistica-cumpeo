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
    // allSettled: que una lista falle no debe vaciar también a las demás.
    const [
      destinosRes,
      restaurantesRes,
      alojamientosRes,
      eventosRes,
      rutasRes,
    ] = await Promise.allSettled([
      getAdminDestinations(),
      getAdminRestaurants(),
      getAdminAccommodations(),
      getEvents(),
      getAdminTourRoutes(),
    ]);

    const leer = <T,>(etiqueta: string, res: PromiseSettledResult<T[]>): T[] => {
      if (res.status === 'fulfilled') return res.value;
      console.error(`Error fetching admin ${etiqueta}:`, res.reason);
      return [];
    };

    destinos = leer('destinos', destinosRes);
    restaurantes = leer('restaurantes', restaurantesRes);
    alojamientos = leer('alojamientos', alojamientosRes);
    eventos = leer('eventos', eventosRes);
    rutas = leer('rutas', rutasRes);

    if (session.role === 'ADMIN') {
      try {
        const res = await getAdminUsers();
        if (res.ok) initialUsers = res.data;
      } catch (e) {
        console.error('Error fetching initial users:', e);
      }
    }

    try {
      const res = await getSiteTextsAdmin();
      if (res.ok) initialSiteTexts = res.data;
    } catch (e) {
      console.error('Error fetching site texts:', e);
    }
    try {
      const res = await getThemeConfigAdmin();
      if (res.ok) initialTheme = res.data;
    } catch (e) {
      console.error('Error fetching theme config:', e);
    }
    if (session.role === 'ADMIN') {
      try {
        const res = await getNotificacionesAdmin();
        if (res.ok) initialNotificaciones = res.data;
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
      initialEventos={eventos}
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
