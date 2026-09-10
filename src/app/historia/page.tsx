import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Sparkles, Lightbulb, Store, Star, HelpCircle, Compass, Map, BookOpen } from 'lucide-react';
import { Editable } from '@/components/site-text';

export const metadata: Metadata = {
  title: 'Historia de Cumpeo — El Pueblo de Condorito',
  description: 'Descubre la increíble historia de cómo Cumpeo se convirtió en el único pueblo real de la historieta de Condorito.',
};

export default function HistoriaPage() {
  // El contenido de cada hito es editable desde el CMS; el icono se mantiene
  // en el codigo porque es una decision de diseño, no de contenido.
  const hitos = [
    { id: '1', icon: <Sparkles size={18} className="text-sol-dark" /> },
    { id: '2', icon: <Lightbulb size={18} className="text-amber-500" /> },
    { id: '3', icon: <Store size={18} className="text-rojo" /> },
    { id: '4', icon: <Star size={18} className="text-sol-dark" /> },
  ];

  return (
    <div className="bg-bg min-h-screen pb-20">
      {/* ── HERO ─────── */}
      <section className="relative w-full h-[45vh] min-h-[360px] flex items-center justify-center text-center overflow-hidden" aria-label="Historia de Cumpeo">
        <img
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          src="/assets/images/ruta-condorito.webp"
          alt="Historia Cumpeo"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(30,30,36,0.75)] to-bg" />

        <div className="relative z-[2] flex flex-col items-center px-4">
          <h1
            className="font-display font-black text-sol leading-tight max-w-[800px] mx-auto [text-shadow:2px_2px_8px_rgba(0,0,0,0.5)]"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)' }}
          >
            <Editable k="historia.hero.titulo" />
          </h1>
          <Editable
            k="historia.hero.bajada"
            as="p"
            className="max-w-[600px] mx-auto mt-4 text-[1.1rem] text-[#f8f9fa] [text-shadow:1px_1px_4px_rgba(0,0,0,0.8)]"
            multiline
          />
        </div>
      </section>

      {/* ── CONTENIDO PRINCIPAL ─────── */}
      <main className="w-full max-w-[1200px] mx-auto px-4 relative z-10 -mt-10">
        {/* EL ORIGEN (Dos Columnas) */}
        <section className="bg-white p-8 md:p-12 rounded-[22px] shadow-xl border border-border mb-16 grid gap-10 items-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <div>
            <h2 className="font-display text-[2rem] mb-6 text-sol-dark flex items-center gap-2">
              <BookOpen size={28} className="text-rojo" /> <Editable k="historia.origen.titulo" />
            </h2>
            <Editable
              k="historia.origen.parrafo1"
              as="p"
              className="leading-[1.8] text-text-primary mb-4 text-[1.05rem]"
              multiline
            />
            <Editable
              k="historia.origen.parrafo2"
              as="p"
              className="leading-[1.8] text-text-primary mb-6 text-[1.05rem]"
              multiline
            />
            <Editable
              k="historia.origen.cita"
              as="blockquote"
              className="border-l-4 border-sol pl-5 italic text-text-muted text-[1.1rem]"
              multiline
            />
          </div>
          <div className="rounded-2xl overflow-hidden min-h-[350px] bg-surface-soft relative flex items-center justify-center p-6 border border-border">
            <img src="/assets/images/condorito-oficial.png" alt="Pepo y Condorito" className="max-w-[80%] max-h-[80%] object-contain" />
            <Editable
              k="historia.origen.pieFoto"
              as="div"
              className="absolute bottom-0 left-0 right-0 p-3 bg-black/70 text-xs text-white text-center"
            />
          </div>
        </section>

        {/* LÍNEA DE TIEMPO */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="font-display font-extrabold text-[1.6rem] text-text-primary relative pb-2 inline-block after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-12 after:h-1 after:bg-rojo after:rounded-full">
              <Editable k="historia.hitos.titulo" />
            </h2>
            <Editable
              k="historia.hitos.bajada"
              as="div"
              className="text-sm text-text-secondary mt-3"
            />
          </div>

          <div className="flex flex-col gap-4 max-w-[800px] mx-auto">
            {hitos.map((hito) => (
              <div key={hito.id} className="flex gap-5 bg-white p-5 md:p-6 rounded-2xl border border-border items-start shadow-sm hover:shadow-md transition-shadow">
                <Editable
                  k={'historia.hitos.' + hito.id + '.year'}
                  as="div"
                  className="bg-sol text-text-primary font-extrabold py-2.5 px-4 rounded-xl text-base min-w-[95px] text-center shrink-0 border border-[#E0A900]/30 font-display"
                />
                <div>
                  <h3 className="m-0 mb-1.5 text-lg font-bold text-text-primary flex items-center gap-2 font-display">
                    {hito.icon} <Editable k={'historia.hitos.' + hito.id + '.titulo'} />
                  </h3>
                  <Editable
                    k={'historia.hitos.' + hito.id + '.texto'}
                    as="p"
                    className="text-text-secondary m-0 text-sm leading-relaxed"
                    multiline
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CURIOSIDADES */}
        <section className="bg-white p-8 md:p-12 rounded-[22px] mb-16 border border-border shadow-sm">
          <h2 className="font-display font-extrabold text-[1.6rem] text-text-primary text-center mb-8 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-12 after:h-1 after:bg-rojo after:rounded-full flex items-center justify-center gap-2">
            <HelpCircle size={22} className="text-rojo" /> <Editable k="historia.curiosidades.titulo" />
          </h2>

          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <div className="p-6 bg-surface-soft rounded-xl border-l-4 border-rojo border border-border/70">
              <Editable
                k="historia.curiosidades.1.titulo"
                as="h4"
                className="text-rojo mb-2 font-bold font-display text-base"
              />
              <Editable
                k="historia.curiosidades.1.texto"
                as="p"
                className="text-text-secondary text-sm leading-relaxed"
                multiline
              />
            </div>

            <div className="p-6 bg-surface-soft rounded-xl border-l-4 border-cielo border border-border/70">
              <Editable
                k="historia.curiosidades.2.titulo"
                as="h4"
                className="text-cielo mb-2 font-bold font-display text-base"
              />
              <Editable
                k="historia.curiosidades.2.texto"
                as="p"
                className="text-text-secondary text-sm leading-relaxed"
                multiline
              />
            </div>

            <div className="p-6 bg-surface-soft rounded-xl border-l-4 border-verde border border-border/70">
              <Editable
                k="historia.curiosidades.3.titulo"
                as="h4"
                className="text-verde mb-2 font-bold font-display text-base"
              />
              <Editable
                k="historia.curiosidades.3.texto"
                as="p"
                className="text-text-secondary text-sm leading-relaxed"
                multiline
              />
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="text-center py-10 px-5 bg-white rounded-[22px] border border-border shadow-sm">
          <Editable
            k="historia.cta.titulo"
            as="h2"
            className="font-display text-[2rem] font-bold text-text-primary mb-3"
          />
          <Editable
            k="historia.cta.texto"
            as="p"
            className="text-text-secondary max-w-[600px] mx-auto mb-8 text-sm md:text-base"
            multiline
          />
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/#section-destinos" className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-full text-base font-bold bg-rojo text-white shadow-md hover:-translate-y-0.5 hover:bg-rojo-dark transition-all no-underline">
              <Compass size={18} /> <Editable k="historia.cta.botonDestinos" />
            </Link>
            <Link href="/mapa" className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-full text-base font-bold text-rojo border-2 border-rojo hover:bg-[#FFF0F1] transition-all no-underline">
              <Map size={18} /> <Editable k="historia.cta.botonMapa" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
