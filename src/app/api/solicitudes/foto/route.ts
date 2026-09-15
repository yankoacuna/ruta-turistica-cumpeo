import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { saveUpload } from '@/lib/fileStorage';

export const dynamic = 'force-dynamic';

const MAX_SIZE_MB = 8;
const MAX_DIMENSION = 1600;

// Subida abierta al público: el tope por IP y hora es la única barrera real
// contra alguien que quiera llenar el bucket.
const VENTANA_MS = 60 * 60 * 1000;
const MAX_POR_VENTANA = 12;
const subidas = new Map<string, { cuenta: number; expira: number }>();

// La extensión sale de este mapa y nunca del nombre que manda el cliente, para
// que un mimetype falso no cuele una extensión ejecutable en el bucket.
const TIPOS_PERMITIDOS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

function superaLimite(ip: string): boolean {
  const ahora = Date.now();

  if (subidas.size > 2000) {
    for (const [clave, registro] of subidas) {
      if (registro.expira <= ahora) subidas.delete(clave);
    }
  }

  const registro = subidas.get(ip);
  if (!registro || registro.expira <= ahora) {
    subidas.set(ip, { cuenta: 1, expira: ahora + VENTANA_MS });
    return false;
  }
  registro.cuenta += 1;
  return registro.cuenta > MAX_POR_VENTANA;
}

function ipDe(req: NextRequest): string {
  const reenviada = req.headers.get('x-forwarded-for');
  if (reenviada) return reenviada.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'desconocida';
}

/**
 * Fotos que adjunta un emprendedor al postular su negocio.
 *
 * Va aparte de /api/upload porque aquel exige sesión de administrador. Acá no
 * hay sesión, así que las defensas son otras: tope por IP, tamaño máximo, lista
 * blanca de formatos, nombre de archivo generado por el servidor y —lo más
 * importante— reprocesado con sharp, que descarta cualquier carga útil escondida
 * en los metadatos y garantiza que lo guardado sea una imagen de verdad.
 *
 * Las fotos caen en la carpeta `solicitudes/`, separadas del contenido
 * publicado: hasta que alguien del municipio apruebe la ficha, no son del sitio.
 */
export async function POST(req: NextRequest) {
  try {
    if (superaLimite(ipDe(req))) {
      return NextResponse.json(
        { error: 'Demasiadas fotos desde esta conexión. Intenta más tarde.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ninguna foto' }, { status: 400 });
    }

    const ext = TIPOS_PERMITIDOS[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: 'Formato no permitido. Usa JPG, PNG, WebP o AVIF.' },
        { status: 400 }
      );
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      return NextResponse.json(
        { error: `La foto pesa ${sizeMB.toFixed(1)}MB. El máximo es ${MAX_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    const entrada = Buffer.from(await file.arrayBuffer());

    // Todo se normaliza a WebP: pesa menos, y reencodear garantiza que el
    // archivo guardado sea exactamente lo que sharp pudo interpretar.
    let salida: Buffer;
    try {
      salida = await sharp(entrada)
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      return NextResponse.json(
        { error: 'No pudimos leer la imagen. Prueba con otra foto.' },
        { status: 400 }
      );
    }

    const nombre = `solicitudes/${Date.now()}-${crypto.randomUUID()}.webp`;
    const url = await saveUpload(salida, nombre);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error en la subida de foto de solicitud:', error);
    return NextResponse.json({ error: 'Error al procesar la foto' }, { status: 500 });
  }
}
