import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingMapButton from '@/components/FloatingMapButton';
import PWARegister from '@/components/PWARegister';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  metadataBase: new URL('https://cumpeo-turismo.vercel.app'),
  title: 'Cumpeo Turismo — El Pueblo de Condorito, Maule, Chile',
  description: 'Descubre Cumpeo, el pueblo de Condorito en el corazón del Maule. Historia, naturaleza, gastronomía y rutas interactivas con GPS.',
  keywords: ['Cumpeo', 'turismo', 'Condorito', 'Maule', 'Chile', 'Río Claro', 'pueblo temático'],
  manifest: '/manifest.json',
  themeColor: '#E63946',
  openGraph: {
    title: 'Cumpeo Turismo — El Pueblo de Condorito',
    description: 'Guía turística interactiva de Cumpeo, Región del Maule. Mapa GPS, destinos, gastronomía y más.',
    type: 'website',
    images: ['/assets/images/og-image.webp'],
    locale: 'es_CL',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL">
      <head>
        <link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg" />
        <link rel="apple-touch-icon" href="/assets/icons/icon-180.png" />
      </head>
      <body className="w-full min-h-[100dvh] bg-bg text-text-primary font-sans antialiased flex flex-col overflow-x-hidden relative">
        <ToastProvider>
          <Navbar />
          <main className="flex-1 pt-[56px] pb-[calc(64px+env(safe-area-inset-bottom,0px)+1.5rem)] md:pt-[68px] md:pb-6">
            {children}
          </main>
          <Footer />
          
          {/* Floating Action Button for Map */}
          <FloatingMapButton />
          {/* PWA Offline Service Worker Registration */}
          <PWARegister />
        </ToastProvider>
      </body>
    </html>
  );
}
