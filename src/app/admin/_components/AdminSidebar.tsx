'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  MapPin,
  UtensilsCrossed,
  BedDouble,
  CalendarDays,
  Compass,
  QrCode,
  Database,
  Type,
  ListOrdered,
  ExternalLink,
  LogOut,
  X,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Eye,
  Radio,
  Users,
  KeyRound,
} from 'lucide-react';
import { AdminSection, AdminSessionUser } from '../_types';

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  counts: {
    destinos: number;
    restaurantes: number;
    alojamientos: number;
    eventos: number;
    rutas: number;
    usuarios?: number;
    /** Cuántos textos del sitio fueron modificados desde el CMS. */
    textos?: number;
  };
  currentUser?: AdminSessionUser | null;
  onChangePassword?: () => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  activeSection,
  onSectionChange,
  counts,
  currentUser,
  onChangePassword,
  onLogout,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const role = currentUser?.role || 'ADMIN';

  const toolItems = [
    {
      id: 'qrcodes' as AdminSection,
      label: 'Generador de QR',
      icon: QrCode,
      count: undefined,
    },
    ...(role !== 'LECTOR'
      ? [
          {
            id: 'backups' as AdminSection,
            label: 'Copias y Carga Masiva',
            icon: Database,
            count: undefined,
          },
        ]
      : []),
    ...(role === 'ADMIN'
      ? [
          {
            id: 'usuarios' as AdminSection,
            label: 'Usuarios y Accesos',
            icon: Users,
            count: counts.usuarios,
            color: 'text-rojo',
          },
        ]
      : []),
  ];

  const navGroups = [
    {
      title: 'VISIÓN GENERAL',
      items: [
        {
          id: 'dashboard' as AdminSection,
          label: 'Dashboard',
          icon: LayoutDashboard,
          count: undefined,
          highlight: false,
        },
      ],
    },
    {
      title: 'CONTENIDO EDITABLE',
      items: [
        {
          id: 'destinos' as AdminSection,
          label: 'Destinos Turísticos',
          icon: MapPin,
          count: counts.destinos,
          color: 'text-amber-500',
        },
        {
          id: 'restaurantes' as AdminSection,
          label: 'Restaurantes y Picadas',
          icon: UtensilsCrossed,
          count: counts.restaurantes,
          color: 'text-rojo',
        },
        {
          id: 'alojamientos' as AdminSection,
          label: 'Alojamientos y Cabañas',
          icon: BedDouble,
          count: counts.alojamientos,
          color: 'text-cielo',
        },
        {
          id: 'eventos' as AdminSection,
          label: 'Eventos y Festividades',
          icon: CalendarDays,
          count: counts.eventos,
          color: 'text-emerald-500',
        },
        {
          id: 'rutas' as AdminSection,
          label: 'Circuitos y Rutas',
          icon: Compass,
          count: counts.rutas,
          color: 'text-purple-500',
        },
        {
          id: 'textos' as AdminSection,
          label: 'Textos del Sitio',
          icon: Type,
          count: counts.textos,
          color: 'text-sky-500',
        },
        {
          id: 'orden' as AdminSection,
          label: 'Orden de la Portada',
          icon: ListOrdered,
          count: undefined,
          color: 'text-tierra-dark',
        },
      ],
    },
    {
      title: 'HERRAMIENTAS Y SISTEMA',
      items: toolItems,
    },
  ];

  const handleNavClick = (id: AdminSection) => {
    onSectionChange(id);
    onCloseMobile();
  };

  const getRoleDisplay = () => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Administrador',
          badgeCls: 'bg-red-50 text-rojo border-red-200',
          icon: ShieldAlert,
        };
      case 'EDITOR':
        return {
          label: 'Editor',
          badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Shield,
        };
      case 'LECTOR':
      default:
        return {
          label: 'Lector',
          badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Eye,
        };
    }
  };

  const roleInfo = getRoleDisplay();
  const RoleIcon = roleInfo.icon;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-border/80 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-border/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rojo to-rojo-dark flex items-center justify-center text-white font-display font-black text-xl shadow-md shadow-rojo/20">
            C
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base text-text-primary tracking-tight">
                Ruta Cumpeo
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rojo/10 text-rojo px-1.5 py-0.5 rounded">
                CMS
              </span>
            </div>
            <p className="text-[11px] text-text-muted font-medium">Gestor Municipal de Turismo</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-soft rounded-lg transition-colors"
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>
      </div>

      {/* Quick Website Link Button */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-border text-xs font-semibold text-text-secondary hover:text-rojo hover:border-rojo/40 hover:bg-[#FFF5F5] transition-all group shadow-2xs"
        >
          <span className="flex items-center gap-2">
            <Radio size={14} className="text-emerald-500 animate-pulse" />
            <span>Ver Portal en Vivo</span>
          </span>
          <ExternalLink size={13} className="text-text-muted group-hover:text-rojo transition-colors" />
        </Link>
      </div>

      {/* Navigation Sections */}
      <div id="tour-sidebar-nav" className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    id={`tour-nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                      isActive
                        ? 'bg-rojo text-white shadow-sm shadow-rojo/25 font-bold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        size={16}
                        className={
                          isActive
                            ? 'text-white'
                            : (item as any).color || 'text-text-muted'
                        }
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.count !== undefined && (
                      <span
                        className={`text-[10px] font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-surface-soft border border-border text-text-muted'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / User & Session */}
      <div className="p-3 border-t border-border/70 bg-[#FAF8F5]/80">
        <div className="p-3 bg-white rounded-xl border border-border/80 shadow-2xs mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200/80 flex items-center justify-center text-rojo font-bold text-xs shrink-0">
              {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-text-primary leading-tight truncate">
                {currentUser?.nombre || 'Administrador'}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${roleInfo.badgeCls}`}>
                  <RoleIcon size={10} />
                  {roleInfo.label}
                </span>
              </div>
            </div>
            {onChangePassword && (
              <button
                onClick={onChangePassword}
                className="p-1.5 text-text-muted hover:text-rojo hover:bg-surface-soft rounded-lg transition-colors shrink-0"
                title="Cambiar mi contraseña"
              >
                <KeyRound size={15} />
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition-all cursor-pointer"
        >
          <LogOut size={14} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
