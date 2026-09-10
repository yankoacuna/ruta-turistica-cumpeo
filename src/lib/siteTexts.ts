/**
 * Registro de textos editables del sitio publico.
 *
 * Este archivo es la fuente de verdad de los valores POR DEFECTO. La tabla
 * SiteText de la base de datos solo guarda los textos que un editor cambio
 * desde el CMS: si esa tabla esta vacia, el sitio se ve exactamente igual que
 * antes de existir esta funcionalidad.
 *
 * Como agregar un texto editable nuevo:
 *   1. Agregarlo aca dentro del grupo que corresponda, con su valor actual.
 *   2. Reemplazar el literal en el componente por <Editable k="la.clave" />.
 * No hace falta tocar la base de datos ni el CMS: la seccion "Textos del
 * sitio" se arma leyendo este registro.
 *
 * Reglas:
 * - Solo texto plano. Se renderiza escapado por React, nunca como HTML.
 * - Las claves son permanentes: renombrar una clave deja huerfano el texto
 *   guardado en la base (vuelve al valor por defecto).
 */

export interface SiteTextDef {
  key: string;
  /** Nombre humano del campo, es lo que ve el editor en el CMS. */
  label: string;
  /** Valor por defecto: el texto tal como esta escrito en el codigo. */
  value: string;
  /** true para parrafos: el CMS usa textarea y el sitio respeta saltos de linea. */
  multiline?: boolean;
  /** Pista opcional para el editor. */
  hint?: string;
}

export interface SiteTextGroup {
  id: string;
  /** Pagina a la que pertenece el grupo, para agrupar en el CMS. */
  pagina: string;
  /** Ruta donde se ve, para el boton "editar en el sitio". */
  path: string;
  /** Bloque dentro de la pagina. */
  label: string;
  items: SiteTextDef[];
}

export type SiteTexts = Record<string, string>;

export const SITE_TEXT_MAX_LENGTH = 4000;

