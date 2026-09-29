import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MAX_COMMENT_LENGTH, MIN_COMMENT_LENGTH } from "@/lib/review-rules";

// Moderación y edición de reseñas desde el panel: pasa por RLS con la sesión del admin.
async function adminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

// Las páginas públicas guardan las reseñas por 5 minutos: se refrescan al momento.
function refreshPublicPages() {
  revalidatePath("/");
  revalidatePath("/resenas");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminClient();
  if (!supabase) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const update: Record<string, unknown> = {};

  if (typeof body?.aprobada === "boolean") update.aprobada = body.aprobada;
  if (body?.nombre !== undefined) {
    const nombre = typeof body.nombre === "string" ? body.nombre.replace(/\s+/g, " ").trim() : "";
    if (nombre.length < 2 || nombre.length > 60) {
      return NextResponse.json({ error: "El nombre debe tener entre 2 y 60 caracteres." }, { status: 400 });
    }
    update.nombre = nombre;
  }
  if (body?.calificacion !== undefined) {
    const calificacion = Number(body.calificacion);
    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
      return NextResponse.json({ error: "Elige de 1 a 5 estrellas." }, { status: 400 });
    }
    update.calificacion = calificacion;
  }
  if (body?.comentario !== undefined) {
    const comentario = typeof body.comentario === "string" ? body.comentario.trim() : "";
    if (comentario.length < MIN_COMMENT_LENGTH || comentario.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `El comentario debe tener entre ${MIN_COMMENT_LENGTH} y ${MAX_COMMENT_LENGTH} caracteres.` },
        { status: 400 }
      );
    }
    update.comentario = comentario;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  const { error } = await supabase.from("resenas").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  refreshPublicPages();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminClient();
  if (!supabase) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { error } = await supabase.from("resenas").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  refreshPublicPages();
  return NextResponse.json({ ok: true });
}
