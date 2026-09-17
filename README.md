# Turismo Cumpeo — Guía Turística Interactiva 🦅🇨🇱

Plataforma web turística oficial para la localidad de Cumpeo (Río Claro, Región del Maule), el pueblo temático de Condorito. Incluye el sitio público (mapa interactivo, rutas, destinos, restaurantes, alojamientos, eventos) y un panel de administración (CMS) para que el municipio gestione todo el contenido sin tocar código.

---

## 🚀 Stack técnico

- **Framework:** Next.js 15 (App Router, modo `standalone`), React 19, TypeScript
- **Base de datos:** MySQL vía Prisma ORM
- **Estilos:** Tailwind CSS
- **Mapas:** Google Maps JavaScript API (`@vis.gl/react-google-maps`)
- **Autenticación:** Sesiones propias vía cookies HTTP-only firmadas (`SESSION_SECRET`), contraseñas con scrypt
- **Almacenamiento de archivos:** Disco local del servidor (`src/lib/fileStorage.ts`), servido vía endpoint `/uploads/[...path]`
- **Correo saliente:** Nodemailer vía SMTP del hosting
- **Hosting de producción:** cPanel (V2Networks), Node.js Selector 22 LTS (Passenger/CloudLinux)

---

## ✨ Características principales

1. **Mapa interactivo con GPS:** Puntos de interés con marcadores propios y ordenamiento por cercanía geográfica al usuario (fórmula de Haversine).
2. **Rutas y circuitos turísticos (`/ruta`, `/mapa`):** Paradas configurables desde el admin, con hitos, consejos y tiempos de recorrido.
3. **Catastro completo:** Fichas de atractivos, restaurantes, alojamientos y eventos con galería fotográfica, horarios y contacto directo (WhatsApp, llamada, mapa).
4. **Formularios con moderación:** `/contacto` y `/sumate` (postulación de negocios locales) con subida de fotos y notificación por correo.
5. **Panel de administración (`/admin`):**
   - Gestión de contenidos (crear, editar, ordenar, activar/desactivar).
   - Roles de usuario: **Administrador**, **Editor** y **Lector** (modo seguro sin edición).
   - Métricas y visitantes en tiempo real.
   - Editor de textos y personalizador de apariencia en vivo (colores y tipografías).
   - Generador de códigos QR vectoriales para señalética física.
   - Copias de seguridad y exportación/importación masiva (Excel/JSON).
6. **Diseño Mobile-First:** Optimizado para turistas en terreno que acceden escaneando QR.

---

## ⚙️ Variables de entorno

Copia `.env.example` a `.env` en la raíz del proyecto y completa los valores:

| Variable | Descripción | Ejemplo / Nota |
|---|---|---|
| `DATABASE_URL` | String de conexión a MySQL | `mysql://usuario:password@localhost:3306/db_name` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Clave pública de Google Maps API | `AIzaSy...` |
| `SESSION_SECRET` | Clave secreta para firmar tokens de sesión | Generar con `openssl rand -hex 32` |
| `UPLOADS_DIR` | Carpeta persistente para archivos y fotos | `public/uploads` (local) o ruta absoluta fuera de `.next` (servidor) |
| `TOKIO_WORKER_THREADS` | Limita hilos de Prisma (obligatorio en cPanel) | `1` |
| `SITE_URL` | URL pública del sitio sin barra final | `https://turismocumpeo.cl` |
| `ADMIN_SECRET` | Contraseña para el primer usuario admin | Solo requerida al correr seed inicial |
| `INITIAL_ADMIN_EMAIL` | Correo del primer admin | `admin@turismocumpeo.cl` |
| `INITIAL_ADMIN_NAME` | Nombre del primer admin | `Administrador Municipal` |
| `SMTP_HOST` | Servidor SMTP para correos de notificación | `mail.turismocumpeo.cl` |
| `SMTP_PORT` | Puerto SMTP | `465` (SSL) o `587` (TLS) |
| `SMTP_USER` | Usuario / Casilla SMTP | `contacto@turismocumpeo.cl` |
| `SMTP_PASS` | Contraseña de la casilla SMTP | `********` |
| `SOLICITUDES_EMAIL_FROM` | Remitente de los avisos | `"Turismo Cumpeo" <contacto@turismocumpeo.cl>` |
| `SOLICITUDES_EMAIL_TO` | Destinatario que recibe postulaciones | `turismo@munirioclaro.cl` |

