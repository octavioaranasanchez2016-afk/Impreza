import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MAX_PERSONAS, SizeList, cleanName, listPersonal, listSizes, newSecret } from "@/lib/size-lists";
import { cleanValores, fieldHint, parsePersonExtra, zoneTitle } from "@/lib/group-names";
import { HOUR, clientIp, withinLimit } from "@/lib/rate-limit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Una persona se anota en la lista con su nombre y su talla. Devuelve un token
// para que, desde el mismo teléfono, pueda quitar su registro si se equivocó.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Lista no válida." }, { status: 400 });
  const body = await req.json().catch(() => null);
  const nombre = cleanName(body?.nombre);
  const talla = typeof body?.talla === "string" ? body.talla : "";
  const cantidad = Number(body?.cantidad ?? 1);

  const service = createServiceClient();
  const { data: list } = await service
    .from("listas_tallas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!list) return NextResponse.json({ error: "No encontramos esta lista." }, { status: 404 });
  if (list.cerrada) return NextResponse.json({ error: "El organizador ya cerró esta lista." }, { status: 409 });
  if (nombre.length < 2) return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });
  if (!listSizes(list.product_id, list.color).includes(talla)) return NextResponse.json({ error: "Elige tu talla." }, { status: 400 });
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20) {
    return NextResponse.json({ error: "La cantidad va de 1 a 20." }, { status: 400 });
  }
  // Lo que pone cada quien en su camisa, texto por texto: no se puede anotar sin ello.
  const personal = listPersonal(list as SizeList);
  const { valores, texto, numero, falta } = cleanValores(personal, body?.valores);
  if (falta) {
    return NextResponse.json({ error: `Escribe lo de ${zoneTitle(falta.zona).toLowerCase()} (${fieldHint(falta)}).` }, { status: 400 });
  }

  // Un salón entero puede anotarse desde el mismo wifi: el límite es alto, solo frena robots.
  if (!(await withinLimit({ clave: `anotarse-ip:${clientIp(req.headers)}`, max: 80, windowMs: HOUR }))) {
    return NextResponse.json({ error: "Demasiadas personas anotadas desde esta conexión. Espera un rato." }, { status: 429 });
  }

  const { count } = await service.from("listas_tallas_personas").select("id", { count: "exact", head: true }).eq("lista_id", id);
  if ((count ?? 0) >= MAX_PERSONAS) return NextResponse.json({ error: "Esta lista ya está llena." }, { status: 409 });

  // Sus textos, y la letra y el color solo si el organizador lo deja.
  const eligen = personal?.eligen ?? { color: false, fuente: false };
  const chosen = parsePersonExtra(body?.estilo);
  const estilo = {
    ...(personal ? { valores } : {}),
    ...(eligen.fuente && chosen.fuente ? { fuente: chosen.fuente } : {}),
    ...(eligen.color && chosen.color ? { color: chosen.color } : {}),
  };

  const token = newSecret();
  const row: Record<string, unknown> = {
    lista_id: id,
    nombre,
    talla,
    cantidad,
    token,
    texto,
    numero,
    ...(Object.keys(estilo).length > 0 ? { estilo } : {}),
  };
  let { data, error } = await service.from("listas_tallas_personas").insert(row).select("id").single();
  // Sin la columna "estilo" (falta la última línea de listas.sql) se anota igual: quedan
  // su primer nombre y su primer número, con la letra y el color de todos.
  if (error?.code === "PGRST204" && row.estilo) {
    delete row.estilo;
    ({ data, error } = await service.from("listas_tallas_personas").insert(row).select("id").single());
  }
  if (error || !data) return NextResponse.json({ error: "No se pudo guardar. Intenta de nuevo." }, { status: 500 });
  return NextResponse.json({ id: data.id, token });
}

// Quitar un registro: el organizador (con su clave) o la misma persona (con su token).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const personaId = typeof body?.personaId === "string" ? body.personaId : "";
  const clave = typeof body?.clave === "string" ? body.clave : "";
  const token = typeof body?.token === "string" ? body.token : "";
  if (!UUID.test(id) || !UUID.test(personaId)) return NextResponse.json({ error: "Registro no válido." }, { status: 400 });

  const service = createServiceClient();
  const [{ data: list }, { data: persona }] = await Promise.all([
    service.from("listas_tallas").select("clave").eq("id", id).maybeSingle(),
    service.from("listas_tallas_personas").select("token").eq("id", personaId).eq("lista_id", id).maybeSingle(),
  ]);
  if (!list || !persona) return NextResponse.json({ error: "No encontramos ese registro." }, { status: 404 });
  const allowed = (clave && clave === list.clave) || (token && token === persona.token);
  if (!allowed) return NextResponse.json({ error: "No puedes quitar este registro." }, { status: 403 });

  const { error } = await service.from("listas_tallas_personas").delete().eq("id", personaId);
  if (error) return NextResponse.json({ error: "No se pudo quitar." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
