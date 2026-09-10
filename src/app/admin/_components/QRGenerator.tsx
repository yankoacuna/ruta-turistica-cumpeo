'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Destination, Restaurant, Accommodation } from '@/lib/types';
import { QrCode, Download, ExternalLink, Sparkles, Printer, Copy, Check } from 'lucide-react';
import { Field, selectCls, inputCls } from './Field';
import { useToast } from '@/components/Toast';

interface QRGeneratorProps {
  destinos: Destination[];
  restaurantes: Restaurant[];
  alojamientos: Accommodation[];
}

export function QRGenerator({
  destinos,
  restaurantes,
  alojamientos,
}: QRGeneratorProps) {
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedType, setSelectedType] = useState<'destino' | 'restaurante' | 'alojamiento' | 'mapa' | 'custom'>('destino');
  const [selectedId, setSelectedId] = useState<string>(destinos[0]?.id || '');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [signTitle, setSignTitle] = useState<string>('Turismo Cumpeo');
  const [signSubtitle, setSignSubtitle] = useState<string>('Escanea con tu celular para ver la historia oficial');

  // Determine current target URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cumpeo-turismo.vercel.app';

  const currentUrl = React.useMemo(() => {
    if (selectedType === 'mapa') {
      return `${origin}/mapa`;
    }
    if (selectedType === 'custom') {
      return customUrl || origin;
    }
    if (selectedType === 'destino') {
      const d = destinos.find((item) => item.id === selectedId);
      return `${origin}/destino/${d?.slug || selectedId}`;
    }
    if (selectedType === 'restaurante') {
      return `${origin}/#section-gastronomia`;
    }
    if (selectedType === 'alojamiento') {
      return `${origin}/#section-alojamientos`;
    }
    return origin;
  }, [selectedType, selectedId, customUrl, destinos, origin]);

  // Update default signage title when selection changes
  useEffect(() => {
    if (selectedType === 'destino') {
      const d = destinos.find((item) => item.id === selectedId);
      if (d) setSignTitle(d.nombre);
    } else if (selectedType === 'mapa') {
      setSignTitle('Mapa Interactivo GPS de Cumpeo');
    } else if (selectedType === 'restaurante') {
      const r = restaurantes.find((item) => item.id === selectedId);
      if (r) setSignTitle(r.nombre);
    } else if (selectedType === 'alojamiento') {
      const a = alojamientos.find((item) => item.id === selectedId);
      if (a) setSignTitle(a.nombre);
    }
  }, [selectedType, selectedId, destinos, restaurantes, alojamientos]);

  // Draw QR code onto canvas
  useEffect(() => {
    if (!canvasRef.current || !currentUrl) return;

    QRCode.toCanvas(
      canvasRef.current,
      currentUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#1E1E24',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      },
      (error) => {
        if (error) console.error('Error generating QR code:', error);
      }
    );
  }, [currentUrl]);

  // Download high-resolution PNG for printing
  const handleDownloadHiResPNG = async () => {
    try {
      // Create high-res offscreen canvas (2048x2048)
      const dataUrl = await QRCode.toDataURL(currentUrl, {
        width: 2048,
        margin: 2,
        color: {
          dark: '#1E1E24',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });

      const a = document.createElement('a');
      const filename = `QR-Cumpeo-${signTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_')}-2048px.png`;
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('Código QR descargado en alta resolución (2048px)', 'success');
    } catch (err: any) {
      showToast(`Error al exportar QR: ${err.message}`, 'error');
    }
  };

  // Copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    showToast('Enlace copiado al portapapeles', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Introduction banner */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-text-primary flex items-center gap-2">
              <QrCode size={22} className="text-rojo" />
              Generador de Códigos QR para Señalética Municipal
            </h2>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl">
              Crea y descarga códigos QR en alta resolución (2048×2048 px) listos para enviar a imprenta y colocarlos en los tótems, placas y letreros de la ruta turística.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFE0E2] text-[#C1121F] text-xs font-bold border border-[#FFA8AE]">
              <Printer size={13} /> Listo para Imprenta
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
          <h3 className="font-display font-bold text-base text-text-primary border-b border-border pb-3">
            1. Seleccionar Destino o Enlace
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'destino', label: 'Destinos' },
              { id: 'restaurante', label: 'Restaurantes' },
              { id: 'alojamiento', label: 'Alojamientos' },
              { id: 'mapa', label: 'Mapa GPS' },
              { id: 'custom', label: 'URL Personalizada' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                  selectedType === t.id
                    ? 'bg-rojo text-white border-rojo shadow-sm'
                    : 'bg-surface-soft text-text-secondary border-border hover:border-rojo hover:text-rojo'
                }`}
                onClick={() => {
                  setSelectedType(t.id as any);
                  if (t.id === 'destino' && destinos[0]) setSelectedId(destinos[0].id);
                  if (t.id === 'restaurante' && restaurantes[0]) setSelectedId(restaurantes[0].id);
                  if (t.id === 'alojamiento' && alojamientos[0]) setSelectedId(alojamientos[0].id);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Dynamic Selectors */}
          {selectedType === 'destino' && (
            <Field label="Selecciona el Destino Turístico" required>
              <select
                className={selectCls}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {destinos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.categoria})
                  </option>
                ))}
              </select>
            </Field>
          )}

          {selectedType === 'restaurante' && (
            <Field label="Selecciona el Restaurante" required>
              <select
                className={selectCls}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {restaurantes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {selectedType === 'alojamiento' && (
            <Field label="Selecciona el Alojamiento" required>
              <select
                className={selectCls}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {alojamientos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} ({a.tipo || 'Hospedaje'})
                  </option>
                ))}
              </select>
            </Field>
          )}

          {selectedType === 'custom' && (
            <Field label="URL de destino" required hint="Ingresa la dirección web completa">
              <input
                type="url"
                className={inputCls}
                placeholder="https://..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
            </Field>
          )}

          {/* Signage text customizer */}
          <div className="pt-4 border-t border-border space-y-4">
            <h3 className="font-display font-bold text-base text-text-primary">
              2. Textos para la Placa o Letrero
            </h3>

            <Field label="Título en el Letrero">
              <input
                type="text"
                className={inputCls}
                value={signTitle}
                onChange={(e) => setSignTitle(e.target.value)}
              />
            </Field>

            <Field label="Instrucción / Bajada">
              <input
                type="text"
                className={inputCls}
                value={signSubtitle}
                onChange={(e) => setSignSubtitle(e.target.value)}
              />
            </Field>
          </div>

          {/* Current URL bar */}
          <div className="bg-surface-soft p-3 rounded-xl border border-border flex items-center justify-between gap-2 text-xs">
            <div className="flex-1 truncate font-mono text-text-secondary">
              {currentUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg bg-white border border-border text-text-secondary hover:text-rojo hover:border-rojo transition-all flex items-center gap-1 shrink-0 font-sans font-bold"
              title="Copiar enlace"
            >
              {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Right: Live Plaque Preview & Download */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-md flex flex-col items-center text-center">
            <div className="text-xs font-extrabold uppercase tracking-widest text-text-muted mb-4">
              Vista Previa de Placa / Tótem
            </div>

            {/* Simulated Totem Sign Plaque */}
            <div className="w-full max-w-[320px] bg-[#1E1E24] text-white p-6 rounded-3xl shadow-xl border-4 border-sol flex flex-col items-center">
              {/* Header Logo */}
              <div className="flex items-center gap-2 mb-3">
                <img
                  src="/assets/images/condorito-oficial.png"
                  alt="Condorito"
                  className="w-8 h-8 rounded-full border border-sol"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                  }}
                />
                <span className="font-display font-black text-sm text-sol tracking-wide uppercase">
                  Turismo Cumpeo
                </span>
              </div>

              {/* Title */}
              <h4 className="font-display font-bold text-lg text-white mb-3 line-clamp-2 leading-tight">
                {signTitle}
              </h4>

              {/* QR Canvas Box */}
              <div className="bg-white p-3 rounded-2xl shadow-inner mb-3">
                <canvas ref={canvasRef} className="w-48 h-48 block mx-auto" />
              </div>

              {/* Instruction subtitle */}
              <p className="text-[11px] text-gray-300 leading-snug px-2">
                {signSubtitle}
              </p>

              <div className="mt-3 pt-2 border-t border-white/10 w-full flex items-center justify-between text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                <span>Río Claro, Maule</span>
                <span>¡Reflauta!</span>
              </div>
            </div>

            {/* Action Download Buttons */}
            <div className="w-full mt-6 flex flex-col gap-2.5">
              <button
                onClick={handleDownloadHiResPNG}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-rojo text-white font-bold text-sm shadow-[0_4px_12px_rgba(230,57,70,0.3)] hover:bg-rojo-dark transition-all cursor-pointer"
              >
                <Download size={16} /> Descargar QR para Imprenta (PNG 2048px)
              </button>

              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface-soft hover:border-rojo hover:text-rojo transition-all no-underline"
              >
                <ExternalLink size={14} /> Probar enlace en navegador
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