---

## 🛠️ Instalación y desarrollo local

### 1. Clonar el repositorio
```bash
git clone https://github.com/yankoacuna/ruta-turistica-cumpeo.git
cd ruta-turistica-cumpeo
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar `.env`
Crea el archivo `.env` según la tabla de variables anterior.

### 4. Base de datos
Genera el cliente de Prisma y sincroniza el esquema con la base de datos:
```bash
npx prisma generate
npx prisma db push
```

*(Opcional)* Carga datos iniciales de prueba:
```bash
node prisma/seed.js
```

> **Nota sobre MySQL Remoto:** Si te conectas desde local a la base de datos del servidor cPanel, debes autorizar tu IP pública en **cPanel → Bases de Datos → MySQL Remoto**. Si tu IP cambia, dará error de autenticación hasta actualizarla en dicha sección.

### 5. Iniciar en modo desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000).

### 6. Ejecutar pruebas
```bash
npm test
```

---

## 🚀 Despliegue en producción (cPanel / Passenger)

El servidor de producción corre bajo **CloudLinux con Node.js Selector (Passenger)** en la ruta `~/ruta-cumpeo`.

### Paso a paso para publicar una actualización:

#### 1. En tu máquina local (subir los cambios a GitHub)
```bash
git push origin master
```

#### 2. En la Terminal de cPanel

##### a) Activar el entorno virtual y ubicarse en el proyecto
```bash
source ~/nodevenv/ruta-cumpeo/22/bin/activate
cd ~/ruta-cumpeo
```

##### b) Descargar los últimos cambios
```bash
git pull
```

##### c) Actualizar dependencias y Prisma (si hubo cambios)
```bash
npm install --include=dev --ignore-scripts
npx prisma generate --schema=./prisma/schema.prisma
```
> *`--include=dev` es indispensable porque el entorno inicia en producción y Next.js necesita TypeScript/ESLint para compilar. `--ignore-scripts` evita errores de rutas relativas en cPanel.*

##### d) Sincronizar cambios en el modelo de base de datos (si modificaste `schema.prisma`)
```bash
npx prisma db push
```

##### e) Compilar la aplicación Next.js
```bash
rm -rf .next
npm run build
```

##### f) Copiar archivos estáticos al paquete standalone
*(Paso obligatorio: el modo standalone no empaqueta automáticamente assets estáticos ni la carpeta pública)*
```bash
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
```

##### g) Reiniciar la aplicación
Ejecuta en la terminal:
```bash
mkdir -p tmp && touch tmp/restart.txt
```
*O bien haz clic en el botón **Restart** dentro de **cPanel → Setup Node.js App**.*

---

## 📂 Estructura del proyecto

```text
ruta-turistica-cumpeo/
├── prisma/
│   ├── schema.prisma       # Definición de tablas y modelos MySQL
│   ├── seed.js             # Script de población de datos iniciales
│   └── seed-data/          # JSON con datos base de atractivos y rutas
├── public/                 # Archivos estáticos públicos (logos, mapas, iconos)
├── src/
│   ├── app/                # Rutas y páginas (Next.js App Router)
│   │   ├── (public)/       # Páginas para visitantes (inicio, mapa, rutas, fichas)
│   │   ├── admin/          # Panel CMS (/admin) y Server Actions de gestión
│   │   ├── api/            # Endpoints REST (solicitudes, analítica, backups)
│   │   └── uploads/        # Servidor de fotos almacenadas en disco
│   ├── components/         # Componentes UI reutilizables (modales, toast, cards)
│   └── lib/                # Lógica de negocio (DB Prisma, auth, cookies, utilidades)
└── tailwind.config.ts      # Configuración de diseño y paleta de colores
```
