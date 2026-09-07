"use client";
import React, { useRef, useState, useCallback } from "react";
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
} from "lucide-react";
import { Field, inputCls } from "./Field";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  hint?: string;
}

type UploadState = "idle" | "uploading" | "success" | "error";

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
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState("");

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

  const handleRemove = async () => {
    // Solo eliminamos fisicamente del disco si fue un archivo subido en esta misma sesion
    if (value && value.startsWith("/uploads/") && uploadedInThisSession.current.has(value)) {
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
    setState("idle");
    setErrorMsg("");
  };

  const handleApplyManualUrl = () => {
    const trimmed = manualUrlInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setState("success");
    setShowManualUrl(false);
    setManualUrlInput("");
  };

  const isPlaceholder = Boolean(value && value.includes("placeholder"));
  const hasRealImage = Boolean(value && !isPlaceholder);
  const previewSrc = hasRealImage
    ? value.startsWith("http") || value.startsWith("/")
      ? value
      : `/${value}`
    : null;

  const displayFilename = hasRealImage
    ? value.split("/").pop() || value
    : "";

  return (
    <Field label={label} required={required} hint={hint}>
      <div className="flex flex-col gap-2">
        {/* Drop zone / preview */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden ${
            isDragging
              ? "border-rojo bg-[#FFF0F1] scale-[1.01]"
              : "border-border bg-surface-soft"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {previewSrc ? (
            <div className="flex flex-col">
              {/* Imagen con overlay interactivo para desktop */}
              <div className="relative group h-44 bg-[#1E1E24]/5 overflow-hidden">
                <img
                  src={previewSrc}
                  alt="Vista previa"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/assets/images/placeholder.webp";
                  }}
                />

                {/* Overlay flotante para mouse / desktop */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex items-center gap-1.5 bg-white text-text-primary text-xs font-bold px-3 py-2 rounded-xl shadow-md hover:bg-rojo hover:text-white transition-all cursor-pointer"
                  >
                    <Upload size={13} /> Cambiar foto
                  </button>
                  <a
                    href={previewSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-white/90 text-text-primary text-xs font-bold px-3 py-2 rounded-xl shadow-md hover:bg-white transition-all no-underline"
                    title="Ver imagen completa"
                  >
                    <ExternalLink size={13} /> Ver original
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
                    <CheckCircle2 size={11} /> Foto lista
                  </div>
                )}
              </div>

              {/* Barra inferior permanente (Accesible para moviles, tablets y raton) */}
              <div className="p-2.5 bg-white border-t border-border flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon size={14} className="text-text-muted shrink-0" />
                  <span
                    className="text-[11px] text-text-secondary truncate font-mono"
                    title={value}
                  >
                    {displayFilename}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
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
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-surface-soft hover:bg-rojo hover:text-white text-text-primary border border-border transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} /> Cambiar
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
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={state === "uploading"}
              className="w-full py-8 flex flex-col items-center gap-2 text-text-muted hover:text-rojo transition-colors disabled:opacity-50 cursor-pointer"
            >
              {state === "uploading" ? (
                <Loader2 size={30} className="animate-spin text-rojo" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-rojo/10 text-rojo flex items-center justify-center mb-1">
                  <Upload size={22} />
                </div>
              )}
              <span className="text-xs font-bold text-text-primary">
                {state === "uploading"
                  ? "Subiendo imagen al servidor..."
                  : "Clic o arrastra una imagen aqui"}
              </span>
              <span className="text-[11px] text-text-muted">
                JPG, PNG, WebP, GIF, AVIF (Maximo 5 MB)
              </span>
            </button>
          )}
        </div>

        {/* Alternar URL manual externa */}
        <div className="flex flex-col gap-1.5">
          {!showManualUrl ? (
            <button
              type="button"
              onClick={() => setShowManualUrl(true)}
              className="self-start text-[11px] font-medium text-text-muted hover:text-rojo flex items-center gap-1 transition-colors cursor-pointer"
            >
              <LinkIcon size={12} /> O ingresar URL externa de imagen...
            </button>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-surface-soft rounded-xl border border-border">
              <input
                type="text"
                value={manualUrlInput}
                onChange={(e) => setManualUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyManualUrl();
                  }
                }}
                placeholder="https://ejemplo.com/foto.jpg"
                className={inputCls}
                autoFocus
              />
              <button
                type="button"
                onClick={handleApplyManualUrl}
                className="px-3.5 py-2 bg-[#1E1E24] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                Aplicar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowManualUrl(false);
                  setManualUrlInput("");
                }}
                className="p-2 text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                title="Cancelar"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Mensaje de error */}
        {state === "error" && errorMsg && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
            <AlertCircle size={14} className="shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input oculto de archivo con reseteo para permitir re-seleccion del mismo archivo */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = ""; // Permite volver a subir el mismo archivo si fue quitado
          }}
        />
      </div>
    </Field>
  );
}
