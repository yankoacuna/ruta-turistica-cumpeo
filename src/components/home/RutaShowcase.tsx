import React from 'react';
import Link from 'next/link';
import { Compass, ArrowRight } from 'lucide-react';

export function RutaShowcase() {
  return (
    <section className="py-10 md:py-14 w-full max-w-[1200px] mx-auto px-4">
      <div className="bg-white border-2 border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Lado izquierdo: Informacion y llamado */}
          <div className="lg:col-span-6 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-sol/25 text-[#B47900] border border-sol/40 mb-3">
                <Compass size={14} /> Circuito Turistico Patrimonial
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-text-primary leading-tight">
                La Ruta Oficial de Condorito
              </h2>
              <p className="text-sm sm:text-base text-text-secondary mt-3 leading-relaxed">
                Sumergete en el itinerario comunal oficial diseñado para recorrer Cumpeo y conocer sus principales atractivos. Esculturas tematicas, gastronomia criolla y la historia del unico pueblo dedicado a Condorito en el mundo.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-border">
              <Link
                href="/ruta"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-extrabold bg-rojo hover:bg-rojo-dark text-white transition-all shadow-sm no-underline"
              >
                <Compass size={16} /> Ver Itinerario y Paradas <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Lado derecho: galeria de imagenes reales del pueblo */}
          <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-border grid grid-cols-2 overflow-hidden">
            <img
              src="/assets/images/letrero-cumpeo.webp"
              alt="Pueblo tematico de Cumpeo"
              className="w-full h-full object-cover aspect-square"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <img
              src="/assets/images/letras-cumpeo-cone.jpg"
              alt="Cumpeo - el pueblo de Condorito"
              className="w-full h-full object-cover aspect-square"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <img
              src="/assets/images/plaza-fuente-ugenio.jpg"
              alt="Ambiente de Cumpeo"
              className="w-full h-full object-cover aspect-square"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <img
              src="/assets/images/mapa-ilustrado-ruta-condorito.png"
              alt="Vista de Cumpeo"
              className="w-full h-full object-cover aspect-square"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
