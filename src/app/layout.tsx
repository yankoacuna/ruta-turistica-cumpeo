import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import SiteLayout from '@/components/SiteLayout';
import PWARegister from '@/components/PWARegister';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import { SiteTextProvider } from '@/components/site-text';
import { getResolvedSiteTexts } from '@/lib/data';

export const viewport: Viewport = {
  themeColor: '#E63946',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://turismocumpeo.cl'),
  title: 'Turismo Cumpeo',
  description: 'Descubre Cumpeo, el pueblo de Condorito en el corazón del Maule. Historia, naturaleza, gastronomía y rutas interactivas con GPS.',
  keywords: ['Cumpeo', 'turismo', 'Condorito', 'Chile', 'Río Claro', 'pueblo temático'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Turismo Cumpeo — El Pueblo de Condorito',
    description: 'Guía turística interactiva de Cumpeo, Región del Maule. Mapa GPS, destinos, gastronomía y más.',
    type: 'website',
    images: ['/assets/images/og-image.webp'],
    locale: 'es_CL',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Textos editables del sitio. Va en el layout para que cualquier página
  // (incluidas las estáticas) los tenga sin repetir la consulta: la lectura
  // está cacheada y se invalida sola cuando alguien guarda un texto.
  const siteTexts = await getResolvedSiteTexts();

  return (
    <html lang="es-CL">
      <head>
        <link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg" />
        <link rel="apple-touch-icon" href="/assets/icons/icon-180.png" />
      </head>
      <body className="w-full min-h-[100dvh] bg-bg text-text-primary font-sans antialiased flex flex-col overflow-x-hidden relative">
        <ToastProvider>
          <ConfirmProvider>
            <SiteTextProvider initial={siteTexts}>
              <SiteLayout>
                {children}
              </SiteLayout>

              {/* PWA Offline Service Worker Registration */}
              <PWARegister />
            </SiteTextProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
