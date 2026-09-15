import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  typescript: {
    // Evita que la compilación en hosting compartido (cPanel) falle por
    // discrepancias de paquetes @types en el entorno virtual de producción
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;

