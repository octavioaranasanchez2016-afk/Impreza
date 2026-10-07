import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/catalog";
import { SizeList, listSizes, loadGroupDesign } from "@/lib/size-lists";
import { parseGroupDesign } from "@/lib/group-design";
import {
  fitLugares,
  lugaresDeLista,
  parseLugares,
  parseNameStyle,
  parsePersonalizado,
  personalizadoDe,
} from "@/lib/group-names";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El diseño del grupo, para cargarlo en el diseñador (al cambiarlo o al hacer el
// pedido). Lo puede leer cualquiera con el enlace: es lo mismo que ve el grupo.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Lista no válida." }, { status: 400 });
  const service = createServiceClient();
  const { data: list } = await service.from("listas_tallas").select("*").eq("id", id).maybeSingle();
  const product = list && getProductById(list.product_id);
  if (!list || !product) return NextResponse.json({ error: "No encontramos esta lista." }, { status: 404 });
  const { count } = await service.from("listas_tallas_personas").select("id", { count: "exact", head: true }).eq("lista_id", id);

  const personalizado = parsePersonalizado(list.personalizado);
  const style = parseNameStyle(list.estilo, personalizado);
  return NextResponse.json({
    nombre: list.nombre,
    personas: count ?? 0,
    personalizado,
    diseno: await loadGroupDesign(list as SizeList),
    nombres:
      personalizado === "ninguno"
        ? null
        : {
            lugares: lugaresDeLista(personalizado, list.estilo, product.category),
            ...(style ? { fuente: style.fuente, color: style.color } : {}),
          },
  });
}

// El organizador guarda el diseño (con su clave). Mientras nadie se haya anotado
// también puede cambiar qué lleva cada camisa; después, solo dónde va lo que ya
// escribieron, la letra y el color.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Lista no válida." }, { status: 400 });
  const body = await req.json().catch(() => null);
  const clave = typeof body?.clave === "string" ? body.clave : "";

  const service = createServiceClient();
  const { data: list } = await service.from("listas_tallas").select("*").eq("id", id).maybeSingle();
  if (!list || !clave || list.clave !== clave) {
    return NextResponse.json({ error: "Solo el organizador puede cambiar el diseño." }, { status: 403 });
  }
  if (list.order_id) return NextResponse.json({ error: "Esta lista ya se convirtió en pedido." }, { status: 409 });
  const product = getProductById(list.product_id);
  if (!product) return NextResponse.json({ error: "No encontramos la prenda de esta lista." }, { status: 404 });

  const diseno = parseGroupDesign(body?.diseno, product.id, id);
  const { data: personas } = await service.from("listas_tallas_personas").select("talla").eq("lista_id", id);
  const anotados = personas?.length ?? 0;
  // Un color que no viene en la talla de alguien ya anotado dejaría esa camisa fuera.
  if (diseno?.color && diseno.color !== list.color) {
    const sizes = listSizes(product.id, diseno.color);
    const missing = [...new Set((personas ?? []).map((p) => p.talla as string))].filter((t) => !sizes.includes(t));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Ya hay gente anotada en talla ${missing.join(", ")}, que no viene en ${diseno.color.toLowerCase()}. Elige otro color.` },
        { status: 409 }
      );
    }
  }

  const estilo: Record<string, unknown> = list.estilo && typeof list.estilo === "object" ? { ...list.estilo } : {};
  let personalizado = parsePersonalizado(list.personalizado);
  if (body?.nombres) {
    const lugares = parseLugares(body.nombres.lugares, product.category);
    const fitted = anotados === 0 ? lugares : fitLugares(lugares, personalizado, product.category);
    if (anotados === 0) personalizado = personalizadoDe(fitted);
    const style = parseNameStyle({ ...body.nombres, lugares: fitted }, personalizado);
    if (personalizado !== "ninguno") Object.assign(estilo, style ?? { lugares: fitted });
  } else if (anotados === 0) {
    personalizado = "ninguno";
  }
  if (personalizado === "ninguno") {
    delete estilo.lugares;
    delete estilo.fuente;
    delete estilo.color;
  }
  if (diseno) estilo.diseno = diseno;
  else delete estilo.diseno;

  const { error } = await service
    .from("listas_tallas")
    .update({ estilo, personalizado, ...(diseno?.color ? { color: diseno.color } : {}) })
    .eq("id", id);
  if (error) return NextResponse.json({ error: "No se pudo guardar el diseño. Intenta de nuevo." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
