'use client';

import React from 'react';
import Link from 'next/link';
import {
  Menu,
  ExternalLink,
  LogOut,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Eye,
  KeyRound,
} from 'lucide-react';
import { AdminSection, AdminSessionUser } from '../_types';

interface AdminTopBarProps {
  activeSection: AdminSection;
  currentUser?: AdminSessionUser | null;
  onToggleMobileSidebar: () => void;
  onChangePassword?: () => void;
  onLogout: () => void;
}

export function AdminTopBar({
  activeSection,
  currentUser,
  onToggleMobileSidebar,
  onChangePassword,
  onLogout,
}: AdminTopBarProps) {
  const sectionMeta: Record<
    AdminSection,
    { category: string; label: string }
  > = {
    dashboard: { category: 'Visión General', label: 'Dashboard Ejecutivo' },
    destinos: { category: 'Contenido Editable', label: 'Destinos Turísticos' },
    restaurantes: { category: 'Contenido Editable', label: 'Restaurantes y Picadas' },
    alojamientos: { category: 'Contenido Editable', label: 'Alojamientos y Cabañas' },
    eventos: { category: 'Contenido Editable', label: 'Eventos y Festividades' },
    rutas: { category: 'Contenido Editable', label: 'Circuitos y Rutas' },
    qrcodes: { category: 'Herramientas', label: 'Generador de Códigos QR' },
    backups: { category: 'Sistema', label: 'Copias de Seguridad (Backup)' },
    usuarios: { category: 'Sistema', label: 'Usuarios y Permisos' },
  };

  const current = sectionMeta[activeSection] || {
    category: 'Módulo',
    label: 'Administración',
  };

  const getRoleBadge = () => {
    switch (currentUser?.role) {
      case 'ADMIN':
        return { label: 'Admin', icon: ShieldAlert, cls: 'bg-red-50 text-rojo border-red-200' };
      case 'EDITOR':
        return { label: 'Editor', icon: Shield, cls: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'LECTOR':
      default:
        return { label: 'Lector', icon: Eye, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const role = getRoleBadge();
  const RoleIcon = role.icon;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-border px-4 lg:px-8 h-16 flex items-center justify-between gap-4 select-none">
      {/* Left: Mobile Hamburger & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-surface-soft rounded-lg transition-colors border border-border"
          aria-label="Abrir navegación"
        >
          <Menu size={18} />
        </button>

        {/* Formal Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted truncate">
          <span className="font-bold text-text-secondary">CMS</span>
          <ChevronRight size={12} className="text-border shrink-0" />
          <span className="hidden sm:inline-block text-text-secondary">{current.category}</span>
          <ChevronRight size={12} className="hidden sm:inline-block text-border shrink-0" />
          <span className="font-extrabold text-rojo truncate">{current.label}</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* User Role Badge */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border bg-[#FAF8F5] border-border text-xs">
            <span className="font-medium text-text-secondary max-w-[130px] truncate">
              {currentUser.nombre}
            </span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${role.cls}`}>
              <RoleIcon size={11} />
              {role.label}
            </span>
          </div>
        )}

        {/* Change password button */}
        {onChangePassword && (
          <button
            onClick={onChangePassword}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-text-secondary hover:text-rojo hover:bg-[#FFF5F5] border border-border hover:border-rojo/30 transition-all shadow-2xs"
            title="Cambiar mi contraseña personal"
          >
            <KeyRound size={13} />
            <span>Cambiar Clave</span>
          </button>
        )}

        {/* View Public Portal */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-text-secondary hover:text-rojo hover:bg-[#FFF5F5] border border-border hover:border-rojo/30 transition-all shadow-2xs"
          title="Abrir el sitio web en una nueva pestaña"
        >
          <ExternalLink size={13} />
          <span>Ver Portal</span>
        </Link>

        {/* Quick Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-text-muted hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
          title="Cerrar sesión"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
