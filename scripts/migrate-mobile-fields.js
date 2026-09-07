const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('=== POBLANDO CAMPOS MÓVILES (TELÉFONO, WHATSAPP, ACTIVO) ===');

  const restPhones = {
    'platillo-volador': '+56 9 6507 5887',
    'san-sebastian-restaurante': '+56 9 9737 3759',
    'la-terraza': '+56 9 7522 0922',
    'la-combi': '+56 9 3177 9951',
    'el-pollo-farsante': '+56 9 9795 7024',
    'tito-el-pacho': '+56 9 3651 6497',
    'la-oveja-negra': '+56 9 8902 6642',
    'sabor-oriental': '+56 9 7136 3316',
    'la-pica-del-tuna': '+56 9 9437 7921',
  };

  for (const [id, tel] of Object.entries(restPhones)) {
    await prisma.restaurant.updateMany({
      where: { id },
      data: {
        telefono: tel,
        whatsapp: tel.replace(/[^0-9]/g, ''),
        activo: true,
      },
    });
    console.log('Restaurante actualizado con teléfono móvil:', id, '->', tel);
  }

  const accPhones = {
    'hostal-residencial-la-central': '+56 9 8204 0623',
    'hostal-pension-la-cuadra': '+56 9 9737 3759',
    'residencial-cone': '+56 9 9199 0171',
    'residencial-restaurante-pollo-farsante': '+56 9 9795 7024',
    'alojamiento-manikomio': '+56 9 8418 7062',
    'progreso': '+56 9 9575 8498',
  };

  for (const [id, tel] of Object.entries(accPhones)) {
    await prisma.accommodation.updateMany({
      where: { id },
      data: {
        telefono: tel,
        whatsapp: tel.replace(/[^0-9]/g, ''),
        activo: true,
      },
    });
    console.log('Alojamiento actualizado con teléfono móvil:', id, '->', tel);
  }

  // Activar todos los destinos
  await prisma.destination.updateMany({
    data: { activo: true },
  });

  // Crear o actualizar Contactos de Emergencia Comunales
  const emergencias = [
    {
      id: 'carabineros-cumpeo',
      institucion: 'Carabineros (Retén Cumpeo)',
      telefono: '+56 71 257 1146',
      icono: 'shield',
      direccion: 'Av. Ursicinio Opazo s/n, Cumpeo',
      orden: 1,
      activo: true,
    },
    {
      id: 'cesfam-cumpeo',
      institucion: 'Urgencias CESFAM Cumpeo',
      telefono: '+56 71 257 1150',
      icono: 'ambulance',
      direccion: 'Calle Los Maitenes s/n, Cumpeo',
      orden: 2,
      activo: true,
    },
    {
      id: 'bomberos-rio-claro',
      institucion: 'Bomberos Río Claro / Cumpeo',
      telefono: '132',
      icono: 'flame',
      direccion: 'Cumpeo, Río Claro',
      orden: 3,
      activo: true,
    },
    {
      id: 'seguridad-municipal',
      institucion: 'Seguridad Ciudadana Municipal',
      telefono: '+56 9 6842 1739',
      icono: 'phone',
      direccion: 'Municipalidad de Río Claro',
      orden: 4,
      activo: true,
    },
  ];

  for (const em of emergencias) {
    await prisma.emergencyContact.upsert({
      where: { id: em.id },
      update: em,
      create: em,
    });
  }
  console.log('\nContactos de emergencia comunales registrados:', emergencias.length);
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
