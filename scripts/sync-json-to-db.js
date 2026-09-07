const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function sync() {
  console.log('--- Sincronizando Restaurantes con BD ---');
  const restData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../public/data/restaurants.json'), 'utf-8')
  );
  for (const r of restData.restaurantes) {
    await prisma.restaurant.upsert({
      where: { id: r.id },
      update: {
        nombre: r.nombre,
        tipo: r.tipo,
        descripcion: r.descripcion,
        especialidad: r.especialidad || null,
        propietario: r.propietario || null,
        coordenadas: r.coordenadas,
        direccion: r.direccion,
        horario: r.horario,
        precio: r.precio,
        mediosPago: r.mediosPago || [],
        tags: r.tags || [],
        imagenPrincipal: r.imagenPrincipal,
        galeria: r.galeria || [],
        contacto: r.contacto,
        menuUrl: r.menuUrl || null,
      },
      create: {
        id: r.id,
        nombre: r.nombre,
        tipo: r.tipo,
        descripcion: r.descripcion,
        especialidad: r.especialidad || null,
        propietario: r.propietario || null,
        coordenadas: r.coordenadas,
        direccion: r.direccion,
        horario: r.horario,
        precio: r.precio,
        mediosPago: r.mediosPago || [],
        tags: r.tags || [],
        imagenPrincipal: r.imagenPrincipal,
        galeria: r.galeria || [],
        contacto: r.contacto,
        menuUrl: r.menuUrl || null,
      },
    });
    console.log('Restaurante actualizado:', r.nombre, '-> Propietario:', r.propietario);
  }

  console.log('\n--- Sincronizando Alojamientos con BD ---');
  const accData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../public/data/accommodations.json'), 'utf-8')
  );
  for (const a of accData.alojamientos) {
    await prisma.accommodation.upsert({
      where: { id: a.id },
      update: {
        nombre: a.nombre,
        tipo: a.tipo,
        descripcion: a.descripcion,
        propietario: a.propietario || null,
        coordenadas: a.coordenadas,
        direccion: a.direccion,
        precio: a.precio,
        servicios: a.servicios || [],
        imagenPrincipal: a.imagenPrincipal,
        galeria: a.galeria || [],
        contacto: a.contacto,
      },
      create: {
        id: a.id,
        nombre: a.nombre,
        tipo: a.tipo,
        descripcion: a.descripcion,
        propietario: a.propietario || null,
        coordenadas: a.coordenadas,
        direccion: a.direccion,
        precio: a.precio,
        servicios: a.servicios || [],
        imagenPrincipal: a.imagenPrincipal,
        galeria: a.galeria || [],
        contacto: a.contacto,
      },
    });
    console.log('Alojamiento actualizado:', a.nombre, '-> Propietario:', a.propietario);
  }

  console.log('\n--- Sincronización completa ---');
}

sync()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
