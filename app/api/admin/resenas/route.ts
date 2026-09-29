import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { MAX_COMMENT_LENGTH, MIN_COMMENT_LENGTH } from "@/lib/review-rules";

// El admin agrega una reseña que le dio un cliente (por WhatsApp, en persona...).
// Si trae el código de un pedido, queda como "Compra verificada".
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const { data: admin } = await supabase.from("admins").select("id").eq("id", user.id).single();
  if (!admin) return NextResponse.json({ error: "Sin acceso." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const nombre = typeof body?.nombre === "string" ? body.nombre.replace(/\s+/g, " ").trim() : "";
  const comentario = typeof body?.comentario === "string" ? body.comentario.trim() : "";
  const calificacion = Number(body?.calificacion);
  const aprobada = body?.aprobada !== false;
  const codigo = typeof body?.codigo === "string" ? body.codigo.replace(/[#\s-]/g, "").toLowerCase() : "";

  if (nombre.length < 2 || nombre.length > 60) {
    return NextResponse.json({ error: "Escribe el nombre del cliente (2 a 60 caracteres)." }, { status: 400 });
  }
  if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
    return NextResponse.json({ error: "Elige de 1 a 5 estrellas." }, { status: 400 });
  }
  if (comentario.length < MIN_COMMENT_LENGTH || comentario.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `El comentario debe tener entre ${MIN_COMMENT_LENGTH} y ${MAX_COMMENT_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  // Las reseñas se guardan con la service role: la tabla no deja insertar desde el navegador.
  const service = createServiceClient();
  let orderId: string | null = null;
  if (codigo) {
    if (!/^[0-9a-f]{8}$/.test(codigo)) {
      return NextResponse.json({ error: "El código de pedido tiene 8 caracteres (por ejemplo CB07F9DB)." }, { status: 400 });
    }
    const { data: found } = await service
      .from("orders")
      .select("id")
      .gte("id", `${codigo}-0000-0000-0000-000000000000`)
      .lte("id", `${codigo}-ffff-ffff-ffff-ffffffffffff`)
      .limit(1);
    orderId = found?.[0]?.id ?? null;
    if (!orderId) return NextResponse.json({ error: "No encontramos un pedido con ese código." }, { status: 404 });
  }

  const { error } = await service.from("resenas").insert({ nombre, calificacion, comentario, aprobada, order_id: orderId });
  if (error?.code === "23505") {
    return NextResponse.json({ error: "Ese pedido ya tiene una reseña. Edita la que existe." }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/");
  revalidatePath("/resenas");
  return NextResponse.json({ ok: true });
}
