'use client';

import React from 'react';
import { LogOut, CheckCircle2, LayoutDashboard, MapPin, UtensilsCrossed, BedDouble } from 'lucide-react';
import { AdminSection } from '../_types';

interface NavTab {
  id: AdminSection;
  label: string;
  icon: React.ReactNode;
  count: number;
}

interface AdminHeaderProps {
  activeSection: AdminSection;
  navTabs: NavTab[];
  onSectionChange: (section: AdminSection) => void;
  onLogout: () => void;
}

export function AdminHeader({
  activeSection,
  navTabs,
  onSectionChange,
  onLogout,
}: AdminHeaderProps) {
  return (
    <>
      {/* Sub-header del panel */}
      <div className="bg-white border-b border-border shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 h-12 flex items-center justify-between gap-4">
          {/* Indicador de sección */}
          <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            <span className="text-text-muted text-xs">Panel Admin</span>
            <span className="text-border">/</span>
            <span className="text-text-primary capitalize">
              {activeSection === 'dashboard' ? 'Dashboard' :
               activeSection === 'destinos' ? 'Destinos' :
               activeSection === 'restaurantes' ? 'Restaurantes' :
               activeSection === 'alojamientos' ? 'Alojamientos' :
               activeSection === 'qrcodes' ? 'Códigos QR' : 'Copias de Seguridad'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-green-600 text-[11px] font-semibold">
              <CheckCircle2 size={10} />
              En línea
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-surface-soft transition-all"
              onClick={onLogout}
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="max-w-[1200px] mx-auto px-4 pt-5">
        <div className="flex gap-2 mb-6 flex-wrap">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                activeSection === tab.id
                  ? 'bg-rojo text-white border-rojo shadow-[0_4px_12px_rgba(230,57,70,0.25)]'
                  : 'bg-white text-text-secondary border-border hover:border-rojo/40 hover:text-rojo hover:bg-[#FFF5F5]'
              }`}
              onClick={() => onSectionChange(tab.id)}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`text-[10px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                    activeSection === tab.id
                      ? 'bg-white/25 text-white'
                      : 'bg-surface-soft text-text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
