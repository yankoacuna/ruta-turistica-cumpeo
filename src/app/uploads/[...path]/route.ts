import { NextRequest, NextResponse } from "next/server";
import { readUpload } from "@/lib/fileStorage";

export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

/**
 * Sirve los archivos subidos (galerías del admin, fotos de solicitudes) desde
 * UPLOADS_DIR, que en producción vive fuera de `public/` (ver
 * src/lib/fileStorage.ts) y por eso Next.js no los sirve como estáticos.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  const buffer = await readUpload(segments).catch(() => null);
  if (!buffer) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const ext = segments[segments.length - 1]?.split(".").pop()?.toLowerCase() || "";
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
