const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Seed Config
  try {
    const configData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/config.json'), 'utf-8'));
    await prisma.config.upsert({
      where: { id: 'default' },
      update: { categorias: configData.categorias || [] },
      create: {
        id: 'default',
        categorias: configData.categorias || []
      }
    });
    console.log('✅ Config seeded');
  } catch (err) {
    console.warn('⚠️ Could not seed config:', err.message);
  }

  // 2. Seed Destinations
  try {
    const destData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/destinations.json'), 'utf-8'));
    let destsCount = 0;
    for (const d of destData.destinos || []) {
      const slug = d.slug || d.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const id = d.id || slug;
      await prisma.destination.upsert({
        where: { id },
        update: {},
        create: {
          id,
          slug,
          nombre: d.nombre,
          categoria: d.categoria,
          descripcionCorta: d.descripcionCorta,
          descripcionLarga: d.descripcionLarga,
          historia: d.historia,
          coordenadas: d.coordenadas,
          direccion: d.direccion,
          horario: d.horario,
          precio: d.precio,
          duracionVisita: d.duracionVisita,
          comoLlegar: d.comoLlegar,
          tags: d.tags || [],
          imagenPrincipal: d.imagenPrincipal,
          galeria: d.galeria || [],
          rating: d.rating,
          destacado: d.destacado || false
        }
      });
      destsCount++;
    }
    console.log(`✅ ${destsCount} Destinations seeded`);
  } catch (err) {
    console.warn('⚠️ Could not seed destinations:', err.message);
  }

  // 3. Seed Restaurants
  try {
    const restData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/restaurants.json'), 'utf-8'));
    let restsCount = 0;
    for (const r of restData.restaurantes || []) {
      await prisma.restaurant.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          nombre: r.nombre,
          descripcion: r.descripcion,
          coordenadas: r.coordenadas,
          direccion: r.direccion,
          horario: r.horario,
          precio: r.precio,
          tags: r.tags || [],
          imagenPrincipal: r.imagenPrincipal,
          galeria: r.galeria || [],
          menuUrl: r.menuUrl,
          contacto: r.contacto
        }
      });
      restsCount++;
    }
    console.log(`✅ ${restsCount} Restaurants seeded`);
  } catch (err) {
    console.warn('⚠️ Could not seed restaurants:', err.message);
  }

  // 4. Seed Accommodations
  try {
    const accData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/accommodations.json'), 'utf-8'));
    let accsCount = 0;
    for (const a of accData.alojamientos || []) {
      await prisma.accommodation.upsert({
        where: { id: a.id },
        update: {},
        create: {
          id: a.id,
          nombre: a.nombre,
          descripcion: a.descripcion,
          coordenadas: a.coordenadas,
          direccion: a.direccion,
          precio: a.precio,
          servicios: a.servicios || [],
          imagenPrincipal: a.imagenPrincipal,
          galeria: a.galeria || [],
          contacto: a.contacto
        }
      });
      accsCount++;
    }
    console.log(`✅ ${accsCount} Accommodations seeded`);
  } catch (err) {
    console.warn('⚠️ Could not seed accommodations:', err.message);
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
