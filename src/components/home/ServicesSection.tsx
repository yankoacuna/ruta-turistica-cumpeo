'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  BedDouble,
  Camera,
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  User,
  ArrowRight,
  Store,
} from 'lucide-react';
import { Restaurant, Accommodation, Destination } from '@/lib/types';
import { formatImgUrl, getCategoryColorClass } from '@/lib/data';
import { getOpeningStatus } from '@/lib/openingHours';
import { getBadgeStyle } from './badgeStyles';

interface ServicesSectionProps {
  restaurants: Restaurant[];
  accommodations: Accommodation[];
  destinations: Destination[];
  categories: Array<{ id: string; nombre: string }>;
  onOpenEmergencyModal: () => void;
}

export function ServicesSection({
  restaurants,
  accommodations,
  destinations,
  categories,
  onOpenEmergencyModal,
}: ServicesSectionProps) {
  const [activeTab, setActiveTab] = useState<'gastronomia' | 'alojamientos' | 'destinos'>('gastronomia');
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  const filteredDestinations =
    activeCategory === 'todos'
      ? destinations
      : destinations.filter((d) => d.categoria === activeCategory);

  return (
    <section className="py-10 w-full max-w-[1200px] mx-auto px-4" id="section-servicios">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rojo uppercase tracking-wider mb-1">
            <UtensilsCrossed size={14} /> Comercio y Servicios Locales
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-text-primary">
            Donde Comer, Dormir y Disfrutar
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Catastro oficial de restaurantes criollos, hospedajes campesinos y destinos turisticos registrados en la comuna.
          </p>
        </div>

        {/* Selector de pestañas */}
        <div className="inline-flex p-1 bg-white border border-border rounded-2xl shadow-xs self-start md:self-auto">
          <button
            onClick={() => setActiveTab('gastronomia')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'gastronomia'
                ? 'bg-rojo text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <UtensilsCrossed size={13} /> Gastronomia ({restaurants.length})
          </button>
          <button
            onClick={() => setActiveTab('alojamientos')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'alojamientos'
                ? 'bg-rojo text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <BedDouble size={13} /> Alojamientos ({accommodations.length})
          </button>
          <button
            onClick={() => setActiveTab('destinos')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'destinos'
                ? 'bg-rojo text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Camera size={13} /> Todos los Destinos ({destinations.length})
          </button>
        </div>
      </div>

      {/* TAB 1: GASTRONOMÍA */}
      {activeTab === 'gastronomia' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((r) => {
            const opening = getOpeningStatus(r.horario);
            const phoneClean = r.telefono?.replace(/\D/g, '');
            const whatsappClean = r.whatsapp?.replace(/\D/g, '') || phoneClean;

            return (
              <article
                key={r.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-2xs hover:border-rojo hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/10] bg-surface-soft overflow-hidden">
                    <img
                      src={formatImgUrl(r.imagenPrincipal)}
                      alt={r.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-black uppercase bg-[#FFE0E2] text-rojo border border-[#FFA8AE]">
                        {r.tipo || 'Restaurante'}
                      </span>
                      {opening.isOpen !== null && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold text-white shadow-xs ${
                            opening.isOpen ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        >
                          {opening.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-display font-bold text-base text-text-primary leading-tight">
                      {r.nombre}
                    </h3>

                    {r.propietario && (
                      <div className="text-[0.75rem] text-text-muted mt-1 flex items-center gap-1">
                        <User size={11} className="text-rojo shrink-0" />
                        <span>
                          Atendido por:{' '}
                          <strong className="font-semibold text-text-secondary">
                            {r.propietario}
                          </strong>
                        </span>
                      </div>
                    )}

                    {r.direccion && (
                      <div className="text-[0.75rem] text-text-muted mt-1 flex items-center gap-1">
                        <MapPin size={11} className="text-text-muted shrink-0" />
                        <span>{r.direccion}</span>
                      </div>
                    )}

                    <p className="text-xs text-text-secondary mt-2.5 line-clamp-2 leading-relaxed">
                      {r.descripcion}
                    </p>

                    {r.mediosPago && r.mediosPago.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {r.mediosPago.map((pago, idx) => (
                          <span
                            key={idx}
                            className="text-[0.65rem] bg-surface-soft text-text-muted px-2 py-0.5 rounded-md border border-border"
                          >
                            {pago}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de contacto y mapas */}
                <div className="p-3 bg-surface-soft border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {r.telefono && (
                      <a
                        href={`tel:${phoneClean}`}
                        className="p-2 rounded-xl bg-white border border-border hover:border-rojo text-text-primary hover:text-rojo transition-all"
                        title={`Llamar a ${r.nombre}`}
                      >
                        <Phone size={14} />
                      </a>
                    )}
                    {whatsappClean && (
                      <a
                        href={`https://wa.me/${whatsappClean}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white border border-border hover:border-green-500 text-green-700 transition-all"
                        title="Contactar por WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>
                    )}
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${r.coordenadas.lat},${r.coordenadas.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-border hover:border-rojo text-text-primary no-underline transition-all shadow-2xs"
                  >
                    <Navigation size={12} className="text-rojo" /> Como llegar
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* TAB 2: ALOJAMIENTOS */}
      {activeTab === 'alojamientos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {accommodations.map((a) => {
            const phoneClean = a.telefono?.replace(/\D/g, '');
            const whatsappClean = a.whatsapp?.replace(/\D/g, '') || phoneClean;

            return (
              <article
                key={a.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-2xs hover:border-rojo hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/10] bg-surface-soft overflow-hidden">
                    <img
                      src={formatImgUrl(a.imagenPrincipal)}
                      alt={a.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-black uppercase bg-sol/20 text-[#B47900] border border-sol/40">
                        {a.tipo || 'Alojamiento'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-display font-bold text-base text-text-primary leading-tight">
                      {a.nombre}
                    </h3>

                    {a.propietario && (
                      <div className="text-[0.75rem] text-text-muted mt-1 flex items-center gap-1">
                        <User size={11} className="text-rojo shrink-0" />
                        <span>
                          Atendido por:{' '}
                          <strong className="font-semibold text-text-secondary">
                            {a.propietario}
                          </strong>
                        </span>
                      </div>
                    )}

                    {a.direccion && (
                      <div className="text-[0.75rem] text-text-muted mt-1 flex items-center gap-1">
                        <MapPin size={11} className="text-text-muted shrink-0" />
                        <span>{a.direccion}</span>
                      </div>
                    )}

                    <p className="text-xs text-text-secondary mt-2.5 line-clamp-2 leading-relaxed">
                      {a.descripcion}
                    </p>

                    {a.servicios && a.servicios.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {a.servicios.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[0.65rem] bg-surface-soft text-text-muted px-2 py-0.5 rounded-md border border-border"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-surface-soft border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {a.telefono && (
                      <a
                        href={`tel:${phoneClean}`}
                        className="p-2 rounded-xl bg-white border border-border hover:border-rojo text-text-primary hover:text-rojo transition-all"
                        title={`Llamar a ${a.nombre}`}
                      >
                        <Phone size={14} />
                      </a>
                    )}
                    {whatsappClean && (
                      <a
                        href={`https://wa.me/${whatsappClean}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white border border-border hover:border-green-500 text-green-700 transition-all"
                        title="Contactar por WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>
                    )}
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${a.coordenadas.lat},${a.coordenadas.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-border hover:border-rojo text-text-primary no-underline transition-all shadow-2xs"
                  >
                    <Navigation size={12} className="text-rojo" /> Como llegar
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* TAB 3: TODOS LOS DESTINOS */}
      {activeTab === 'destinos' && (
        <div>
          {/* Filtros de categoria */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            <button
              onClick={() => setActiveCategory('todos')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === 'todos'
                  ? 'bg-[#1E1E24] text-white'
                  : 'bg-white text-text-secondary border border-border'
              }`}
            >
              Todos ({destinations.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeCategory === c.id
                    ? 'bg-rojo text-white shadow-xs'
                    : 'bg-white text-text-secondary border border-border'
                }`}
              >
                {c.nombre}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinations.map((d) => (
              <article
                key={d.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-2xs hover:border-rojo hover:shadow-md transition-all flex flex-col justify-between"
              >
                <Link href={`/destino/${d.slug}`} className="no-underline text-inherit flex flex-col flex-1">
                  <div className="relative aspect-[16/10] bg-surface-soft overflow-hidden">
                    <img
                      src={formatImgUrl(d.imagenPrincipal)}
                      alt={d.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wide border ${getBadgeStyle(
                          getCategoryColorClass(d.categoria)
                        )}`}
                      >
                        {d.categoria}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base text-text-primary leading-tight">
                        {d.nombre}
                      </h3>
                      {d.direccion && (
                        <div className="text-[0.75rem] text-text-muted mt-1 flex items-center gap-1">
                          <MapPin size={11} className="text-text-muted shrink-0" />
                          <span>{d.direccion}</span>
                        </div>
                      )}
                      <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">
                        {d.descripcionCorta}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs font-bold text-rojo">
                      <span>Ver detalles completos</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Banner institucional para comerciantes y emprendedores */}
      <div className="mt-12 p-6 rounded-2xl bg-white border border-border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rojo/10 text-rojo flex items-center justify-center shrink-0">
            <Store size={20} />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-text-primary">
              ¿Tienes un local gastronomico, cabaña o taller artesanal en Cumpeo?
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">
              Acercate a la Oficina de Turismo de la Ilustre Municipalidad de Rio Claro para registrar tu emprendimiento en el catastro comunal oficial.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenEmergencyModal}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1E1E24] hover:bg-black text-white transition-all shrink-0 cursor-pointer"
        >
          Contacto Municipal
        </button>
      </div>
    </section>
  );
}
