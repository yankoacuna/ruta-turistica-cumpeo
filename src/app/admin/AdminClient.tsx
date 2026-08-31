'use client';

import React, { useState } from 'react';
import {
  Loader2,
  LayoutDashboard,
  MapPin,
  UtensilsCrossed,
  BedDouble,
  QrCode,
  Database,
} from 'lucide-react';
import { Destination, Accommodation, Restaurant } from '@/lib/types';
import { useToast } from '@/components/Toast';

import { useDestinos } from './_hooks/useDestinos';
import { useRestaurantes } from './_hooks/useRestaurantes';
import { useAlojamientos } from './_hooks/useAlojamientos';

import { AdminLogin } from './_components/AdminLogin';
import { AdminHeader } from './_components/AdminHeader';
import { AdminDashboard } from './_components/AdminDashboard';
import { AdminTable } from './_components/AdminTable';
import { QRGenerator } from './_components/QRGenerator';
import { BackupManager } from './_components/BackupManager';
import { DestinoModal } from './_components/modals/DestinoModal';
import { RestauranteModal } from './_components/modals/RestauranteModal';
import { AlojamientoModal } from './_components/modals/AlojamientoModal';
import { loginAdmin, logoutAdmin } from './actions';

import { AdminSection } from './_types';

interface Props {
  initialDestinos: Destination[];
  initialRestaurantes: Restaurant[];
  initialAlojamientos: Accommodation[];
  initialAuthenticated?: boolean;
}

export default function AdminClient({
  initialDestinos,
  initialRestaurantes,
  initialAlojamientos,
  initialAuthenticated = false,
}: Props) {
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  const destinos = useDestinos(initialDestinos, { password, showToast });
  const restaurantes = useRestaurantes(initialRestaurantes, { password, showToast });
  const alojamientos = useAlojamientos(initialAlojamientos, { password, showToast });

  const isAnyPending =
    destinos.isPending || restaurantes.isPending || alojamientos.isPending;

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

  const navTabs = [
    { id: 'dashboard' as AdminSection, label: 'Dashboard', icon: <LayoutDashboard size={15} />, count: 0 },
    { id: 'destinos' as AdminSection, label: 'Destinos', icon: <MapPin size={15} />, count: destinos.destinos.length },
    { id: 'restaurantes' as AdminSection, label: 'Restaurantes', icon: <UtensilsCrossed size={15} />, count: restaurantes.restaurantes.length },
    { id: 'alojamientos' as AdminSection, label: 'Alojamientos', icon: <BedDouble size={15} />, count: alojamientos.alojamientos.length },
    { id: 'qrcodes' as AdminSection, label: 'Códigos QR', icon: <QrCode size={15} />, count: 0 },
    { id: 'backups' as AdminSection, label: 'Copias de Seguridad', icon: <Database size={15} />, count: 0 },
  ];

  return (
    <div className="min-h-screen bg-[#F4F3EF]">
      <AdminHeader
        activeSection={activeSection}
        navTabs={navTabs}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
      />

      <div className="max-w-[1200px] mx-auto px-4 pb-16">
        {/* Global loading overlay */}
        {isAnyPending && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center">
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
            onNavigate={setActiveSection}
          />
        )}

        {/* Tables */}
        {activeSection !== 'dashboard' &&
          activeSection !== 'qrcodes' &&
          activeSection !== 'backups' && (
            <AdminTable
              activeSection={activeSection}
              destinos={destinos.destinos}
              restaurantes={restaurantes.restaurantes}
              alojamientos={alojamientos.alojamientos}
              handlers={{
                destinos: { onNew: destinos.openNew, onEdit: destinos.openEdit, onDelete: destinos.handleDelete },
                restaurantes: { onNew: restaurantes.openNew, onEdit: restaurantes.openEdit, onDelete: restaurantes.handleDelete },
                alojamientos: { onNew: alojamientos.openNew, onEdit: alojamientos.openEdit, onDelete: alojamientos.handleDelete },
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
      </div>
    </div>
  );
}
