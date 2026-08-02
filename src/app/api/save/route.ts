import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = ['destinations', 'restaurants', 'accommodations', 'config'];
const FILE_MAP: Record<string, string> = {
  destinations: 'destinations.json',
  restaurants: 'restaurants.json',
  accommodations: 'accommodations.json',
  config: 'config.json',
};

export async function POST(req: NextRequest) {
  // Read secret from environment — never hardcode credentials in source code
  const ADMIN_TOKEN = process.env.ADMIN_SECRET;
  if (!ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Servidor no configurado correctamente (falta ADMIN_SECRET)' }, { status: 500 });
  }

  try {
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const { token, type, data } = body;

    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 403 });
    }

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: `Tipo de datos no permitido: ${type}` }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Sin datos para guardar' }, { status: 400 });
    }

    const filename = FILE_MAP[type];
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const filePath = path.join(dataDir, filename);

    // Create backups directory if it doesn't exist
    const backupDir = path.join(dataDir, 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    // Create timestamped backup if file exists
    try {
      await fs.access(filePath);
      const now = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${path.basename(filename, '.json')}_${now}.json`;
      await fs.copyFile(filePath, path.join(backupDir, backupName));

      // Keep maximum 5 backups
      const files = await fs.readdir(backupDir);
      const prefix = `${path.basename(filename, '.json')}_`;
      const matchingBackups = files.filter((f) => f.startsWith(prefix)).sort();

      if (matchingBackups.length > 5) {
        const toDelete = matchingBackups.slice(0, matchingBackups.length - 5);
        for (const fileToDelete of toDelete) {
          await fs.unlink(path.join(backupDir, fileToDelete)).catch(() => {});
        }
      }
    } catch {
      // File didn't exist yet, ignore backup step
    }

    // Add metadata
    if (typeof data === 'object' && data !== null) {
      (data as Record<string, unknown>).lastUpdated = new Date().toISOString();
    }

    // Write file
    const jsonContent = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonContent, 'utf-8');

    return NextResponse.json({
      success: true,
      type,
      file: filename,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
