'use client';

import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { AdminSection } from '../_types';

export type TourId =
  | 'general'
  | 'create-destino'
  | 'create-ruta'
  | 'create-comida'
  | 'create-alojamiento'
  | 'create-evento'
  | 'bulk-import'
  | 'usuarios'
  | 'textos'
  | 'orden';

export interface TourHandlers {
  activeSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
  openNewDestino?: () => void;
  closeDestino?: () => void;
  openNewRuta?: () => void;
  closeRuta?: () => void;
  openNewRestaurante?: () => void;
  closeRestaurante?: () => void;
  openNewAlojamiento?: () => void;
  closeAlojamiento?: () => void;
  openNewEvento?: () => void;
  closeEvento?: () => void;
  openNewUser?: () => void;
  closeUser?: () => void;
}

function makeIconSvg(path: string, size = 15): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">${path}</svg>`;
}

const TOUR_ICONS = {
  dashboard: makeIconSvg('<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>'),
  barChart: makeIconSvg('<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>'),
  camera: makeIconSvg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'),
  compass: makeIconSvg('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'),
  globe: makeIconSvg('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>'),
  tag: makeIconSvg('<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>'),
  link: makeIconSvg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  fileText: makeIconSvg('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'),
  image: makeIconSvg('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'),
  checkCircle: makeIconSvg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'),
  route: makeIconSvg('<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>'),
  clock: makeIconSvg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  mapPin: makeIconSvg('<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'),
  arrowRight: makeIconSvg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', 13),
  arrowLeft: makeIconSvg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 13),
  check: makeIconSvg('<polyline points="20 6 9 17 4 12"/>', 13),
  sparkle: makeIconSvg('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>', 13),
  layers: makeIconSvg('<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'),
  uploadCloud: makeIconSvg('<path d="M12 13v8"/><path d="M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284"/><path d="m8 17 4-4 4 4"/>'),
  key: makeIconSvg('<path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>'),
  search: makeIconSvg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  listOrdered: makeIconSvg('<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>'),
};

function tourTitle(icon: string, text: string): string {
  return `<span class="tour-title-icon">${icon}</span><span>${text}</span>`;
}

const baseDriverConfig = {
  showProgress: true,
  animate: true,
  overlayColor: 'rgba(15, 23, 42, 0.75)',
  stagePadding: 6,
  stageRadius: 12,
  popoverClass: 'cumpeo-tour-popover',
  nextBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">Siguiente ${TOUR_ICONS.arrowRight}</span>`,
  prevBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">${TOUR_ICONS.arrowLeft} Anterior</span>`,
  doneBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">${TOUR_ICONS.check} Entendido</span>`,
  progressText: 'Paso {{current}} de {{total}}',
  allowClose: true,
  waitForElement: 3000,
};

/**
 * 1. TOUR GENERAL DEL PANEL
 * Recorrido de bienvenida por el dashboard y la navegación principal.
 */
