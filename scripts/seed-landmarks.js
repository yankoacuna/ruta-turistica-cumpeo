const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const landmarks = [
  {
    id: 'monumento-letras-cumpeo',
    slug: 'monumento-letras-cumpeo',
    nombre: 'Monumento Letras CUMPEO (Coné y Washington)',
    categoria: 'cultural',
    descripcionCorta: 'Letrero volumétrico monumental con esculturas a tamaño real de Coné y el perro Washington en la plaza de Cumpeo.',
    descripcionLarga: 'En el centro de la Plaza de Cumpeo se erige el monumento oficial con las letras volumétricas del pueblo. Acompañando las letras se encuentran las esculturas a tamaño real de Coné, el travieso sobrino de Condorito, y Washington, el fiel perro que reposa plácidamente sobre el letrero. Es uno de los puntos fotográficos más queridos por niños y adultos.',
    historia: 'Inaugurado para dar identidad al pueblo temático de Condorito, homenajeando a dos de los personajes más entrañables creados por Pepo.',
    coordenadas: { lat: -35.2678, lng: -71.2515 },
    direccion: 'Plaza de Cumpeo, Av. Los Aromos',
    horario: 'Abierto todo el día',
    duracionVisita: '30 minutos',
    comoLlegar: 'Plaza principal de Cumpeo, frente a la avenida Los Aromos.',
    tags: ['letras', 'cone', 'washington', 'escultura', 'plaza', 'foto'],
    imagenPrincipal: '/assets/images/letras-cumpeo-cone.jpg',
    galeria: ['/assets/images/letras-cumpeo-cone.jpg'],
    destacado: true,
    activo: true,
  },
  {
    id: 'plaza-cumpeo-fuente-ugenio',
    slug: 'plaza-cumpeo-fuente-ugenio',
    nombre: 'Plaza de Armas',
    categoria: 'cultural',
    descripcionCorta: 'Histórica plaza con frondosas palmeras, senderos adoquinados y fuente ornamental en el corazón cívico de Cumpeo.',
    descripcionLarga: 'La Plaza de Armas de Cumpeo es el corazón social y de descanso de la comuna de Río Claro. Cuenta con añosas palmeras chilenas, senderos adoquinados y una clásica fuente de agua ornamental en el centro cívico.',
    historia: 'La plaza es el punto fundacional de Cumpeo, rodeada por el comercio local, la iglesia y la sede municipal.',
    coordenadas: { lat: -35.2679, lng: -71.2518 },
    direccion: 'Plaza de Armas de Cumpeo',
    horario: 'Abierto las 24 horas',
    duracionVisita: '45 minutos',
    comoLlegar: 'Centro cívico de Cumpeo, entre Av. Los Aromos y calle Comercio.',
    tags: ['plaza', 'cumpeo', 'fuente', 'parque', 'civico'],
    imagenPrincipal: '/assets/images/plaza-fuente-ugenio.jpg',
    galeria: ['/assets/images/plaza-fuente-ugenio.jpg'],
    destacado: true,
    activo: true,
  },
];

async function main() {
  console.log('Insertando hitos emblemáticos en la base de datos...');
  for (const lm of landmarks) {
    const res = await prisma.destination.upsert({
      where: { id: lm.id },
      update: {
        nombre: lm.nombre,
        descripcionCorta: lm.descripcionCorta,
        descripcionLarga: lm.descripcionLarga,
        historia: lm.historia,
        coordenadas: lm.coordenadas,
        direccion: lm.direccion,
        horario: lm.horario,
        duracionVisita: lm.duracionVisita,
        comoLlegar: lm.comoLlegar,
        tags: lm.tags,
        imagenPrincipal: lm.imagenPrincipal,
        galeria: lm.galeria,
        destacado: lm.destacado,
        activo: lm.activo,
      },
      create: {
        id: lm.id,
        slug: lm.slug,
        nombre: lm.nombre,
        categoria: lm.categoria,
        descripcionCorta: lm.descripcionCorta,
        descripcionLarga: lm.descripcionLarga,
        historia: lm.historia,
        coordenadas: lm.coordenadas,
        direccion: lm.direccion,
        horario: lm.horario,
        duracionVisita: lm.duracionVisita,
        comoLlegar: lm.comoLlegar,
        tags: lm.tags,
        imagenPrincipal: lm.imagenPrincipal,
        galeria: lm.galeria,
        destacado: lm.destacado,
        activo: lm.activo,
      },
    });
    console.log(`✅ Hito: ${res.nombre}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
