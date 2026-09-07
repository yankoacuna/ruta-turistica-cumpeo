'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Destination, Accommodation, Restaurant, CumpeoEvent, TourRoute, POI } from '@/lib/types';
import { useToast } from '@/components/Toast';

import { useDestinos } from './_hooks/useDestinos';
import { useRestaurantes } from './_hooks/useRestaurantes';
import { useAlojamientos } from './_hooks/useAlojamientos';
import { useEventos } from './_hooks/useEventos';
import { useRutas } from './_hooks/useRutas';

import { AdminLogin } from './_components/AdminLogin';
import { AdminSidebar } from './_components/AdminSidebar';
import { AdminTopBar } from './_components/AdminTopBar';
import { AdminDashboard } from './_components/AdminDashboard';
import { AdminTable } from './_components/AdminTable';
import { RutasManager } from './_components/RutasManager';
import { QRGenerator } from './_components/QRGenerator';
import { BackupManager } from './_components/BackupManager';
import { DestinoModal } from './_components/modals/DestinoModal';
import { RestauranteModal } from './_components/modals/RestauranteModal';
import { AlojamientoModal } from './_components/modals/AlojamientoModal';
import { EventoModal } from './_components/modals/EventoModal';
import { RutaModal } from './_components/modals/RutaModal';
import { loginAdmin, logoutAdmin } from './actions';

import { AdminSection } from './_types';

interface Props {
  initialDestinos: Destination[];
  initialRestaurantes: Restaurant[];
  initialAlojamientos: Accommodation[];
  initialEventos: CumpeoEvent[];
  initialRutas?: TourRoute[];
  allPois?: POI[];
  initialAuthenticated?: boolean;
}

export default function AdminClient({
  initialDestinos,
  initialRestaurantes,
  initialAlojamientos,
  initialEventos,
  initialRutas = [],
  allPois = [],
  initialAuthenticated = false,
}: Props) {
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const destinos = useDestinos(initialDestinos, { password, showToast });
  const restaurantes = useRestaurantes(initialRestaurantes, { password, showToast });
  const alojamientos = useAlojamientos(initialAlojamientos, { password, showToast });
  const eventos = useEventos(initialEventos, { password, showToast });
  const rutas = useRutas(initialRutas, { password, showToast });

  const isAnyPending =
    destinos.isPending ||
    restaurantes.isPending ||
    alojamientos.isPending ||
    eventos.isPending ||
    rutas.isPending;


  const handleLogin = async (pwd: string) => {
    try {
      const res = await loginAdmin(pwd);
      if (res.success) {
        setPassword(pwd);
        setIsAuthenticated(true);
        showToast('Sesión de administración iniciada con éxito', 'success');
      } else {
        showToast(res.error || 'Contraseña incorrecta', 'error');
      }
    } catch (err: any) {
      showToast(`Error al iniciar sesión: ${err.message}`, 'error');
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    setPassword('');
    showToast('Sesión cerrada correctamente', 'info');
  };

  if (!isAuthenticated) return <AdminLogin onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar navigation with clear separation of Dashboard, Editable Items, and Tools */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        counts={{
          destinos: destinos.destinos.length,
          restaurantes: restaurantes.restaurantes.length,
          alojamientos: alojamientos.alojamientos.length,
          eventos: eventos.eventos.length,
          rutas: rutas.rutas.length,
        }}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar
          activeSection={activeSection}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onLogout={handleLogout}
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
              onNavigate={setActiveSection}
              onNewDestino={destinos.openNew}
              onNewRestaurante={restaurantes.openNew}
              onNewAlojamiento={alojamientos.openNew}
              onNewEvento={eventos.openNew}
              onNewRuta={rutas.openNew}
            />
          )}

        {/* Rutas y Paradas Manager */}
        {activeSection === 'rutas' && (
          <RutasManager
            rutas={rutas.rutas}
            allPois={allPois}
            onNew={rutas.openNew}
            onEdit={rutas.openEdit}
            onDelete={rutas.handleDelete}
          />
        )}

        {/* Tables */}
        {activeSection !== 'dashboard' &&
          activeSection !== 'rutas' &&
          activeSection !== 'qrcodes' &&
          activeSection !== 'backups' && (
            <AdminTable
              activeSection={activeSection}
              destinos={destinos.destinos}
              restaurantes={restaurantes.restaurantes}
              alojamientos={alojamientos.alojamientos}
              eventos={eventos.eventos}
              handlers={{
                destinos: { onNew: destinos.openNew, onEdit: destinos.openEdit, onDelete: destinos.handleDelete },
                restaurantes: { onNew: restaurantes.openNew, onEdit: restaurantes.openEdit, onDelete: restaurantes.handleDelete },
                alojamientos: { onNew: alojamientos.openNew, onEdit: alojamientos.openEdit, onDelete: alojamientos.handleDelete },
                eventos: { onNew: eventos.openNew, onEdit: eventos.openEdit, onDelete: eventos.handleDelete },
              }}
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
            token={password}
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
        </main>
      </div>
    </div>
  );
}

