import { createServiceClient } from "./supabase/server";

export { MAX_COMMENT_LENGTH, MIN_COMMENT_LENGTH } from "./review-rules";

export interface PublicReview {
  id: string;
  nombre: string;
  calificacion: number;
  comentario: string;
  created_at: string;
  verificada: boolean; // viene de un pedido real hecho en el sitio
}

export interface ReviewStats {
  count: number;
  average: number;
}

// "María José Gómez" → "María G.": en público solo nombre e inicial del apellido.
export function publicName(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "Cliente";
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// Reseñas aprobadas para mostrar en el sitio. Si la tabla todavía no existe
// (falta correr supabase/resenas.sql) devuelve una lista vacía.
export async function getApprovedReviews(limit?: number): Promise<{ reviews: PublicReview[]; stats: ReviewStats }> {
  const supabase = createServiceClient();
  let query = supabase
    .from("resenas")
    .select("id, nombre, calificacion, comentario, created_at, order_id")
    .eq("aprobada", true)
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const [{ data, error }, { data: all }] = await Promise.all([
    query,
    supabase.from("resenas").select("calificacion").eq("aprobada", true),
  ]);
  if (error || !data) return { reviews: [], stats: { count: 0, average: 0 } };

  const ratings = (all ?? []).map((r) => Number(r.calificacion));
  const average = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  return {
    reviews: data.map((r) => ({
      id: r.id,
      nombre: publicName(r.nombre),
      calificacion: r.calificacion,
      comentario: r.comentario,
      created_at: r.created_at,
      verificada: Boolean(r.order_id),
    })),
    stats: { count: ratings.length, average: Math.round(average * 10) / 10 },
  };
}

// Estado de la reseña de un pedido: "sin_tabla" si las reseñas no están activadas.
export async function getOrderReviewState(orderId: string): Promise<"sin_tabla" | "pendiente" | "enviada"> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("resenas").select("id").eq("order_id", orderId).limit(1);
  if (error) return "sin_tabla";
  return data && data.length > 0 ? "enviada" : "pendiente";
}
