import React, { useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Field, inputCls } from './Field';

interface GalleryFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function GalleryField({ images = [], onChange }: GalleryFieldProps) {
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    if (!images.includes(trimmed)) {
      onChange([...images, trimmed]);
    }
    setNewUrl('');
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, idx) => idx !== index));
  };

  return (
    <Field
      label={`Galería de Fotografías (${images.length})`}
      hint="Agrega URLs o rutas de imágenes para la galería del destino"
    >
      <div className="flex flex-col gap-3">
        {/* Input bar to add photo */}
        <div className="flex gap-2">
          <input
            type="text"
            className={inputCls}
            placeholder="/assets/images/foto1.webp o https://..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1 bg-surface-soft border border-border text-text-primary px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-rojo hover:text-white hover:border-rojo transition-all shrink-0"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>

        {/* Gallery Thumbnails List */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto p-2 bg-surface-soft rounded-xl border border-border">
            {images.map((url, idx) => {
              const resolved = url.startsWith('http') || url.startsWith('/') ? url : `/${url}`;
              return (
                <div
                  key={idx}
                  className="relative group bg-white rounded-lg border border-border overflow-hidden shadow-sm flex flex-col"
                >
                  <div className="h-20 w-full overflow-hidden bg-surface-soft relative">
                    <img
                      src={resolved}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                      }}
                    />
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="p-1.5 flex items-center justify-between gap-1 text-[10px] bg-white border-t border-border">
                    <span className="truncate text-text-muted font-mono flex-1" title={url}>
                      {url.split('/').pop() || url}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="text-text-muted hover:text-rojo p-1 rounded transition-colors"
                      title="Eliminar foto"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 px-3 bg-surface-soft rounded-xl border border-border/60 text-xs text-text-muted flex items-center justify-center gap-1.5">
            <ImageIcon size={14} className="text-text-muted" />
            Sin fotos adicionales en la galería
          </div>
        )}
      </div>
    </Field>
  );
}
