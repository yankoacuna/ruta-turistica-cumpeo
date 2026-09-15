'use client';

import React from 'react';
import { X, MapPin, Phone, MessageCircle, Instagram, Facebook, Navigation, User, Clock } from 'lucide-react';
import { formatImgUrl } from '@/lib/data';
import { formatHorario } from '@/lib/openingHours';
import { useOpeningStatus } from '@/hooks/useOpeningStatus';
import type { PlaceCardItem } from './PlaceCard';

const FALLBACK_IMG = '/assets/images/placeholder.webp';

/**
 * Ficha rapida de un servicio (gastronomia / alojamiento) en un modal.
 *
 * Ni restaurantes ni alojamientos tienen pagina propia (a diferencia de los
 * destinos, con /destino/[slug]): toda su info ya vive en la fila compacta
 * de ServiceRow, pero comprimida. Este modal la despliega completa -
 * descripcion entera, galeria de fotos guardada en el catastro - sin tener
 * que crear una ruta nueva para cada uno.
 */
export function PlaceDetailModal({
  item,
  onClose,
}: {
  item: PlaceCardItem | null;
  onClose: () => void;
}) {
  const status = useOpeningStatus(item?.horario ?? null);

  if (!item) return null;

  const phoneClean = item.telefono?.replace(/\D/g, '');
  const whatsappClean = item.whatsapp?.replace(/\D/g, '') || phoneClean;
  const horarioTexto = formatHorario(item.horario ?? null);
  const photos = [item.imagen, ...(item.galeria || [])].filter(Boolean) as string[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img
            src={formatImgUrl(item.imagen)}
            alt={item.nombre}
            className="w-full h-48 object-cover bg-paper-deep"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMG;
            }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          {item.badge && (
            <span className="absolute bottom-3 left-4 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-white/95 text-ink border border-ink/25 backdrop-blur-sm">
              {item.badge}
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-extrabold text-xl text-text-primary leading-snug">
              {item.nombre}
            </h3>
            {status?.isOpen != null && (
              <span
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold text-white ${
                  status.isOpen ? 'bg-verde' : 'bg-rojo-dark'
                }`}
              >
                {status.label}
              </span>
            )}
          </div>

          <div className="mt-3 space-y-1.5 text-sm text-text-secondary">
            {item.propietario && (
              <div className="flex items-center gap-1.5">
                <User size={14} className="shrink-0 text-text-muted" />
                <span>{item.propietario}</span>
              </div>
            )}
            {item.direccion && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="shrink-0 text-text-muted" />
                <span>{item.direccion}</span>
              </div>
            )}
            {horarioTexto && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="shrink-0 text-text-muted" />
                <span>{horarioTexto}</span>
              </div>
            )}
          </div>

          {item.descripcion && (
            <p className="mt-4 text-sm text-text-primary leading-relaxed whitespace-pre-line">
              {item.descripcion}
            </p>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {item.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-xs text-text-muted px-2.5 py-1 rounded-full border border-border"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {photos.length > 1 && (
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Fotos
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden bg-paper-deep border border-border"
                  >
                    <img
                      src={formatImgUrl(url)}
                      alt={`${item.nombre} ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMG;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(phoneClean || whatsappClean || item.instagram || item.facebook || item.coords) && (
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border">
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
              {item.instagram && (
                <a
                  href={`https://instagram.com/${item.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-lg bg-paper-warm border-[1.5px] border-border hover:border-ink text-text-primary transition-colors"
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
                  className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-lg bg-paper-warm border-[1.5px] border-border hover:border-ink text-text-primary transition-colors"
                  aria-label={`Ver Facebook de ${item.nombre}`}
                >
                  <Facebook size={16} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
