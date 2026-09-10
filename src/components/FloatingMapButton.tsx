'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map } from 'lucide-react';

export default function FloatingMapButton() {
  const pathname = usePathname();

  // No mostrar el botón flotante si ya estamos en el mapa o en el panel admin
  if (pathname === '/mapa' || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <Link
      href="/mapa"
      className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px)+12px)] md:bottom-5 right-5 w-13 h-13 p-3 rounded-full bg-sol text-text-primary border-2 border-ink flex items-center justify-center shadow-lg z-30 hover:scale-110 hover:bg-sol-dark transition-all no-underline"
      title="Abrir Mapa Interactivo GPS"
      aria-label="Abrir Mapa Interactivo"
    >
      <Map size={22} className="text-ink" />
    </Link>
  );
}
