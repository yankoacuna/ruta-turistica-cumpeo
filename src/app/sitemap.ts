import type { MetadataRoute } from 'next';
import { getDestinations, getConfig } from '@/lib/data';

const BASE_URL = 'https://turismocumpeo.cl';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [destinations, config] = await Promise.all([getDestinations(), getConfig()]);

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
