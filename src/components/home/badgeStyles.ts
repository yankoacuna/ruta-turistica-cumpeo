/**
 * Estilos de badge de categoria.
 *
 * Antes habia siete tratamientos de color distintos (rojo, sol, cielo, verde,
 * tierra, gris, morado). Sobre tarjetas con foto, eso significaba hasta cinco
 * colores compitiendo en una misma grilla y ningun nivel de jerarquia: es la
 * causa principal de que la portada se viera generica.
 *
 * Ahora el badge es uno solo, monocromo sobre papel, y la categoria se
 * distingue por su texto. El color queda reservado para lo que de verdad
 * necesita destacar: acciones (rojo) y estado abierto/cerrado.
 */
const BADGE_BASE = 'bg-paper-warm/95 text-ink border-ink/25 backdrop-blur-sm';

export const BADGE_STYLES: Record<string, string> = {
  rojo: BADGE_BASE,
  sol: BADGE_BASE,
  cielo: BADGE_BASE,
  verde: BADGE_BASE,
  tierra: BADGE_BASE,
  gray: BADGE_BASE,
  patrimonio: BADGE_BASE,
};

export const getBadgeStyle = (colorClass: string): string =>
  BADGE_STYLES[colorClass] || BADGE_BASE;
