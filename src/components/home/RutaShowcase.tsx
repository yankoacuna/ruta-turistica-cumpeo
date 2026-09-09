import React from 'react';
import Link from 'next/link';
import { Compass, ArrowRight, Footprints, Users, Headphones } from 'lucide-react';
import { Section } from './Section';

const GALERIA = [
  { src: '/assets/images/letrero-cumpeo.webp', alt: 'Letrero del pueblo tematico de Cumpeo' },
  { src: '/assets/images/letras-cumpeo-cone.jpg', alt: 'Cumpeo, el pueblo de Condorito' },
  { src: '/assets/images/plaza-fuente-ugenio.jpg', alt: 'Plaza y fuente de Ugenio' },
  { src: '/assets/images/mapa-ilustrado-ruta-condorito.png', alt: 'Mapa ilustrado de la ruta' },
];

const ATRIBUTOS = [
  { icon: Footprints, label: 'Recorrido a pie' },
  { icon: Users, label: 'Apto para familias' },
  { icon: Headphones, label: 'Con mapa GPS' },
];

/**
 * Bloque de acento (fondo oscuro) para el producto estrella de la comuna.
 * Rompe la sucesion de tarjetas blancas y marca el centro de la portada.
 * En mobile: galeria arriba, texto y CTA abajo.
 */
export function RutaShowcase() {
  return (
    <Section tone="accent">
      <div className="px-4 flex flex-col lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center">
        {/* Galeria: primero en mobile, a la derecha en desktop */}
        <div className="lg:col-span-6 lg:order-2 grid grid-cols-2 gap-1.5 rounded-3xl overflow-hidden mb-6 lg:mb-0">
          {GALERIA.map((img) => (
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="w-full h-full object-cover aspect-[4/3] lg:aspect-square"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ))}
        </div>

        <div className="lg:col-span-6 lg:order-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[0.7rem] font-extrabold uppercase tracking-wider bg-sol/20 text-sol border border-sol/40 mb-3">
            <Compass size={14} /> Circuito Patrimonial
          </div>

          <h2 className="font-display font-extrabold text-[1.6rem] sm:text-3xl md:text-4xl text-white leading-tight text-balance">
            La Ruta Oficial de Condorito
          </h2>

          <p className="text-sm sm:text-base text-gray-300 mt-3 leading-relaxed max-w-xl">
            El itinerario comunal oficial para recorrer Cumpeo a pie: esculturas tematicas,
            gastronomia criolla y la historia del unico pueblo del mundo dedicado a Condorito.
          </p>

          <ul className="mt-5 flex flex-wrap gap-2">
            {ATRIBUTOS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold text-gray-200 bg-white/10 border border-white/15 rounded-full px-3 py-1.5"
              >
                <Icon size={13} className="text-sol" /> {label}
              </li>
            ))}
          </ul>

          <Link
            href="/ruta"
            className="mt-7 w-full sm:w-auto sm:inline-flex min-h-[52px] px-6 flex items-center justify-center gap-2 rounded-full text-sm font-extrabold bg-rojo hover:bg-rojo-light text-white transition-all shadow-rojo no-underline"
          >
            <Compass size={18} /> Ver itinerario y paradas <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </Section>
  );
}
