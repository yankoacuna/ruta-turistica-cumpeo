import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",

  // No anunciar el framework ni su versión.
  poweredByHeader: false,
  experimental: {
    cpus: 1,
  },
  // geoip-lite lee sus archivos .dat con una ruta relativa a su propio
  // __dirname en node_modules. Si webpack lo empaqueta (el default), esa
  // ruta relativa termina apuntando dentro de .next/server/... y los .dat no
  // están ahí -> falla en runtime ("ENOENT ... geoip-country.dat"). Sacarlo
  // del bundle deja que se resuelva con require() normal desde node_modules.
  serverExternalPackages: ['geoip-lite'],
  // output: "standalone" solo copia lo que el file tracing detecta como
  // dependencia; como geoip-lite arma la ruta a sus .dat en runtime (no con
  // un require/import estático), el tracer no los ve solo. Se fuerza acá.
  //
  // Se incluyen todos los .dat (país + región + ciudad, ~111MB): geoip-lite
  // los carga enteros a memoria de forma permanente apenas arranca el proceso
  // (preload() síncrono al hacer require, no en cada lookup) — costo fijo por
  // proceso, no por visita, de ~106MB de RAM. Si hiciera falta reducirlo, con
  // sacar geoip-city*.dat y geoip-city-names.dat de este glob alcanza:
  // geoip-lite cae solo a país automáticamente (ver geoip-lite/lib/geoip.js),
  // sin tocar código.
  outputFileTracingIncludes: {
    '/api/track': ['./node_modules/geoip-lite/data/**/*'],
  },
  // ─── CABECERAS DE SEGURIDAD ───────────────────────────────────────────────
  async headers() {
    const base = [
      // Nada de adivinar el tipo de un archivo por su contenido: una imagen
      // subida por un desconocido se trata como imagen y nunca como HTML.
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Al salir del sitio se manda solo el dominio, no la URL completa.
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // El sitio pide ubicación (mapa y "cerca de mí"); cámara y micrófono no
      // los usa nadie, así que se niegan de entrada.
      { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=(), payment=()' },
      // Sin includeSubDomains: los subdominios del hosting (webmail, cpanel)
      // no son de esta aplicación.
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
    ];

    return [
      // El sitio público puede necesitar embeberse en la web municipal.
      { source: '/:path*', headers: [...base, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
      // El panel no se embebe en ningún lado.
      {
        source: '/admin/:path*',
        headers: [
          ...base,
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          // El panel nunca debe quedar en la caché de un equipo compartido.
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      // Archivos subidos: se sirven como archivo y nada más, sin nada activo.
      {
        source: '/uploads/:path*',
        headers: [
          ...base,
          { key: 'Content-Security-Policy', value: "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;

