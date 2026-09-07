'use client';

import React from 'react';
import {
  MapPin,
  UtensilsCrossed,
  BedDouble,
  CalendarDays,
  Compass,
  Database,
  TrendingUp,
  CheckCircle2,
  Image,
  Star,
  Plus,
  ArrowRight,
  HardDrive,
  QrCode,
  Map,
} from 'lucide-react';
import { Destination, Restaurant, Accommodation, CumpeoEvent, TourRoute } from '@/lib/types';
import { StatCard } from './StatCard';
import { AdminSection } from '../_types';

interface AdminDashboardProps {
  destinos: Destination[];
  restaurantes: Restaurant[];
  alojamientos: Accommodation[];
  eventos?: CumpeoEvent[];
  rutas?: TourRoute[];
  onNavigate: (section: AdminSection) => void;
  onNewDestino?: () => void;
  onNewRestaurante?: () => void;
  onNewAlojamiento?: () => void;
  onNewEvento?: () => void;
  onNewRuta?: () => void;
}

export function AdminDashboard({
  destinos,
  restaurantes,
  alojamientos,
  eventos = [],
  rutas = [],
  onNavigate,
  onNewDestino,
  onNewRestaurante,
  onNewAlojamiento,
  onNewEvento,
  onNewRuta,
}: AdminDashboardProps) {
  const totalItems =
    destinos.length + restaurantes.length + alojamientos.length + eventos.length + rutas.length;

  const hasRealPhoto = (img?: string | null): img is string =>
    Boolean(img && !img.includes('placeholder'));

  const withImages =
    destinos.filter((d) => hasRealPhoto(d.imagenPrincipal)).length +
    restaurantes.filter((r) => hasRealPhoto(r.imagenPrincipal)).length +
    alojamientos.filter((a) => hasRealPhoto(a.imagenPrincipal)).length +
    eventos.filter((e) => hasRealPhoto(e.imagenPrincipal)).length;

  const totalPossibleImages =
    destinos.length + restaurantes.length + alojamientos.length + eventos.length;

  const imageCoveragePct =
    totalPossibleImages > 0 ? Math.round((withImages / totalPossibleImages) * 100) : 0;

  const progressItems = [
    {
      label: 'Destinos con foto de portada',
      value: destinos.filter((d) => hasRealPhoto(d.imagenPrincipal)).length,
      total: destinos.length,
    },
    {
      label: 'Restaurantes con foto de portada',
      value: restaurantes.filter((r) => hasRealPhoto(r.imagenPrincipal)).length,
      total: restaurantes.length,
    },
    {
      label: 'Alojamientos con foto de portada',
      value: alojamientos.filter((a) => hasRealPhoto(a.imagenPrincipal)).length,
      total: alojamientos.length,
    },
    {
      label: 'Eventos con foto de portada',
      value: eventos.filter((e) => hasRealPhoto(e.imagenPrincipal)).length,
      total: eventos.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-rojo-dark via-rojo to-rojo-light rounded-2xl p-6 text-white shadow-lg shadow-rojo/15 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8 select-none pointer-events-none">
          <Compass size={220} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-3 backdrop-blur-xs">
            <Star size={12} className="text-sol" />
            Panel de Control Turístico Oficial
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white mb-2">
            Ruta Turística Cumpeo
          </h1>
          <p className="text-white/90 text-sm leading-relaxed">
            Bienvenido al gestor de contenidos. Desde aquí administras todos los destinos, gastronomía, hospedajes, eventos y circuitos que ven los turistas en la plataforma móvil y en los tótems informativos.
          </p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-2xs">
        <div className="text-xs font-extrabold uppercase tracking-wider text-text-muted mb-3">
          Accesos Rápidos de Creación
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            onClick={onNewDestino || (() => onNavigate('destinos'))}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-amber-800 text-xs font-bold transition-all shadow-2xs group"
          >
            <Plus size={14} className="group-hover:scale-110 transition-transform" />
            <span>Nuevo Destino</span>
          </button>

          <button
            onClick={onNewRestaurante || (() => onNavigate('restaurantes'))}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-800 text-xs font-bold transition-all shadow-2xs group"
          >
            <Plus size={14} className="group-hover:scale-110 transition-transform" />
            <span>Restaurante</span>
          </button>

          <button
            onClick={onNewAlojamiento || (() => onNavigate('alojamientos'))}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 text-sky-800 text-xs font-bold transition-all shadow-2xs group"
          >
            <Plus size={14} className="group-hover:scale-110 transition-transform" />
            <span>Alojamiento</span>
          </button>

          <button
            onClick={onNewEvento || (() => onNavigate('eventos'))}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-800 text-xs font-bold transition-all shadow-2xs group"
          >
            <Plus size={14} className="group-hover:scale-110 transition-transform" />
            <span>Evento</span>
          </button>

          <button
            onClick={onNewRuta || (() => onNavigate('rutas'))}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-purple-800 text-xs font-bold transition-all shadow-2xs group col-span-2 sm:col-span-1"
          >
            <Plus size={14} className="group-hover:scale-110 transition-transform" />
            <span>Nueva Ruta</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard
          label="Destinos"
          value={destinos.length}
          icon={<MapPin size={22} />}
          color="text-amber-600"
          bg="bg-amber-100"
          sub={`${destinos.filter((d) => d.destacado).length} destacados`}
          onClick={() => onNavigate('destinos')}
        />
        <StatCard
          label="Restaurantes"
          value={restaurantes.length}
          icon={<UtensilsCrossed size={22} />}
          color="text-rojo"
          bg="bg-rose-100"
          sub="Gastronomía local"
          onClick={() => onNavigate('restaurantes')}
        />
        <StatCard
          label="Alojamientos"
          value={alojamientos.length}
          icon={<BedDouble size={22} />}
          color="text-cielo"
          bg="bg-sky-100"
          sub="Cabañas y hostales"
          onClick={() => onNavigate('alojamientos')}
        />
        <StatCard
          label="Eventos"
          value={eventos.length}
          icon={<CalendarDays size={22} />}
          color="text-emerald-600"
          bg="bg-emerald-100"
          sub={`${eventos.filter((e) => e.activo).length} activos`}
          onClick={() => onNavigate('eventos')}
        />
        <StatCard
          label="Circuitos"
          value={rutas.length}
          icon={<Compass size={22} />}
          color="text-purple-600"
          bg="bg-purple-100"
          sub="Rutas con GPS"
          onClick={() => onNavigate('rutas')}
        />
      </div>

      {/* Analytics & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Consejos y Buenas Prácticas para el Gestor */}
        <div className="bg-white rounded-2xl border border-border shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Star size={16} />
                </div>
                <h3 className="font-bold text-text-primary text-sm">Recomendaciones para el Administrador</h3>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Buenas Prácticas
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              Recomendaciones clave para mantener el portal atractivo y actualizado para los turistas que visitan Cumpeo:
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/60">
            {[
              {
                titulo: 'Fotos de alta calidad',
                detalle: 'Sube fotos reales y nítidas de platos, fachadas y esculturas temáticas.',
              },
              {
                titulo: 'Horarios y teléfonos al día',
                detalle: 'Verifica los horarios de fin de semana para evitar visitas a locales cerrados.',
              },
              {
                titulo: 'Circuitos y Rutas turísticas',
                detalle: 'Agrupa atractivos cercanos para facilitar el recorrido a pie por el pueblo.',
              },
              {
                titulo: 'Señalética con Códigos QR',
                detalle: 'Descarga e imprime los QR para instalarlos en tótems, placas o folletos.',
              },
            ].map((tip) => (
              <div
                key={tip.titulo}
                className="flex items-start gap-2.5 text-xs py-1.5 border-b border-border/40 last:border-none"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rojo mt-1.5 shrink-0" />
                <div>
                  <div className="font-semibold text-text-primary">{tip.titulo}</div>
                  <div className="text-[11px] text-text-muted leading-tight">{tip.detalle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Catalog Completion Quality */}
        <div className="bg-white rounded-2xl border border-border shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-sky-50 text-cielo">
                  <TrendingUp size={16} />
                </div>
                <h3 className="font-bold text-text-primary text-sm">Calidad y Cobertura Visual</h3>
              </div>
              <span className="text-[11px] font-bold text-text-secondary bg-surface-soft border border-border px-2 py-0.5 rounded-full">
                {imageCoveragePct}% promedio
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              Porcentaje de fichas que ya cuentan con fotografía de portada para garantizar una experiencia atractiva al turista.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-border/60">
            {progressItems.map((item) => {
              const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary font-medium">{item.label}</span>
                    <span className="font-bold text-text-primary">
                      {item.value} / {item.total}{' '}
                      <span className="text-text-muted font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-soft rounded-full overflow-hidden border border-border/80">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rojo'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Records Showcase */}
      {destinos.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-rojo" />
              <h3 className="font-bold text-text-primary text-sm">
                Últimos Destinos Registrados
              </h3>
            </div>
            <button
              className="text-xs font-bold text-rojo hover:underline flex items-center gap-1"
              onClick={() => onNavigate('destinos')}
            >
              <span>Ver todos ({destinos.length})</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-border">
            {destinos.slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#FAF8F5] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-surface-soft border border-border shrink-0">
                    {hasRealPhoto(d.imagenPrincipal) ? (
                      <img
                        src={
                          d.imagenPrincipal.startsWith('/') || d.imagenPrincipal.startsWith('http')
                            ? d.imagenPrincipal
                            : `/${d.imagenPrincipal}`
                        }
                        alt={d.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image size={16} className="text-text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-text-primary truncate">
                      {d.nombre}
                    </div>
                    <div className="text-[11px] text-text-muted capitalize flex items-center gap-2">
                      <span>{d.categoria}</span>
                      {d.horario && (
                        <>
                          <span className="text-border">/</span>
                          <span className="truncate">{d.horario}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {d.destacado && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star size={10} className="fill-amber-500 text-amber-500" />
                      Destacado
                    </span>
                  )}
                  <button
                    onClick={() => onNavigate('destinos')}
                    className="text-xs font-semibold text-cielo hover:underline px-2 py-1"
                  >
                    Gestionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
