// Límites para que nadie abuse del sitio: pedir códigos sin fin, mandar pedidos falsos
// en masa, crear listas de a montón. Se cuentan en la tabla "cuenta_limites" (ver
// supabase/seguridad.sql), por correo o por conexión. Solo para el servidor.

import { createServiceClient } from "@/lib/supabase/server";

interface Limit {
  clave: string; // "correo:...", "ip:...", "pedido-ip:..."
  max: number; // cuántos por ventana
  windowMs: number;
  gapMs?: number; // tiempo mínimo entre uno y otro
}

export type LimitResult = "ok" | "espera" | "muchos";

// La conexión de quien hace la petición. En Vercel, x-forwarded-for la pone Vercel.
export function clientIp(headers: Headers): string {
  return (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || headers.get("x-real-ip") || "sin-ip";
}

// Cuenta uno más si cabe en el límite. Lanza si la tabla no existe todavía.
export async function takeLimit({ clave, max, windowMs, gapMs = 0 }: Limit): Promise<LimitResult> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("cuenta_limites").select("*").eq("clave", clave).maybeSingle();
  if (error) throw new Error(`cuenta_limites: ${error.code} ${error.message}`);
  const now = Date.now();
  let enviados = 0;
  let ventana = now;
  if (data) {
    if (now - Date.parse(data.ultimo_at) < gapMs) return "espera";
    if (now - Date.parse(data.ventana_at) < windowMs) {
      enviados = data.enviados;
      ventana = Date.parse(data.ventana_at);
    }
  }
  if (enviados >= max) return "muchos";
  const { error: saveError } = await supabase.from("cuenta_limites").upsert({
    clave,
    enviados: enviados + 1,
    ventana_at: new Date(ventana).toISOString(),
    ultimo_at: new Date(now).toISOString(),
  });
  if (saveError) throw new Error(`cuenta_limites: ${saveError.code} ${saveError.message}`);
  return "ok";
}

// Para lo que no debe trabarse si algo falla (un pedido de verdad nunca se pierde por
// esto): si la tabla no está, deja pasar.
export async function withinLimit(limit: Limit): Promise<boolean> {
  try {
    return (await takeLimit(limit)) === "ok";
  } catch (err) {
    console.error("Límite sin revisar (¿falta supabase/seguridad.sql?):", err);
    return true;
  }
}

export const HOUR = 60 * 60 * 1000;
