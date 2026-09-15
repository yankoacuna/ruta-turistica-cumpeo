/**
 * Punto de entrada único de los server actions del panel admin.
 *
 * La implementación real vive separada por dominio (authActions,
 * entityActions, tourRouteActions, backupActions, bulkImportActions,
 * userActions) para que cada archivo tenga una sola responsabilidad. Este
 * archivo solo re-exporta, así ningún import existente en el resto del
 * proyecto (`from '../actions'` / `from './actions'`) tuvo que cambiar.
 */

export {
  ensureInitialAdmin,
  getAdminSession,
  pingSession,
  loginAdmin,
  logoutAdmin,
  verifyAdminSession,
  requireRole,
  assertAuthorized,
} from './authActions';

export {
  getAdminDestinations,
  saveDestination,
  deleteDestination,
  getAdminRestaurants,
  saveRestaurant,
  deleteRestaurant,
  getAdminAccommodations,
  saveAccommodation,
  deleteAccommodation,
  getEvents,
  saveEvent,
  deleteEvent,
  updateEntityOrder,
} from './entityActions';

export {
  getAdminTourRoutes,
  saveTourRoute,
  deleteTourRoute,
  updateTourRouteStops,
} from './tourRouteActions';

export { exportDatabaseBackup, restoreDatabaseBackup } from './backupActions';

export { bulkImportEntitiesAction } from './bulkImportActions';

export {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  changeOwnPassword,
} from './userActions';
