/**
 * Convierte un texto en un slug URL amigable:
 * - Convierte a minúsculas
 * - Remueve tildes, acentos y diacríticos (ej: á -> a, ñ -> n)
 * - Remueve caracteres que no sean letras, números, espacios o guiones
 * - Reemplaza espacios por guiones y colapsa guiones repetidos
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Separa caracteres base de los acentos
    .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos diacríticos
    .replace(/ñ/g, 'n') // Asegura la conversión de la ñ si quedara algún remanente
    .replace(/[^a-z0-9\s-]/g, '') // Remueve cualquier carácter no alfanumérico
    .trim()
    .replace(/\s+/g, '-') // Reemplaza espacios por guiones
    .replace(/-+/g, '-'); // Evita guiones múltiples consecutivos
}
