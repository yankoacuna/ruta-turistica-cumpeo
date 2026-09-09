import React from 'react';
import { Star } from 'lucide-react';
import { Destination } from '@/lib/types';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field, inputCls, textareaCls, selectCls } from '../Field';
import { ImageUploadField } from '../ImageUploadField';
import { GalleryField } from '../GalleryField';

interface DestinoModalProps {
  editing: Partial<Destination>;
  onChange: (updated: Partial<Destination>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
}

export function DestinoModal({
  editing,
  onChange,
  onSubmit,
  onClose,
  isPending,
}: DestinoModalProps) {
  const set = (patch: Partial<Destination>) => onChange({ ...editing, ...patch });

  return (
    <ModalWrapper
      title={editing.id ? 'Editar Destino' : 'Nuevo Destino'}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Nombre + Categoría */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre" required>
            <input
              required
              className={inputCls}
              placeholder="Ej: Mural de Condorito"
              value={editing.nombre || ''}
              onChange={(e) => set({ nombre: e.target.value })}
            />
          </Field>
          <Field label="Categoría" required>
            <select
              className={selectCls}
              value={editing.categoria}
              onChange={(e) => set({ categoria: e.target.value as Destination['categoria'] })}
            >
              <option value="cultural">Cultural</option>
              <option value="historico">Histórico</option>
              <option value="naturaleza">Naturaleza</option>
              <option value="gastronomia">Gastronomía</option>
              <option value="patrimonio">Patrimonio</option>
              <option value="entretencion">Entretención</option>
            </select>
          </Field>
        </div>

        {/* Slug */}
        <Field label="Slug URL" hint="Identificador único. Ej: mural-condorito">
          <input
            className={inputCls}
            placeholder="mural-condorito"
            value={editing.slug || ''}
            onChange={(e) =>
              set({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })
            }
          />
        </Field>

        {/* Descripciones */}
        <Field label="Descripción Corta" required>
          <textarea
            required
            className={textareaCls}
            placeholder="Resumen breve para las tarjetas…"
            value={editing.descripcionCorta || ''}
            onChange={(e) => set({ descripcionCorta: e.target.value })}
          />
        </Field>
        <Field label="Descripción Completa">
          <textarea
            className={textareaCls}
            style={{ minHeight: '110px' }}
            placeholder="Descripción detallada del destino…"
            value={editing.descripcionLarga || ''}
            onChange={(e) => set({ descripcionLarga: e.target.value })}
          />
        </Field>
        <Field label="Historia / Contexto">
          <textarea
            className={textareaCls}
            placeholder="Historia e información histórica del lugar…"
            value={editing.historia || ''}
            onChange={(e) => set({ historia: e.target.value })}
          />
        </Field>

        {/* Datos prácticos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Dirección">
            <input
              className={inputCls}
              placeholder="Calle / Localidad, Cumpeo"
              value={editing.direccion || ''}
              onChange={(e) => set({ direccion: e.target.value })}
            />
          </Field>
          <Field label="Horario">
            <input
              className={inputCls}
              placeholder="Lun–Dom 9:00–18:00"
              value={editing.horario || ''}
              onChange={(e) => set({ horario: e.target.value })}
            />
          </Field>
          <Field label="Duración Sugerida">
            <input
              className={inputCls}
              placeholder="Ej: 45 minutos"
              value={editing.duracionVisita || ''}
              onChange={(e) => set({ duracionVisita: e.target.value })}
            />
          </Field>
        </div>

        {/* Cómo llegar */}
        <Field label="Cómo Llegar">
          <textarea
            className={textareaCls}
            style={{ minHeight: '70px' }}
            placeholder="Instrucciones para llegar al destino…"
            value={editing.comoLlegar || ''}
            onChange={(e) => set({ comoLlegar: e.target.value })}
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
                set({
                  coordenadas: { ...editing.coordenadas!, lat: parseFloat(e.target.value) },
                })
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
                set({
                  coordenadas: { ...editing.coordenadas!, lng: parseFloat(e.target.value) },
                })
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

        {/* Tags */}
        <Field label="Tags" hint="Separados por coma">
          <input
            className={inputCls}
            placeholder="historia, arte, familia"
            value={(editing.tags || []).join(', ')}
            onChange={(e) =>
              set({
                tags: e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>

        {/* Destacado */}
        <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-[#FFF3C4]/60 border border-[#FDE68A]">
          <input
            type="checkbox"
            id="destacado"
            className="w-4 h-4 accent-rojo rounded cursor-pointer"
            checked={editing.destacado || false}
            onChange={(e) => set({ destacado: e.target.checked })}
          />
          <label
            htmlFor="destacado"
            className="text-sm font-semibold text-text-primary cursor-pointer flex items-center gap-1.5"
          >
            <Star size={14} className="text-[#B47900]" />
            Marcar como Destino Destacado
          </label>
        </div>

        <ModalActions onClose={onClose} isPending={isPending} />
      </form>
    </ModalWrapper>
  );
}
