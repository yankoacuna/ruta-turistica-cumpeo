/**
 * Constantes de dominio compartidas por el sitio público y el panel.
 *
 * Viven acá y no repetidas en cada archivo porque son decisiones del
 * territorio, no de un componente: si mañana el municipio decide que el centro
 * del mapa es la plaza nueva, se cambia en un solo lugar y queda igual en el
 * formulario de fichas, en el mapa, en la carga masiva y en el valor por
 * defecto que se guarda en la base.
 */

import type { Coordinates } from './types';

/** Centro de Cumpeo: punto de partida de los mapas y coordenada por defecto de una ficha nueva. */
export const CENTRO_CUMPEO: Coordinates = { lat: -35.281739, lng: -71.258714 };
