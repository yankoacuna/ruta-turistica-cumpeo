# Cumpeo Turismo — Guía Turística Interactiva 🦅🇨🇱

Plataforma web turística oficial para la localidad de Cumpeo (Río Claro, Región del Maule), conocida como el pueblo temático de Condorito. La aplicación permite a los turistas explorar destinos, rutas, restaurantes y alojamientos utilizando geolocalización en tiempo real.

## 🚀 Tecnologías Utilizadas

- **Framework:** Next.js 14 (App Router)
- **Librería UI:** React 18
- **Lenguaje:** TypeScript
- **Estilos:** CSS Nativo (Variables de diseño personalizadas)
- **Mapas y Geolocalización:** Google Maps API (`@vis.gl/react-google-maps`)
- **Iconografía:** Lucide React
- **Despliegue Recomendado:** Vercel

## ✨ Características Principales

1. **Mapa Interactivo con GPS:** Uso de Google Maps para mostrar puntos de interés (POIs) con marcadores personalizados (emojis) y rastreo de la ubicación del usuario en tiempo real.
2. **Rutas Dinámicas (`/destino/[slug]`):** Páginas generadas dinámicamente para cada destino turístico con galería de imágenes, reseñas históricas, horarios y tarifas.
3. **Responsive Design:** Interfaz diseñada bajo la filosofía *Mobile-First*, optimizada para el uso en teléfonos móviles durante los recorridos de los turistas.
4. **Panel de Administración (`/admin`):** Interfaz gráfica para que la Municipalidad pueda gestionar (Crear, Editar, Eliminar) la base de datos JSON de los destinos, alojamientos y restaurantes.
5. **Cálculo de Distancias:** Implementación de la fórmula de Haversine para ordenar los lugares turísticos desde el más cercano al más lejano respecto a la posición actual del usuario.

## 🛠️ Instalación y Configuración Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/yankoacuna/ruta-turistica-cumpeo
   cd ruta-turistica-cumpeo
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto y agrega tu clave de Google Maps:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="TU_API_KEY_DE_GOOGLE"
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## 📂 Estructura del Proyecto

- `/public/data`: Archivos JSON que actúan como base de datos (`destinations.json`, `config.json`, etc.).
- `/public/assets`: Imágenes, iconos y recursos estáticos.
- `/src/app`: Rutas de la aplicación (Next.js App Router).
- `/src/components`: Componentes reutilizables de React (Navbar, Footer, MapComponent, etc.).
- `/src/lib`: Utilidades, tipos de TypeScript y funciones de carga de datos.
