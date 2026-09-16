import { revalidatePath, revalidateTag } from 'next/cache';
import { CONTENT_TAG } from './data';

/**
 * Refresca todo lo que muestra el catastro: la caché de lectura y el HTML ya
 * renderizado de las páginas públicas.
 *
 * La llama toda escritura sobre destinos, restaurantes, alojamientos, eventos,
 * rutas o categorías. Una página pública nueva se agrega acá.
 */
export function invalidarContenidoPublico(): void {
  // Bota las lecturas cacheadas del catastro (src/lib/data.ts).
  revalidateTag(CONTENT_TAG);

  // Y el HTML ya renderizado de las páginas que lo muestran.
  revalidatePath('/');
  revalidatePath('/mapa');
  revalidatePath('/ruta');
  revalidatePath('/destino/[slug]', 'page');
  revalidatePath('/categoria/[id]', 'page');
}
