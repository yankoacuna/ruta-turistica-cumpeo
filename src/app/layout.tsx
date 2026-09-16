import type { Metadata, Viewport } from 'next';
import './globals.css';
import SiteLayout from '@/components/SiteLayout';
import PWARegister from '@/components/PWARegister';
import VisitTracker from '@/components/VisitTracker';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import { SiteTextProvider } from '@/components/site-text';
import { getResolvedSiteTexts, getResolvedTheme } from '@/lib/data';
import { themeToStyleTag, themeToGoogleFontsHref } from '@/lib/theme';

export async function generateViewport(): Promise<Viewport> {
  const theme = await getResolvedTheme();
  // cssVars vive en formato "R G B" (para las clases de opacidad de
  // Tailwind, ver theme.ts), pero el meta theme-color necesita un color CSS
  // valido.
  return { themeColor: `rgb(${theme.cssVars['--color-rojo']})` };
}

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

  // Apariencia (paleta y tipografías). Misma lógica: se resuelve una vez acá
  // y llega a todas las páginas, incluido el propio panel /admin. Las fuentes
  // se cargan siempre (por defecto u override); las variables de color solo
  // se sobreescriben cuando alguien personalizó algo, para que el sitio sin
  // cambios se vea con los hex exactos definidos en globals.css.
  const theme = await getResolvedTheme();

  return (
    <html lang="es-CL" className="overflow-x-hidden">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg" />
        <link rel="apple-touch-icon" href="/assets/icons/icon-180.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={themeToGoogleFontsHref(theme)} />
        {!theme.isDefault && <style>{themeToStyleTag(theme)}</style>}
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

              {/* Conteo anonimo de visitas del sitio publico (excluye /admin) */}
              <VisitTracker />
            </SiteTextProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
