'use client';

import React from 'react';
import { ImageUploadField } from '../../ImageUploadField';
import { GalleryField } from '../../GalleryField';

interface MediaFieldsProps {
  imagenPrincipal?: string | null;
  onImagenChange: (url: string) => void;
  galeria?: string[];
  onGaleriaChange: (images: string[]) => void;
  /** Envuelve el campo de imagen principal en un div con este id (usado por el tour guiado). */
  imagenWrapperId?: string;
}

/** Imagen principal + galería de fotos: idéntico en todas las fichas del catastro turístico. */
export function MediaFields({
  imagenPrincipal,
  onImagenChange,
  galeria,
  onGaleriaChange,
  imagenWrapperId,
}: MediaFieldsProps) {
  const imageField = (
    <ImageUploadField label="Imagen Principal" value={imagenPrincipal || ''} onChange={onImagenChange} />
  );

  return (
    <>
      {imagenWrapperId ? <div id={imagenWrapperId}>{imageField}</div> : imageField}
      <GalleryField images={galeria || []} onChange={onGaleriaChange} />
    </>
  );
}
