'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Destination,
  Accommodation,
  Restaurant,
  CumpeoEvent,
  TourRoute,
  POI,
  AdminUser,
  AdminSessionUser,
  UserRole,
  SiteTextRecord,
  OrderableEntity,
} from '@/lib/types';
import { useToast } from '@/components/Toast';

import { useDestinos } from './_hooks/useDestinos';
import { useRestaurantes } from './_hooks/useRestaurantes';
import { useAlojamientos } from './_hooks/useAlojamientos';
import { useEventos } from './_hooks/useEventos';
import { useRutas } from './_hooks/useRutas';
import { useSessionHeartbeat } from './_hooks/useSessionHeartbeat';

import { AdminLogin } from './_components/AdminLogin';
import { AdminSidebar } from './_components/AdminSidebar';
import { AdminTopBar } from './_components/AdminTopBar';
import { AdminDashboard } from './_components/AdminDashboard';
import { AdminTable } from './_components/AdminTable';
import { RutasManager } from './_components/RutasManager';
import { QRGenerator } from './_components/QRGenerator';
import { BackupManager } from './_components/BackupManager';
import { UserManager } from './_components/UserManager';
import { SiteTextsManager } from './_components/SiteTextsManager';
import { OrdenPortadaManager } from './_components/OrdenPortadaManager';
import { DestinoModal } from './_components/modals/DestinoModal';
import { RestauranteModal } from './_components/modals/RestauranteModal';
import { AlojamientoModal } from './_components/modals/AlojamientoModal';
import { EventoModal } from './_components/modals/EventoModal';
import { RutaModal } from './_components/modals/RutaModal';
import { UserModal } from './_components/modals/UserModal';
import { ChangePasswordModal } from './_components/modals/ChangePasswordModal';
import { SessionExpiredModal } from './_components/modals/SessionExpiredModal';
import { runTour, TourId } from './_components/adminTour';
import {
  loginAdmin,
  logoutAdmin,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from './actions';

import { AdminSection } from './_types';

interface Props {
  initialDestinos: Destination[];
  initialRestaurantes: Restaurant[];
  initialAlojamientos: Accommodation[];
  initialEventos: CumpeoEvent[];
  initialRutas?: TourRoute[];
  allPois?: POI[];
  initialSession?: AdminSessionUser | null;
  initialUsers?: AdminUser[];
  initialAuthenticated?: boolean;
  /** Textos del sitio que fueron modificados desde el CMS. */
  initialSiteTexts?: SiteTextRecord[];
}

export default function AdminClient({
  initialDestinos,
  initialRestaurantes,
  initialAlojamientos,
  initialEventos,
  initialRutas = [],
  allPois = [],
  initialSession = null,
  initialUsers = [],
  initialAuthenticated = false,
  initialSiteTexts = [],
}: Props) {
  const { showToast } = useToast();
  const [session, setSession] = useState<AdminSessionUser | null>(initialSession);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(initialSession || initialAuthenticated)
  );
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Users management state
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<
    (Partial<AdminUser> & { password?: string }) | null
  >(null);
  const [isUserPending, setIsUserPending] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Role permissions (Fail-secure: si no hay sesión, asume LECTOR)
  const role: UserRole = session?.role || 'LECTOR';
  const isAdmin = role === 'ADMIN';
  const canEdit = role === 'ADMIN' || role === 'EDITOR';
  const canDelete = role === 'ADMIN';

  const handleAuthError = () => {
    setIsSessionExpired(true);
  };

  // Mantiene la sesion viva mientras el usuario esta realmente usando el
  // panel, en vez de dejar que el token expire en silencio y recien avisar
  // cuando intenta guardar algo (ver useSessionHeartbeat para el detalle).
  useSessionHeartbeat({
    enabled: isAuthenticated && !isSessionExpired,
    onExpired: handleAuthError,
    onRefreshed: setSession,
  });

  const destinos = useDestinos(initialDestinos, { showToast, onAuthError: handleAuthError });
  const restaurantes = useRestaurantes(initialRestaurantes, { showToast, onAuthError: handleAuthError });
  const alojamientos = useAlojamientos(initialAlojamientos, { showToast, onAuthError: handleAuthError });
  const eventos = useEventos(initialEventos, { showToast, onAuthError: handleAuthError });
  const rutas = useRutas(initialRutas, { showToast, onAuthError: handleAuthError });

  /**
   * Deja las listas del panel en el mismo orden que se acaba de guardar, para
   * que las tablas no queden mostrando el orden anterior hasta recargar.
   */
  const handleReordered = (tipo: OrderableEntity, orderedIds: string[]) => {
    const reordenar = <T extends { id: string }>(items: T[]): T[] => {
      const posicion = new Map(orderedIds.map((id, i) => [id, i]));
      return [...items].sort(
        (a, b) => (posicion.get(a.id) ?? Infinity) - (posicion.get(b.id) ?? Infinity)
      );
    };

    if (tipo === 'destinos') destinos.setDestinos((prev) => reordenar(prev));
    if (tipo === 'restaurantes') restaurantes.setRestaurantes((prev) => reordenar(prev));
    if (tipo === 'alojamientos') alojamientos.setAlojamientos((prev) => reordenar(prev));
    if (tipo === 'eventos') eventos.setEventos((prev) => reordenar(prev));
  };

  const isAnyPending =
    destinos.isPending ||
    restaurantes.isPending ||
    alojamientos.isPending ||
    eventos.isPending ||
    rutas.isPending ||
    isUserPending;

  // ─── LOGIN & LOGOUT ─────────────────────────────────────────────────────────

  const handleLogin = async (identifier: string, pwd?: string) => {
    try {
      const res = await loginAdmin(identifier, pwd);
      if (res.success && res.user) {
        setSession(res.user);
        setIsAuthenticated(true);
        showToast(`Bienvenido, ${res.user.nombre} (${res.user.role})`, 'success');

        if (res.user.role === 'ADMIN') {
          try {
            const uList = await getAdminUsers();
            setUsers(uList);
          } catch (e) {
            console.error('Error fetching users:', e);
          }
        }
      } else {
        showToast(res.error || 'Credenciales incorrectas', 'error');
        throw new Error(res.error || 'Credenciales incorrectas');
      }
    } catch (err: any) {
      showToast(err.message || 'Error al iniciar sesión', 'error');
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
    setSession(null);
    setIsAuthenticated(false);
    setActiveSection('dashboard');
    window.location.href = '/admin';
  };

  // ─── USER MANAGEMENT HANDLERS ───────────────────────────────────────────────

  const handleNewUser = () => {
    setEditingUser({
      nombre: '',
      email: '',
      role: 'LECTOR',
      password: '',
      activo: true,
    });
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser({ ...user, password: '' });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsUserPending(true);
    try {
      if (editingUser.id) {
        const updated = await updateAdminUser(editingUser.id, {
          nombre: editingUser.nombre,
          role: editingUser.role,
          activo: editingUser.activo,
          password: editingUser.password || undefined,
        });
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        showToast(`Usuario "${updated.nombre}" actualizado con éxito`, 'success');
      } else {
        if (!editingUser.email || !editingUser.nombre || !editingUser.password) {
          showToast('Por favor completa todos los campos obligatorios', 'error');
          setIsUserPending(false);
          return;
        }
        const created = await createAdminUser({
          email: editingUser.email,
          nombre: editingUser.nombre,
          password: editingUser.password,
          role: editingUser.role || 'LECTOR',
        });
        setUsers((prev) => [...prev, created]);
        showToast(`Usuario "${created.nombre}" creado exitosamente`, 'success');
      }
      setEditingUser(null);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsUserPending(false);
    }
  };

  const handleToggleUserStatus = async (user: AdminUser) => {
    try {
      const updated = await updateAdminUser(user.id, {
        activo: !user.activo,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(
        `Usuario ${updated.activo ? 'activado' : 'desactivado'} con éxito`,
        'info'
      );
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleDeleteUser = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente al usuario "${nombre}"?`)) return;
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast(`Usuario "${nombre}" eliminado`, 'info');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleStartTour = (tourId: TourId = 'general') => {
    runTour(tourId, {
      activeSection,
      onNavigate: (section) => setActiveSection(section),
      openNewDestino: canEdit ? destinos.openNew : undefined,
      closeDestino: destinos.close,
      openNewRuta: canEdit ? rutas.openNew : undefined,
      closeRuta: rutas.close,
    });
  };

  if (!isAuthenticated) return <AdminLogin onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar navigation */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        counts={{
          destinos: destinos.destinos.length,
          restaurantes: restaurantes.restaurantes.length,
          alojamientos: alojamientos.alojamientos.length,
          eventos: eventos.eventos.length,
          rutas: rutas.rutas.length,
          usuarios: users.length,
          textos: initialSiteTexts.length,
        }}
        currentUser={session}
        onChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar
          activeSection={activeSection}
          currentUser={session}
          onChangePassword={() => setIsChangePasswordOpen(true)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onLogout={handleLogout}
          onStartTour={handleStartTour}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Global loading overlay */}
          {isAnyPending && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white p-5 rounded-2xl shadow-2xl flex items-center gap-3 border border-border">
                <Loader2 size={22} className="animate-spin text-rojo" />
                <span className="font-bold text-text-primary">Guardando cambios…</span>
              </div>
            </div>
          )}

          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <AdminDashboard
              destinos={destinos.destinos}
              restaurantes={restaurantes.restaurantes}
              alojamientos={alojamientos.alojamientos}
              eventos={eventos.eventos}
              rutas={rutas.rutas}
              usersCount={users.length}
              currentUser={session}
              onNavigate={setActiveSection}
              onNewDestino={canEdit ? destinos.openNew : undefined}
              onNewRestaurante={canEdit ? restaurantes.openNew : undefined}
              onNewAlojamiento={canEdit ? alojamientos.openNew : undefined}
              onNewEvento={canEdit ? eventos.openNew : undefined}
              onNewRuta={canEdit ? rutas.openNew : undefined}
              onStartTour={handleStartTour}
            />
          )}

          {/* Rutas y Paradas Manager */}
          {activeSection === 'rutas' && (
            <RutasManager
              rutas={rutas.rutas}
              allPois={allPois}
              canEdit={canEdit}
              canDelete={canDelete}
              onNew={rutas.openNew}
              onEdit={rutas.openEdit}
              onDelete={rutas.handleDelete}
            />
          )}

          {/* Tables for Destinos, Restaurantes, Alojamientos, Eventos */}
          {activeSection !== 'dashboard' &&
            activeSection !== 'rutas' &&
            activeSection !== 'textos' &&
            activeSection !== 'orden' &&
            activeSection !== 'qrcodes' &&
            activeSection !== 'backups' &&
            activeSection !== 'usuarios' && (
              <AdminTable
                activeSection={activeSection}
                destinos={destinos.destinos}
                restaurantes={restaurantes.restaurantes}
                alojamientos={alojamientos.alojamientos}
                eventos={eventos.eventos}
                canEdit={canEdit}
                canDelete={canDelete}
                handlers={{
                  destinos: {
                    onNew: destinos.openNew,
                    onEdit: destinos.openEdit,
                    onDelete: destinos.handleDelete,
                  },
                  restaurantes: {
                    onNew: restaurantes.openNew,
                    onEdit: restaurantes.openEdit,
                    onDelete: restaurantes.handleDelete,
                  },
                  alojamientos: {
                    onNew: alojamientos.openNew,
                    onEdit: alojamientos.openEdit,
                    onDelete: alojamientos.handleDelete,
                  },
                  eventos: {
                    onNew: eventos.openNew,
                    onEdit: eventos.openEdit,
                    onDelete: eventos.handleDelete,
                  },
                }}
              />
            )}

          {/* Textos editables del sitio publico */}
          {activeSection === 'textos' && (
            <SiteTextsManager
              overrides={initialSiteTexts}
              role={role}
              showToast={showToast}
              onAuthError={handleAuthError}
            />
          )}

          {/* Orden con que se muestran los catastros en la portada */}
          {activeSection === 'orden' && (
            <OrdenPortadaManager
              destinos={destinos.destinos}
              restaurantes={restaurantes.restaurantes}
              alojamientos={alojamientos.alojamientos}
              eventos={eventos.eventos}
              role={role}
              showToast={showToast}
              onAuthError={handleAuthError}
              onReordered={handleReordered}
            />
          )}

          {/* QR Code Generator */}
          {activeSection === 'qrcodes' && (
            <QRGenerator
              destinos={destinos.destinos}
              restaurantes={restaurantes.restaurantes}
              alojamientos={alojamientos.alojamientos}
            />
          )}

          {/* Backup & Restore Manager */}
          {activeSection === 'backups' && (
            <BackupManager
              destinos={destinos.destinos}
              restaurantes={restaurantes.restaurantes}
              alojamientos={alojamientos.alojamientos}
              eventos={eventos.eventos}
              rutas={rutas.rutas}
              userRole={role}
            />
          )}

          {/* User Management (Solo Administrador) */}
          {activeSection === 'usuarios' && isAdmin && (
            <UserManager
              users={users}
              currentUserId={session?.id || ''}
              onNewUser={handleNewUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onToggleStatus={handleToggleUserStatus}
            />
          )}

          {/* Modals */}
          {destinos.editing && (
            <DestinoModal
              editing={destinos.editing}
              onChange={destinos.setEditing}
              onSubmit={destinos.handleSave}
              onClose={destinos.close}
              isPending={destinos.isPending}
            />
          )}
          {restaurantes.editing && (
            <RestauranteModal
              editing={restaurantes.editing}
              onChange={restaurantes.setEditing}
              onSubmit={restaurantes.handleSave}
              onClose={restaurantes.close}
              isPending={restaurantes.isPending}
            />
          )}
          {alojamientos.editing && (
            <AlojamientoModal
              editing={alojamientos.editing}
              onChange={alojamientos.setEditing}
              onSubmit={alojamientos.handleSave}
              onClose={alojamientos.close}
              isPending={alojamientos.isPending}
            />
          )}
          {eventos.editing && (
            <EventoModal
              editing={eventos.editing}
              onChange={eventos.setEditing}
              onSubmit={eventos.handleSave}
              onClose={eventos.close}
              isPending={eventos.isPending}
            />
          )}
          {rutas.editing && (
            <RutaModal
              editing={rutas.editing}
              availablePois={allPois}
              onChange={rutas.setEditing}
              onSubmit={rutas.handleSave}
              onClose={rutas.close}
              isPending={rutas.isPending}
            />
          )}
          {editingUser && (
            <UserModal
              editing={editingUser}
              onChange={setEditingUser}
              onSubmit={handleSaveUser}
              onClose={() => setEditingUser(null)}
              isPending={isUserPending}
            />
          )}
          {isChangePasswordOpen && (
            <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />
          )}

          {/* Modal de re-autenticación cuando expira la sesión */}
          {isSessionExpired && (
            <SessionExpiredModal
              currentUser={session}
              onSuccess={(refreshedUser) => {
                setSession(refreshedUser);
                setIsAuthenticated(true);
                setIsSessionExpired(false);
                showToast(`Sesión reanudada con éxito para ${refreshedUser.nombre}. Ya puedes guardar tus cambios.`, 'success');
              }}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}
