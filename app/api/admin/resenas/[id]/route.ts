import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Moderación de reseñas desde el panel: pasa por RLS con la sesión del admin.
async function adminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminClient();
  if (!supabase) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (typeof body?.aprobada !== "boolean") {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }
  const { error } = await supabase.from("resenas").update({ aprobada: body.aprobada }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminClient();
  if (!supabase) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { error } = await supabase.from("resenas").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
