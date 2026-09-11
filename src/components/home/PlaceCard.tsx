import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, MessageCircle, Instagram, Facebook, Navigation, User, ArrowRight } from 'lucide-react';
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
  instagram?: string | null;
  facebook?: string | null;
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

/** Badge monocromo. El color en esta portada esta reservado a acciones y estado. */
const BADGE =
  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold capitalize border-[1.5px]';

/**
 * Tarjeta de lugar, en clave de viñeta de historieta: linea de tinta en lugar
 * de sombra difusa, un solo radio (rounded-xl) y ningun texto bajo 12px.
 * Se usa para destinos (contenido aspiracional, con foto grande). Los
 * servicios usan ServiceRow, que es una fila compacta y mas util.
 */
export function PlaceCard({ item }: { item: PlaceCardItem }) {
  const phoneClean = item.telefono?.replace(/\D/g, '');
  const whatsappClean = item.whatsapp?.replace(/\D/g, '') || phoneClean;
  const hasContact = Boolean(
    phoneClean || whatsappClean || item.instagram || item.facebook || item.coords
  );
  const status = useOpeningStatus(item.horario ?? null);

  const media = (
    <>
      <div className="relative aspect-[16/10] bg-paper-deep overflow-hidden">
        <img
          src={formatImgUrl(item.imagen)}
          alt={item.nombre}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMG;
          }}
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
          {item.badge && (
            <span className={`${BADGE} ${item.badgeClass || 'bg-paper-warm/95 text-ink border-ink/25 backdrop-blur-sm'}`}>
              {item.badge}
            </span>
          )}
          {status?.isOpen != null && (
            <span
              className={`${BADGE} text-white border-transparent ${
                status.isOpen ? 'bg-verde' : 'bg-rojo-dark'
              }`}
            >
              {status.label}
            </span>
          )}
          {item.distancia && (
            <span className={`${BADGE} bg-ink/85 text-white border-transparent backdrop-blur-sm`}>
              a {item.distancia}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display font-bold text-base text-text-primary leading-snug group-hover:text-rojo transition-colors">
          {item.nombre}
        </h3>

        {item.propietario && (
          <div className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5">
            <User size={12} className="shrink-0" />
            <span className="truncate">
              Atendido por{' '}
              <strong className="font-semibold text-text-secondary">{item.propietario}</strong>
            </span>
          </div>
        )}

        {item.direccion && (
          <div className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{item.direccion}</span>
          </div>
        )}

        {item.descripcion && (
          <p className="text-sm text-text-secondary mt-2.5 line-clamp-2 leading-relaxed">
            {item.descripcion}
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.tags.slice(0, 3).map((t, idx) => (
              <span
                key={idx}
                className="text-xs text-text-muted px-2 py-0.5 rounded-full border border-border"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {item.href && !hasContact && (
          <span className="mt-auto pt-3.5 text-sm font-bold text-rojo inline-flex items-center gap-1.5">
            Ver ficha <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </>
  );

  return (
    <article className="group w-full bg-white border-[1.5px] border-border rounded-xl overflow-hidden hover:border-ink transition-colors flex flex-col">
      {item.href ? (
        <Link href={item.href} className="flex flex-col flex-1 no-underline text-inherit">
          {media}
        </Link>
      ) : (
        <div className="flex flex-col flex-1">{media}</div>
      )}

      {hasContact && (
        <div className="p-2.5 bg-paper-warm border-t border-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {phoneClean && (
              <a
                href={`tel:${phoneClean}`}
                className="h-11 w-11 inline-flex items-center justify-center rounded-lg bg-white border-[1.5px] border-border hover:border-ink text-text-primary transition-colors"
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
                className="h-11 w-11 inline-flex items-center justify-center rounded-lg bg-white border-[1.5px] border-border hover:border-ink text-text-primary transition-colors"
                aria-label={`Escribir por WhatsApp a ${item.nombre}`}
              >
                <MessageCircle size={16} />
              </a>
            )}
            {item.instagram && (
              <a
                href={`https://instagram.com/${item.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 w-11 inline-flex items-center justify-center rounded-lg bg-white border-[1.5px] border-border hover:border-ink text-text-primary transition-colors"
                aria-label={`Ver Instagram de ${item.nombre}`}
              >
                <Instagram size={16} />
              </a>
            )}
            {item.facebook && (
              <a
                href={`https://facebook.com/${item.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 w-11 inline-flex items-center justify-center rounded-lg bg-white border-[1.5px] border-border hover:border-ink text-text-primary transition-colors"
                aria-label={`Ver Facebook de ${item.nombre}`}
              >
                <Facebook size={16} />
              </a>
            )}
          </div>

          {item.coords && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${item.coords.lat},${item.coords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-lg text-sm font-bold bg-white border-[1.5px] border-border hover:border-ink text-text-primary no-underline transition-colors"
            >
              <Navigation size={14} /> Cómo llegar
            </a>
          )}
        </div>
      )}
    </article>
  );
}
