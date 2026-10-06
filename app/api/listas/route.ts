import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/catalog";
import { cleanName, isMissingSchema, newSecret } from "@/lib/size-lists";
import { defaultLugares, parseLugares, parsePersonalizado, personalizadoDe } from "@/lib/group-names";

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

  // Qué va en cada lugar de la camisa (lo elige el organizador). De ahí sale lo que
  // cada persona tiene que escribir al anotarse.
  const lugares = body?.lugares
    ? parseLugares(body.lugares, product.category)
    : defaultLugares(parsePersonalizado(body?.personalizado), product.category);
  const personalizado = personalizadoDe(lugares);

  const clave = newSecret();
  const service = createServiceClient();
  const row: Record<string, unknown> = { nombre, organizador, product_id: product.id, color, clave, personalizado };
  if (personalizado !== "ninguno") row.estilo = { lugares };
  let { data, error } = await service.from("listas_tallas").insert(row).select("id").single();
  // Sin la columna "personalizado" (falta correr la parte nueva de listas.sql) la lista
  // se crea igual, sin nombres en las camisas.
  if (error?.code === "PGRST204" && personalizado === "ninguno") {
    delete row.personalizado;
    ({ data, error } = await service.from("listas_tallas").insert(row).select("id").single());
  } else if (error?.code === "PGRST204") {
    return NextResponse.json(
      { error: "Los nombres en las camisas todavía no están activados: falta correr la parte nueva de supabase/listas.sql." },
      { status: 503 }
    );
  }
  if (error || !data) {
    const missing = isMissingSchema(error);
    return NextResponse.json({ error: missing ? MISSING : "No se pudo crear la lista. Intenta de nuevo." }, { status: missing ? 503 : 500 });
  }
  return NextResponse.json({ id: data.id, clave });
}
