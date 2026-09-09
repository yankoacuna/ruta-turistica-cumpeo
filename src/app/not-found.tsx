import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 min-h-[60vh]">
      <h1 className="font-display font-black text-6xl text-rojo mb-2">404</h1>
      <h2 className="font-display font-bold text-2xl text-text-primary mb-2">¡PLOP! Página no encontrada</h2>
      <p className="text-text-muted text-sm max-w-md mb-6">La atracción o sección que buscas no existe o ha sido trasladada.</p>
      <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-rojo text-white font-bold text-sm shadow-md hover:bg-rojo-dark transition-all no-underline">
        <Home size={16} /> Volver al Inicio
      </Link>
    </div>
  );
}
