import { createServiceClient } from "./supabase/server";

// Fotos de trabajos terminados (bucket público "trabajos", ver supabase/trabajos.sql).
// No hay tabla: el nombre del archivo guarda la fecha y el título,
// "1759200000000_<título en base64url>.jpg", y las más nuevas van primero.
export const TRABAJOS_BUCKET = "trabajos";
export const MAX_TITULO = 80;

export interface Trabajo {
  path: string;
  url: string;
  titulo: string;
}

export function trabajoPath(titulo: string, ext: "jpg" | "png" | "webp"): string {
  const encoded = titulo ? Buffer.from(titulo, "utf8").toString("base64url") : "";
  return `${Date.now()}_${encoded}.${ext}`;
}

function tituloFromPath(path: string): string {
  // Todo lo que va después del primer "_" (el base64url también puede traer "_").
  const name = path.replace(/\.[a-z]+$/i, "");
  const encoded = name.slice(name.indexOf("_") + 1);
  try {
    return Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return "";
  }
}

export function isTrabajoPath(path: string): boolean {
  return /^\d{13}_[A-Za-z0-9_-]*\.(jpg|png|webp)$/.test(path);
}

// missing: el bucket todavía no existe (falta correr el SQL).
export async function listTrabajos(limit = 12): Promise<{ trabajos: Trabajo[]; missing: boolean }> {
  try {
    const service = createServiceClient();
    const bucket = service.storage.from(TRABAJOS_BUCKET);
    const { data, error } = await bucket.list("", { limit, sortBy: { column: "name", order: "desc" } });
    if (error || !data) return { trabajos: [], missing: true };
    const trabajos = data
      .filter((f) => isTrabajoPath(f.name))
      .map((f) => ({ path: f.name, url: bucket.getPublicUrl(f.name).data.publicUrl, titulo: tituloFromPath(f.name) }));
    return { trabajos, missing: false };
  } catch {
    return { trabajos: [], missing: true };
  }
}
