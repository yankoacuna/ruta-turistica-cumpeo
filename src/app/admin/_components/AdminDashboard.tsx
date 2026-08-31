'use client';

import React from 'react';
import {
  MapPin,
  UtensilsCrossed,
  BedDouble,
  Database,
  TrendingUp,
  CheckCircle2,
  Image,
  Star,
} from 'lucide-react';
import { Destination, Restaurant, Accommodation } from '@/lib/types';
import { StatCard } from './StatCard';
import { AdminSection } from '../_types';

interface AdminDashboardProps {
  destinos: Destination[];
  restaurantes: Restaurant[];
  alojamientos: Accommodation[];
  onNavigate: (section: AdminSection) => void;
}

export function AdminDashboard({
  destinos,
  restaurantes,
  alojamientos,
  onNavigate,
}: AdminDashboardProps) {
  const progressItems = [
    {
      label: 'Destinos destacados',
      value: destinos.filter((d) => d.destacado).length,
      total: destinos.length,
    },
    {
      label: 'Destinos con imagen',
      value: destinos.filter((d) => d.imagenPrincipal).length,
      total: destinos.length,
    },
    {
      label: 'Restaurantes con imagen',
      value: restaurantes.filter((r) => r.imagenPrincipal).length,
      total: restaurantes.length,
    },
    {
      label: 'Alojamientos con imagen',
      value: alojamientos.filter((a) => a.imagenPrincipal).length,
      total: alojamientos.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Destinos Turísticos"
          value={destinos.length}
          icon={<MapPin size={24} />}
          color="text-sol-dark"
          bg="bg-[#FFF3C4]"
          sub={`${destinos.filter((d) => d.destacado).length} destacados`}
          onClick={() => onNavigate('destinos')}
        />
        <StatCard
          label="Restaurantes"
          value={restaurantes.length}
          icon={<UtensilsCrossed size={24} />}
          color="text-rojo"
          bg="bg-[#FFE0E2]"
          sub="Gastronomía típica maulina"
          onClick={() => onNavigate('restaurantes')}
        />
        <StatCard
          label="Alojamientos"
          value={alojamientos.length}
          icon={<BedDouble size={24} />}
          color="text-cielo"
          bg="bg-[#E0F2FE]"
          sub="Hospedajes y cabañas"
          onClick={() => onNavigate('alojamientos')}
        />
      </div>

      {/* Info + progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-rojo" />
            <h3 className="font-bold text-text-primary text-sm">Estado del Sistema</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Base de datos activa. Los cambios guardados se reflejan en el portal turístico en tiempo real sin necesidad de reiniciar servicios.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {[
              { label: 'Base de datos PostgreSQL', ok: true },
              { label: 'Servidor API & Server Actions', ok: true },
              { label: 'Geolocalización GPS', ok: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-none">
                <span className="text-text-secondary">{s.label}</span>
                <span className="flex items-center gap-1 font-bold text-green-600">
                  <CheckCircle2 size={12} /> Operativo
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-cielo" />
            <h3 className="font-bold text-text-primary text-sm">Resumen de Contenidos</h3>
          </div>
          <div className="space-y-3 mt-4">
            {progressItems.map((item) => {
              const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex-1 text-xs text-text-secondary">{item.label}</div>
                  <div className="text-xs font-bold text-text-primary">
                    {item.value}/{item.total}
                  </div>
                  <div className="w-24 h-2 bg-surface-soft rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-rojo rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-text-muted w-8 text-right">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent destinos list */}
      {destinos.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
              <MapPin size={15} className="text-rojo" />
              Últimos Destinos Registrados
            </h3>
            <button
              className="text-xs font-bold text-rojo hover:underline"
              onClick={() => onNavigate('destinos')}
            >
              Ver todos
            </button>
          </div>
          <div className="divide-y divide-border">
            {destinos.slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-surface-soft/60 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-soft border border-border shrink-0">
                  {d.imagenPrincipal ? (
                    <img
                      src={
                        d.imagenPrincipal.startsWith('/')
                          ? d.imagenPrincipal
                          : `/${d.imagenPrincipal}`
                      }
                      alt={d.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          '/assets/images/placeholder.webp';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image size={14} className="text-text-muted" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary truncate">
                    {d.nombre}
                  </div>
                  <div className="text-[11px] text-text-muted capitalize">{d.categoria}</div>
                </div>
                {d.destacado && (
                  <span className="text-[10px] font-bold bg-[#FFF3C4] text-[#B47900] px-2 py-0.5 rounded-full border border-[#FDE68A] flex items-center gap-1">
                    <Star size={10} /> Destacado
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
