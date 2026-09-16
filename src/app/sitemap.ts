import type { MetadataRoute } from 'next';
import { getDestinations, getConfig } from '@/lib/data';

const BASE_URL = 'https://turismocumpeo.cl';

/**
 * Mapa del sitio para los buscadores. Las fichas salen de la base; si no
 * responde se publican solo las rutas fijas, porque el sitemap se genera al
 * compilar y una base inalcanzable no debe impedir un despliegue.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let destinations: Awaited<ReturnType<typeof getDestinations>> = [];
  let config: Awaited<ReturnType<typeof getConfig>> = { categorias: [] };

  try {
    [destinations, config] = await Promise.all([getDestinations(), getConfig()]);
  } catch (error) {
    console.warn('Sitemap: no se pudo leer el catastro, se publican solo las rutas fijas:', error);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/ruta`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/mapa`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/historia`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/contacto`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/sumate`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const destinoRoutes: MetadataRoute.Sitemap = destinations.map((d) => ({
    url: `${BASE_URL}/destino/${d.slug || d.id}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const categoriaRoutes: MetadataRoute.Sitemap = (config.categorias || []).map((c) => ({
    url: `${BASE_URL}/categoria/${c.id}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...destinoRoutes, ...categoriaRoutes];
}
