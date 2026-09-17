'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ThemeConfigRecord,
  NotificacionesConfigRecord,
  OrderableEntity,
} from '@/lib/types';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

import { useDestinos } from './_hooks/useDestinos';
import { useRestaurantes } from './_hooks/useRestaurantes';
import { useAlojamientos } from './_hooks/useAlojamientos';
import { useEventos } from './_hooks/useEventos';
import { useRutas } from './_hooks/useRutas';
import { useSessionHeartbeat } from './_hooks/useSessionHeartbeat';

import { AdminLogin } from './_components/AdminLogin';
import { AdminSidebar } from './_components/AdminSidebar';
import { SolicitudesManager } from './_components/SolicitudesManager';
import { AdminTopBar } from './_components/AdminTopBar';
import { AdminDashboard } from './_components/AdminDashboard';
import { AdminTable } from './_components/AdminTable';
import { RutasManager } from './_components/RutasManager';
import { QRGenerator } from './_components/QRGenerator';
import { BackupManager } from './_components/BackupManager';
import { UserManager } from './_components/UserManager';
import { SiteTextsManager } from './_components/SiteTextsManager';
import { ThemeManager } from './_components/ThemeManager';
import { NotificacionesManager } from './_components/NotificacionesManager';
import { OrdenPortadaManager } from './_components/OrdenPortadaManager';
import { DestinoModal } from './_components/modals/DestinoModal';
import { RestauranteModal } from './_components/modals/RestauranteModal';
import { AlojamientoModal } from './_components/modals/AlojamientoModal';
import { EventoModal } from './_components/modals/EventoModal';
import { RutaModal } from './_components/modals/RutaModal';
import { UserModal } from './_components/modals/UserModal';
import { ChangePasswordModal } from './_components/modals/ChangePasswordModal';
import { GeneratedPasswordModal } from './_components/modals/GeneratedPasswordModal';
import { ForcedPasswordChangeScreen } from './_components/ForcedPasswordChangeScreen';
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
import { ResultadoError, esProblemaDeSesion } from '@/lib/resultado';
import { SolicitudRecord } from '@/lib/types';
import { contarSolicitudesPendientes, marcarSolicitudPublicada } from './solicitudActions';

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
  /** Apariencia (paleta y tipografías) guardada desde el CMS, si la hay. */
  initialTheme?: ThemeConfigRecord | null;
  /** Destinatarios del aviso por correo de Solicitudes nuevas, si hay. */
  initialNotificaciones?: NotificacionesConfigRecord | null;
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
  initialTheme = null,
  initialNotificaciones = null,
}: Props) {
  const { showToast } = useToast();
  const { confirm: confirmAction } = useConfirm();
  const [session, setSession] = useState<AdminSessionUser | null>(initialSession);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(initialSession || initialAuthenticated)
  );
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Solicitudes del sitio publico pendientes de revisar: alimentan el contador
  // de la barra lateral y el aviso del dashboard.
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
  // Solicitud que dio origen a la ficha que se esta creando. Va en un ref y no
  // en estado porque lo lee el callback de guardado de los hooks, que se crea
  // una sola vez: con estado leeria siempre el valor inicial.
  const solicitudEnCurso = useRef<{ id: string; seccion: AdminSection } | null>(null);

  // Users management state
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<
    (Partial<AdminUser> & { resetPassword?: boolean }) | null
  >(null);
  const [isUserPending, setIsUserPending] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [generatedCredential, setGeneratedCredential] = useState<
    { email: string; nombre: string; password: string } | null
  >(null);

  // Role permissions (Fail-secure: si no hay sesión, asume LECTOR)
  const role: UserRole = session?.role || 'LECTOR';
  const isAdmin = role === 'ADMIN';
  const canEdit = role === 'ADMIN' || role === 'EDITOR';
  const canDelete = role === 'ADMIN';

  const handleAuthError = () => {
    setIsSessionExpired(true);
  };

  /** Fallo previsto por una acción: la sesión caída cambia la pantalla, el resto avisa. */
  const avisarFallo = (res: ResultadoError) => {
    if (esProblemaDeSesion(res)) handleAuthError();
    showToast(res.mensaje, 'error');
  };

  /** Mensaje para una falla no prevista; el detalle queda en la consola. */
  const avisarErrorInesperado = (contexto: string, err: unknown) => {
    console.error(contexto, err);
    showToast('No pudimos completar la acción. Vuelve a intentarlo en unos segundos.', 'error');
  };

  // Mantiene la sesion viva mientras el usuario esta realmente usando el
  // panel, en vez de dejar que el token expire en silencio y recien avisar
  // cuando intenta guardar algo (ver useSessionHeartbeat para el detalle).
  useSessionHeartbeat({
    enabled: isAuthenticated && !isSessionExpired,
    onExpired: handleAuthError,
    onRefreshed: setSession,
  });

  /**
   * Cierra el ciclo de una solicitud cuando la ficha que nacio de ella se
   * guarda: la enlaza con la ficha creada y la marca como publicada, para que
   * el mismo negocio no se publique dos veces por olvido.
   */
  const cerrarSolicitudSiCorresponde = (saved: { id: string; nombre?: string }) => {
    const pendiente = solicitudEnCurso.current;
    if (!pendiente) return;
    solicitudEnCurso.current = null;

    marcarSolicitudPublicada(pendiente.id, saved.id, pendiente.seccion)
      .then((res) => {
        if (!res.ok) {
          showToast('La ficha se guardo, pero la solicitud quedo sin marcar', 'info');
          return;
        }
        setSolicitudesPendientes((prev) => Math.max(0, prev - 1));
        showToast('La solicitud quedo marcada como publicada', 'success');
      })
      .catch((e) => {
        // La ficha ya se guardo: que falle el enlace no es motivo para alarmar,
        // pero si hay que avisar, porque la solicitud sigue apareciendo abierta.
        console.error('No se pudo enlazar la solicitud con la ficha:', e);
        showToast('La ficha se guardo, pero la solicitud quedo sin marcar', 'info');
      });
  };

  const opcionesFicha = {
    showToast,
    confirmAction,
    onAuthError: handleAuthError,
    onSaved: cerrarSolicitudSiCorresponde,
    isAuthenticated,
  };

  const destinos = useDestinos(initialDestinos, opcionesFicha);
  const restaurantes = useRestaurantes(initialRestaurantes, opcionesFicha);
  const alojamientos = useAlojamientos(initialAlojamientos, opcionesFicha);
  const eventos = useEventos(initialEventos, opcionesFicha);
  const rutas = useRutas(initialRutas, { showToast, confirmAction, onAuthError: handleAuthError, isAuthenticated });

  // Contador de solicitudes sin revisar. Se pide una vez al entrar: no cambia
  // solo, y la bandeja lo refresca cuando el usuario actua sobre ella.
  useEffect(() => {
    if (!isAuthenticated) return;
    contarSolicitudesPendientes()
      .then((res) => setSolicitudesPendientes(res.ok ? res.data : 0))
      .catch(() => setSolicitudesPendientes(0));
  }, [isAuthenticated]);

  /**
   * Abre el formulario de ficha con los datos que mando el emprendedor.
   *
   * Este es el punto de todo el modulo: el encargado revisa, corrige lo que
   * haga falta y guarda, en vez de transcribir a mano un correo. Los campos de
   * la solicitud son deliberadamente los mismos que los de una ficha, asi que
   * el traspaso es directo.
   */
  const handleCrearFichaDesdeSolicitud = (s: SolicitudRecord) => {
    const contacto = {
      telefono: s.telefono || '',
      whatsapp: s.whatsapp || '',
      email: s.email || '',
      web: s.web || '',
      instagram: s.instagram || '',
      facebook: s.facebook || '',
    };
    const comun = {
      nombre: s.nombre,
      direccion: s.direccion || '',
      coordenadas: s.coordenadas || undefined,
      // La primera foto queda de portada y el resto en la galeria, que es como
      // se ordenan en la ficha publicada.
      imagenPrincipal: s.fotos?.[0] || '',
      galeria: s.fotos?.slice(1) || [],
    };

    switch (s.tipo) {
      case 'RESTAURANTE':
        restaurantes.setEditing({
          ...comun,
          tipo: s.categoriaSugerida || '',
          descripcion: s.descripcion,
          especialidad: s.especialidad || '',
          horario: s.horario || undefined,
          mediosPago: s.mediosPago || [],
          contacto,
          tags: [],
        });
        solicitudEnCurso.current = { id: s.id, seccion: 'restaurantes' };
        setActiveSection('restaurantes');
        break;

      case 'ALOJAMIENTO':
        alojamientos.setEditing({
          ...comun,
          tipo: s.categoriaSugerida || '',
          descripcion: s.descripcion,
          servicios: s.servicios || [],
          contacto,
        });
        solicitudEnCurso.current = { id: s.id, seccion: 'alojamientos' };
        setActiveSection('alojamientos');
        break;

      case 'DESTINO':
        destinos.setEditing({
          ...comun,
          // La categoria del catalogo es acotada: lo que sugirio el emprendedor
          // es solo una pista, y el encargado la elige en el formulario.
          categoria: undefined,
          descripcionCorta: s.descripcion.slice(0, 160),
          descripcionLarga: s.descripcion,
          horario: s.horario || undefined,
          tags: [],
        });
        solicitudEnCurso.current = { id: s.id, seccion: 'destinos' };
        setActiveSection('destinos');
        break;

      case 'EVENTO':
        eventos.setEditing({
          ...comun,
          tipo: s.categoriaSugerida || '',
          descripcion: s.descripcion,
          descripcionLarga: s.descripcion,
          fecha: s.fecha || '',
          tags: [],
        });
        solicitudEnCurso.current = { id: s.id, seccion: 'eventos' };
        setActiveSection('eventos');
        break;

      default:
        showToast('Una consulta general no crea una ficha', 'info');
    }
  };

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
        showToast(`Bienvenido, ${res.user.nombre}`, 'success');

        if (res.user.role === 'ADMIN') {
          try {
            const lista = await getAdminUsers();
            if (lista.ok) setUsers(lista.data);
          } catch (e) {
            console.error('Error fetching users:', e);
          }
        }
      } else {
        showToast(res.error || 'Credenciales incorrectas', 'error');
        throw new Error(res.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al iniciar sesión', 'error');
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
      activo: true,
    });
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser({ ...user, resetPassword: false });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsUserPending(true);
    try {
      if (editingUser.id) {
        const res = await updateAdminUser(editingUser.id, {
          nombre: editingUser.nombre,
          role: editingUser.role,
          activo: editingUser.activo,
          resetPassword: editingUser.resetPassword,
        });
        if (!res.ok) {
          avisarFallo(res);
          return;
        }
        const { user: updated, temporaryPassword } = res.data;
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        if (temporaryPassword) {
          setGeneratedCredential({ email: updated.email, nombre: updated.nombre, password: temporaryPassword });
        }
        showToast(`Usuario "${updated.nombre}" actualizado con éxito`, 'success');
      } else {
        if (!editingUser.email || !editingUser.nombre) {
          showToast('Por favor completa todos los campos obligatorios', 'error');
          return;
        }
        const res = await createAdminUser({
          email: editingUser.email,
          nombre: editingUser.nombre,
          role: editingUser.role || 'LECTOR',
        });
        if (!res.ok) {
          avisarFallo(res);
          return;
        }
        const { user: created, temporaryPassword } = res.data;
        setUsers((prev) => [...prev, created]);
        setGeneratedCredential({ email: created.email, nombre: created.nombre, password: temporaryPassword });
        showToast(`Usuario "${created.nombre}" creado exitosamente`, 'success');
      }
      setEditingUser(null);
    } catch (err) {
      avisarErrorInesperado('Error inesperado al guardar el usuario:', err);
    } finally {
      setIsUserPending(false);
    }
  };

  const handleToggleUserStatus = async (user: AdminUser) => {
    try {
      const res = await updateAdminUser(user.id, { activo: !user.activo });
      if (!res.ok) {
        avisarFallo(res);
        return;
      }
      const { user: updated } = res.data;
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(
        `Usuario ${updated.activo ? 'activado' : 'desactivado'} con éxito`,
        'info'
      );
    } catch (err) {
      avisarErrorInesperado('Error inesperado al cambiar el estado del usuario:', err);
    }
  };

  const handleDeleteUser = async (id: string, nombre: string) => {
    const ok = await confirmAction(`¿Estás seguro de eliminar permanentemente al usuario "${nombre}"?`, {
      title: 'Eliminar usuario',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await deleteAdminUser(id);
      if (!res.ok && res.codigo !== 'NO_ENCONTRADO') {
        avisarFallo(res);
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast(res.ok ? `Usuario "${nombre}" eliminado` : res.mensaje, 'info');
    } catch (err) {
      avisarErrorInesperado('Error inesperado al eliminar el usuario:', err);
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
      openNewRestaurante: canEdit ? restaurantes.openNew : undefined,
      closeRestaurante: restaurantes.close,
      openNewAlojamiento: canEdit ? alojamientos.openNew : undefined,
      closeAlojamiento: alojamientos.close,
      openNewEvento: canEdit ? eventos.openNew : undefined,
      closeEvento: eventos.close,
      openNewUser: isAdmin ? handleNewUser : undefined,
      closeUser: () => setEditingUser(null),
    });
  };

  if (!isAuthenticated) return <AdminLogin onLogin={handleLogin} />;

  if (session?.mustChangePassword) {
    return (
      <ForcedPasswordChangeScreen
        currentUser={session}
        onSuccess={() => setSession({ ...session, mustChangePassword: false })}
      />
    );
  }

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
          solicitudes: solicitudesPendientes,
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

          {/* Solicitudes del sitio publico */}
          {activeSection === 'solicitudes' && (
            <SolicitudesManager
              currentUser={session}
              showToast={showToast}
              confirmAction={confirmAction}
              onCrearFicha={handleCrearFichaDesdeSolicitud}
              onAuthError={handleAuthError}
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
            activeSection !== 'solicitudes' &&
            activeSection !== 'rutas' &&
            activeSection !== 'textos' &&
            activeSection !== 'apariencia' &&
            activeSection !== 'orden' &&
            activeSection !== 'qrcodes' &&
            activeSection !== 'backups' &&
            activeSection !== 'usuarios' &&
            activeSection !== 'notificaciones' && (
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
              confirmAction={confirmAction}
              onAuthError={handleAuthError}
            />
          )}

          {/* Apariencia: paleta de colores y tipografías del sitio */}
          {activeSection === 'apariencia' && (
            <ThemeManager
              initial={initialTheme}
              role={role}
              showToast={showToast}
              confirmAction={confirmAction}
              onAuthError={handleAuthError}
            />
          )}

          {/* Notificaciones: destinatarios del aviso de Solicitudes nuevas */}
          {activeSection === 'notificaciones' && (
            <NotificacionesManager
              initial={initialNotificaciones}
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
              errores={destinos.erroresCampo}
              onChange={destinos.setEditing}
              onSubmit={destinos.handleSave}
              onClose={destinos.close}
              isPending={destinos.isPending}
            />
          )}
          {restaurantes.editing && (
            <RestauranteModal
              editing={restaurantes.editing}
              errores={restaurantes.erroresCampo}
              onChange={restaurantes.setEditing}
              onSubmit={restaurantes.handleSave}
              onClose={restaurantes.close}
              isPending={restaurantes.isPending}
            />
          )}
          {alojamientos.editing && (
            <AlojamientoModal
              editing={alojamientos.editing}
              errores={alojamientos.erroresCampo}
              onChange={alojamientos.setEditing}
              onSubmit={alojamientos.handleSave}
              onClose={alojamientos.close}
              isPending={alojamientos.isPending}
            />
          )}
          {eventos.editing && (
            <EventoModal
              editing={eventos.editing}
              errores={eventos.erroresCampo}
              onChange={eventos.setEditing}
              onSubmit={eventos.handleSave}
              onClose={eventos.close}
              isPending={eventos.isPending}
            />
          )}
          {rutas.editing && (
            <RutaModal
              editing={rutas.editing}
              errores={rutas.erroresCampo}
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
          {generatedCredential && (
            <GeneratedPasswordModal
              nombre={generatedCredential.nombre}
              email={generatedCredential.email}
              password={generatedCredential.password}
              onClose={() => setGeneratedCredential(null)}
            />
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
