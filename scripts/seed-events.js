const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Eventos reales del catastro municipal de Cumpeo
const eventos = [
  {
    id: 'fiesta-san-sebastian',
    nombre: 'Fiesta de San Sebastián',
    tipo: 'fiesta-religiosa',
    descripcion: 'Celebración anual en honor a San Sebastián cada 20 de enero. Procesión, misa solemne y actividades comunitarias.',
    descripcionLarga: 'La Fiesta de San Sebastián es una de las tradiciones religiosas más arraigadas de Cumpeo. La festividad reúne a los habitantes del pueblo, devotos de los alrededores y visitantes en una jornada de fe, música y celebración comunitaria. La procesión de la imagen recorre las calles principales en un ambiente de profunda devoción popular.',
    fecha: '20 de enero',
    recurrente: true,
    coordenadas: { lat: -35.2680, lng: -71.2510 },
    direccion: 'Iglesia y calles de Cumpeo',
    galeria: [],
    tags: ['religioso', 'enero', 'tradicion', 'procesion'],
    destacado: true,
    activo: true,
  },
  {
    id: 'cuasimodo-cumpeo',
    nombre: 'Cuasimodo en Cumpeo',
    tipo: 'fiesta-religiosa',
    descripcion: 'Tradición única en Chile: jinetes y huasos escoltan a sacerdotes que llevan la comunión a los enfermos del campo.',
    descripcionLarga: 'El Cuasimodo es una festividad religiosa única en el mundo, declarada Patrimonio Cultural Inmaterial de Chile. En Cumpeo, sacerdotes escoltados por cientos de jinetes y ciclistas llevan la Eucaristía a los enfermos. El espectáculo visual de la caravana de huasos es uno de los más fotogénicos del Maule.',
    fecha: 'Domingo siguiente a Pascua (aprox. 27 de abril)',
    recurrente: true,
    coordenadas: { lat: -35.2682, lng: -71.2515 },
    direccion: 'Iglesia y caminos rurales de Cumpeo',
    galeria: [],
    tags: ['religioso', 'huasos', 'patrimonio-inmaterial', 'abril'],
    destacado: true,
    activo: true,
  },
  {
    id: 'virgen-del-carmen-cumpeo',
    nombre: 'Fiesta de la Virgen del Carmen',
    tipo: 'fiesta-religiosa',
    descripcion: 'Celebración en honor a la Virgen del Carmen, patrona de Chile, cada 16 de julio.',
    descripcionLarga: 'El 16 de julio Cumpeo celebra la festividad de la Virgen del Carmen, patrona del Ejército de Chile. La celebración incluye misa solemne, procesión y actividades comunitarias que reafirman los lazos de la comunidad.',
    fecha: '16 de julio',
    recurrente: true,
    coordenadas: { lat: -35.2678, lng: -71.2508 },
    direccion: 'Iglesia de Cumpeo',
    galeria: [],
    tags: ['religioso', 'virgen', 'julio'],
    destacado: false,
    activo: true,
  },
  {
    id: 'semana-santa-cumpeo',
    nombre: 'Semana Santa en Cumpeo',
    tipo: 'fiesta-religiosa',
    descripcion: 'Del 13 al 19 de abril. Celebraciones religiosas que van del Domingo de Ramos al Domingo de Resurrección.',
    descripcionLarga: 'Durante la Semana Santa, Cumpeo se convierte en un pueblo de intensa vida religiosa y cultural. La autenticidad de las celebraciones en el entorno rural, libre de la masificación urbana, hace de Cumpeo un destino especial para estas fechas.',
    fecha: '13 al 19 de abril (varía según año litúrgico)',
    recurrente: true,
    coordenadas: { lat: -35.2678, lng: -71.2508 },
    direccion: 'Iglesia y calles de Cumpeo',
    galeria: [],
    tags: ['religioso', 'semana-santa', 'pascua', 'abril'],
    destacado: false,
    activo: true,
  },
  {
    id: 'feria-artesanos-pergola',
    nombre: 'Feria de Artesanos en la Pérgola',
    tipo: 'feria',
    descripcion: 'Mercado de artesanos en la pérgola de la Plaza de Cumpeo. Tejidos, cerámica, mermeladas y productos del campo maulino.',
    descripcionLarga: 'La Feria de Artesanos es uno de los eventos más pintorescos del pueblo. Emprendedores locales exhiben productos artesanales hechos a mano en el Maule, apoyando la economía local y mostrando la identidad del territorio más allá de la temática de Condorito.',
    fecha: 'Fines de semana (consultar municipalidad de Río Claro)',
    recurrente: true,
    coordenadas: { lat: -35.2678, lng: -71.2520 },
    direccion: 'Plaza de Cumpeo, Pérgola Central',
    galeria: [],
    tags: ['artesania', 'feria', 'plaza', 'compras', 'local'],
    destacado: true,
    activo: true,
  },
  {
    id: 'feria-emprendedores-alameda',
    nombre: 'Feria de Emprendedores en la Alameda',
    tipo: 'feria',
    descripcion: 'Feria municipal de emprendedores locales en la Alameda. Productos artesanales, gastronomía típica y manifestaciones culturales.',
    descripcionLarga: 'Iniciativa de la Municipalidad de Río Claro para potenciar a los pequeños productores locales. En la Alameda de Cumpeo se reúnen emprendedores con variedad de productos y alimentos elaborados localmente.',
    fecha: 'Consultar fechas en la municipalidad de Río Claro',
    recurrente: true,
    coordenadas: { lat: -35.2675, lng: -71.2518 },
    direccion: 'Alameda de Cumpeo',
    galeria: [],
    tags: ['emprendimiento', 'feria', 'gastronomia', 'local'],
    destacado: false,
    activo: true,
  },
  {
    id: 'centro-eventos-manikomio',
    nombre: 'Centro de Eventos Manikomio',
    tipo: 'centro-evento',
    descripcion: 'Espacio disponible para celebraciones, matrimonios, eventos corporativos y reuniones en Cumpeo.',
    descripcionLarga: 'El Centro de Eventos Manikomio es uno de los espacios para eventos de Cumpeo, con instalaciones para organizar eventos de mediana escala en el ambiente tranquilo y acogedor del pueblo maulino.',
    fecha: 'Según disponibilidad',
    recurrente: false,
    coordenadas: { lat: -35.2685, lng: -71.2520 },
    direccion: 'Cumpeo, Río Claro',
    galeria: [],
    tags: ['eventos', 'celebraciones', 'salon', 'matrimonios'],
    destacado: false,
    activo: true,
  },
  {
    id: 'centro-eventos-la-estancia',
    nombre: 'Centro de Eventos La Estancia',
    tipo: 'centro-evento',
    descripcion: 'Centro de eventos en ambiente de estancia rural maulina. Ideal para celebraciones y reuniones empresariales.',
    descripcionLarga: 'La Estancia ofrece un ambiente de estancia rural para celebraciones y eventos sociales. Su ambiente tradicional del campo maulino lo hace ideal para quienes buscan una experiencia alejada del entorno urbano.',
    fecha: 'Según disponibilidad',
    recurrente: false,
    coordenadas: { lat: -35.2690, lng: -71.2525 },
    direccion: 'Cumpeo, Río Claro',
    galeria: [],
    tags: ['eventos', 'estancia', 'rural', 'campo'],
    destacado: false,
    activo: true,
  },
];

async function main() {
  console.log('Cargando eventos del catastro a la BD...');
  for (const ev of eventos) {
    await prisma.event.upsert({
      where: { id: ev.id },
      update: ev,
      create: ev,
    });
    console.log('OK:', ev.nombre);
  }
  console.log(`\nTotal: ${eventos.length} eventos cargados.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
