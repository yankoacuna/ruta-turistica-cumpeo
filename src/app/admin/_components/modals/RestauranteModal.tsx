import React from 'react';
import { Phone, User, CreditCard } from 'lucide-react';
import { Restaurant } from '@/lib/types';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field, inputCls, textareaCls, selectCls } from '../Field';
import { ImageUploadField } from '../ImageUploadField';
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
        {/* Nombre + Estado Activo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <Field label="Nombre" required>
              <input
                required
                className={inputCls}
                placeholder="Nombre del restaurante"
                value={editing.nombre || ''}
                onChange={(e) => set({ nombre: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-surface-soft h-[42px]">
            <input
              type="checkbox"
              id="rest-activo"
              checked={editing.activo ?? true}
              onChange={(e) => set({ activo: e.target.checked })}
              className="w-4 h-4 text-rojo rounded border-border focus:ring-rojo cursor-pointer"
            />
            <label htmlFor="rest-activo" className="text-xs font-bold text-text-primary cursor-pointer select-none">
              {editing.activo ?? true ? 'Visible en el portal' : 'Oculto (En Pausa)'}
            </label>
          </div>
        </div>

        {/* Tipo + Propietario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tipo de Local">
            <select
              className={selectCls}
              value={editing.tipo || ''}
              onChange={(e) => set({ tipo: e.target.value })}
            >
              <option value="">Seleccionar tipo…</option>
              <option value="restaurante">Restaurante</option>
              <option value="picada">Picada</option>
              <option value="restaurante-bar">Restaurante-Bar</option>
              <option value="restaurante-tematico">Restaurante Temático</option>
              <option value="cafeteria">Cafetería</option>
              <option value="parrilla">Parrilla / Quincho</option>
              <option value="minimarket">Minimarket</option>
            </select>
          </Field>
          <Field label="Propietario" hint="Nombre del dueño o encargado">
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                className={inputCls + ' pl-8'}
                placeholder="Ej: María de la Cuadra"
                value={editing.propietario || ''}
                onChange={(e) => set({ propietario: e.target.value })}
              />
            </div>
          </Field>
        </div>

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

        {/* Medios de Pago */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-surface-soft px-4 py-2.5 text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
            <CreditCard size={12} /> Medios de Pago
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {['Efectivo', 'Débito', 'Crédito', 'Transferencia'].map((medio) => (
              <label key={medio} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="accent-rojo"
                  checked={(editing.mediosPago || []).includes(medio)}
                  onChange={(e) => {
                    const current = editing.mediosPago || [];
                    set({
                      mediosPago: e.target.checked
                        ? [...current, medio]
                        : current.filter((m) => m !== medio),
                    });
                  }}
                />
                <span className="text-sm text-text-primary">{medio}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Contacto */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-surface-soft px-4 py-2.5 text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
            <Phone size={12} /> Información de Contacto
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Teléfono (Llamadas)">
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

        <ImageUploadField
          label="Imagen Principal"
          value={editing.imagenPrincipal || ''}
          onChange={(url) => set({ imagenPrincipal: url })}
        />

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
