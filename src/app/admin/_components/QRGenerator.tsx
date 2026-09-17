'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { Destination, Restaurant, Accommodation } from '@/lib/types';
import { QrCode, ExternalLink, Printer, Copy, Check, ChevronDown } from 'lucide-react';
import { Field, inputCls } from './Field';
import { SearchableSelect } from '@/components/SearchableSelect';
import { useToast } from '@/components/Toast';

interface QRGeneratorProps {
  destinos: Destination[];
  restaurantes: Restaurant[];
  alojamientos: Accommodation[];
}

/** Páginas fijas del sitio (no dependen de un registro del catastro). */
const PAGINAS_SITIO = [
  {
    id: 'inicio',
    label: 'Inicio',
    path: '/',
    signTitle: 'Turismo Cumpeo',
    signSubtitle: 'Escanea con tu celular para ver la guía turística completa',
  },
  {
    id: 'mapa',
    label: 'Mapa GPS',
    path: '/mapa',
    signTitle: 'Mapa Interactivo GPS de Cumpeo',
    signSubtitle: 'Escanea con tu celular para abrir el mapa con tu ubicación',
  },
  {
    id: 'ruta',
    label: 'La Ruta',
    path: '/ruta',
    signTitle: 'La Ruta Oficial de Condorito',
    signSubtitle: 'Escanea con tu celular para ver el recorrido completo',
  },
  {
    id: 'historia',
    label: 'Historia',
    path: '/historia',
    signTitle: 'La Historia de Cumpeo',
    signSubtitle: 'Escanea con tu celular para conocer la historia del pueblo',
  },
  {
    id: 'contacto',
    label: 'Contacto',
    path: '/contacto',
    signTitle: 'Contacto Turístico',
    signSubtitle: 'Escanea con tu celular para contactar a la Oficina de Turismo',
  },
  {
    id: 'sumate',
    label: 'Súmate',
    path: '/sumate',
    signTitle: 'Súmate a la Plataforma',
    signSubtitle: 'Escanea con tu celular para registrar tu negocio o emprendimiento',
  },
] as const;

