/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  webpack: (config) => {
    // node_modules es un symlink hacia el entorno virtual de cPanel
    // (fuera de la raiz del proyecto); si webpack sigue el symlink para
    // calcular rutas reales, confunde la resolucion del alias "@/*".
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
