import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MAX_COMMENT_LENGTH, MIN_COMMENT_LENGTH } from "@/lib/review-rules";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Un cliente deja la reseña de SU pedido, solo cuando ya está listo o entregado.
// Queda sin publicar hasta que el admin la aprueba en el panel.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const nombre = typeof body?.nombre === "string" ? body.nombre.replace(/\s+/g, " ").trim() : "";
  const comentario = typeof body?.comentario === "string" ? body.comentario.trim() : "";
  const calificacion = Number(body?.calificacion);

  if (!UUID.test(orderId)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
    return NextResponse.json({ error: "Elige de 1 a 5 estrellas." }, { status: 400 });
  }
  if (nombre.length < 2 || nombre.length > 60) {
    return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });
  }
  if (comentario.length < MIN_COMMENT_LENGTH || comentario.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `Tu comentario debe tener entre ${MIN_COMMENT_LENGTH} y ${MAX_COMMENT_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data: order } = await supabase.from("orders").select("id, status").eq("id", orderId).single();
  if (!order) {
    return NextResponse.json({ error: "No encontramos ese pedido." }, { status: 404 });
  }
  if (order.status !== "listo_entregado") {
    return NextResponse.json({ error: "Podrás dejar tu reseña cuando tu pedido esté listo." }, { status: 400 });
  }

  const { error } = await supabase
    .from("resenas")
    .insert({ order_id: orderId, nombre, calificacion, comentario });

  if (error?.code === "23505") {
    return NextResponse.json({ error: "Ya dejaste tu reseña para este pedido. ¡Gracias!" }, { status: 409 });
  }
  if (error) {
    console.error("No se pudo guardar la reseña:", error);
    return NextResponse.json({ error: "No pudimos guardar tu reseña. Intenta de nuevo más tarde." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
