import { createClient } from "@supabase/supabase-js";
import WS from "ws";

// Cliente con service_role: solo se usa en rutas server-side (API routes),
// nunca debe llegar al cliente porque bypassa las políticas RLS del bucket.
// Solo usamos Storage, pero supabase-js siempre instancia un cliente de
// Realtime; en Node < 22 (sin WebSocket global) eso revienta el import si no
// le pasamos una implementación de WebSocket explícita.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    realtime: { transport: WS as unknown as typeof WebSocket },
  }
);

export const UPLOADS_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";
