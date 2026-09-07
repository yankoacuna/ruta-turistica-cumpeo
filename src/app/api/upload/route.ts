import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join, basename } from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function POST(req: NextRequest) {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibio ningun archivo" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipo no permitido. Solo JPG, PNG, WebP, GIF, AVIF" }, { status: 400 });
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      return NextResponse.json({ error: `Archivo muy grande (${sizeMB.toFixed(1)}MB). Maximo: ${MAX_SIZE_MB}MB` }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const baseName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_\-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .slice(0, 40);
    const filename = `${Date.now()}-${baseName}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(UPLOAD_DIR, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}`, filename });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Error interno al subir la imagen" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
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
