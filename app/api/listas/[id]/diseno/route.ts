import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/catalog";
import { SizeList, cleanName, exampleEntryId, listPersonal, listSizes, loadGroupDesign, newSecret, sameSecret } from "@/lib/size-lists";
import { parseGroupDesign } from "@/lib/group-design";
import { cleanValores, parsePersonExtra, parsePersonal, personalizadoDe, valoresDePersona } from "@/lib/group-names";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El diseño del grupo (la camisa de ejemplo), para cargarlo en el diseñador al cambiarlo
// o al hacer el pedido. Lo puede leer cualquiera con el enlace: es lo mismo que ve el grupo.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Lista no válida." }, { status: 400 });
  const service = createServiceClient();
  const { data: list } = await service.from("listas_tallas").select("*").eq("id", id).maybeSingle();
  if (!list || !getProductById(list.product_id)) return NextResponse.json({ error: "No encontramos esta lista." }, { status: 404 });
  const { data: rows } = await service
    .from("listas_tallas_personas")
    .select("*")
    .eq("lista_id", id)
    .order("created_at", { ascending: true });

  const ejemploId = exampleEntryId(list as SizeList);
  const mia = (rows ?? []).find((r) => r.id === ejemploId);
  const personal = listPersonal(list as SizeList);
  const otros = (rows ?? []).filter((r) => r.id !== ejemploId);
  const estilo = list.estilo && typeof list.estilo === "object" ? (list.estilo as Record<string, unknown>) : {};
  return NextResponse.json({
    nombre: list.nombre,
    // Cambia cada vez que se guarda: el pedido vuelve a cargar el diseño si cambió.
    version: typeof estilo.actualizado === "string" ? estilo.actualizado : null,
    personas: otros.length,
    diseno: await loadGroupDesign(list as SizeList),
    personal,
    // Algunas camisas del grupo, para ver el pedido con lo que escribió cada quien.
    ejemplosGrupo: otros.slice(0, 6).map((r) => ({
      nombre: (r.nombre as string).split(" ")[0],
      valores: valoresDePersona(personal, { texto: r.texto, numero: r.numero, estilo: parsePersonExtra(r.estilo) }),
    })),
    mia: mia ? { nombre: mia.nombre as string, talla: mia.talla as string } : null,
  });
}

// El organizador guarda la camisa de ejemplo (con su clave): el diseño de todos, lo que
// pone cada quien y, si quiere, su propia camisa con lo que escribió en ella. Con gente
// ya anotada no se puede pedir algo que ellos no escribieron.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Lista no válida." }, { status: 400 });
  const body = await req.json().catch(() => null);
  const clave = typeof body?.clave === "string" ? body.clave : "";

  const service = createServiceClient();
  const { data: list } = await service.from("listas_tallas").select("*").eq("id", id).maybeSingle();
  if (!list || !sameSecret(clave, list.clave)) {
    return NextResponse.json({ error: "Solo el organizador puede cambiar el diseño." }, { status: 403 });
  }
  if (list.order_id) return NextResponse.json({ error: "Esta lista ya se convirtió en pedido." }, { status: 409 });
  const product = getProductById(list.product_id);
  if (!product) return NextResponse.json({ error: "No encontramos la prenda de esta lista." }, { status: 404 });

  const diseno = parseGroupDesign(body?.diseno, product.id, id);
  const personal = parsePersonal(body?.personal, product.category);
  const color = diseno?.color ?? list.color;
  const ejemploId = exampleEntryId(list as SizeList);
  const { data: rows } = await service.from("listas_tallas_personas").select("id, talla").eq("lista_id", id);
  const otros = (rows ?? []).filter((r) => r.id !== ejemploId);

  // Con gente anotada no se agregan textos nuevos: ellos no los escribieron.
  if (otros.length > 0) {
    const antes = new Set((listPersonal(list as SizeList)?.campos ?? []).map((f) => f.id));
    if ((personal?.campos ?? []).some((f) => !antes.has(f.id))) {
      return NextResponse.json(
        {
          error: `Ya hay ${otros.length} persona${otros.length === 1 ? "" : "s"} anotada${otros.length === 1 ? "" : "s"} y no escribieron ese texto nuevo. Quítalo o acomoda solo los que ya estaban.`,
        },
        { status: 409 }
      );
    }
  }
  // Un color que no viene en la talla de alguien ya anotado dejaría esa camisa fuera.
  if (diseno?.color && diseno.color !== list.color) {
    const sizes = listSizes(product.id, diseno.color);
    const missing = [...new Set(otros.map((p) => p.talla as string))].filter((t) => !sizes.includes(t));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Ya hay gente anotada en talla ${missing.join(", ")}, que no viene en ${diseno.color.toLowerCase()}. Elige otro color.` },
        { status: 409 }
      );
    }
  }
  // Lo que escribe cada quien se guarda en cada persona: la columna tiene que existir.
  if (personal) {
    const { error: columnError } = await service.from("listas_tallas_personas").select("estilo").limit(1);
    if (columnError) {
      return NextResponse.json(
        {
          error:
            "Para lo que pone cada quien falta activar una parte en Supabase (la última línea de supabase/listas.sql).",
        },
        { status: 503 }
      );
    }
  }

  // La camisa del organizador: su registro en la lista con lo que dice su camisa de ejemplo.
  let nuevoEjemploId: string | null = null;
  const mia = body?.mia;
  if (mia) {
    const nombre = cleanName(mia.nombre);
    const talla = typeof mia.talla === "string" ? mia.talla : "";
    if (nombre.length < 2) return NextResponse.json({ error: "Escribe tu nombre para tu camisa." }, { status: 400 });
    if (!listSizes(product.id, color).includes(talla)) return NextResponse.json({ error: "Elige tu talla." }, { status: 400 });
    // Lo que dice su camisa de ejemplo en cada texto es lo que lleva la suya.
    const { valores, texto, numero } = cleanValores(personal, Object.fromEntries((personal?.campos ?? []).map((f) => [f.id, f.ejemplo])));
    const row: Record<string, unknown> = {
      nombre,
      talla,
      cantidad: 1,
      texto,
      numero,
      estilo: personal ? { valores } : null,
    };
    const existing = ejemploId && (rows ?? []).some((r) => r.id === ejemploId);
    const { data: saved, error: miaError } = existing
      ? await service.from("listas_tallas_personas").update(row).eq("id", ejemploId!).select("id").single()
      : await service
          .from("listas_tallas_personas")
          .insert({ lista_id: id, token: newSecret(), ...row })
          .select("id")
          .single();
    if (miaError || !saved) return NextResponse.json({ error: "No se pudo guardar tu camisa. Intenta de nuevo." }, { status: 500 });
    nuevoEjemploId = saved.id as string;
  } else if (ejemploId) {
    await service.from("listas_tallas_personas").delete().eq("id", ejemploId);
  }

  // Todo en estilo; lo de antes (lugares, una letra y un color para todos) se reemplaza.
  const estilo: Record<string, unknown> = {
    ...(diseno ? { diseno } : {}),
    ...(personal ? { campos: personal.campos, eligen: personal.eligen } : {}),
    ...(nuevoEjemploId ? { ejemploId: nuevoEjemploId } : {}),
    actualizado: new Date().toISOString(),
  };
  const { error } = await service
    .from("listas_tallas")
    .update({ estilo, personalizado: personalizadoDe(personal), ...(diseno?.color ? { color: diseno.color } : {}) })
    .eq("id", id);
  if (error) return NextResponse.json({ error: "No se pudo guardar el diseño. Intenta de nuevo." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
