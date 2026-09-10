import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, MessageCircle, Navigation, User, ArrowRight } from 'lucide-react';
import { formatImgUrl } from '@/lib/data';
import { useOpeningStatus } from '@/hooks/useOpeningStatus';
import { Horario } from '@/lib/types';

export interface PlaceCardItem {
  id: string;
  nombre: string;
  imagen?: string | null;
  badge?: string | null;
  /** Clases tailwind del badge (ver badgeStyles.ts) */
  badgeClass?: string;
  descripcion?: string | null;
  direccion?: string | null;
  propietario?: string | null;
  tags?: string[];
  /** Ficha interna. Si existe, la portada de la tarjeta es un enlace. */
  href?: string;
  telefono?: string | null;
  whatsapp?: string | null;
  coords?: { lat: number; lng: number } | null;
  /**
   * Horario crudo (solo gastronomia). Se calcula "Abierto/Cerrado" en el cliente,
   * despues del montaje, para no generar mismatches de hidratacion: ese estado
   * depende de la hora actual y no puede evaluarse igual en servidor y cliente.
   */
  horario?: Horario | string | null;
  /** Distancia ya formateada (solo modo GPS) */
  distancia?: string | null;
}

const FALLBACK_IMG = '/assets/images/placeholder.webp';

/**
 * Tarjeta unica para destinos, restaurantes y alojamientos.
 * Reemplaza las tres variantes casi identicas que vivian en ServicesSection.
 */
export function PlaceCard({ item }: { item: PlaceCardItem }) {
  const phoneClean = item.telefono?.replace(/\D/g, '');
  const whatsappClean = item.whatsapp?.replace(/\D/g, '') || phoneClean;
  const hasContact = Boolean(phoneClean || whatsappClean || item.coords);
  const status = useOpeningStatus(item.horario ?? null);

  const media = (
    <>
      <div className="relative aspect-[16/10] bg-surface-soft overflow-hidden">
        <img
          src={formatImgUrl(item.imagen)}
          alt={item.nombre}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMG;
          }}
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
          {item.badge && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wide border ${
                item.badgeClass || 'bg-white/90 text-text-primary border-border'
              }`}
            >
              {item.badge}
            </span>
          )}
          {status?.isOpen != null && (
            <span
              className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold text-white shadow-sm ${
                status.isOpen ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              {status.label}
            </span>
          )}
          {item.distancia && (
            <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-black/70 text-white backdrop-blur-sm">
              a {item.distancia}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display font-bold text-base text-text-primary leading-tight">
          {item.nombre}
        </h3>

        {item.propietario && (
          <div className="text-[0.75rem] text-text-muted mt-1 flex items-center gap-1">
            <User size={11} className="text-rojo shrink-0" />
            <span className="truncate">
              Atendido por{' '}
              <strong className="font-semibold text-text-secondary">{item.propietario}</strong>
            </span>
          </div>
        )}

        {item.direccion && (
          <div className="text-[0.75rem] text-text-muted mt-1 flex items-center gap-1">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{item.direccion}</span>
          </div>
        )}

        {item.descripcion && (
          <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">
            {item.descripcion}
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.slice(0, 4).map((t, idx) => (
              <span
                key={idx}
                className="text-[0.65rem] bg-surface-soft text-text-muted px-2 py-0.5 rounded-md border border-border"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {item.href && !hasContact && (
          <span className="mt-auto pt-3 text-xs font-bold text-rojo inline-flex items-center gap-1">
            Ver ficha completa <ArrowRight size={13} />
          </span>
        )}
      </div>
    </>
  );

  return (
    <article className="group w-full bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:border-rojo hover:shadow-md transition-all flex flex-col">
      {item.href ? (
        <Link href={item.href} className="flex flex-col flex-1 no-underline text-inherit">
          {media}
        </Link>
      ) : (
        <div className="flex flex-col flex-1">{media}</div>
      )}

      {hasContact && (
        <div className="p-2.5 bg-surface-soft border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {phoneClean && (
              <a
                href={`tel:${phoneClean}`}
                className="h-11 w-11 inline-flex items-center justify-center rounded-xl bg-white border border-border hover:border-rojo text-text-primary hover:text-rojo transition-all"
                aria-label={`Llamar a ${item.nombre}`}
              >
                <Phone size={16} />
              </a>
            )}
            {whatsappClean && (
              <a
                href={`https://wa.me/${whatsappClean}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 w-11 inline-flex items-center justify-center rounded-xl bg-white border border-border hover:border-green-500 text-green-700 transition-all"
                aria-label={`Escribir por WhatsApp a ${item.nombre}`}
              >
                <MessageCircle size={16} />
              </a>
            )}
          </div>

          {item.coords && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${item.coords.lat},${item.coords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-bold bg-white border border-border hover:border-rojo text-text-primary no-underline transition-all"
            >
              <Navigation size={13} className="text-rojo" /> Como llegar
            </a>
          )}
        </div>
      )}
    </article>
  );
}
