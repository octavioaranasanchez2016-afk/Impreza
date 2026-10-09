import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sameSecret } from "@/lib/size-lists";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El organizador cierra o vuelve a abrir su lista (cerrada = nadie más se anota).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Lista no válida." }, { status: 400 });
  const body = await req.json().catch(() => null);
  const clave = typeof body?.clave === "string" ? body.clave : "";
  if (typeof body?.cerrada !== "boolean") return NextResponse.json({ error: "Falta el estado." }, { status: 400 });

  const service = createServiceClient();
  const { data: list } = await service.from("listas_tallas").select("clave").eq("id", id).maybeSingle();
  if (!list || !sameSecret(clave, list.clave)) return NextResponse.json({ error: "Solo el organizador puede hacer esto." }, { status: 403 });

  const { error } = await service.from("listas_tallas").update({ cerrada: body.cerrada }).eq("id", id);
  if (error) return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
