import React from 'react';
import { Phone } from 'lucide-react';
import { Accommodation } from '@/lib/types';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field, inputCls, textareaCls, selectCls } from '../Field';
import { ImagePreview } from '../ImagePreview';

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

  const precio = editing.precio as any || {};
  const setPrecio = (patch: Record<string, any>) =>
    set({ precio: { ...precio, ...patch } as any });

  const contacto = editing.contacto as any || {};
  const setContacto = (patch: Record<string, string>) =>
    set({ contacto: { ...contacto, ...patch } });

  return (
    <ModalWrapper
      title={editing.id ? 'Editar Alojamiento' : 'Nuevo Alojamiento'}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Nombre + Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <option value="">Seleccionar tipo…</option>
              <option value="Cabaña">Cabaña</option>
              <option value="Hostal">Hostal</option>
              <option value="Hotel">Hotel</option>
              <option value="Camping">Camping</option>
              <option value="Residencial">Residencial</option>
              <option value="Agroturismo">Agroturismo</option>
            </select>
          </Field>
        </div>

        {/* Descripción */}
        <Field label="Descripción" required>
          <textarea
            required
            className={textareaCls}
            placeholder="Descripción del alojamiento y sus características…"
            value={editing.descripcion || ''}
            onChange={(e) => set({ descripcion: e.target.value })}
          />
        </Field>

        {/* Dirección + Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Dirección">
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
              placeholder="WiFi, Estacionamiento, Piscina…"
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

        {/* Precio */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-surface-soft px-4 py-2.5 text-xs font-bold text-text-secondary uppercase tracking-wide">
            Rango de Precio (CLP)
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <Field label="Precio Desde">
              <input
                type="number"
                className={inputCls}
                placeholder="25000"
                value={precio.min || ''}
                onChange={(e) => setPrecio({ min: parseInt(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Precio Hasta">
              <input
                type="number"
                className={inputCls}
                placeholder="45000"
                value={precio.max || ''}
                onChange={(e) => setPrecio({ max: parseInt(e.target.value) || 0 })}
              />
            </Field>
            <div className="col-span-2">
              <Field label="Descripción del Precio" hint="Ej: Por noche, incluye desayuno">
                <input
                  className={inputCls}
                  placeholder="Por noche por persona"
                  value={precio.descripcion || ''}
                  onChange={(e) => setPrecio({ descripcion: e.target.value })}
                />
              </Field>
            </div>
          </div>
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

        <ModalActions onClose={onClose} isPending={isPending} />
      </form>
    </ModalWrapper>
  );
}
