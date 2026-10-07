import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/catalog";
import { cleanName, isMissingSchema, newSecret } from "@/lib/size-lists";

const MISSING = "Las listas de tallas todavía no están activadas: falta correr supabase/listas.sql en Supabase.";

// Crea una lista de tallas. Devuelve su id (para compartir) y la clave del organizador.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const nombre = cleanName(body?.nombre);
  const organizador = cleanName(body?.organizador) || null;
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const product = getProductById(productId);
  const color = typeof body?.color === "string" && product?.variants.some((v) => v.color === body.color) ? body.color : null;

  if (nombre.length < 3) return NextResponse.json({ error: "Escribe el nombre del grupo (por ejemplo, Promoción 2026)." }, { status: 400 });
  if (!product) return NextResponse.json({ error: "Elige la prenda." }, { status: 400 });

  // Lo que pone cada quien (nombre, número…) se decide después, en el diseño de la lista.
  const clave = newSecret();
  const service = createServiceClient();
  const { data, error } = await service
    .from("listas_tallas")
    .insert({ nombre, organizador, product_id: product.id, color, clave })
    .select("id")
    .single();
  if (error || !data) {
    const missing = isMissingSchema(error);
    return NextResponse.json({ error: missing ? MISSING : "No se pudo crear la lista. Intenta de nuevo." }, { status: missing ? 503 : 500 });
  }
  return NextResponse.json({ id: data.id, clave });
}
