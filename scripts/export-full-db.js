// Exporta TODAS las tablas de la base Postgres actual (Supabase) a JSON, como
// paso previo a la migracion a MySQL. Usa `pg` directo (no Prisma) para no
// depender de si prisma/schema.prisma ya esta en formato mysql o postgres.
//
// Uso: node --env-file=.env scripts/export-full-db.js

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const OUT_DIR = path.join(process.cwd(), 'prisma', 'migration-export');

// Nombre exacto de tabla (Prisma quotea el nombre del modelo tal cual) ->
// nombre de archivo de salida.
const TABLAS = [
  'Config',
  'Destination',
  'Restaurant',
  'Accommodation',
  'Event',
  'EmergencyContact',
  'TourRoute',
  'User',
  'SiteText',
  'SiteTextRevision',
  'ThemeConfig',
  'NotificacionesConfig',
  'PageView',
  'Solicitud',
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en el entorno.');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  for (const tabla of TABLAS) {
    try {
      const { rows } = await client.query(`SELECT * FROM "public"."${tabla}"`);
      const archivo = path.join(OUT_DIR, `${tabla}.json`);
      fs.writeFileSync(archivo, JSON.stringify(rows, null, 2) + '\n');
      console.log(`OK  ${tabla}: ${rows.length} filas -> ${path.relative(process.cwd(), archivo)}`);
    } catch (err) {
      console.error(`ERROR exportando ${tabla}:`, err.message);
    }
  }

  await client.end();
  console.log('\nExportacion completa.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
