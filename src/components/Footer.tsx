'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Info, Bus, CalendarDays, Thermometer, Phone, AlertTriangle,
  Building2, Navigation, Home, Map, Target, UtensilsCrossed,
  BedDouble, MapPin
} from 'lucide-react';
import { Editable } from '@/components/site-text';

export default function Footer() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <footer className="bg-ink text-gray-300 py-8 md:py-12" role="contentinfo" id="section-info">
        <div className="w-full max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">

            {/* Columna 1: Marca & Municipio */}
            <div>
              <div className="mb-3">
                <img
                  src="/assets/images/logo-muni-rio-claro.png"
                  className="h-10 max-w-[170px] object-contain brightness-125"
                  alt="Ilustre Municipalidad de Río Claro"
                />
              </div>
              <div className="text-sm font-extrabold text-sol uppercase tracking-wider mb-2 font-display flex items-center gap-2">
                <img
                  src="/assets/images/condorito-oficial.png"
                  className="w-5 h-5 rounded-full"
                  alt="Condorito"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/condorito-oficial.png';
                  }}
                />
                <Editable k="footer.marca" />
              </div>
              <Editable
                k="footer.descripcion"
                as="p"
                className="text-xs leading-relaxed text-gray-400 mb-3"
                multiline
              />
              <Editable
                k="footer.badge"
                as="div"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider whitespace-nowrap bg-[#FFE0E2] text-[#C1121F] border border-[#FFA8AE]"
              />
            </div>

            {/* Columna 2: Info Útil */}
            <div>
              <div className="text-sm font-extrabold text-sol uppercase tracking-wider mb-3 font-display">
                <span className="inline-flex items-center gap-1.5">
                  <Info size={13} /> <Editable k="footer.info.titulo" />
                </span>
              </div>
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-300 mb-[2px] flex items-center gap-1.5">
                  <Bus size={11} /> <Editable k="footer.info.comoLlegar.titulo" />
                </div>
                <Editable
                  k="footer.info.comoLlegar.texto"
                  as="div"
                  className="text-xs text-gray-400"
                  multiline
                />
              </div>
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-300 mb-[2px] flex items-center gap-1.5">
                  <CalendarDays size={11} /> <Editable k="footer.info.epoca.titulo" />
                </div>
                <Editable
                  k="footer.info.epoca.texto"
                  as="div"
                  className="text-xs text-gray-400"
                  multiline
                />
              </div>
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-300 mb-[2px] flex items-center gap-1.5">
                  <Thermometer size={11} /> <Editable k="footer.info.clima.titulo" />
                </div>
                <Editable
                  k="footer.info.clima.texto"
                  as="div"
                  className="text-xs text-gray-400"
                  multiline
                />
              </div>
            </div>

            {/* Columna 3: Contacto & Emergencias */}
            <div>
              <div className="text-sm font-extrabold text-sol uppercase tracking-wider mb-3 font-display">
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={13} /> <Editable k="footer.contacto.titulo" />
                </span>
              </div>
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={11} /> <Editable k="footer.contacto.emergenciasTitulo" />
                </div>
                <div>
                  <Editable
                    k="footer.contacto.carabineros"
                    className="inline-block bg-rojo/20 border border-rojo/40 text-red-300 text-xs font-bold px-2.5 py-[3px] rounded-full m-[2px]"
                  />
                  <Editable
                    k="footer.contacto.bomberos"
                    className="inline-block bg-rojo/20 border border-rojo/40 text-red-300 text-xs font-bold px-2.5 py-[3px] rounded-full m-[2px]"
                  />
                  <Editable
                    k="footer.contacto.samu"
                    className="inline-block bg-rojo/20 border border-rojo/40 text-red-300 text-xs font-bold px-2.5 py-[3px] rounded-full m-[2px]"
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-300 mb-[2px] flex items-center gap-1.5">
                  <Building2 size={11} /> <Editable k="footer.contacto.muniTitulo" />
                </div>
                <Editable
                  k="footer.contacto.muniTelefono"
                  as="div"
                  className="text-xs text-gray-400"
                />
                <Editable k="footer.contacto.muniEmail" as="div" className="text-xs text-gray-400" />
              </div>
            </div>

            {/* Columna 4: Navegación */}
            <div>
              <div className="text-sm font-extrabold text-sol uppercase tracking-wider mb-3 font-display">
                <span className="inline-flex items-center gap-1.5">
                  <Navigation size={13} /> <Editable k="footer.nav.titulo" />
                </span>
              </div>
              <ul className="list-none flex flex-col gap-2">
                <li>
                  <Link href="/" className="text-xs text-gray-400 no-underline transition-colors hover:text-sol flex items-center gap-1.5">
                    <Home size={11} /> <Editable k="nav.inicio" />
                  </Link>
                </li>
                <li>
                  <Link href="/ruta" className="text-xs text-gray-400 no-underline transition-colors hover:text-sol flex items-center gap-1.5">
                    <Target size={11} /> <Editable k="nav.rutaLargo" />
                  </Link>
                </li>
                <li>
                  <Link href="/historia" className="text-xs text-gray-400 no-underline transition-colors hover:text-sol flex items-center gap-1.5">
                    <Info size={11} /> <Editable k="nav.historiaLargo" />
                  </Link>
                </li>
                <li>
                  <Link href="/mapa" className="text-xs text-gray-400 no-underline transition-colors hover:text-sol flex items-center gap-1.5">
                    <Map size={11} /> <Editable k="nav.mapa" />
                  </Link>
                </li>
                <li>
                  <Link href="/contacto" className="text-xs text-gray-400 no-underline transition-colors hover:text-sol flex items-center gap-1.5">
                    <Phone size={11} /> <Editable k="nav.contactoLargo" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bar inferior copyright */}
          <div className="mt-6 md:mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
            <Editable k="footer.copyright" as="div" />
            <Editable k="footer.version" as="div" />
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 backdrop-blur-md border-t-[1.5px] border-border z-40 flex items-center justify-around px-2"
        role="navigation"
        aria-label="Navegación principal"
      >
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 w-full h-full no-underline text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${isActive('/') ? 'text-rojo' : 'text-text-muted'}`}
        >
          <Home size={20} />
          <Editable k="nav.inicio" />
        </Link>
        <Link
          href="/ruta"
          className={`flex flex-col items-center justify-center gap-1 w-full h-full no-underline text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${isActive('/ruta') ? 'text-rojo' : 'text-text-muted'}`}
        >
          <Target size={20} />
          <Editable k="nav.ruta" />
        </Link>
        <Link
          href="/mapa"
          className={`flex flex-col items-center justify-center gap-1 w-full h-full no-underline text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${isActive('/mapa') ? 'text-rojo' : 'text-text-muted'}`}
        >
          <Map size={20} />
          <Editable k="nav.mapa" />
        </Link>
        <Link
          href="/contacto"
          className={`flex flex-col items-center justify-center gap-1 w-full h-full no-underline text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${isActive('/contacto') ? 'text-rojo' : 'text-text-muted'}`}
        >
          <Phone size={20} />
          <Editable k="nav.contacto" />
        </Link>
      </nav>
    </>
  );
}
