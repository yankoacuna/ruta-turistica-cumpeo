import React from 'react';
import { MapPin, Phone, MessageCircle, Navigation, User } from 'lucide-react';
import { formatImgUrl } from '@/lib/data';
import { useOpeningStatus } from '@/hooks/useOpeningStatus';
import type { PlaceCardItem } from './PlaceCard';

const FALLBACK_IMG = '/assets/images/placeholder.webp';

/**
 * Fila compacta de servicio (gastronomia y alojamiento).
 *
 * Por que no una tarjeta con foto 16/10 como los destinos: un restaurante o
 * una cabaña no se eligen por una foto de portada, se eligen por horario,
 * direccion y un boton para llamar. La version anterior gastaba media pantalla
 * de telefono por local y obligaba a hacer scroll por seis tarjetas casi
 * identicas. Aca la foto es una miniatura y las acciones estan siempre a mano.
 */
export function ServiceRow({ item }: { item: PlaceCardItem }) {
  const phoneClean = item.telefono?.replace(/\D/g, '');
  const whatsappClean = item.whatsapp?.replace(/\D/g, '') || phoneClean;
  const status = useOpeningStatus(item.horario ?? null);

  return (
    <article className="bg-white border-[1.5px] border-border rounded-xl p-3.5 flex flex-col gap-3 hover:border-ink transition-colors">
      <div className="flex items-start gap-3.5">
        <img
          src={formatImgUrl(item.imagen)}
          alt={item.nombre}
          loading="lazy"
          className="w-[76px] h-[76px] rounded-lg object-cover bg-paper-deep shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMG;
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-bold text-base text-text-primary leading-snug">
              {item.nombre}
            </h3>
            {status?.isOpen != null && (
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold text-white ${
                  status.isOpen ? 'bg-verde' : 'bg-rojo-dark'
                }`}
              >
                {status.label}
              </span>
            )}
          </div>

          {item.badge && (
            <div className="text-xs font-semibold text-text-muted capitalize mt-0.5">
              {item.badge}
            </div>
          )}

          {item.propietario && (
            <div className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5">
              <User size={12} className="shrink-0" />
              <span className="truncate">{item.propietario}</span>
            </div>
          )}

          {item.direccion && (
            <div className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{item.direccion}</span>
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
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
        </div>
      </div>

      {(phoneClean || whatsappClean || item.coords) && (
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          {phoneClean && (
            <a
              href={`tel:${phoneClean}`}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-bold bg-paper-warm border-[1.5px] border-border hover:border-ink text-text-primary no-underline transition-colors"
            >
              <Phone size={15} /> Llamar
            </a>
          )}
          {whatsappClean && (
            <a
              href={`https://wa.me/${whatsappClean}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-bold bg-paper-warm border-[1.5px] border-border hover:border-ink text-text-primary no-underline transition-colors"
            >
              <MessageCircle size={15} /> WhatsApp
            </a>
          )}
          {item.coords && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${item.coords.lat},${item.coords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-bold bg-ink hover:bg-ink-soft text-white no-underline transition-colors"
            >
              <Navigation size={15} /> Ir
            </a>
          )}
        </div>
      )}
    </article>
  );
}
