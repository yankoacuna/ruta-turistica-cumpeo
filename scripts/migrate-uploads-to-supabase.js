// Migra las imagenes de public/uploads/ (disco local, no persiste en Vercel)
// hacia un bucket publico de Supabase Storage, y actualiza las referencias
// "/uploads/archivo.jpg" guardadas en la base de datos por las nuevas URLs.
//
// Uso (Node 20.6+, --env-file carga las variables sin instalar dotenv):
//   node --env-file=.env scripts/migrate-uploads-to-supabase.js
//
// Es seguro correrlo mas de una vez: los archivos ya subidos se sobreescriben
// (upsert) y las filas que ya apuntan a Supabase se dejan intactas.

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const WS = require('ws');
const { createClient } = require('@supabase/supabase-js');

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

const CONTENT_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

const MODELS_WITH_IMAGES = ['destination', 'restaurant', 'accommodation', 'event'];

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.');
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    realtime: { transport: WS },
  });
  const prisma = new PrismaClient();

  console.log(`Bucket destino: "${BUCKET}"`);

  const { data: buckets, error: listBucketsError } = await supabase.storage.listBuckets();
  if (listBucketsError) throw listBucketsError;
  if (!buckets.some((b) => b.name === BUCKET)) {
    console.log(`Bucket "${BUCKET}" no existe, creandolo como publico...`);
    const { error: createBucketError } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (createBucketError) throw createBucketError;
  }

  if (!fs.existsSync(UPLOAD_DIR)) {
    console.log('No existe public/uploads, nada que migrar.');
    return;
  }

  const files = fs.readdirSync(UPLOAD_DIR).filter((f) => f !== '.gitkeep');
  console.log(`Archivos locales encontrados: ${files.length}`);

  // legacyPath -> nueva URL publica
  const urlMap = new Map();

  for (const filename of files) {
    const ext = filename.split('.').pop().toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
    const buffer = fs.readFileSync(path.join(UPLOAD_DIR, filename));

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType, upsert: true });
    if (uploadError) {
      console.error(`  ERROR subiendo ${filename}:`, uploadError.message);
      continue;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    urlMap.set(`/uploads/${filename}`, data.publicUrl);
    console.log(`  OK  ${filename} -> ${data.publicUrl}`);
  }

  console.log('\nActualizando referencias en la base de datos...');
  let updatedRows = 0;

  for (const model of MODELS_WITH_IMAGES) {
    const rows = await prisma[model].findMany();
    for (const row of rows) {
      let changed = false;
      const update = {};

      if (row.imagenPrincipal && urlMap.has(row.imagenPrincipal)) {
        update.imagenPrincipal = urlMap.get(row.imagenPrincipal);
        changed = true;
      }

      if (Array.isArray(row.galeria) && row.galeria.some((url) => urlMap.has(url))) {
        update.galeria = row.galeria.map((url) => urlMap.get(url) || url);
        changed = true;
      }

      if (changed) {
        await prisma[model].update({ where: { id: row.id }, data: update });
        updatedRows += 1;
        console.log(`  ${model} ${row.id} actualizado`);
      }
    }
  }

  console.log(`\nListo. ${urlMap.size} archivos migrados, ${updatedRows} filas de base de datos actualizadas.`);
  console.log('Los archivos originales siguen en public/uploads/ como respaldo local; puedes borrarlos si ya verificaste que todo carga bien.');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
