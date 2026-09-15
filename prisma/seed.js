const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Datos de arranque: un volcado real de la base de producción (ver
 * prisma/seed-data/*.json), no un catálogo de ejemplo aparte. Reemplazar
 * estos archivos exportando la base de nuevo es la forma de mantener el
 * seeder al día con lo que el equipo va cargando desde el panel admin.
 */
function readSeedData(nombre) {
  const ruta = path.join(__dirname, 'seed-data', `${nombre}.json`);
  return JSON.parse(fs.readFileSync(ruta, 'utf-8'));
}

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Config
  try {
    const rows = readSeedData('config');
    for (const c of rows) {
      await prisma.config.upsert({
        where: { id: c.id },
        update: { categorias: c.categorias || [] },
        create: { id: c.id, categorias: c.categorias || [] },
      });
    }
    console.log(`✅ ${rows.length} Config seeded`);
  } catch (err) {
    console.warn('⚠️ Could not seed config:', err.message);
  }

  // 2. Destinations
  try {
    const rows = readSeedData('destinations');
    for (const d of rows) {
      const { id, createdAt, updatedAt, ...data } = d;
      await prisma.destination.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    console.log(`✅ ${rows.length} Destinations seeded`);
  } catch (err) {
    console.warn('⚠️ Could not seed destinations:', err.message);
  }

  // 3. Restaurants
  try {
    const rows = readSeedData('restaurants');
    for (const r of rows) {
      const { id, createdAt, updatedAt, ...data } = r;
      await prisma.restaurant.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    console.log(`✅ ${rows.length} Restaurants seeded`);
  } catch (err) {
    console.warn('⚠️ Could not seed restaurants:', err.message);
  }

  // 4. Accommodations
  try {
    const rows = readSeedData('accommodations');
    for (const a of rows) {
      const { id, createdAt, updatedAt, ...data } = a;
      await prisma.accommodation.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    console.log(`✅ ${rows.length} Accommodations seeded`);
  } catch (err) {
    console.warn('⚠️ Could not seed accommodations:', err.message);
  }

  // 5. Events
  try {
    const rows = readSeedData('events');
    for (const e of rows) {
      const { id, createdAt, updatedAt, ...data } = e;
      await prisma.event.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    console.log(`✅ ${rows.length} Events seeded`);
  } catch (err) {
    console.warn('⚠️ Could not seed events:', err.message);
  }

  // 6. Emergency Contacts
  try {
    const rows = readSeedData('emergencyContacts');
    for (const c of rows) {
      const { id, ...data } = c;
      await prisma.emergencyContact.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    console.log(`✅ ${rows.length} Emergency Contacts seeded`);
  } catch (err) {
    console.warn('⚠️ Could not seed emergency contacts:', err.message);
  }

  // 7. Tour Routes
  try {
    const rows = readSeedData('tourRoutes');
    for (const t of rows) {
      const { id, createdAt, updatedAt, ...data } = t;
      await prisma.tourRoute.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    console.log(`✅ ${rows.length} Tour Routes seeded`);
  } catch (err) {
    console.warn('⚠️ Could not seed tour routes:', err.message);
  }

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
