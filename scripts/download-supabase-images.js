// Descarga todas las imagenes del bucket de Supabase Storage a una carpeta
// local, y reescribe las referencias en prisma/migration-export/*.json
// (generado por export-full-db.js) para que apunten a "/uploads/...".
//
// Uso: node --env-file=.env scripts/download-supabase-images.js
//
// Es el camino inverso de scripts/migrate-uploads-to-supabase.js.

const fs = require('fs');
const path = require('path');
const WS = require('ws');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
const STAGING_DIR = path.join(process.cwd(), 'migration-images');
const EXPORT_DIR = path.join(process.cwd(), 'prisma', 'migration-export');

// Campos que pueden contener URLs de imagenes, por archivo exportado.
const CAMPOS_IMAGEN = {
  'Destination.json': ['imagenPrincipal', 'galeria'],
  'Restaurant.json': ['imagenPrincipal', 'galeria'],
  'Accommodation.json': ['imagenPrincipal', 'galeria'],
  'Event.json': ['imagenPrincipal', 'galeria'],
  'Solicitud.json': ['fotos'],
};

async function listarTodo(supabase, prefix = '') {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;

  let archivos = [];
  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    // Una "carpeta" en Supabase Storage es una entrada sin metadata de archivo.
    if (item.id === null) {
      archivos = archivos.concat(await listarTodo(supabase, fullPath));
    } else {
      archivos.push(fullPath);
    }
  }
  return archivos;
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.');
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    realtime: { transport: WS },
  });

  console.log(`Listando archivos del bucket "${BUCKET}"...`);
  const archivos = await listarTodo(supabase);
  console.log(`Encontrados: ${archivos.length}`);

  fs.mkdirSync(STAGING_DIR, { recursive: true });

  // URL publica de Supabase -> nueva ruta local "/uploads/..."
  const urlMap = new Map();

  for (const rel of archivos) {
    const { data, error } = await supabase.storage.from(BUCKET).download(rel);
    if (error) {
      console.error(`  ERROR descargando ${rel}:`, error.message);
      continue;
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    const destino = path.join(STAGING_DIR, rel);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, buffer);

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(rel);
    urlMap.set(pub.publicUrl, `/uploads/${rel}`);
    console.log(`  OK  ${rel}`);
  }

  fs.writeFileSync(
    path.join(STAGING_DIR, 'url-map.json'),
    JSON.stringify(Object.fromEntries(urlMap), null, 2) + '\n'
  );

  console.log(`\n${urlMap.size} archivos descargados a ${path.relative(process.cwd(), STAGING_DIR)}`);

  console.log('\nReescribiendo referencias en prisma/migration-export/...');
  let camposReescritos = 0;

  for (const [archivo, campos] of Object.entries(CAMPOS_IMAGEN)) {
    const ruta = path.join(EXPORT_DIR, archivo);
    if (!fs.existsSync(ruta)) continue;

    const filas = JSON.parse(fs.readFileSync(ruta, 'utf-8'));
    for (const fila of filas) {
      for (const campo of campos) {
        const valor = fila[campo];
        if (typeof valor === 'string' && urlMap.has(valor)) {
          fila[campo] = urlMap.get(valor);
          camposReescritos++;
        } else if (Array.isArray(valor)) {
          fila[campo] = valor.map((u) => (typeof u === 'string' && urlMap.has(u) ? urlMap.get(u) : u));
        }
      }
    }
    fs.writeFileSync(ruta, JSON.stringify(filas, null, 2) + '\n');
  }

  console.log(`Listo. ${camposReescritos} campos individuales reescritos.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
