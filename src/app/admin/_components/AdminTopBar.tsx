'use client';

import React from 'react';
import Link from 'next/link';
import {
  Menu,
  ExternalLink,
  LogOut,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { AdminSection } from '../_types';

interface AdminTopBarProps {
  activeSection: AdminSection;
  onToggleMobileSidebar: () => void;
  onLogout: () => void;
}

export function AdminTopBar({
  activeSection,
  onToggleMobileSidebar,
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
  };

  const current = sectionMeta[activeSection] || {
    category: 'Módulo',
    label: 'Administración',
  };

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
        {/* Real-time Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-bold">
          <CheckCircle2 size={12} />
          <span>Portal en Línea</span>
        </div>

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
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-text-muted hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
          title="Cerrar sesión de administrador"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
