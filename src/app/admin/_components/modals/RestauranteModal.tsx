import React from 'react';
import { Phone } from 'lucide-react';
import { Restaurant } from '@/lib/types';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field, inputCls, textareaCls } from '../Field';
import { ImagePreview } from '../ImagePreview';
import { GalleryField } from '../GalleryField';

interface RestauranteModalProps {
  editing: Partial<Restaurant>;
  onChange: (updated: Partial<Restaurant>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
}

export function RestauranteModal({
  editing,
  onChange,
  onSubmit,
  onClose,
  isPending,
}: RestauranteModalProps) {
  const set = (patch: Partial<Restaurant>) => onChange({ ...editing, ...patch });

  const contacto = editing.contacto as any || {};
  const setContacto = (patch: Record<string, string>) =>
    set({ contacto: { ...contacto, ...patch } });

  const horario = editing.horario as any || {};
  const setHorario = (patch: Record<string, string>) =>
    set({ horario: { ...horario, ...patch } });

  return (
    <ModalWrapper
      title={editing.id ? 'Editar Restaurante' : 'Nuevo Restaurante'}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Nombre */}
        <Field label="Nombre" required>
          <input
            required
            className={inputCls}
            placeholder="Nombre del restaurante"
            value={editing.nombre || ''}
            onChange={(e) => set({ nombre: e.target.value })}
          />
        </Field>

        {/* Especialidad + Plato estrella */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Especialidad">
            <input
              className={inputCls}
              placeholder="Ej: Cocina típica maulina"
              value={editing.especialidad || ''}
              onChange={(e) => set({ especialidad: e.target.value })}
            />
          </Field>
          <Field label="Plato Estrella">
            <input
              className={inputCls}
              placeholder="Ej: Cazuela de vacuno"
              value={editing.platoEstrella || ''}
              onChange={(e) => set({ platoEstrella: e.target.value })}
            />
          </Field>
        </div>

        {/* Descripción */}
        <Field label="Descripción" required>
          <textarea
            required
            className={textareaCls}
            placeholder="Descripción del restaurante y su propuesta gastronómica…"
            value={editing.descripcion || ''}
            onChange={(e) => set({ descripcion: e.target.value })}
          />
        </Field>

        {/* Dirección + Horario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Dirección">
            <input
              className={inputCls}
              placeholder="Calle / Localidad"
              value={editing.direccion || ''}
              onChange={(e) => set({ direccion: e.target.value })}
            />
          </Field>
          <Field label="Horario de Atención">
            <input
              className={inputCls}
              placeholder="Lun–Dom 12:00–22:00"
              value={horario.descripcion || ''}
              onChange={(e) => setHorario({ descripcion: e.target.value })}
            />
          </Field>
        </div>

        {/* Contacto */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-surface-soft px-4 py-2.5 text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
            <Phone size={12} /> Información de Contacto
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Teléfono">
              <input
                className={inputCls}
                placeholder="+56 71 XXX XXXX"
                value={contacto.telefono || ''}
                onChange={(e) => setContacto({ telefono: e.target.value })}
              />
            </Field>
            <Field label="WhatsApp">
              <input
                className={inputCls}
                placeholder="+56 9 XXXX XXXX"
                value={contacto.whatsapp || ''}
                onChange={(e) => setContacto({ whatsapp: e.target.value })}
              />
            </Field>
            <Field label="Instagram">
              <input
                className={inputCls}
                placeholder="@nombre_local"
                value={contacto.instagram || ''}
                onChange={(e) => setContacto({ instagram: e.target.value })}
              />
            </Field>
            <Field label="Sitio Web">
              <input
                className={inputCls}
                placeholder="https://..."
                value={contacto.web || ''}
                onChange={(e) => setContacto({ web: e.target.value })}
              />
            </Field>
          </div>
        </div>

        {/* URL menú */}
        <Field label="URL del Menú" hint="Enlace a carta digital o PDF">
          <input
            className={inputCls}
            placeholder="https://..."
            value={editing.menuUrl || ''}
            onChange={(e) => set({ menuUrl: e.target.value })}
          />
        </Field>

        {/* Coordenadas */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitud">
            <input
              type="number"
              step="0.000001"
              className={inputCls}
              value={editing.coordenadas?.lat ?? -35.267}
              onChange={(e) =>
                set({ coordenadas: { ...editing.coordenadas!, lat: parseFloat(e.target.value) } })
              }
            />
          </Field>
          <Field label="Longitud">
            <input
              type="number"
              step="0.000001"
              className={inputCls}
              value={editing.coordenadas?.lng ?? -71.25}
              onChange={(e) =>
                set({ coordenadas: { ...editing.coordenadas!, lng: parseFloat(e.target.value) } })
              }
            />
          </Field>
        </div>

        {/* Imagen */}
        <Field label="URL Imagen Principal" hint="Ruta relativa o URL completa">
          <input
            className={inputCls}
            placeholder="/assets/images/..."
            value={editing.imagenPrincipal || ''}
            onChange={(e) => set({ imagenPrincipal: e.target.value })}
          />
          <ImagePreview url={editing.imagenPrincipal} />
        </Field>

        {/* Galería de fotos del local */}
        <GalleryField
          images={editing.galeria || []}
          onChange={(images) => set({ galeria: images })}
        />

        <ModalActions onClose={onClose} isPending={isPending} />
      </form>
    </ModalWrapper>
  );
}
