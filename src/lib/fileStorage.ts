import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import { dirname, join, normalize, sep } from "path";

/**
 * Carpeta donde viven los archivos subidos. Fuera de `.next` y fuera de
 * git a propósito: un deploy hace `rm -rf .next` y vuelve a copiar
 * `public/` al build, así que cualquier archivo escrito ahí en tiempo de
 * ejecución se perdería en el próximo deploy si UPLOADS_DIR no apuntara a
 * un lugar persistente por fuera de eso.
 */
const UPLOADS_DIR = process.env.UPLOADS_DIR || join(process.cwd(), "public", "uploads");

/** Evita que un relativePath con ".." escriba/borre fuera de UPLOADS_DIR. */
function resolveSafePath(relativePath: string): string {
  const cleaned = relativePath.replace(/^\/+/, "");
  const resolved = normalize(join(UPLOADS_DIR, cleaned));
  if (resolved !== UPLOADS_DIR && !resolved.startsWith(UPLOADS_DIR + sep)) {
    throw new Error("Ruta de archivo invalida");
  }
  return resolved;
}

/** Guarda un archivo subido. Devuelve la URL pública ("/uploads/..."). */
export async function saveUpload(buffer: Buffer, relativePath: string): Promise<string> {
  const fullPath = resolveSafePath(relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return `/uploads/${relativePath.replace(/^\/+/, "")}`;
}

/**
 * Lee un archivo subido a partir de sus segmentos de ruta relativos a
 * UPLOADS_DIR (ej. ["solicitudes", "foo.webp"]). Devuelve null si no existe.
 */
export async function readUpload(segments: string[]): Promise<Buffer | null> {
  const relativePath = segments.join("/");
  try {
    const fullPath = resolveSafePath(relativePath);
    return await readFile(fullPath);
  } catch (error: any) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

/**
 * Borra el archivo correspondiente a una URL/ruta "/uploads/...". Nunca
 * lanza si el archivo ya no existe: borrar algo que no está no es un error
 * para quien llama.
 */
export async function deleteUpload(urlOrPath: string): Promise<void> {
  const relativePath = urlOrPath.replace(/^.*\/uploads\//, "");
  try {
    const fullPath = resolveSafePath(relativePath);
    await unlink(fullPath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
  }
}