export function QRGenerator({
  destinos,
  restaurantes,
  alojamientos,
}: QRGeneratorProps) {
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const plaqueRef = useRef<HTMLDivElement | null>(null);
  const [exportandoPlaca, setExportandoPlaca] = useState(false);

  const [selectedType, setSelectedType] = useState<'destino' | 'restaurante' | 'alojamiento' | 'pagina' | 'custom'>('destino');
  const [selectedId, setSelectedId] = useState<string>(destinos[0]?.id || '');
  const [selectedPagina, setSelectedPagina] = useState<string>('inicio');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [signTitle, setSignTitle] = useState<string>('Turismo Cumpeo');
  const [signSubtitle, setSignSubtitle] = useState<string>('Escanea con tu celular para ver la historia oficial');

  // Determine current target URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://turismocumpeo.cl';

  const currentUrl = React.useMemo(() => {
    if (selectedType === 'pagina') {
      const p = PAGINAS_SITIO.find((item) => item.id === selectedPagina);
      return `${origin}${p?.path || '/'}`;
    }
    if (selectedType === 'custom') {
      return customUrl || origin;
    }
    if (selectedType === 'destino') {
      const d = destinos.find((item) => item.id === selectedId);
      return `${origin}/destino/${d?.slug || selectedId}`;
    }
    if (selectedType === 'restaurante') {
      // El local no tiene ficha propia: el ?lugar= abre directamente su
      // tarjeta de detalle sobre la portada. El ancla es el respaldo si el
      // parametro no llega a resolverse (JS deshabilitado, id borrado, etc).
      return `${origin}/?lugar=${selectedId}#section-servicios`;
    }
    if (selectedType === 'alojamiento') {
      return `${origin}/?lugar=${selectedId}#section-servicios`;
    }
    return origin;
  }, [selectedType, selectedId, selectedPagina, customUrl, destinos, origin]);

  // Update default signage title when selection changes
  useEffect(() => {
    if (selectedType === 'destino') {
      const d = destinos.find((item) => item.id === selectedId);
      if (d) setSignTitle(d.nombre);
    } else if (selectedType === 'pagina') {
      const p = PAGINAS_SITIO.find((item) => item.id === selectedPagina);
      if (p) {
        setSignTitle(p.signTitle);
        setSignSubtitle(p.signSubtitle);
      }
    } else if (selectedType === 'restaurante') {
      const r = restaurantes.find((item) => item.id === selectedId);
      if (r) setSignTitle(r.nombre);
    } else if (selectedType === 'alojamiento') {
      const a = alojamientos.find((item) => item.id === selectedId);
      if (a) setSignTitle(a.nombre);
    }
  }, [selectedType, selectedId, selectedPagina, destinos, restaurantes, alojamientos]);

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
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'error desconocido';
      showToast(`Error al exportar QR: ${mensaje}`, 'error');
    }
  };

  // Exporta la placa tal cual se ve en la Vista Previa (logo, título, QR,
  // instrucción y pie), como una sola imagen lista para mandar a imprenta.
  // Se captura el DOM real en vez de redibujarlo a mano en un canvas: asi
  // cualquier ajuste futuro al diseño de la placa se refleja solo, sin
  // mantener el layout duplicado en dos lugares.
  const handleDownloadPlaquePNG = async () => {
    if (!plaqueRef.current) return;
    setExportandoPlaca(true);
    try {
      const dataUrl = await toPng(plaqueRef.current, {
        pixelRatio: 6,
        cacheBust: true,
        backgroundColor: '#1E1E24',
        // Sin esto, la libreria intenta descargar e incrustar la hoja de
        // estilos de Google Fonts que carga el layout (fuente Fredoka/Outfit)
        // y esa descarga falla por CORS, tumbando la exportacion entera. El
        // titulo se exporta en la tipografia de respaldo del sistema.
        skipFonts: true,
      });

      const a = document.createElement('a');
      const filename = `Placa-QR-Cumpeo-${signTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.png`;
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('Placa completa descargada en alta resolución', 'success');
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'error desconocido';
      showToast(`Error al exportar la placa: ${mensaje}`, 'error');
    } finally {
      setExportandoPlaca(false);
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
              Crea y descarga códigos QR en alta resolución (2048×2048 px) listos para colocarlos en los tótems, placas y letreros de la ruta turística.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
          <h3 className="font-display font-bold text-base text-text-primary border-b border-border pb-3">
            1. Seleccionar Destino o Enlace
          </h3>

          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'destino', label: 'Destinos' },
                  { id: 'restaurante', label: 'Restaurantes' },
                  { id: 'alojamiento', label: 'Alojamientos' },
                  { id: 'pagina', label: 'Página del Sitio' },
                  { id: 'custom', label: 'URL Personalizada' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                    selectedType === t.id
                      ? 'bg-rojo text-white border-rojo shadow-sm'
                      : 'bg-surface-soft text-text-secondary border-border hover:border-rojo hover:text-rojo'
                  }`}
                  onClick={() => {
                    setSelectedType(t.id);
                    if (t.id === 'destino' && destinos[0]) setSelectedId(destinos[0].id);
                    if (t.id === 'restaurante' && restaurantes[0]) setSelectedId(restaurantes[0].id);
                    if (t.id === 'alojamiento' && alojamientos[0]) setSelectedId(alojamientos[0].id);
                  }}
                >
                  {t.label}
                  <ChevronDown
                    size={13}
                    className={`shrink-0 transition-transform ${selectedType === t.id ? 'rotate-180' : ''}`}
                  />
                </button>
              ))}
            </div>

            {/* Panel del tipo elegido: mismo acento rojo que el boton activo de
                arriba y pegado sin espacio, para que se lea como su continuacion
                y no como un campo suelto y desconectado. */}
            <div className="pt-4 px-3.5 pb-3.5 rounded-b-xl border-2 border-t-0 border-rojo/30 bg-[#FFF8F8]">
              {selectedType === 'destino' && (
                <Field label="Selecciona el Destino Turístico" required>
                  <SearchableSelect
                    value={selectedId}
                    onChange={setSelectedId}
                    options={destinos.map((d) => ({ value: d.id, label: d.nombre, description: d.categoria }))}
                  />
                </Field>
              )}

              {selectedType === 'restaurante' && (
                <Field label="Selecciona el Restaurante" required>
                  <SearchableSelect
                    value={selectedId}
                    onChange={setSelectedId}
                    options={restaurantes.map((r) => ({ value: r.id, label: r.nombre }))}
                  />
                </Field>
              )}

              {selectedType === 'alojamiento' && (
                <Field label="Selecciona el Alojamiento" required>
                  <SearchableSelect
                    value={selectedId}
                    onChange={setSelectedId}
                    options={alojamientos.map((a) => ({ value: a.id, label: a.nombre, description: a.tipo || 'Hospedaje' }))}
                  />
                </Field>
              )}

              {selectedType === 'pagina' && (
                <Field label="Selecciona la Página" required>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PAGINAS_SITIO.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPagina(p.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                          selectedPagina === p.id
                            ? 'bg-ink text-white border-ink shadow-sm'
                            : 'bg-surface-soft text-text-secondary border-border hover:border-ink hover:text-ink'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
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
            </div>
          </div>

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
              Vista Previa de Placa
            </div>

            {/* Simulated Totem Sign Plaque */}
            <div
              ref={plaqueRef}
              className="w-full max-w-[320px] bg-[#1E1E24] text-white p-6 rounded-3xl shadow-xl border-4 border-sol flex flex-col items-center"
            >
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
                onClick={handleDownloadPlaquePNG}
                disabled={exportandoPlaca}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-rojo text-white font-bold text-sm shadow-[0_4px_12px_rgba(230,57,70,0.3)] hover:bg-rojo-dark transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Printer size={16} /> {exportandoPlaca ? 'Generando placa…' : 'Descargar Placa Completa (PNG)'}
              </button>

              <button
                onClick={handleDownloadHiResPNG}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border text-text-secondary font-bold text-xs hover:bg-surface-soft hover:border-rojo hover:text-rojo transition-all cursor-pointer"
              >
                <QrCode size={14} /> Descargar Solo el Código QR (PNG 2048px)
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
