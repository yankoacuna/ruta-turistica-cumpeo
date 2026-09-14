import type { Metadata } from 'next';
import { Store, Camera, BadgeCheck } from 'lucide-react';
import { SumateForm } from './SumateForm';

export const metadata: Metadata = {
  title: 'Súmate a la plataforma | Turismo Cumpeo',
  description:
    'Si tienes un restaurante, alojamiento, atractivo turístico o evento en Cumpeo, postula para aparecer en la plataforma oficial de turismo de la comuna de Río Claro.',
};

const PASOS = [
  {
    icono: <Store size={18} />,
    titulo: 'Cuéntanos de tu negocio',
    texto: 'Completas el formulario con los datos que verá el turista. Toma unos cinco minutos.',
  },
  {
    icono: <Camera size={18} />,
    titulo: 'Adjuntas fotos',
    texto: 'Hasta tres imágenes propias. Si no las tienes a mano, puedes enviarlas después.',
  },
  {
    icono: <BadgeCheck size={18} />,
    titulo: 'El municipio revisa y publica',
    texto: 'El equipo de turismo verifica los datos y crea tu ficha. Te escriben si falta algo.',
  },
];

export default function SumatePage() {
  return (
    <div className="bg-[#F4F3EF] min-h-screen pb-20">
      <section className="relative py-12 sm:py-16 text-center bg-[#1E1E24] text-white px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display font-black text-3xl md:text-4xl text-sol mb-3">
            Súmate a la plataforma
          </h1>
          <p className="text-sm md:text-base text-gray-300 leading-relaxed">
            ¿Tienes un restaurante, alojamiento, atractivo o evento en Cumpeo? Postula para aparecer
            en la guía turística oficial de la comuna. Es gratis.
          </p>
        </div>
      </section>

      <main className="max-w-[860px] mx-auto px-4 -mt-8 relative z-10 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PASOS.map((paso, i) => (
            <div
              key={paso.titulo}
              className="bg-white rounded-2xl border border-border p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-8 h-8 rounded-xl bg-surface-soft text-rojo flex items-center justify-center shrink-0">
                  {paso.icono}
                </span>
                <span className="text-xs font-bold text-text-muted">Paso {i + 1}</span>
              </div>
              <h2 className="text-sm font-bold text-text-primary mb-0.5">{paso.titulo}</h2>
              <p className="text-xs text-text-secondary leading-relaxed">{paso.texto}</p>
            </div>
          ))}
        </div>

        <SumateForm />
      </main>
    </div>
  );
}
