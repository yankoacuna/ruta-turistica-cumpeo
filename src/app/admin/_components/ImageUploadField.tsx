"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Link as LinkIcon,
  RefreshCw,
  Globe,
  ClipboardPaste,
} from "lucide-react";
import { Field } from "./Field";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  hint?: string;
}

type UploadState = "idle" | "uploading" | "success" | "error";
type TabMode = "upload" | "url";

export function ImageUploadField({
  label,
  value,
  onChange,
  required,
  hint,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Tab activo: si ya tiene una URL externa (http), por defecto mostramos pestaña URL si se quiere editar
  const [activeTab, setActiveTab] = useState<TabMode>(
    value && value.startsWith("http") ? "url" : "upload"
  );
  const [manualUrlInput, setManualUrlInput] = useState(
    value && value.startsWith("http") ? value : ""
  );
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  // Sincronizar manualUrlInput si value cambia externamente
  useEffect(() => {
    if (value && value.startsWith("http")) {
      setManualUrlInput(value);
    }
  }, [value]);

  // Rastrear fotos subidas en esta sesion especifica para borrado seguro del servidor
  const uploadedInThisSession = useRef<Set<string>>(new Set());

  const upload = useCallback(
    async (file: File) => {
      setState("uploading");
      setErrorMsg("");
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al subir la imagen");

        uploadedInThisSession.current.add(data.url);
        onChange(data.url);
        setState("success");
        setIsEditingUrl(false);
      } catch (err: any) {
        setErrorMsg(err.message || "Error desconocido al procesar imagen");
        setState("error");
      }
    },
    [onChange]
  );

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Solo se aceptan archivos de imagen (JPG, PNG, WebP, GIF, AVIF)");
      setState("error");
      return;
    }
    upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handlePasteFromClipboard = async () => {
    setErrorMsg("");
    setState("uploading");
    try {
      if (!navigator.clipboard) {
        throw new Error(
          "Tu navegador no permite acceso directo al portapapeles. Puedes presionar Ctrl+V para pegar."
        );
      }

      // 1. Intentar leer imagen binaria con navigator.clipboard.read()
      if (navigator.clipboard.read) {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imageType = item.types.find((t) => t.startsWith("image/"));
            if (imageType) {
              const blob = await item.getType(imageType);
              const ext = imageType.split("/")[1]?.replace("+xml", "") || "png";
              const file = new File([blob], `portapapeles-${Date.now()}.${ext}`, {
                type: imageType,
              });
              handleFile(file);
              return;
            }
          }
        } catch (readErr: any) {
          console.warn("navigator.clipboard.read falló o requiere permisos:", readErr);
        }
      }

      // 2. Si no hubo imagen binaria o no hubo permiso para binarios, probar si hay una URL copiada
      if (navigator.clipboard.readText) {
        const text = (await navigator.clipboard.readText()).trim();
        if (text) {
          if (
            text.startsWith("http://") ||
            text.startsWith("https://") ||
            text.startsWith("data:image/") ||
            text.startsWith("/uploads/")
          ) {
            onChange(text);
            setState("success");
            setIsEditingUrl(false);
            return;
          }
        }
      }

      throw new Error(
        "No se detectó ninguna imagen en el portapapeles. Copia una imagen o captura de pantalla (Ctrl+C o clic derecho 'Copiar imagen') y vuelve a intentarlo."
      );
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setErrorMsg(
          "Permiso denegado por el navegador para leer el portapapeles. También puedes hacer clic aquí y presionar Ctrl+V."
        );
      } else {
        setErrorMsg(err.message || "No se pudo leer del portapapeles. Prueba presionando Ctrl+V.");
      }
      setState("error");
    }
  };

  const handleContainerPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" && (target as HTMLInputElement).type === "url") {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            e.stopPropagation();
            handleFile(file);
            return;
          }
        }
      }

      const text = e.clipboardData.getData("text/plain")?.trim();
      if (
        text &&
        (text.startsWith("http://") ||
          text.startsWith("https://") ||
          text.startsWith("data:image/") ||
          text.startsWith("/uploads/"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        onChange(text);
        setState("success");
        setIsEditingUrl(false);
      }
    },
    [onChange]
  );

  const handleRemove = async () => {
    // Solo eliminamos fisicamente del storage si fue un archivo subido en esta misma sesion
    if (value && uploadedInThisSession.current.has(value)) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value }),
        });
        uploadedInThisSession.current.delete(value);
      } catch (err) {
        console.warn("No se pudo eliminar el archivo fisico del servidor:", err);
      }
    }
    onChange("");
    setManualUrlInput("");
    setIsEditingUrl(false);
    setState("idle");
    setErrorMsg("");
  };

  const handleApplyManualUrl = () => {
    const trimmed = manualUrlInput.trim();
    if (!trimmed) {
      setErrorMsg("Por favor ingresa una URL válida");
      return;
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
      setErrorMsg("La dirección debe comenzar con https:// o http://");
      return;
    }
    setErrorMsg("");
    onChange(trimmed);
    setState("success");
    setIsEditingUrl(false);
  };

  const isPlaceholder = Boolean(value && value.includes("placeholder"));
  const hasRealImage = Boolean(value && !isPlaceholder);
  const previewSrc = hasRealImage
    ? value.startsWith("http") || value.startsWith("/")
      ? value
      : `/${value}`
    : null;

  const displayFilename = hasRealImage
    ? value.startsWith("http")
      ? value
      : value.split("/").pop() || value
    : "";

  return (
    <Field label={label} required={required} hint={hint}>
      <div className="flex flex-col gap-3" onPaste={handleContainerPaste}>
        {/* Si ya hay imagen y NO estamos editando URL, mostramos la vista previa con acciones */}
        {previewSrc && !isEditingUrl ? (
          <div className="rounded-xl border border-border bg-surface-soft overflow-hidden shadow-xs">
            {/* Imagen con overlay interactivo */}
            <div className="relative group h-48 bg-[#1E1E24]/5 overflow-hidden">
              <img
                src={previewSrc}
                alt="Vista previa"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/assets/images/placeholder.webp";
                }}
              />

              {/* Overlay flotante para desktop */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-white text-text-primary text-xs font-bold px-3 py-2 rounded-xl shadow-md hover:bg-rojo hover:text-white transition-all cursor-pointer"
                >
                  <Upload size={13} /> Subir archivo
                </button>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="flex items-center gap-1.5 bg-white text-text-primary text-xs font-bold px-3 py-2 rounded-xl shadow-md hover:bg-rojo hover:text-white transition-all cursor-pointer"
                  title="Pegar imagen desde el portapapeles (Ctrl+V)"
                >
                  <ClipboardPaste size={13} /> Pegar portapapeles
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManualUrlInput(value.startsWith("http") ? value : "");
                    setIsEditingUrl(true);
                    setActiveTab("url");
                  }}
                  className="flex items-center gap-1.5 bg-white text-text-primary text-xs font-bold px-3 py-2 rounded-xl shadow-md hover:bg-rojo hover:text-white transition-all cursor-pointer"
                >
                  <LinkIcon size={13} /> Cambiar por URL
                </button>
                <a
                  href={previewSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-white/90 text-text-primary text-xs font-bold px-3 py-2 rounded-xl shadow-md hover:bg-white transition-all no-underline"
                  title="Ver imagen original"
                >
                  <ExternalLink size={13} /> Ver
                </a>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex items-center gap-1.5 bg-white text-text-primary text-xs font-bold px-3 py-2 rounded-xl shadow-md hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                >
                  <X size={13} /> Quitar
                </button>
              </div>

              {/* Badge de estado */}
              {state === "uploading" && (
                <div className="absolute top-2 right-2 bg-black/80 text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs font-semibold">
                  <Loader2 size={11} className="animate-spin text-rojo" /> Subiendo...
                </div>
              )}
              {state === "success" && (
                <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs font-semibold">
                  <CheckCircle2 size={11} /> Imagen lista
                </div>
              )}
            </div>

            {/* Barra de información y acciones accesible */}
            <div className="p-3 bg-white border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                {value.startsWith("http") ? (
                  <Globe size={14} className="text-rojo shrink-0" />
                ) : (
                  <ImageIcon size={14} className="text-text-muted shrink-0" />
                )}
                <span
                  className="text-[11px] text-text-secondary truncate font-mono"
                  title={value}
                >
                  {displayFilename}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <a
                  href={previewSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors"
                  title="Abrir imagen completa"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-surface-soft hover:bg-rojo hover:text-white text-text-primary border border-border transition-colors flex items-center gap-1 cursor-pointer"
                  title="Subir otra imagen desde el equipo"
                >
                  <Upload size={11} /> Subir archivo
                </button>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-surface-soft hover:bg-rojo hover:text-white text-text-primary border border-border transition-colors flex items-center gap-1 cursor-pointer"
                  title="Pegar imagen copiada del portapapeles (Ctrl+V)"
                >
                  <ClipboardPaste size={11} /> Pegar portapapeles
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManualUrlInput(value.startsWith("http") ? value : "");
                    setIsEditingUrl(true);
                    setActiveTab("url");
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-surface-soft hover:bg-rojo hover:text-white text-text-primary border border-border transition-colors flex items-center gap-1 cursor-pointer"
                  title="Cambiar imagen ingresando una dirección web"
                >
                  <LinkIcon size={11} /> Cambiar URL
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Quitar foto"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Selector de pestañas y área de configuración */
          <div className="flex flex-col gap-2.5">
            {/* Pestañas destacadas y claras */}
            <div className="flex items-center p-1 rounded-xl bg-surface-soft border border-border gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("upload");
                  setErrorMsg("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "upload"
                    ? "bg-white text-text-primary shadow-xs border border-border/40"
                    : "text-text-muted hover:text-text-primary hover:bg-white/50"
                }`}
              >
                <Upload
                  size={14}
                  className={activeTab === "upload" ? "text-rojo" : "text-text-muted"}
                />
                Subir desde mi equipo
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("url");
                  setErrorMsg("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "url"
                    ? "bg-white text-text-primary shadow-xs border border-border/40"
                    : "text-text-muted hover:text-text-primary hover:bg-white/50"
                }`}
              >
                <LinkIcon
                  size={14}
                  className={activeTab === "url" ? "text-rojo" : "text-text-muted"}
                />
                Pegar enlace web (URL)
              </button>
            </div>

            {/* Contenido según pestaña activa */}
            {activeTab === "upload" ? (
              /* Pestaña: Subir archivo */
              <div
                className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden p-6 sm:p-7 flex flex-col items-center justify-center gap-3 text-center ${
                  isDragging
                    ? "border-rojo bg-[#FFF0F1] scale-[1.01]"
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
                {state === "uploading" ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 size={32} className="animate-spin text-rojo" />
                    <span className="text-xs font-bold text-text-primary">
                      Subiendo imagen al servidor...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-rojo/10 text-rojo flex items-center justify-center shadow-xs">
                      <Upload size={22} />
                    </div>

                    <div className="max-w-xs">
                      <span className="text-xs font-bold text-text-primary block">
                        Arrastra una imagen aquí o elije una opción:
                      </span>
                      <span className="text-[11px] text-text-muted">
                        JPG, PNG, WebP, GIF, AVIF (Máximo 5 MB)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-surface-soft text-text-primary border border-border shadow-xs hover:border-rojo hover:text-rojo transition-all cursor-pointer"
                      >
                        <Upload size={13} /> Seleccionar archivo
                      </button>

                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-text-primary border border-border shadow-xs hover:bg-rojo hover:text-white hover:border-rojo transition-all cursor-pointer group"
                        title="Pegar imagen copiada o captura de pantalla desde el portapapeles (Ctrl+V)"
                      >
                        <ClipboardPaste
                          size={14}
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
            ) : (
              /* Pestaña: Pegar enlace web (URL) - Espaciosa, clara e intuitiva */
              <div className="p-4 sm:p-5 rounded-xl bg-surface-soft border border-border flex flex-col gap-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rojo/10 text-rojo flex items-center justify-center shrink-0">
                    <Globe size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-text-primary">
                      Ingresar imagen mediante dirección web (URL)
                    </h4>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                      Pega aquí el enlace directo de una foto en internet (de Google Imágenes, redes sociales, Unsplash o cualquier página web).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      <LinkIcon size={14} />
                    </div>
                    <input
                      type="url"
                      value={manualUrlInput}
                      onChange={(e) => setManualUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyManualUrl();
                        }
                      }}
                      placeholder="https://ejemplo.com/imagenes/mi-foto.jpg"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-white focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none text-xs sm:text-sm text-text-primary transition-all placeholder:text-text-muted/60"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleApplyManualUrl}
                      disabled={!manualUrlInput.trim()}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-rojo hover:bg-[#c9182b] disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 size={14} /> Usar esta imagen
                    </button>

                    {previewSrc && isEditingUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingUrl(false);
                          setErrorMsg("");
                        }}
                        className="px-3 py-2.5 bg-white border border-border hover:bg-surface-soft text-text-secondary text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        title="Cancelar edición"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de error visible */}
        {state === "error" && errorMsg && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
            <AlertCircle size={14} className="shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input oculto de archivo con reseteo para permitir re-selección del mismo archivo */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </Field>
  );
}
