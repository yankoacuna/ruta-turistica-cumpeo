import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import {
  getConfig,
  getAllPOIs,
  getCategoryColorClass,
  formatImgUrl,
} from '@/lib/data';

interface PageProps {
  params: { id: string };
}

const BADGE_STYLES: Record<string, string> = {
  rojo:       'bg-[#FFE0E2] text-[#C1121F] border-[#FFA8AE]',
  sol:        'bg-[#FFF3C4] text-[#B47900] border-[#FFE07D]',
  cielo:      'bg-[#E0F2FE] text-[#023E8A] border-[#BAE6FD]',
  verde:      'bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7]',
  tierra:     'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
  gray:       'bg-[#EAE8E1] text-[#4A4E69] border-[#D5D3C8]',
  patrimonio: 'bg-[#EDE9FE] text-[#5B21B6] border-[#C4B5FD]',
};
const getBadgeStyle = (colorClass: string) => BADGE_STYLES[colorClass] || BADGE_STYLES.gray;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const config = await getConfig();
  const cat = config.categorias?.find((c: any) => c.id === params.id);
  if (!cat) return { title: 'Categoría no encontrada' };
  return {
    title: `${cat.nombre} en Cumpeo — Cumpeo Turismo`,
    description: `Explora todos los lugares de ${cat.nombre} en el pueblo temático de Condorito, Región del Maule.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const config = await getConfig();
  const category = config.categorias?.find((c: any) => c.id === params.id);
  if (!category) notFound();

  const allPOIs = await getAllPOIs();
  const categoryPOIs = allPOIs.filter((poi) => poi.categoria === params.id);

  return (
    <div>
      {/* ── HERO SECTION ─────── */}
      <section className="relative w-full min-h-[420px] h-[52vh] max-h-[520px] flex items-end overflow-hidden" aria-label={`Categoría ${category.nombre}`}>
        <img
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          src={formatImgUrl(category.imagen)}
          alt={category.nombre}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/90" />

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 py-6 md:py-8 flex flex-col gap-2 pt-24">
          <h1 className="font-display font-black text-[2.6rem] md:text-[3.4rem] leading-[1.1] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
            {category.nombre}
          </h1>
          <p className="text-sm leading-relaxed text-white/90 max-w-xl mb-4">
            Explora todos los lugares y actividades de la categoría {category.nombre} en el pueblo de Condorito.
          </p>
          <div className="flex gap-3 mt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-full text-sm font-bold border-none no-underline transition-all shadow-md bg-sol text-[#1E1E24] hover:bg-sol-dark"
            >
              <ArrowLeft size={16} /> Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      {/* ── RESULTS ─────── */}
      <div className="w-full max-w-[1200px] mx-auto px-4 py-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-extrabold text-[1.6rem] text-text-primary relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-rojo after:rounded-full">
            Resultados ({categoryPOIs.length})
          </h2>
        </div>

        {categoryPOIs.length === 0 ? (
          <div className="text-center py-16 px-5 bg-white rounded-[22px] border border-border">
            <h3 className="mt-2 text-[1.2rem] font-bold text-text-primary">Pronto más lugares</h3>
            <p className="text-text-muted text-sm mt-1">Estamos actualizando los destinos de esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
            {categoryPOIs.map((poi) => (
              <article
                key={poi.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:border-rojo hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer flex flex-col"
                role="button"
                tabIndex={0}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-soft">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    src={formatImgUrl(poi.imagenPrincipal)}
                    alt={poi.nombre}
                  />
                  <div className="absolute top-2 left-2 z-[2]">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wider whitespace-nowrap border ${getBadgeStyle(getCategoryColorClass(poi.categoria))}`}>
                      {poi.categoria}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-xs text-text-muted mb-1 font-semibold uppercase tracking-wider">
                    {poi.categoria}
                  </div>
                  <h3 className="font-display font-bold text-[1.25rem] text-text-primary mb-1">
                    <Link href={`/destino/${poi.id}`} className="no-underline text-inherit hover:text-rojo transition-colors">
                      {poi.nombre}
                    </Link>
                  </h3>
                  <p className="text-sm text-text-secondary mb-3 flex-1 line-clamp-2">{poi.descripcionCorta}</p>
                  <div className="pt-3 border-t border-border flex items-center justify-between mt-auto">
                    <span className="text-xs font-semibold text-rojo inline-flex items-center gap-1">
                      <span>Ver detalles</span>
                      <ArrowRight size={13} />
                    </span>
                    {poi.rating && (
                      <div className="text-xs font-bold text-[#B47900] flex items-center gap-1">
                        <Star size={12} className="fill-[#FFC300] text-[#FFC300]" />
                        {poi.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