export function startGeneralTour({ activeSection, onNavigate }: TourHandlers) {
  if (activeSection !== 'dashboard') {
    onNavigate('dashboard');
  }

  const steps: DriveStep[] = [
    {
      element: '#tour-dashboard-welcome',
      popover: {
        title: tourTitle(TOUR_ICONS.dashboard, 'Panel de Gestión Turística'),
        description:
          'Bienvenido al administrador de contenidos de Cumpeo. Desde este panel puedes gestionar de forma simple todos los atractivos, gastronomía, hospedajes, eventos y circuitos turísticos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-stat-cards',
      popover: {
        title: tourTitle(TOUR_ICONS.barChart, 'Resumen de Contenidos'),
        description:
          'Consulta el total de registros en cada categoría turística y utiliza los accesos rápidos para agregar nuevos elementos.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-visual-coverage',
      popover: {
        title: tourTitle(TOUR_ICONS.camera, 'Cobertura Visual'),
        description:
          'Supervisa qué porcentaje de destinos, restaurantes y alojamientos ya tienen foto de portada para garantizar que el portal se vea atractivo para los visitantes.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '#tour-sidebar-nav',
      popover: {
        title: tourTitle(TOUR_ICONS.compass, 'Menú de Secciones'),
        description:
          'Desde esta barra lateral puedes navegar entre los distintos módulos: Destinos, Gastronomía, Alojamientos, Eventos, Circuitos y el Generador de Códigos QR.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '#tour-topbar-actions',
      popover: {
        title: tourTitle(TOUR_ICONS.globe, 'Acceso Rápido y Salida'),
        description:
          'Haz clic en "Ver Portal" para comprobar en tiempo real cómo ven los turistas la información. En el botón de ayuda puedes repetir este u otros tours cuando lo desees.',
        side: 'bottom',
        align: 'end',
      },
    },
  ];

  const instance = driver({
    ...baseDriverConfig,
    doneBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">${TOUR_ICONS.sparkle} Comenzar</span>`,
    steps,
  });

  instance.drive();
}

/**
 * 2. TOUR: CÓMO CREAR UN ATRACTIVO TURÍSTICO
 * Guía interactiva paso a paso dentro del formulario de Destinos.
 */
export function startCreateDestinoTour({
  activeSection,
  onNavigate,
  openNewDestino,
  closeDestino,
}: TourHandlers) {
  if (activeSection !== 'destinos') {
    onNavigate('destinos');
  }

  // Abrir el modal de creación si no está ya abierto
  setTimeout(() => {
    openNewDestino?.();
  }, 100);

  const steps: DriveStep[] = [
    {
      element: '#tour-dest-nombre',
      popover: {
        title: tourTitle(TOUR_ICONS.tag, '1. Nombre y Categoría'),
        description:
          'Escribe el nombre del lugar turístico (por ejemplo: "Mural de Condorito") y selecciona su categoría correspondiente (Cultural, Histórico, Gastronomía, etc.). El enlace web se genera automáticamente.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-dest-desc',
      popover: {
        title: tourTitle(TOUR_ICONS.fileText, '2. Descripciones e Información'),
        description:
          'Redacta un resumen breve para las tarjetas de búsqueda y una descripción completa con la historia y detalles del atractivo.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-dest-ubicacion',
      popover: {
        title: tourTitle(TOUR_ICONS.mapPin, '3. Ubicación en el Mapa y Dirección'),
        description:
          '<strong>Uso cotidiano:</strong> Haz clic en "Buscar en el mapa" o arrastra el marcador para fijar las coordenadas GPS exactas y obtener el nombre de calle limpio de forma automática.<br/><br/><strong>Dirección manual o rural:</strong> Si el lugar no tiene calle oficial o la dirección física es una referencia (ej: <em>"Camino Los Cristales Km 4, Parcela 12"</em>), usa la opción secundaria <em>"¿La dirección física es distinta a la del mapa? Escríbela aquí"</em> para personalizarla sin perder la posición exacta del pin en el mapa.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-dest-image',
      popover: {
        title: tourTitle(TOUR_ICONS.image, '4. Fotografía de Portada'),
        description:
          'Selecciona la pestaña "Subir desde mi equipo" para cargar una foto local, o "Pegar enlace web" para usar una imagen directa de internet.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-dest-actions',
      popover: {
        title: tourTitle(TOUR_ICONS.checkCircle, '5. Guardar Registro'),
        description:
          'Al presionar "Guardar Destino", el atractivo quedará publicado de inmediato en la aplicación móvil y en el mapa turístico de Cumpeo.',
        side: 'top',
        align: 'end',
      },
    },
  ];

  const instance = driver({
    ...baseDriverConfig,
    doneBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">${TOUR_ICONS.check} Entendido</span>`,
    steps,
    onDestroyed: () => {
      closeDestino?.();
    },
  });

  // Damos un breve instante para que el modal monte en el DOM
  setTimeout(() => {
    instance.drive();
  }, 250);
}

/**
 * 3. TOUR: CÓMO CREAR UNA RUTA TURÍSTICA
 * Guía interactiva paso a paso para armar circuitos con paradas GPS.
 */
export function startCreateRutaTour({
  activeSection,
  onNavigate,
  openNewRuta,
  closeRuta,
}: TourHandlers) {
  if (activeSection !== 'rutas') {
    onNavigate('rutas');
  }

  setTimeout(() => {
    openNewRuta?.();
  }, 100);

  const steps: DriveStep[] = [
    {
      element: '#tour-ruta-nombre',
      popover: {
        title: tourTitle(TOUR_ICONS.route, '1. Nombre del Circuito'),
        description:
          'Asigna un nombre descriptivo al recorrido temático (por ejemplo: "La Ruta Oficial de Condorito" o "Circuito Gastronómico").',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-ruta-desc',
      popover: {
        title: tourTitle(TOUR_ICONS.clock, '2. Descripción y Tiempo Estimado'),
        description:
          'Explica a los visitantes los atractivos que conocerán en esta ruta e indica la duración sugerida y la distancia aproximada en kilómetros.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-ruta-pois',
      popover: {
        title: tourTitle(TOUR_ICONS.mapPin, '3. Secuencia de Paradas Turísticas'),
        description:
          'Selecciona los atractivos que forman parte del circuito y agrégalos uno a uno. Con las flechas puedes ordenar la secuencia exacta del recorrido.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-ruta-actions',
      popover: {
        title: tourTitle(TOUR_ICONS.checkCircle, '4. Guardar y Activar Circuito'),
        description:
          'Al guardar, la ruta se trazará automáticamente en el mapa interactivo para que los turistas la sigan paso a paso en sus teléfonos.',
        side: 'top',
        align: 'end',
      },
    },
  ];

  const instance = driver({
    ...baseDriverConfig,
    doneBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">${TOUR_ICONS.check} Entendido</span>`,
    steps,
    onDestroyed: () => {
      closeRuta?.();
    },
  });

  setTimeout(() => {
    instance.drive();
  }, 250);
}

/**
 * 4. TOUR: CÓMO CREAR UNA COMIDA (RESTAURANTE / PICADA)
 * Guía interactiva paso a paso, con énfasis en fijar la ubicación en el mapa.
 */
export function startCreateComidaTour({
  activeSection,
  onNavigate,
  openNewRestaurante,
  closeRestaurante,
}: TourHandlers) {
  if (activeSection !== 'restaurantes') {
    onNavigate('restaurantes');
  }

  setTimeout(() => {
    openNewRestaurante?.();
  }, 100);

  const steps: DriveStep[] = [
    {
      element: '#tour-rest-nombre',
      popover: {
        title: tourTitle(TOUR_ICONS.tag, '1. Nombre y Tipo de Local'),
        description:
          'Escribe el nombre del restaurante o picada y selecciona el tipo de local que corresponde (restaurante, picada, cafetería, etc.).',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-rest-desc',
      popover: {
        title: tourTitle(TOUR_ICONS.fileText, '2. Descripción'),
        description: 'Cuenta brevemente qué ofrece el local y su propuesta gastronómica.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-rest-ubicacion',
      popover: {
        title: tourTitle(TOUR_ICONS.mapPin, '3. Ubicación en el Mapa y Dirección'),
        description:
          '<strong>Uso cotidiano:</strong> Haz clic en "Buscar en el mapa" o mueve el marcador para obtener la calle limpia y las coordenadas GPS exactas automáticamente (sin códigos raros).<br/><br/><strong>Casos especiales o rurales:</strong> Si el local está en un callejón, parcela o tiene una referencia conocida (ej: <em>"Frente a la copa de agua"</em>), usa la opción secundaria <em>"¿La dirección física es distinta a la del mapa? Escríbela aquí"</em> o personalízala en el selector sin alterar las coordenadas GPS.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-rest-image',
      popover: {
        title: tourTitle(TOUR_ICONS.image, '4. Fotografía Principal'),
        description: 'Sube una foto del local o pega el enlace de una imagen ya publicada en internet.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-rest-actions',
      popover: {
        title: tourTitle(TOUR_ICONS.checkCircle, '5. Guardar Registro'),
        description:
          'Al presionar "Guardar Cambios", el local queda publicado de inmediato en la pestaña "Comidas" del sitio y visible en el mapa turístico.',
        side: 'top',
        align: 'end',
      },
    },
  ];

  const instance = driver({
    ...baseDriverConfig,
    doneBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">${TOUR_ICONS.check} Entendido</span>`,
    steps,
    onDestroyed: () => {
      closeRestaurante?.();
    },
  });

  setTimeout(() => {
    instance.drive();
  }, 250);
}

/**
 * 5. TOUR: CÓMO CREAR UN ALOJAMIENTO
 * Guía interactiva paso a paso dentro del formulario de Alojamientos.
 */
export function startCreateAlojamientoTour({
  activeSection,
  onNavigate,
  openNewAlojamiento,
  closeAlojamiento,
}: TourHandlers) {
  if (activeSection !== 'alojamientos') {
    onNavigate('alojamientos');
  }

  setTimeout(() => {
    openNewAlojamiento?.();
  }, 100);

  const steps: DriveStep[] = [
    {
      element: '#tour-aloj-nombre',
      popover: {
        title: tourTitle(TOUR_ICONS.tag, '1. Nombre y Tipo de Hospedaje'),
        description:
          'Escribe el nombre del alojamiento y selecciona su tipo (Cabaña, Hostal, Hotel, Camping, etc.). También puedes marcarlo como activo o inactivo desde aquí.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-aloj-desc',
      popover: {
        title: tourTitle(TOUR_ICONS.fileText, '2. Descripción y Servicios'),
        description:
          'Cuenta qué ofrece el hospedaje y sus características principales. Más abajo puedes listar servicios como WiFi, estacionamiento o piscina, separados por coma.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-aloj-ubicacion',
      popover: {
        title: tourTitle(TOUR_ICONS.mapPin, '3. Ubicación en el Mapa y Dirección'),
        description:
          '<strong>Uso cotidiano:</strong> Haz clic en "Buscar en el mapa" para posicionar el pin y sincronizar la dirección automáticamente.<br/><br/><strong>Zonas rurales y parcelas:</strong> Si el hospedaje o camping no tiene calle oficial o numeración (ej: <em>"Ruta Los Cristales Km 2.5, Parcela 7"</em>), usa la opción secundaria <em>"¿La dirección física es distinta a la del mapa?"</em> para escribirla a mano sin perder las coordenadas GPS.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-aloj-image',
      popover: {
        title: tourTitle(TOUR_ICONS.image, '4. Fotografía Principal'),
        description:
          'Sube una foto local o pega el enlace de una imagen ya publicada en internet para mostrarla en la ficha del hospedaje.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-aloj-actions',
      popover: {
        title: tourTitle(TOUR_ICONS.checkCircle, '5. Guardar Registro'),
        description:
          'Al guardar, el alojamiento queda publicado de inmediato en la pestaña "Dormir" del sitio y visible en el mapa turístico.',
        side: 'top',
        align: 'end',
      },
    },
  ];

  const instance = driver({
    ...baseDriverConfig,
    doneBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">${TOUR_ICONS.check} Entendido</span>`,
    steps,
    onDestroyed: () => {
      closeAlojamiento?.();
    },
  });

  setTimeout(() => {
    instance.drive();
  }, 250);
}

/**
 * 6. TOUR: CÓMO CREAR UN EVENTO O FERIA
 * Guía interactiva paso a paso dentro del formulario de Eventos.
 */
export function startCreateEventoTour({
  activeSection,
  onNavigate,
  openNewEvento,
  closeEvento,
}: TourHandlers) {
  if (activeSection !== 'eventos') {
    onNavigate('eventos');
  }

  setTimeout(() => {
    openNewEvento?.();
  }, 100);

  const steps: DriveStep[] = [
    {
      element: '#tour-evento-nombre',
      popover: {
        title: tourTitle(TOUR_ICONS.tag, '1. Nombre, Tipo y Fecha'),
        description:
          'Escribe el nombre del evento o fiesta, selecciona su categoría y anota cuándo ocurre (por ejemplo "1 de enero" o "Todos los fines de semana").',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-evento-desc',
      popover: {
        title: tourTitle(TOUR_ICONS.fileText, '2. Descripción'),
        description:
          'Redacta un resumen breve y, si quieres, una descripción más detallada con la historia o las tradiciones del evento.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-evento-ubicacion',
      popover: {
        title: tourTitle(TOUR_ICONS.mapPin, '3. Ubicación del Evento'),
        description:
          '<strong>Uso cotidiano:</strong> Selecciona en el mapa el lugar donde se realiza la fiesta o feria para fijar el GPS y la calle automáticamente.<br/><br/><strong>Recintos o plazas:</strong> Si el evento se realiza en un recinto ferial, medialuna o espacio sin numeración exacta, puedes usar la opción secundaria <em>"¿La dirección física es distinta a la del mapa?"</em> para detallar la indicación manteniendo el punto en el mapa.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-evento-image',
      popover: {
        title: tourTitle(TOUR_ICONS.image, '4. Fotografía Principal'),
        description: 'Sube una foto del evento o pega el enlace de una imagen ya publicada en internet.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-evento-actions',
      popover: {
        title: tourTitle(TOUR_ICONS.checkCircle, '5. Guardar Registro'),
        description:
          'Al guardar, el evento queda publicado de inmediato en la sección de fiestas y eventos del sitio.',
        side: 'top',
        align: 'end',
      },
    },
  ];

  const instance = driver({
    ...baseDriverConfig,
    doneBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">${TOUR_ICONS.check} Entendido</span>`,
    steps,
    onDestroyed: () => {
      closeEvento?.();
    },
  });

  setTimeout(() => {
    instance.drive();
  }, 250);
}

/**
 * 7. TOUR: CÓMO CREAR UN USUARIO DEL CMS
 * Guía interactiva enfocada en el nuevo flujo sin contraseñas escritas por el admin.
 */
export function startUsuariosTour({
  activeSection,
  onNavigate,
  openNewUser,
  closeUser,
}: TourHandlers) {
  if (activeSection !== 'usuarios') {
    onNavigate('usuarios');
  }

  setTimeout(() => {
    openNewUser?.();
  }, 100);

  const steps: DriveStep[] = [
    {
      element: '#tour-user-nombre',
      popover: {
        title: tourTitle(TOUR_ICONS.tag, '1. Datos Básicos'),
        description: 'Escribe el nombre completo y el correo electrónico con el que la persona iniciará sesión.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-user-role',
      popover: {
        title: tourTitle(TOUR_ICONS.checkCircle, '2. Rol y Permisos'),
        description:
          'Elige qué puede hacer: Lector solo consulta, Editor crea y edita contenido, y Administrador tiene control total, incluyendo otros usuarios y respaldos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-user-password',
      popover: {
        title: tourTitle(TOUR_ICONS.key, '3. Contraseña Automática'),
        description:
          'Ya no escribes tú la contraseña: el sistema genera una temporal (basada en el correo) que verás una sola vez para copiar y entregar. La persona deberá cambiarla en su primer ingreso.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-user-actions',
      popover: {
        title: tourTitle(TOUR_ICONS.check, '4. Crear Usuario'),
        description: 'Al confirmar, el usuario queda creado y listo para recibir su contraseña temporal.',
        side: 'top',
        align: 'end',
      },
    },
  ];

  const instance = driver({
    ...baseDriverConfig,
    doneBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">${TOUR_ICONS.check} Entendido</span>`,
    steps,
    onDestroyed: () => {
      closeUser?.();
    },
  });

  setTimeout(() => {
    instance.drive();
  }, 250);
}

/**
 * 8. TOUR: CÓMO EDITAR LOS TEXTOS DEL SITIO
 * Guía interactiva por la sección de Textos del Sitio.
 */
export function startTextosTour({ activeSection, onNavigate }: TourHandlers) {
  if (activeSection !== 'textos') {
    onNavigate('textos');
  }

  const steps: DriveStep[] = [
    {
      element: '#tour-textos-live',
      popover: {
        title: tourTitle(TOUR_ICONS.fileText, '1. Edición en Vivo o Desde Aquí'),
        description:
          'Puedes abrir el sitio en modo edición con "Editar textos en el sitio" y cambiarlos directamente sobre la página, o modificarlos en esta lista y presionar "Guardar cambios".',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-textos-search',
      popover: {
        title: tourTitle(TOUR_ICONS.search, '2. Buscar un Texto'),
        description: 'Filtra por el contenido actual o por el nombre del texto para encontrarlo rápido entre todas las páginas.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-textos-groups',
      popover: {
        title: tourTitle(TOUR_ICONS.checkCircle, '3. Editar, Revertir e Historial'),
        description:
          'Los textos están agrupados por página. Cada uno se puede editar directamente, volver a su versión original, o revisar el historial de cambios anteriores con quién y cuándo los hizo.',
        side: 'top',
        align: 'start',
      },
    },
  ];

  const instance = driver({
    ...baseDriverConfig,
    doneBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">${TOUR_ICONS.check} Entendido</span>`,
    steps,
  });

  setTimeout(() => {
    instance.drive();
  }, 250);
}

/**
 * 9. TOUR: CÓMO ORDENAR LA PORTADA
 * Guía interactiva por la sección de Orden de la Portada.
 */
export function startOrdenTour({ activeSection, onNavigate }: TourHandlers) {
  if (activeSection !== 'orden') {
    onNavigate('orden');
  }

  const steps: DriveStep[] = [
    {
      element: '#tour-orden-header',
      popover: {
        title: tourTitle(TOUR_ICONS.listOrdered, '1. Qué Define Este Orden'),
        description:
          'Define en qué posición aparece cada ficha en el sitio público. Lo que no reordenes se mantiene alfabético, como hasta ahora. Recuerda presionar "Guardar orden" al terminar.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-orden-tabs',
      popover: {
        title: tourTitle(TOUR_ICONS.layers, '2. Elige el Catálogo'),
        description: 'Cambia entre Destinos, Restaurantes, Alojamientos y Eventos: cada uno tiene su propio orden independiente.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-orden-list',
      popover: {
        title: tourTitle(TOUR_ICONS.checkCircle, '3. Reordenar'),
        description:
          'Arrastra cada fila para moverla (en computador) o usa las flechas arriba/abajo (funciona igual en el teléfono). También puedes ordenar todo alfabéticamente con un clic.',
        side: 'top',
        align: 'start',
      },
    },
  ];

  const instance = driver({
    ...baseDriverConfig,
    doneBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">${TOUR_ICONS.check} Entendido</span>`,
    steps,
  });

  setTimeout(() => {
    instance.drive();
  }, 250);
}

/**
 * 10. TOUR: CÓMO USAR LA CARGA MASIVA (EXCEL / JSON)
 * Guía interactiva por la pestaña de importación y exportación masiva.
 */
export function startBulkImportTour({ activeSection, onNavigate }: TourHandlers) {
  if (activeSection !== 'backups') {
    onNavigate('backups');
  }

  const steps: DriveStep[] = [
    {
      element: '#tour-bulk-entity',
      popover: {
        title: tourTitle(TOUR_ICONS.layers, '1. Elige el Catálogo'),
        description:
          'Selecciona qué tipo de contenido vas a cargar o exportar: Atractivos, Restaurantes, Alojamientos o Eventos. El contador te muestra cuántos registros existen hoy en cada uno.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-bulk-template',
      popover: {
        title: tourTitle(TOUR_ICONS.fileText, '2. Descarga la Plantilla Oficial'),
        description:
          'Descarga la planilla Excel o JSON con las columnas correctas, instrucciones y ejemplos reales. Complétala con tus datos sin cambiar el nombre de las columnas.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-bulk-upload',
      popover: {
        title: tourTitle(TOUR_ICONS.uploadCloud, '3. Sube y Audita tu Planilla'),
        description:
          'Arrastra o selecciona el archivo ya completado (.xlsx, .xls, .json o .csv). El sistema audita cada fila y te muestra una tabla con cuáles quedarán válidas, con avisos o con errores. Luego eliges si actualizar los existentes o solo crear nuevos, y confirmas para aplicar los cambios: nada se guarda hasta que lo confirmes.',
        side: 'top',
        align: 'start',
      },
    },
  ];

  const instance = driver({
    ...baseDriverConfig,
    doneBtnText: `<span style="display:inline-flex;align-items:center;gap:4px;">${TOUR_ICONS.check} Entendido</span>`,
    steps,
  });

  setTimeout(() => {
    instance.drive();
  }, 250);
}

/**
 * Función unificada para lanzar cualquier tour por ID
 */
export function runTour(tourId: TourId, handlers: TourHandlers) {
  switch (tourId) {
    case 'create-destino':
      startCreateDestinoTour(handlers);
      break;
    case 'create-ruta':
      startCreateRutaTour(handlers);
      break;
    case 'create-comida':
      startCreateComidaTour(handlers);
      break;
    case 'create-alojamiento':
      startCreateAlojamientoTour(handlers);
      break;
    case 'create-evento':
      startCreateEventoTour(handlers);
      break;
    case 'usuarios':
      startUsuariosTour(handlers);
      break;
    case 'textos':
      startTextosTour(handlers);
      break;
    case 'orden':
      startOrdenTour(handlers);
      break;
    case 'bulk-import':
      startBulkImportTour(handlers);
      break;
    case 'general':
    default:
      startGeneralTour(handlers);
      break;
  }
}
