'use client';

import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { AdminSection } from '../_types';

export type TourId = 'general' | 'create-destino' | 'create-ruta';

export interface TourHandlers {
  activeSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
  openNewDestino?: () => void;
  closeDestino?: () => void;
  openNewRuta?: () => void;
  closeRuta?: () => void;
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
          'Escribe el nombre del lugar turístico (por ejemplo: "Mural de Condorito") y selecciona su categoría correspondiente (Cultural, Histórico, Gastronomía, etc.).',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-dest-slug',
      popover: {
        title: tourTitle(TOUR_ICONS.link, '2. Dirección Web Pública (Enlace)'),
        description:
          'Es el enlace web directo con el que los visitantes abrirán este atractivo en el navegador. Se genera a partir del nombre y puedes personalizarlo si lo prefieres.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-dest-desc',
      popover: {
        title: tourTitle(TOUR_ICONS.fileText, '3. Descripciones e Información'),
        description:
          'Redacta un resumen breve para las tarjetas de búsqueda y una descripción completa con la historia y detalles del atractivo.',
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
    case 'general':
    default:
      startGeneralTour(handlers);
      break;
  }
}
