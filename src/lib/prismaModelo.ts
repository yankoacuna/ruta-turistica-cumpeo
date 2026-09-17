import { prisma } from '@/lib/prisma';
import { DescriptorEntidad } from '@/lib/entidades';

/**
 * Acceso al delegado de Prisma de uno de los cuatro modelos del catastro, por
 * nombre. Prisma no expone un tipo común entre sus delegados (cada uno acepta
 * un `where`/`data` propio), así que no hay forma de tipar este acceso dinámico
 * sin perder la genericidad que permite compartir el CRUD entre los cuatro.
 *
 * Vive fuera de cualquier archivo `'use server'` a propósito: esas rutas
 * exigen que todo lo exportado sea una función async, y esta es síncrona.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function modeloDe(modelo: DescriptorEntidad['modelo']): any {
  return prisma[modelo];
}
