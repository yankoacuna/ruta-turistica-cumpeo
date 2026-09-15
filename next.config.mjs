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
  // Se incluyen TODOS los .dat (país + región + ciudad, ~111MB): geoip-lite
  // los carga enteros a memoria de forma permanente apenas arranca el proceso
  // (preload() síncrono al hacer require, no al hacer un lookup), lo que suma
  // ~106MB de RAM fija. Es una decisión consciente: la alternativa liviana
  // (solo país, ~8MB de RAM) deja "región" —el dato que más le importa a un
  // sitio turístico local, más que país— demasiado genérico para ser útil.
  // Medido con process.memoryUsage() antes/después del require, en dev y
  // dentro de .next/standalone ya buildeado. Si este hosting compartido
  // resulta no tener margen de RAM para esto, la salida es sacar los .dat de
  // ciudad de este glob (geoip-lite cae solo a país automáticamente, sin
  // tocar código: ver geoip-lite/lib/geoip.js), no cambiar de librería.
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