export const SITE_TEXT_GROUPS: SiteTextGroup[] = [
  // ── NAVEGACION Y PIE (se ven en todas las paginas) ────────────────────────
  {
    id: 'nav',
    pagina: 'Global',
    path: '/',
    label: 'Barra de navegación',
    items: [
      { key: 'nav.marca', label: 'Nombre del sitio', value: 'Cumpeo Turismo' },
      { key: 'nav.marcaBajada', label: 'Bajada de la marca', value: 'Pueblo de Condorito' },
      { key: 'nav.marcaRegion', label: 'Etiqueta de región', value: 'Maule' },
      { key: 'nav.inicio', label: 'Menú: inicio', value: 'Inicio' },
      { key: 'nav.ruta', label: 'Menú: ruta (corto)', value: 'La Ruta' },
      { key: 'nav.rutaLargo', label: 'Menú: ruta (largo)', value: 'La Ruta de Condorito' },
      { key: 'nav.historia', label: 'Menú: historia (corto)', value: 'Historia' },
      { key: 'nav.historiaLargo', label: 'Menú: historia (largo)', value: 'Historia del Pueblo' },
      { key: 'nav.contacto', label: 'Menú: contacto (corto)', value: 'Contacto' },
      { key: 'nav.contactoLargo', label: 'Menú: contacto (largo)', value: 'Contacto e Información' },
      { key: 'nav.mapa', label: 'Menú: mapa (corto)', value: 'Mapa GPS' },
      { key: 'nav.mapaCta', label: 'Botón del mapa', value: 'Abrir Mapa GPS' },
      { key: 'nav.admin', label: 'Menú: administración', value: 'Panel de Administración' },
      { key: 'nav.drawerBajada', label: 'Bajada del menú móvil', value: 'Pelotillehue Real' },
      {
        key: 'nav.frase',
        label: 'Frase del menú móvil',
        value: '«¡Exijo una explicación! — Ven a Cumpeo»',
      },
      { key: 'nav.climaCargando', label: 'Clima: cargando', value: 'Cargando clima...' },
    ],
  },
  {
    id: 'footer',
    pagina: 'Global',
    path: '/',
    label: 'Pie de página',
    items: [
      { key: 'footer.marca', label: 'Nombre del sitio', value: 'Cumpeo Turismo' },
      {
        key: 'footer.descripcion',
        label: 'Descripción institucional',
        value:
          'El Pueblo Temático de Condorito - Región del Maule.\nIniciativa impulsada por la Ilustre Municipalidad de Río Claro para el desarrollo patrimonial y turístico.',
        multiline: true,
      },
      { key: 'footer.badge', label: 'Sello de bienvenida', value: '¡Reflauta! Bienvenidos' },

      { key: 'footer.info.titulo', label: 'Columna 2: título', value: 'Info Útil del Visitante' },
      { key: 'footer.info.comoLlegar.titulo', label: 'Cómo llegar: título', value: 'Cómo llegar' },
      {
        key: 'footer.info.comoLlegar.texto',
        label: 'Cómo llegar: texto',
        value: 'Desde Talca: Ruta 5 Sur, ~50 km (45 min). Buses desde Terminal Rodoviario Talca.',
        multiline: true,
      },
      { key: 'footer.info.epoca.titulo', label: 'Mejor época: título', value: 'Mejor época' },
      {
        key: 'footer.info.epoca.texto',
        label: 'Mejor época: texto',
        value: 'Octubre–Abril. Vendimia recomendada en Marzo–Abril.',
        multiline: true,
      },
      { key: 'footer.info.clima.titulo', label: 'Clima: título', value: 'Clima' },
      {
        key: 'footer.info.clima.texto',
        label: 'Clima: texto',
        value: 'Mediterráneo. Veranos 25–34°C, Inviernos 4–14°C.',
        multiline: true,
      },

      { key: 'footer.contacto.titulo', label: 'Columna 3: título', value: 'Contacto y Emergencias' },
      {
        key: 'footer.contacto.emergenciasTitulo',
        label: 'Emergencias: título',
        value: 'Teléfonos de Emergencia',
      },
      { key: 'footer.contacto.carabineros', label: 'Emergencia: carabineros', value: 'Carabineros: 133' },
      { key: 'footer.contacto.bomberos', label: 'Emergencia: bomberos', value: 'Bomberos: 132' },
      { key: 'footer.contacto.samu', label: 'Emergencia: SAMU', value: 'SAMU: 131' },
      {
        key: 'footer.contacto.muniTitulo',
        label: 'Municipalidad: título',
        value: 'Municipalidad de Río Claro',
      },
      { key: 'footer.contacto.muniTelefono', label: 'Municipalidad: teléfono', value: 'Teléfono: +56 71 254 1200' },
      { key: 'footer.contacto.muniEmail', label: 'Municipalidad: email', value: 'Email: turismo@rioclaro.cl' },

      { key: 'footer.nav.titulo', label: 'Columna 4: título', value: 'Navegación' },
      {
        key: 'footer.copyright',
        label: 'Línea de copyright',
        value: '© 2026 Cumpeo Turismo - Municipalidad de Río Claro, Maule, Chile.',
      },
      { key: 'footer.version', label: 'Versión', value: 'v1.0.0' },
    ],
  },

  // ── PORTADA ───────────────────────────────────────────────────────────────
  {
    id: 'home.hero',
    pagina: 'Portada',
    path: '/',
    label: 'Encabezado principal (hero)',
    items: [
      {
        key: 'home.hero.municipalidad',
        label: 'Franja institucional',
        value: 'Ilustre Municipalidad de Río Claro',
      },
      { key: 'home.hero.region', label: 'Región', value: 'Región del Maule' },
      { key: 'home.hero.portalBadge', label: 'Sello de portal', value: 'Portal Oficial' },
      { key: 'home.hero.titulo', label: 'Titular', value: 'Cumpeo' },
      { key: 'home.hero.subtitulo', label: 'Subtitular', value: 'el pueblo de Condorito' },
      {
        key: 'home.hero.bajada',
        label: 'Bajada',
        value:
          'El único pueblo temático del mundo dedicado a la obra de Pepo. Esculturas a tamaño real, cocina criolla y campo maulino.',
        multiline: true,
      },
      { key: 'home.hero.ctaRuta', label: 'Botón principal', value: 'Recorrer la Ruta' },
      { key: 'home.hero.ctaMapa', label: 'Botón secundario', value: 'Ver mapa GPS' },
      {
        key: 'home.hero.buscador',
        label: 'Buscador: texto de ayuda',
        value: 'Buscar un lugar de Cumpeo...',
      },
      {
        key: 'home.hero.qrAviso',
        label: 'Aviso del QR (solo escritorio)',
        value: 'Escanea el QR de cada señalética para llegar aquí',
      },
    ],
  },
  {
    id: 'home.orientacion',
    pagina: 'Portada',
    path: '/',
    label: 'Orientación al visitante',
    items: [
      { key: 'home.orientacion.titulo', label: 'Título', value: '¿Recién llegaste a Cumpeo?' },
      {
        key: 'home.orientacion.bajada',
        label: 'Bajada',
        value: 'Empieza por aquí: lo que tienes al lado, dónde comer y a quién llamar.',
        multiline: true,
      },
      { key: 'home.orientacion.gps.titulo', label: 'GPS: título', value: 'Cerca de mí' },
      { key: 'home.orientacion.gps.buscando', label: 'GPS: buscando', value: 'Buscando señal…' },
      { key: 'home.orientacion.gps.detalle', label: 'GPS: detalle', value: 'Ordenado por distancia' },
      { key: 'home.orientacion.comer.titulo', label: 'Comer: título', value: 'Dónde comer' },
      { key: 'home.orientacion.comer.detalle', label: 'Comer: detalle', value: 'Picadas y restaurantes' },
      { key: 'home.orientacion.dormir.titulo', label: 'Dormir: título', value: 'Dónde dormir' },
      { key: 'home.orientacion.dormir.detalle', label: 'Dormir: detalle', value: 'Cabañas y hospedajes' },
      { key: 'home.orientacion.sos.titulo', label: 'Emergencias: título', value: 'Emergencias' },
      {
        key: 'home.orientacion.sos.detalle',
        label: 'Emergencias: detalle',
        value: 'Carabineros, SAMU, Bomberos',
      },
    ],
  },
  {
    id: 'home.cerca',
    pagina: 'Portada',
    path: '/',
    label: 'Resultado del GPS',
    items: [
      { key: 'home.cerca.kicker', label: 'Antetítulo', value: 'Según tu posición GPS' },
      { key: 'home.cerca.titulo', label: 'Título', value: 'Lo más cerca de ti' },
      { key: 'home.cerca.actualizar', label: 'Botón actualizar', value: 'Actualizar' },
    ],
  },
  {
    id: 'home.ruta',
    pagina: 'Portada',
    path: '/',
    label: 'Bloque de la Ruta',
    items: [
      { key: 'home.ruta.kicker', label: 'Antetítulo', value: 'Circuito patrimonial' },
      {
        key: 'home.ruta.tituloFallback',
        label: 'Título (si no hay ruta destacada)',
        value: 'La Ruta Oficial de Condorito',
        hint: 'Solo se usa cuando ninguna ruta del catastro está marcada como destacada.',
      },
      {
        key: 'home.ruta.descripcionFallback',
        label: 'Descripción (si no hay ruta destacada)',
        value:
          'El itinerario comunal para recorrer Cumpeo a pie: esculturas temáticas, cocina criolla y la historia del único pueblo del mundo dedicado a Condorito.',
        multiline: true,
      },
      { key: 'home.ruta.cta', label: 'Botón', value: 'Ver el itinerario completo' },
    ],
  },
  {
    id: 'home.destacados',
    pagina: 'Portada',
    path: '/',
    label: 'Destacados',
    items: [
      { key: 'home.destacados.kicker', label: 'Antetítulo', value: 'Galería patrimonial' },
      { key: 'home.destacados.titulo', label: 'Título', value: 'Lo que no te puedes perder' },
      {
        key: 'home.destacados.lead',
        label: 'Bajada',
        value: 'Los hitos más emblemáticos del pueblo temático, elegidos por la Oficina de Turismo.',
        multiline: true,
      },
      { key: 'home.destacados.accion', label: 'Enlace de sección', value: 'Ver todos en el mapa' },
      { key: 'home.destacados.verFicha', label: 'Enlace de la ficha', value: 'Ver ficha completa' },
    ],
  },
  {
    id: 'home.servicios',
    pagina: 'Portada',
    path: '/',
    label: 'Comer y dormir',
    items: [
      { key: 'home.servicios.kicker', label: 'Antetítulo', value: 'Catastro comunal' },
      { key: 'home.servicios.titulo', label: 'Título', value: 'Comer y dormir en Cumpeo' },
      {
        key: 'home.servicios.lead',
        label: 'Bajada',
        value:
          'Locales y hospedajes registrados por la Oficina de Turismo. Llama o pide indicaciones directamente desde aquí.',
        multiline: true,
      },
      { key: 'home.servicios.tabComer', label: 'Pestaña comer', value: 'Comer' },
      { key: 'home.servicios.tabDormir', label: 'Pestaña dormir', value: 'Dormir' },
    ],
  },
  {
    id: 'home.catalogo',
    pagina: 'Portada',
    path: '/',
    label: 'Catastro de destinos',
    items: [
      { key: 'home.catalogo.kicker', label: 'Antetítulo', value: 'Explorar por categoría' },
      { key: 'home.catalogo.titulo', label: 'Título', value: 'Todos los destinos' },
      {
        key: 'home.catalogo.lead',
        label: 'Bajada',
        value: 'El catastro turístico completo de la comuna, filtrable por categoría.',
        multiline: true,
      },
      { key: 'home.catalogo.accion', label: 'Enlace de sección', value: 'Abrir mapa GPS' },
      {
        key: 'home.catalogo.vacio',
        label: 'Mensaje sin resultados',
        value: 'No hay resultados en esta categoría por ahora.',
      },
    ],
  },
  {
    id: 'home.eventos',
    pagina: 'Portada',
    path: '/',
    label: 'Fiestas y eventos',
    items: [
      { key: 'home.eventos.kicker', label: 'Antetítulo', value: 'Calendario tradicional' },
      { key: 'home.eventos.titulo', label: 'Título', value: 'Fiestas y eventos costumbristas' },
      {
        key: 'home.eventos.lead',
        label: 'Bajada',
        value: 'Festividades religiosas, ferias artesanales y celebraciones típicas de la comuna.',
        multiline: true,
      },
      { key: 'home.eventos.accion', label: 'Enlace de sección', value: 'Ver en el mapa' },
      { key: 'home.eventos.sinFecha', label: 'Evento sin fecha', value: 'Por confirmar' },
      { key: 'home.eventos.ubicacion', label: 'Botón de cada evento', value: 'Ubicación' },
    ],
  },
  {
    id: 'home.municipal',
    pagina: 'Portada',
    path: '/',
    label: 'Aviso municipal (cierre)',
    items: [
      { key: 'home.municipal.kicker', label: 'Antetítulo', value: 'Aviso municipal' },
      {
        key: 'home.municipal.titulo',
        label: 'Título',
        value: '¿Tienes un local, cabaña o taller artesanal en Cumpeo?',
      },
      {
        key: 'home.municipal.texto',
        label: 'Texto',
        value:
          'Registra tu emprendimiento en el catastro comunal oficial y aparece en este portal. Acércate a la Oficina de Turismo de la Ilustre Municipalidad de Río Claro, o escríbenos.',
        multiline: true,
      },
      { key: 'home.municipal.ctaRegistrar', label: 'Botón principal', value: 'Registrar mi negocio' },
      {
        key: 'home.municipal.ctaEmergencias',
        label: 'Botón secundario',
        value: 'Teléfonos de emergencia',
      },
    ],
  },
  {
    id: 'emergencias',
    pagina: 'Portada',
    path: '/',
    label: 'Ventana de emergencias',
    items: [
      { key: 'emergencias.titulo', label: 'Título', value: 'Asistencia y Contacto Comunal' },
      {
        key: 'emergencias.subtitulo',
        label: 'Subtítulo',
        value: 'Ilustre Municipalidad de Río Claro · Cumpeo',
      },
      {
        key: 'emergencias.oficinaKicker',
        label: 'Oficina: antetítulo',
        value: 'Oficina de Turismo Municipal',
      },
      {
        key: 'emergencias.oficinaNombre',
        label: 'Oficina: nombre',
        value: 'Oficina de Informaciones Turísticas (OIT)',
        hint: 'Se usa si el dato no viene de la configuración del sitio.',
      },
      {
        key: 'emergencias.oficinaHorario',
        label: 'Oficina: horario',
        value: 'Lunes a Viernes 08:30 - 17:30 hrs',
        hint: 'Se usa si el dato no viene de la configuración del sitio.',
      },
      { key: 'emergencias.numerosTitulo', label: 'Números: título', value: 'Números de Emergencia' },
      { key: 'emergencias.cerrar', label: 'Botón cerrar', value: 'Cerrar' },
    ],
  },

  // ── PAGINA: LA RUTA ───────────────────────────────────────────────────────
  {
    id: 'ruta.hero',
    pagina: 'La Ruta',
    path: '/ruta',
    label: 'Encabezado',
    items: [
      { key: 'ruta.hero.kicker', label: 'Antetítulo', value: 'Circuito Turístico Oficial' },
      {
        key: 'ruta.hero.tituloFallback',
        label: 'Título (si la ruta no tiene nombre)',
        value: 'Circuito Turístico de Cumpeo',
      },
      { key: 'ruta.hero.ubicacion', label: 'Ubicación bajo el título', value: 'Río Claro, Maule' },
      {
        key: 'ruta.hero.descripcionFallback',
        label: 'Descripción (si la ruta no tiene una)',
        value:
          'Descubre los hitos patrimoniales, gastronómicos y culturales de Cumpeo, ambientados en las tradiciones maulinas y la historieta de Condorito.',
        multiline: true,
      },
      { key: 'ruta.hero.ctaMapa', label: 'Botón del mapa', value: 'Navegar en Mapa GPS en Vivo' },
      { key: 'ruta.hero.ctaMapaIlustrado', label: 'Botón del mapa ilustrado', value: 'Ver Mapa Ilustrado ↓' },
      { key: 'ruta.hero.selloKicker', label: 'Sello: antetítulo', value: 'Iniciativa Turística Oficial' },
      {
        key: 'ruta.hero.selloTexto',
        label: 'Sello: texto',
        value:
          'Coordinado por la Ilustre Municipalidad de Río Claro para el fomento del turismo comunal y el comercio local.',
        multiline: true,
      },
      { key: 'ruta.selector', label: 'Selector de circuitos', value: 'Circuitos Disponibles:' },
    ],
  },
  {
    id: 'ruta.mapa',
    pagina: 'La Ruta',
    path: '/ruta',
    label: 'Mapa ilustrado',
    items: [
      { key: 'ruta.mapa.kicker', label: 'Antetítulo', value: 'Mapa Cartográfico Patrimonial' },
      { key: 'ruta.mapa.titulo', label: 'Título', value: 'El Mapa Ilustrado del Circuito' },
      {
        key: 'ruta.mapa.lead',
        label: 'Bajada',
        value:
          'Guía cartográfica oficial de los hitos y paradas desde el acceso en Camarico (Ruta 5 Sur Km 222) hasta el centro cívico de Cumpeo.',
        multiline: true,
      },
      { key: 'ruta.mapa.abrir', label: 'Enlace para abrir el mapa', value: 'Abrir mapa en tamaño completo' },
      { key: 'ruta.mapa.pie', label: 'Pie de la imagen', value: 'Ilustración oficial comunal' },
    ],
  },
  {
    id: 'ruta.paradas',
    pagina: 'La Ruta',
    path: '/ruta',
    label: 'Paradas del circuito',
    items: [
      { key: 'ruta.paradas.kicker', label: 'Antetítulo', value: 'Itinerario Oficial' },
      {
        key: 'ruta.paradas.kickerSufijo',
        label: 'Antetítulo: texto tras el número de paradas',
        value: 'Paradas Configuradas',
        hint: 'Se muestra como "Itinerario Oficial (12 Paradas Configuradas)".',
      },
      { key: 'ruta.paradas.titulo', label: 'Título', value: 'Las Paradas del Circuito' },
      {
        key: 'ruta.paradas.lead',
        label: 'Bajada',
        value:
          'Recorrido sugerido en orden secuencial. Configurado en la base de datos y administrable por el equipo de turismo.',
        multiline: true,
      },
      { key: 'ruta.paradas.cta', label: 'Botón del mapa', value: 'Ver paradas en Mapa Interactivo' },
      {
        key: 'ruta.paradas.vacioTitulo',
        label: 'Sin paradas: título',
        value: 'Aún no hay paradas configuradas en este circuito',
      },
      {
        key: 'ruta.paradas.vacioTexto',
        label: 'Sin paradas: texto',
        value:
          'Puedes agregar o reordenar los destinos, restaurantes y locales para esta ruta ingresando al Panel de Administración.',
        multiline: true,
      },
      { key: 'ruta.paradas.verFicha', label: 'Enlace de la ficha', value: 'Ver ficha completa' },
      { key: 'ruta.paradas.comoLlegar', label: 'Enlace de indicaciones', value: 'Cómo llegar' },
      { key: 'ruta.consejos.kicker', label: 'Consejos: antetítulo', value: 'Consejos Prácticos para tu Visita' },
      {
        key: 'ruta.consejos.titulo',
        label: 'Consejos: título',
        value: 'Recomendaciones para recorrer este circuito',
      },
    ],
  },

  // ── PAGINA: HISTORIA ──────────────────────────────────────────────────────
  {
    id: 'historia.hero',
    pagina: 'Historia',
    path: '/historia',
    label: 'Encabezado',
    items: [
      { key: 'historia.hero.titulo', label: 'Título', value: 'La Historia de Cumpeo' },
      {
        key: 'historia.hero.bajada',
        label: 'Bajada',
        value:
          'De las páginas de una historieta a un destino turístico vibrante y lleno de humor chileno.',
        multiline: true,
      },
    ],
  },
  {
    id: 'historia.origen',
    pagina: 'Historia',
    path: '/historia',
    label: 'El único pueblo real',
    items: [
      { key: 'historia.origen.titulo', label: 'Título', value: 'El Único Pueblo Real' },
      {
        key: 'historia.origen.parrafo1',
        label: 'Primer párrafo',
        value:
          'En el vasto universo creado por el caricaturista René Ríos Boettiger, más conocido como Pepo, existen lugares míticos como Pelotillehue (hogar de Condorito) y Buenas Peras (el pueblo rival).',
        multiline: true,
      },
      {
        key: 'historia.origen.parrafo2',
        label: 'Segundo párrafo',
        value:
          'Sin embargo, Cumpeo, una pintoresca localidad de la comuna de Río Claro en la Región del Maule, tiene un honor exclusivo: es el único pueblo mencionado en la revista que existe en la vida real. Condorito a menudo leía el diario «El Hocicón», que ocasionalmente traía noticias de nuestro querido Cumpeo.',
        multiline: true,
      },
      {
        key: 'historia.origen.cita',
        label: 'Cita destacada',
        value: '«¡Exijo una explicación! ¿Cómo es que Cumpeo es real y Pelotillehue no?»',
        multiline: true,
      },
      {
        key: 'historia.origen.pieFoto',
        label: 'Pie de la imagen',
        value: 'Condorito, el ciudadano ilustre de Cumpeo.',
      },
    ],
  },
  {
    id: 'historia.hitos',
    pagina: 'Historia',
    path: '/historia',
    label: 'Línea de tiempo',
    items: [
      { key: 'historia.hitos.titulo', label: 'Título', value: 'La Ruta Hacia la Tematización' },
      {
        key: 'historia.hitos.bajada',
        label: 'Bajada',
        value: 'Hitos clave en la historia de nuestro turismo',
      },
      { key: 'historia.hitos.1.year', label: 'Hito 1: año', value: '1949' },
      { key: 'historia.hitos.1.titulo', label: 'Hito 1: título', value: 'Nace Condorito' },
      {
        key: 'historia.hitos.1.texto',
        label: 'Hito 1: texto',
        value:
          'Pepo publica la primera historieta de Condorito, mencionando a Cumpeo como parte de su peculiar geografía.',
        multiline: true,
      },
      { key: 'historia.hitos.2.year', label: 'Hito 2: año', value: '2012' },
      { key: 'historia.hitos.2.titulo', label: 'Hito 2: título', value: 'La Idea Despega' },
      {
        key: 'historia.hitos.2.texto',
        label: 'Hito 2: texto',
        value:
          'Las autoridades locales y emprendedores de Río Claro deciden transformar a Cumpeo en un pueblo temático oficial.',
        multiline: true,
      },
      { key: 'historia.hitos.3.year', label: 'Hito 3: año', value: '2015' },
      { key: 'historia.hitos.3.titulo', label: 'Hito 3: título', value: 'Inauguración Comercial' },
      {
        key: 'historia.hitos.3.texto',
        label: 'Hito 3: texto',
        value:
          'Abren sus puertas los primeros locales temáticos oficiales como «El Pollo Farsante» y la farmacia «Sin Remedio».',
        multiline: true,
      },
      { key: 'historia.hitos.4.year', label: 'Hito 4: año', value: 'Actualidad' },
      { key: 'historia.hitos.4.titulo', label: 'Hito 4: título', value: 'Destino Nacional' },
      {
        key: 'historia.hitos.4.texto',
        label: 'Hito 4: texto',
        value:
          'Cumpeo se consolida como una parada turística obligatoria en la Región del Maule, atrayendo a nostálgicos y nuevas generaciones.',
        multiline: true,
      },
    ],
  },
  {
    id: 'historia.curiosidades',
    pagina: 'Historia',
    path: '/historia',
    label: '¿Sabías que...?',
    items: [
      { key: 'historia.curiosidades.titulo', label: 'Título', value: '¿Sabías que...?' },
      { key: 'historia.curiosidades.1.titulo', label: 'Dato 1: título', value: 'Cerveza Oficial' },
      {
        key: 'historia.curiosidades.1.texto',
        label: 'Dato 1: texto',
        value:
          'Cumpeo tiene su propia cerveza artesanal llamada «Tome Pin y Haga Pun», tal como el letrero clásico de la historieta.',
        multiline: true,
      },
      { key: 'historia.curiosidades.2.titulo', label: 'Dato 2: título', value: 'Garganta de Lata' },
      {
        key: 'historia.curiosidades.2.texto',
        label: 'Dato 2: texto',
        value:
          'El bar del pueblo está diseñado exactamente igual al bar donde Condorito y sus amigos se juntaban a compartir.',
        multiline: true,
      },
      { key: 'historia.curiosidades.3.titulo', label: 'Dato 3: título', value: 'Licencia Oficial' },
      {
        key: 'historia.curiosidades.3.texto',
        label: 'Dato 3: texto',
        value:
          'Toda la tematización del pueblo se desarrolló con autorización legal de los dueños de los derechos de Condorito.',
        multiline: true,
      },
    ],
  },
  {
    id: 'historia.cta',
    pagina: 'Historia',
    path: '/historia',
    label: 'Cierre',
    items: [
      { key: 'historia.cta.titulo', label: 'Título', value: '¿Listo para vivir la historieta?' },
      {
        key: 'historia.cta.texto',
        label: 'Texto',
        value:
          'Ven a sacarte una foto con Condorito, tómate un café en «Sin Remedio» y cómete un buen asado en «El Pollo Farsante».',
        multiline: true,
      },
      { key: 'historia.cta.botonDestinos', label: 'Botón 1', value: 'Ver Destinos' },
      { key: 'historia.cta.botonMapa', label: 'Botón 2', value: 'Abrir Mapa GPS' },
    ],
  },

  // ── PAGINA: CONTACTO ──────────────────────────────────────────────────────
  {
    id: 'contacto.hero',
    pagina: 'Contacto',
    path: '/contacto',
    label: 'Encabezado',
    items: [
      { key: 'contacto.hero.titulo', label: 'Título', value: 'Contacto Turístico' },
      {
        key: 'contacto.hero.bajada',
        label: 'Bajada',
        value:
          '¿Tienes dudas sobre cómo llegar, dónde alojar o qué comer? El equipo de turismo de Cumpeo está a tu disposición.',
        multiline: true,
      },
    ],
  },
  {
    id: 'contacto.info',
    pagina: 'Contacto',
    path: '/contacto',
    label: 'Datos del visitante',
    items: [
      { key: 'contacto.info.titulo', label: 'Título', value: 'Información del Visitante' },
      {
        key: 'contacto.info.texto',
        label: 'Texto',
        value:
          'La oficina de turismo municipal de Cumpeo te espera para orientarte en tu recorrido por Pelotillehue.',
        multiline: true,
      },
      { key: 'contacto.info.direccionTitulo', label: 'Dirección: título', value: 'Dirección Oficial' },
      {
        key: 'contacto.info.direccionTexto',
        label: 'Dirección: texto',
        value: 'Plaza de Armas S/N, Cumpeo.\nComuna de Río Claro, Región del Maule.',
        multiline: true,
      },
      { key: 'contacto.info.telefonoTitulo', label: 'Teléfono: título', value: 'Teléfono Municipal' },
      { key: 'contacto.info.telefonoValor', label: 'Teléfono: número', value: '+56 71 254 1200' },
      { key: 'contacto.info.emailTitulo', label: 'Correo: título', value: 'Correo Electrónico' },
      { key: 'contacto.info.emailValor', label: 'Correo: dirección', value: 'turismo@rioclaro.cl' },
      { key: 'contacto.info.horarioTitulo', label: 'Horario: título', value: 'Horario de Atención' },
      {
        key: 'contacto.info.horarioTexto',
        label: 'Horario: texto',
        value:
          'Lunes a Viernes de 08:30 a 17:30 hrs. Sábados y Domingos atención en módulos de Plaza de Armas.',
        multiline: true,
      },
    ],
  },
  {
    id: 'contacto.form',
    pagina: 'Contacto',
    path: '/contacto',
    label: 'Formulario',
    items: [
      { key: 'contacto.form.titulo', label: 'Título', value: 'Envíanos un Mensaje' },
      { key: 'contacto.form.boton', label: 'Botón', value: 'Enviar Mensaje' },
      { key: 'contacto.form.enviando', label: 'Botón: enviando', value: 'Enviando mensaje…' },
      {
        key: 'contacto.form.exitoTitulo',
        label: 'Éxito: título',
        value: '¡Mensaje enviado con éxito!',
      },
      {
        key: 'contacto.form.exitoTexto',
        label: 'Éxito: texto',
        value: 'Gracias por comunicarte con nosotros. Te responderemos a la brevedad posible.',
        multiline: true,
      },
    ],
  },
];

