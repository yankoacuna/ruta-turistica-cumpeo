const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function purge() {
  console.log('=== INICIANDO PURGA DE DATOS FICTICIOS ===');

  // 1. IDs de destinos ficticios creados en la plantilla inicial (NO están en el catastro)
  const fictionalDestinationIds = [
    'ruta-condorito',
    'plaza-cumpeo',
    'batalla-vegas-cumpeo',
    'canal-cumpeo',
    'ruta-arco-oriente',
    'viñas-locales',
  ];

  const deletedDests = await prisma.destination.deleteMany({
    where: {
      id: { in: fictionalDestinationIds },
    },
  });
  console.log(`Destinos ficticios eliminados: ${deletedDests.count}`);

  // 2. IDs de restaurantes que NO están en el Excel del catastro
  const realRestaurantIds = [
    'platillo-volador',
    'san-sebastian-restaurante',
    'la-terraza',
    'la-combi',
    'el-pollo-farsante',
    'tito-el-pacho',
    'la-oveja-negra',
    'sabor-oriental',
    'la-pica-del-tuna',
  ];

  const deletedRests = await prisma.restaurant.deleteMany({
    where: {
      id: { notIn: realRestaurantIds },
    },
  });
  console.log(`Restaurantes no pertenecientes al catastro eliminados: ${deletedRests.count}`);

  // 3. IDs de alojamientos que NO están en el Excel del catastro
  const realAccommodationIds = [
    'hostal-residencial-la-central',
    'hostal-pension-la-cuadra',
    'residencial-cone',
    'residencial-restaurante-pollo-farsante',
    'alojamiento-manikomio',
    'progreso',
  ];

  const deletedAccs = await prisma.accommodation.deleteMany({
    where: {
      id: { notIn: realAccommodationIds },
    },
  });
  console.log(`Alojamientos no pertenecientes al catastro eliminados: ${deletedAccs.count}`);

  // 4. Actualizar Config para reflejar solo categorías reales del catastro
  const cleanCategories = [
    {
      id: 'cultural',
      color: '#E8A020',
      emoji: '🎨',
      imagen: '/assets/images/placeholder.webp',
      nombre: 'Cultural y Religioso',
      botonTexto: 'DESCUBRE',
    },
    {
      id: 'entretencion',
      color: '#9B59B6',
      emoji: '🎉',
      imagen: '/assets/images/placeholder.webp',
      nombre: 'Eventos y Ferias',
      botonTexto: 'EXPLORA',
    },
    {
      id: 'gastronomia',
      color: '#C0392B',
      emoji: '🍽️',
      imagen: '/assets/images/placeholder.webp',
      nombre: 'Gastronomía',
      botonTexto: 'SABOREA',
    },
    {
      id: 'alojamiento',
      color: '#2C3E50',
      emoji: '🛏️',
      imagen: '/assets/images/placeholder.webp',
      nombre: 'Alojamientos',
      botonTexto: 'DESCANSA',
    },
  ];

  await prisma.config.upsert({
    where: { id: 'default' },
    update: { categorias: cleanCategories },
    create: { id: 'default', categorias: cleanCategories },
  });
  console.log('Categorías en Config actualizadas para reflejar solo el catastro.');

  // 5. Verificación final de la base de datos
  const totalDests = await prisma.destination.findMany({ select: { id: true, nombre: true } });
  const totalRests = await prisma.restaurant.findMany({ select: { id: true, nombre: true } });
  const totalAccs = await prisma.accommodation.findMany({ select: { id: true, nombre: true } });
  const totalEvents = await prisma.event.findMany({ select: { id: true, nombre: true } });

  console.log('\n=== ESTADO FINAL EN LA BASE DE DATOS (100% CATASTRO REAL) ===');
  console.log(`\nDestinos en BD (${totalDests.length}):`);
  totalDests.forEach((d) => console.log(`  - [${d.id}] ${d.nombre}`));

  console.log(`\nRestaurantes en BD (${totalRests.length}):`);
  totalRests.forEach((r) => console.log(`  - [${r.id}] ${r.nombre}`));

  console.log(`\nAlojamientos en BD (${totalAccs.length}):`);
  totalAccs.forEach((a) => console.log(`  - [${a.id}] ${a.nombre}`));

  console.log(`\nEventos en BD (${totalEvents.length}):`);
  totalEvents.forEach((e) => console.log(`  - [${e.id}] ${e.nombre}`));
}

purge()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
