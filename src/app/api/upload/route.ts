import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join, basename } from "path";
import { existsSync } from "fs";
import sharp from "sharp";
import { getAdminSession } from "@/app/admin/actions";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_SIZE_MB = 5;
const MAX_DIMENSION = 1920;

// La extensión final siempre sale de este mapa, nunca del nombre de archivo
// que manda el cliente, para evitar que un mimetype falso cuele una extensión
// ejecutable/peligrosa (.html, .svg, etc.) en public/uploads.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
      return NextResponse.json(
        { error: "No autorizado: Se requiere rol de Administrador o Editor para subir archivos" },
        { status: 403 }
      );
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibio ningun archivo" }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Tipo no permitido. Solo JPG, PNG, WebP, GIF, AVIF" }, { status: 400 });
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      return NextResponse.json({ error: `Archivo muy grande (${sizeMB.toFixed(1)}MB). Maximo: ${MAX_SIZE_MB}MB` }, { status: 400 });
    }

    const baseName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_\-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .slice(0, 40);
    const filename = `${Date.now()}-${baseName}.${ext}`;

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    // GIF se guarda tal cual para no perder la animación (sharp la aplanaría
    // al primer frame). El resto se redimensiona/comprime al vuelo.
    let outputBuffer: Buffer;
    if (file.type === "image/gif") {
      outputBuffer = inputBuffer;
    } else {
      let pipeline = sharp(inputBuffer).resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });
      if (ext === "jpg") pipeline = pipeline.jpeg({ quality: 82 });
      else if (ext === "png") pipeline = pipeline.png({ quality: 82 });
      else if (ext === "webp") pipeline = pipeline.webp({ quality: 82 });
      else if (ext === "avif") pipeline = pipeline.avif({ quality: 60 });
      outputBuffer = await pipeline.toBuffer();
    }

    await writeFile(join(UPLOAD_DIR, filename), outputBuffer);

    return NextResponse.json({ url: `/uploads/${filename}`, filename });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Error interno al subir la imagen" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "No autorizado: Solo un Administrador puede eliminar archivos del servidor" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetUrl = body.url || body.filename;

    if (!targetUrl || typeof targetUrl !== "string") {
      return NextResponse.json({ error: "URL o nombre de archivo requerido" }, { status: 400 });
    }

    // Sanitizar y asegurar que solo se borren archivos dentro de public/uploads
    const safeFilename = basename(targetUrl);
    const filePath = join(UPLOAD_DIR, safeFilename);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "El archivo no existe en el servidor", notFound: true }, { status: 404 });
    }

    await unlink(filePath);
    return NextResponse.json({ success: true, message: "Archivo eliminado correctamente", filename: safeFilename });
  } catch (error) {
    console.error("Delete upload error:", error);
    return NextResponse.json({ error: "Error interno al eliminar el archivo" }, { status: 500 });
  }
}
