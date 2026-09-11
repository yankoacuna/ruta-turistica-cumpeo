const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding TourRoutes into database...');

  const initialRoutes = [
    {
      id: 'la-ruta-de-condorito',
      slug: 'la-ruta-de-condorito',
      nombre: 'La Ruta Oficial de Condorito',
      descripcion: 'El circuito temático y patrimonial de la historieta chilena en Cumpeo, desde el acceso carretero en Camarico hasta la plaza central y feria de artesanos.',
      color: '#E63946',
      poiIds: [
        'letrero-bienvenida-condorito',
        'el-pollo-farsante',
        'residencial-cone',
        'monumento-letras-cumpeo',
        'plaza-cumpeo-fuente-ugenio',
        'estatua-condorito-municipalidad',
        'feria-artesanos-pergola'
      ],
      duracionEstimada: '2 a 3 horas',
      distanciaKm: 7.5,
      dificultad: 'Fácil (Familiar / Vehicular y Peatonal)',
      mapaImagen: '/assets/images/mapa-ilustrado-ruta-condorito.png',
      destacada: true,
      activo: true,
      orden: 1,
      hitos: [
        {
          numero: 1,
          titulo: 'Acceso por Camarico',
          descripcion: 'En el Km 222 de la Ruta 5 Sur se toma el desvío señalizado hacia Cumpeo.'
        },
        {
          numero: 2,
          titulo: '7.5 Kilómetros de Paisaje',
          descripcion: 'Camino pavimentado rural entre viñas, frutales y gastronomía típica.'
        },
        {
          numero: 3,
          titulo: 'Corazón de Cumpeo',
          descripcion: 'Plaza de Armas, esculturas, comercio local y hospedajes maulinos.'
        }
      ],
      consejos: [
        {
          icono: '🚗',
          titulo: 'Transporte & Acceso',
          texto: 'Cumpeo está a 45 minutos de Talca y 2.5 horas de Santiago por la Ruta 5 Sur. Hay buses rurales frecuentes desde el Terminal de Talca.'
        },
        {
          icono: '🍽️',
          titulo: 'Almuerzos Criollos',
          texto: 'Se recomienda llegar antes de las 13:30 hrs los fines de semana para encontrar mesa con comodidad en los restaurantes locales.'
        },
        {
          icono: '📸',
          titulo: 'Fotografía & Respeto',
          texto: 'Todas las esculturas en los espacios públicos son gratuitas para fotografías. ¡Cuida las figuras patrimoniales para todos los turistas!'
        }
      ]
    },
    {
      id: 'ruta-tradiciones-ferias',
      slug: 'ruta-tradiciones-ferias',
      nombre: 'Ruta de Tradiciones y Ferias',
      descripcion: 'Recorrido por los puntos culturales más significativos de Cumpeo: la pérgola de artesanos, la iglesia y la alameda comunal.',
      color: '#E8A020',
      poiIds: [
        'feria-artesanos-pergola',
        'fiesta-san-sebastian',
        'feria-emprendedores-alameda'
      ],
      duracionEstimada: '1 a 2 horas',
      distanciaKm: 2.0,
      dificultad: 'Muy fácil (Paseo peatonal)',
      destacada: false,
      activo: true,
      orden: 2,
      hitos: [
        {
          numero: 1,
          titulo: 'Pérgola de Artesanos',
          descripcion: 'Souvenirs y artesanía típica maulina hecha a mano por productores locales.'
        },
        {
          numero: 2,
          titulo: 'Santuario y Tradición',
          descripcion: 'Espacio de fe y devoción campesina en torno a San Sebastián.'
        }
      ],
      consejos: [
        {
          icono: '🧶',
          titulo: 'Comercio Justo',
          texto: 'Prefiere artesanía original comprando directamente a las familias creadoras en la feria.'
        }
      ]
    },
    {
      id: 'ruta-sabores-cumpeo',
      slug: 'ruta-sabores-cumpeo',
      nombre: 'Circuito Gastronómico y Comercial',
      descripcion: 'Saborea la auténtica cocina maulina a lo largo del eje central de Cumpeo y la Ruta K-21.',
      color: '#C0392B',
      poiIds: [
        'san-sebastian-restaurante',
        'la-combi',
        'el-pollo-farsante'
      ],
      duracionEstimada: '2 horas',
      distanciaKm: 3.5,
      dificultad: 'Fácil',
      destacada: false,
      activo: true,
      orden: 3,
      hitos: [
        {
          numero: 1,
          titulo: 'Empanadas y Cazuelas',
          descripcion: 'Cocina a fuego lento con ingredientes del valle de Río Claro.'
        }
      ],
      consejos: [
        {
          icono: '💳',
          titulo: 'Medios de Pago',
          texto: 'La mayoría de los locales acepta transferencias y tarjetas, pero siempre es bueno llevar efectivo.'
        }
      ]
    }
  ];

  for (const r of initialRoutes) {
    await prisma.tourRoute.upsert({
      where: { id: r.id },
      update: {
        nombre: r.nombre,
        slug: r.slug,
        descripcion: r.descripcion,
        color: r.color,
        poiIds: r.poiIds,
        duracionEstimada: r.duracionEstimada,
        distanciaKm: r.distanciaKm,
        dificultad: r.dificultad,
        mapaImagen: r.mapaImagen,
        destacada: r.destacada,
        activo: r.activo,
        orden: r.orden,
        hitos: r.hitos,
        consejos: r.consejos
      },
      create: {
        id: r.id,
        slug: r.slug,
        nombre: r.nombre,
        descripcion: r.descripcion,
        color: r.color,
        poiIds: r.poiIds,
        duracionEstimada: r.duracionEstimada,
        distanciaKm: r.distanciaKm,
        dificultad: r.dificultad,
        mapaImagen: r.mapaImagen,
        destacada: r.destacada,
        activo: r.activo,
        orden: r.orden,
        hitos: r.hitos,
        consejos: r.consejos
      }
    });
    console.log(`✓ TourRoute "${r.nombre}" guardada con ${r.poiIds.length} paradas.`);
  }

  console.log('Seeding TourRoutes completado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
