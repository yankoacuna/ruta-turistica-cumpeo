"use client";
import React, { useRef, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  Loader2,
  AlertCircle,
  ClipboardPaste,
} from "lucide-react";
import { Field, inputCls } from "./Field";

interface GalleryFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function GalleryField({ images = [], onChange }: GalleryFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [newUrl, setNewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Solo se aceptan archivos de imagen");
        return;
      }
      setUploading(true);
      setError("");
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al subir");
        if (!images.includes(data.url)) onChange([...images, data.url]);
      } catch (err: any) {
        setError(err.message || "Error al subir imagen");
      } finally {
        setUploading(false);
      }
    },
    [images, onChange]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handlePasteFromClipboard = async () => {
    setError("");
    setUploading(true);
    try {
      if (!navigator.clipboard) {
        throw new Error(
          "Tu navegador no permite acceso directo al portapapeles. Puedes presionar Ctrl+V para pegar."
        );
      }

      if (navigator.clipboard.read) {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imageType = item.types.find((t) => t.startsWith("image/"));
            if (imageType) {
              const blob = await item.getType(imageType);
              const ext = imageType.split("/")[1]?.replace("+xml", "") || "png";
              const file = new File([blob], `galeria-${Date.now()}.${ext}`, {
                type: imageType,
              });
              await uploadFile(file);
              return;
            }
          }
        } catch (readErr: any) {
          console.warn("navigator.clipboard.read falló en galería:", readErr);
        }
      }

      if (navigator.clipboard.readText) {
        const text = (await navigator.clipboard.readText()).trim();
        if (text) {
          if (
            text.startsWith("http://") ||
            text.startsWith("https://") ||
            text.startsWith("/uploads/")
          ) {
            if (!images.includes(text)) {
              onChange([...images, text]);
            }
            return;
          }
        }
      }

      throw new Error(
        "No se detectó ninguna imagen en el portapapeles. Copia una imagen o captura de pantalla (Ctrl+C o clic derecho 'Copiar imagen') y vuelve a intentarlo."
      );
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setError("Permiso denegado por el navegador. Puedes hacer clic aquí y presionar Ctrl+V.");
      } else {
        setError(err.message || "No se pudo leer del portapapeles. Prueba presionando Ctrl+V.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleContainerPaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT") return;

      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            e.stopPropagation();
            await uploadFile(file);
            return;
          }
        }
      }

      const text = e.clipboardData.getData("text/plain")?.trim();
      if (
        text &&
        (text.startsWith("http://") ||
          text.startsWith("https://") ||
          text.startsWith("/uploads/"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (!images.includes(text)) {
          onChange([...images, text]);
        }
      }
    },
    [images, onChange, uploadFile]
  );

  const handleAddUrl = () => {
    const trimmed = newUrl.trim();
    if (!trimmed || images.includes(trimmed)) return;
    onChange([...images, trimmed]);
    setNewUrl("");
  };

  const handleRemovePhoto = async (idx: number) => {
    const targetUrl = images[idx];
    // "/uploads/" es el formato legado (disco local); "/storage/v1/object/public/"
    // es una URL publica de nuestro bucket de Supabase. Cualquier otra URL externa
    // pegada por el usuario no se toca.
    if (targetUrl && (targetUrl.startsWith("/uploads/") || targetUrl.includes("/storage/v1/object/public/"))) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });
      } catch (err) {
        console.warn("No se pudo eliminar el archivo fisico:", err);
      }
    }
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <Field label={`Galeria de Fotografias (${images.length})`}>
      <div className="flex flex-col gap-3" onPaste={handleContainerPaste}>
        <div
          className={`border-2 border-dashed rounded-xl transition-all p-5 flex flex-col items-center justify-center gap-2 text-center ${
            isDragging
              ? "border-rojo bg-[#FFF0F1]"
              : "border-border bg-surface-soft hover:border-rojo/60"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-1.5 py-2">
              <Loader2 size={24} className="animate-spin text-rojo" />
              <span className="text-xs font-semibold text-text-primary">
                Subiendo imagen a la galería...
              </span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-rojo/10 text-rojo flex items-center justify-center">
                <Upload size={18} />
              </div>
              <div>
                <span className="text-xs font-semibold text-text-primary block">
                  Arrastra tus fotos aquí o usa los botones:
                </span>
                <span className="text-[10px] text-text-muted">JPG, PNG, WebP — Máx. 5 MB</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-text-primary border border-border shadow-xs hover:border-rojo hover:text-rojo transition-all cursor-pointer disabled:opacity-50"
                >
                  <Upload size={13} /> Subir archivos
                </button>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-text-primary border border-border shadow-xs hover:bg-rojo hover:text-white hover:border-rojo transition-all cursor-pointer group disabled:opacity-50"
                  title="Pegar imagen copiada en el portapapeles (Ctrl + V)"
                >
                  <ClipboardPaste
                    size={13}
                    className="text-rojo group-hover:text-white transition-colors"
                  />
                  <span>Pegar portapapeles</span>
                  <kbd className="text-[10px] font-mono text-text-muted group-hover:text-white/90 bg-surface-soft group-hover:bg-black/20 px-1 py-0.5 rounded border border-border group-hover:border-transparent">
                    Ctrl+V
                  </kbd>
                </button>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div className="flex gap-2">
          <input type="text" className={inputCls} placeholder="O pega una URL externa: https://..."
            value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddUrl(); } }} />
          <button type="button" onClick={handleAddUrl}
            className="flex items-center gap-1 bg-surface-soft border border-border text-text-primary px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-rojo hover:text-white hover:border-rojo transition-all shrink-0">
            <Plus size={14} /> URL
          </button>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto p-2 bg-surface-soft rounded-xl border border-border">
            {images.map((url, idx) => {
              const resolved = url.startsWith("http") || url.startsWith("/") ? url : `/${url}`;
              return (
                <div key={idx} className="relative bg-white rounded-lg border border-border overflow-hidden shadow-sm flex flex-col">
                  <div className="h-20 w-full overflow-hidden bg-surface-soft relative">
                    <img src={resolved} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/assets/images/placeholder.webp"; }} />
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">#{idx + 1}</span>
                  </div>
                  <div className="p-1.5 flex items-center justify-between gap-1 text-[10px] bg-white border-t border-border">
                    <span className="truncate text-text-muted font-mono flex-1" title={url}>{url.split("/").pop() || url}</span>
                    <button type="button" onClick={() => handleRemovePhoto(idx)}
                      className="text-text-muted hover:text-rojo p-1 rounded transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-3 bg-surface-soft rounded-xl border border-border/60 text-xs text-text-muted flex items-center justify-center gap-1.5">
            <ImageIcon size={14} /> Sin fotos en la galeria
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={async (e) => { for (const f of Array.from(e.target.files || [])) { await uploadFile(f); } e.target.value = ""; }} />
      </div>
    </Field>
  );
}
