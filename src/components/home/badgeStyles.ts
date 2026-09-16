/**
 * Estilos de badge de categoria.
 *
 * Sobre tarjetas con foto, varios colores compitiendo en una misma grilla
 * quitan jerarquia a la portada, por lo que el tratamiento de color es unico.
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
