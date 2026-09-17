# Turismo Cumpeo — Guía Turística Interactiva 🦅🇨🇱

Plataforma web turística oficial para la localidad de Cumpeo (Río Claro, Región del Maule), el pueblo temático de Condorito. Incluye el sitio público (mapa interactivo, rutas, destinos, restaurantes, alojamientos, eventos) y un panel de administración (CMS) para que el municipio gestione todo el contenido sin tocar código.

## 🚀 Stack técnico

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Base de datos:** MySQL, vía Prisma ORM
- **Estilos:** Tailwind CSS
- **Mapas:** Google Maps JavaScript API (`@vis.gl/react-google-maps`)
- **Autenticación:** sesiones propias por cookie firmada (sin proveedor externo), contraseñas con scrypt
- **Almacenamiento de archivos:** disco local del servidor (`src/lib/fileStorage.ts`), servido vía `src/app/uploads/[...path]/route.ts`
- **Correo saliente:** SMTP de la casilla de correo del propio hosting
- **Hosting:** cPanel (V2Networks), Node.js Selector (Passenger), despliegue manual vía Git

Ver **`docs/documento-tecnico.tex`** para el detalle completo de arquitectura, modelo de datos y guía de despliegue/mantención.

## ✨ Características principales

1. **Mapa interactivo con GPS** — puntos de interés con marcadores propios y ordenamiento por cercanía al usuario (fórmula de Haversine).
2. **Rutas turísticas** (`/ruta`, `/mapa`) — paradas configurables desde el admin, con hitos, consejos y cálculo automático de distancia/tiempo.
3. **Fichas de destino, restaurante, alojamiento y evento**, con galería de imágenes, horarios y datos de contacto.
4. **Formularios públicos** — `/contacto` (consultas) y `/sumate` (postulación de emprendedores), con subida de fotos y aviso automático por correo.
5. **Panel de administración** (`/admin`) con roles (Administrador / Editor / Lector): gestión de contenido, apariencia del sitio (colores y tipografías en vivo), textos editables con historial, orden de portada, generador de códigos QR, notificaciones por correo, usuarios, carga masiva (Excel/JSON) y copias de seguridad.
6. **Diseño mobile-first**, pensado para usarse en terreno escaneando un código QR en la señalética.

## 🛠️ Instalación y desarrollo local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/yankoacuna/ruta-turistica-cumpeo
   cd ruta-turistica-cumpeo
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:** copia `.env.example` (o pide las variables reales a quien administre el proyecto) a `.env` en la raíz. Las variables usadas están documentadas en `docs/documento-tecnico.tex`.

4. **Base de datos:** con `DATABASE_URL` apuntando a un MySQL accesible, aplica el schema:
   ```bash
   npx prisma db push
   node prisma/seed.js   # opcional: carga datos de ejemplo/reales
   ```
   Si `DATABASE_URL` apunta a la base de producción (cPanel), esa base solo acepta conexiones remotas desde IPs autorizadas en **cPanel → Bases de Datos → MySQL Remoto**. Un error de Prisma tipo *"Authentication failed"* sin haber tocado ninguna contraseña casi siempre significa que tu IP pública cambió y hay que volver a agregarla ahí (ver `docs/documento-tecnico.tex`, sección *Acceso remoto a la base de datos*).

5. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000).

6. **Correr los tests** (opcional, recomendado antes de subir cambios):
   ```bash
   npm test
   ```

## 📂 Estructura del proyecto

- `prisma/schema.prisma` — modelo de datos (MySQL).
- `prisma/seed.js` + `prisma/seed-data/*.json` — datos de arranque para una instalación nueva.
- `src/app/` — rutas de la aplicación (App Router), incluida `src/app/admin/` (panel CMS) y `src/app/api/` (endpoints).
- `src/app/uploads/[...path]/route.ts` — sirve los archivos subidos desde `UPLOADS_DIR`.
- `src/components/` — componentes de React del sitio público.
- `src/lib/` — acceso a datos, autenticación, almacenamiento de archivos, utilidades.
- `docs/` — manual de usuario y documento técnico (LaTeX) para la entrega del proyecto.

## 📚 Documentación de entrega

- `docs/manual-usuario.tex` — manual para el personal municipal que usa el panel `/admin`.
- `docs/documento-tecnico.tex` — arquitectura, modelo de datos, variables de entorno y guía de despliegue/mantención para quien administre el sistema.
