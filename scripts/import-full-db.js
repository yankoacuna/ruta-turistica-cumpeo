// Importa TODAS las tablas exportadas en prisma/migration-export/*.json
// (generadas por export-full-db.js + download-supabase-images.js) a la base
// de datos MySQL nueva, usando el Prisma Client ya generado para el schema
// actual (mysql).
//
// Correr DESPUES de:
//   1. Cambiar prisma/schema.prisma a mysql (ya hecho en este repo).
//   2. npx prisma db push  (crea las tablas en la base MySQL nueva).
//
// Uso: node --env-file=.env scripts/import-full-db.js

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const EXPORT_DIR = path.join(process.cwd(), 'prisma', 'migration-export');

function leer(nombre) {
  const ruta = path.join(EXPORT_DIR, `${nombre}.json`);
  if (!fs.existsSync(ruta)) return [];
  return JSON.parse(fs.readFileSync(ruta, 'utf-8'));
}

/** Modelo Prisma (camelCase) -> archivo exportado (PascalCase, nombre de tabla). */
const TABLAS = [
  ['config', 'Config'],
  ['destination', 'Destination'],
  ['restaurant', 'Restaurant'],
  ['accommodation', 'Accommodation'],
  ['event', 'Event'],
  ['emergencyContact', 'EmergencyContact'],
  ['tourRoute', 'TourRoute'],
  ['user', 'User'],
  ['siteText', 'SiteText'],
  ['siteTextRevision', 'SiteTextRevision'],
  ['themeConfig', 'ThemeConfig'],
  ['notificacionesConfig', 'NotificacionesConfig'],
  ['pageView', 'PageView'],
  ['solicitud', 'Solicitud'],
];

// Estos usan una clave primaria compuesta/no-id estandar en el modelo Prisma
// (siteText usa "key" como @id), asi que el "where" del upsert difiere.
const CLAVE_PRIMARIA = {
  siteText: 'key',
};

async function main() {
  for (const [modelo, archivo] of TABLAS) {
    const filas = leer(archivo);
    if (filas.length === 0) {
      console.log(`-   ${archivo}: sin filas, se omite`);
      continue;
    }

    const clave = CLAVE_PRIMARIA[modelo] || 'id';
    let ok = 0;
    let fallidas = 0;

    for (const fila of filas) {
      const valorClave = fila[clave];
      try {
        await prisma[modelo].upsert({
          where: { [clave]: valorClave },
          update: fila,
          create: fila,
        });
        ok++;
      } catch (err) {
        fallidas++;
        console.error(`  ERROR en ${archivo} (${clave}=${valorClave}):`, err.message);
      }
    }

    console.log(`OK  ${archivo}: ${ok}/${filas.length} filas importadas${fallidas ? ` (${fallidas} con error)` : ''}`);
  }

  console.log('\nImportacion completa.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