/** Todas las definiciones en una lista plana. */
export const SITE_TEXT_LIST: SiteTextDef[] = SITE_TEXT_GROUPS.flatMap((g) => g.items);

/** Valores por defecto, tal como estan escritos en el codigo. */
export const SITE_TEXT_DEFAULTS: SiteTexts = Object.fromEntries(
  SITE_TEXT_LIST.map((t) => [t.key, t.value])
);

/** Indice para buscar la definicion de una clave. */
export const SITE_TEXT_INDEX: Record<string, SiteTextDef> = Object.fromEntries(
  SITE_TEXT_LIST.map((t) => [t.key, t])
);

/** Claves validas: filtra lo que llega de la base de datos. */
export function isKnownSiteTextKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(SITE_TEXT_INDEX, key);
}

/**
 * Resuelve el texto a mostrar: el override guardado si existe y no esta vacio,
 * si no el valor por defecto del codigo. Nunca devuelve undefined, para que
 * una clave mal escrita no deje un hueco en blanco en la pagina.
 */
export function resolveSiteText(textos: SiteTexts | undefined, key: string): string {
  const override = textos?.[key];
  if (typeof override === 'string' && override.trim().length > 0) return override;
  return SITE_TEXT_DEFAULTS[key] ?? '';
}

/** Grupos agrupados por pagina, para el listado del CMS. */
export function siteTextGroupsByPage(): Array<{ pagina: string; grupos: SiteTextGroup[] }> {
  const orden: string[] = [];
  const mapa = new Map<string, SiteTextGroup[]>();
  SITE_TEXT_GROUPS.forEach((g) => {
    if (!mapa.has(g.pagina)) {
      mapa.set(g.pagina, []);
      orden.push(g.pagina);
    }
    mapa.get(g.pagina)!.push(g);
  });
  return orden.map((pagina) => ({ pagina, grupos: mapa.get(pagina)! }));
}
