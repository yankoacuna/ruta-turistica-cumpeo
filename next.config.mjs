import os from "os";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // En cPanel, node_modules es un symlink hacia el entorno virtual de
  // Node.js (fuera de la carpeta del proyecto). Sin esto, el rastreador
  // de archivos de Next.js considera ese symlink "fuera de la raiz" y
  // falla de forma intermitente al resolver algunos modulos.
  outputFileTracingRoot: os.homedir(),
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
