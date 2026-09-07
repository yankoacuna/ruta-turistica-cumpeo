import React from 'react';
import { Phone, User } from 'lucide-react';
import { Accommodation } from '@/lib/types';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field, inputCls, textareaCls, selectCls } from '../Field';
import { ImageUploadField } from '../ImageUploadField';
import { GalleryField } from '../GalleryField';

interface AlojamientoModalProps {
  editing: Partial<Accommodation>;
  onChange: (updated: Partial<Accommodation>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
}

export function AlojamientoModal({
  editing,
  onChange,
  onSubmit,
  onClose,
  isPending,
}: AlojamientoModalProps) {
  const set = (patch: Partial<Accommodation>) => onChange({ ...editing, ...patch });

  const contacto = editing.contacto as any || {};
  const setContacto = (patch: Record<string, string>) =>
    set({ contacto: { ...contacto, ...patch } });

  return (
    <ModalWrapper
      title={editing.id ? 'Editar Alojamiento' : 'Nuevo Alojamiento'}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Nombre + Tipo + Estado Activo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Field label="Nombre" required>
            <input
              required
              className={inputCls}
              placeholder="Nombre del hospedaje"
              value={editing.nombre || ''}
              onChange={(e) => set({ nombre: e.target.value })}
            />
          </Field>
          <Field label="Tipo de Alojamiento">
            <select
              className={selectCls}
              value={editing.tipo || ''}
              onChange={(e) => set({ tipo: e.target.value })}
            >
              <option value="">Seleccionar tipoâ€¦</option>
              <option value="CabaÃ±a">CabaÃ±a</option>
              <option value="Hostal">Hostal</option>
              <option value="Hotel">Hotel</option>
              <option value="Camping">Camping</option>
              <option value="Residencial">Residencial</option>
              <option value="Agroturismo">Agroturismo</option>
            </select>
          </Field>
          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-surface-soft h-[42px]">
            <input
              type="checkbox"
              id="acc-activo"
              checked={editing.activo ?? true}
              onChange={(e) => set({ activo: e.target.checked })}
              className="w-4 h-4 text-rojo rounded border-border focus:ring-rojo cursor-pointer"
            />
            <label htmlFor="acc-activo" className="text-xs font-bold text-text-primary cursor-pointer select-none">
              {editing.activo ?? true ? 'Visible en el portal' : 'Oculto (En Pausa)'}
            </label>
          </div>
        </div>

        {/* Propietario */}
        <Field label="Propietario" hint="Nombre del dueño o encargado">
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className={inputCls + ' pl-8'}
              placeholder="Ej: Patricia Navarro Troncoso"
              value={editing.propietario || ''}
              onChange={(e) => set({ propietario: e.target.value })}
            />
          </div>
        </Field>

        {/* DescripciÃ³n */}
        <Field label="DescripciÃ³n" required>
          <textarea
            required
            className={textareaCls}
            placeholder="DescripciÃ³n del alojamiento y sus caracterÃ­sticasâ€¦"
            value={editing.descripcion || ''}
            onChange={(e) => set({ descripcion: e.target.value })}
          />
        </Field>

        {/* DirecciÃ³n + Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="DirecciÃ³n">
            <input
              className={inputCls}
              placeholder="Calle / Localidad"
              value={editing.direccion || ''}
              onChange={(e) => set({ direccion: e.target.value })}
            />
          </Field>
          <Field label="Servicios" hint="Separados por coma">
            <input
              className={inputCls}
              placeholder="WiFi, Estacionamiento, Piscinaâ€¦"
              value={(editing.servicios || []).join(', ')}
              onChange={(e) =>
                set({
                  servicios: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
        </div>


        {/* Contacto */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-surface-soft px-4 py-2.5 text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
            <Phone size={12} /> InformaciÃ³n de Contacto
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="TelÃ©fono (Llamadas)">
              <input
                className={inputCls}
                placeholder="+56 9 XXXX XXXX"
                value={editing.telefono || contacto.telefono || ''}
                onChange={(e) => {
                  setContacto({ telefono: e.target.value });
                  set({ telefono: e.target.value });
                }}
              />
            </Field>
            <Field label="WhatsApp">
              <input
                className={inputCls}
                placeholder="+56 9 XXXX XXXX"
                value={editing.whatsapp || contacto.whatsapp || ''}
                onChange={(e) => {
                  setContacto({ whatsapp: e.target.value });
                  set({ whatsapp: e.target.value });
                }}
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
            <Field label="Instagram">
              <input
                className={inputCls}
                placeholder="@nombre_hospedaje"
                value={contacto.instagram || ''}
                onChange={(e) => setContacto({ instagram: e.target.value })}
              />
            </Field>
          </div>
        </div>

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

        <ImageUploadField
          label="Imagen Principal"
          value={editing.imagenPrincipal || ''}
          onChange={(url) => set({ imagenPrincipal: url })}
        />

        {/* Galería de fotos */}
        <GalleryField
          images={editing.galeria || []}
          onChange={(images) => set({ galeria: images })}
        />

        <ModalActions onClose={onClose} isPending={isPending} />
      </form>
    </ModalWrapper>
  );
}

