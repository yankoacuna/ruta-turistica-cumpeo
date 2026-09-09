const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Restaurantes ficticios (no están en el catastro real del municipio)
  const restFicticios = ['farmacia-sin-remedio-cafe', 'quincho-don-chuma', 'mini-market-cone'];
  for (const id of restFicticios) {
    const del = await prisma.restaurant.deleteMany({ where: { id } });
    console.log('Restaurante eliminado:', id, '| eliminados:', del.count);
  }

  // El Pollo Farsante existia con datos ficticios, actualizar con datos reales del catastro
  await prisma.restaurant.update({
    where: { id: 'el-pollo-farsante' },
    data: {
      nombre: 'El Pollo Farsante',
      descripcion: 'El restaurante más famoso de Cumpeo, temático e inspirado en Condorito. Cocina chilena tradicional del Maule en la Ruta K-21. Residencial incluida para viajeros que quieran quedarse a vivir la experiencia completa.',
      direccion: 'Ruta K-21, Km 7,5, Cumpeo',
      contacto: { telefono: '+56 9 9795 7024' },
      horario: { apertura: '10:00', cierre: '22:00', diasCierre: [], descripcion: 'Todos los días' },
      tags: ['tematico', 'condorito', 'ruta-k21'],
    }
  });
  console.log('El Pollo Farsante actualizado con datos reales del catastro');

  // Alojamientos ficticios (no están en el catastro real del municipio)
  const accFicticios = ['cabanas-del-maule', 'hospedaje-cumpeo-center', 'camping-rio-claro'];
  for (const id of accFicticios) {
    const del = await prisma.accommodation.deleteMany({ where: { id } });
    console.log('Alojamiento eliminado:', id, '| eliminados:', del.count);
  }

  console.log('\n=== Limpieza completada ===');
  
  // Verificar estado final
  const totalRest = await prisma.restaurant.count();
  const totalAcc = await prisma.accommodation.count();
  console.log('Restaurantes en BD:', totalRest);
  console.log('Alojamientos en BD:', totalAcc);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
