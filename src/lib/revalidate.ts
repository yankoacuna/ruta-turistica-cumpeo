import { revalidatePath, revalidateTag } from 'next/cache';
import { CONTENT_TAG } from './data';

/**
 * Único lugar donde se declara qué hay que refrescar cuando cambia el catastro.
 *
 * Antes cada acción del panel repetía su propia lista de `revalidatePath`, y
 * las listas se fueron separando: guardar un destino refrescaba la portada y
 * el mapa pero no /ruta, borrarlo no refrescaba su propia ficha ni la página
 * de su categoría. El resultado era contenido viejo en páginas al azar según
 * por dónde se hubiera editado.
 *
 * Ahora hay una sola función: toda escritura sobre destinos, restaurantes,
 * alojamientos, eventos, rutas o categorías la llama, y agregar una página
 * pública nueva es agregar una línea acá, no revisar ocho archivos.
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
