import { NextRequest, NextResponse, after } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { buildInvoiceLines, calculateOrderTotal, techniquesText } from "@/lib/pricing";
import { TECHNIQUE_LABEL, getFabric, getProductById } from "@/lib/catalog";
import { DesignZone, OrderItemInput, PaymentMethod, ProductCategory, Technique } from "@/lib/types";
import { sendCustomerConfirmationEmail, sendNewOrderEmail } from "@/lib/email";
import { describeNameStyle, parseNameStyle } from "@/lib/group-names";
import { addressText, deliveryQuote, missingAddressField, parseShipping } from "@/lib/shipping";
import { billingText, missingBillingField, parseBilling } from "@/lib/billing";

interface DisenoInput {
  zona: DesignZone;
  tipo: "imagen" | "texto";
  path?: string;
  ajuste?: "completa" | "llenar";
  anchoPx?: number;
  altoPx?: number;
  texto?: string;
  color?: string;
  fuente?: string;
  contorno?: string; // color del contorno del texto
  posX: number;
  posY: number;
  escala: number;
  rotacion: number;
  grupo?: number; // qué diseño del pedido es (1, 2, 3...), ver lib/design-groups.ts
}

// diseno: el grupo de diseño que lleva esta línea (null = sin diseño).
type ItemInput = OrderItemInput & { diseno?: number | null };

interface CreateOrderBody {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string | null;
  tecnica: Technique;
  disenos: DisenoInput[];
  notas: string | null;
  entrega: unknown;
  factura?: unknown; // { razonSocial, ruc } si pide factura con RUC
  items: ItemInput[];
  paymentMethod: PaymentMethod;
  comprobantePath: string;
  orderId?: string; // creado en el navegador antes de pagar (va en el concepto de la transferencia)
  listaId?: string; // si el pedido se armó desde una lista de tallas del grupo
  personalizacion?: unknown; // dónde y cómo va el nombre de cada persona (camisas de grupo)
}

const VALID_ZONES: DesignZone[] = ["frente", "espalda", "manga", "manga-izq", "manga-der", "etiqueta"];
const MAX_DESIGN_GROUPS = 50;
const isGroup = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= MAX_DESIGN_GROUPS;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  let body: CreateOrderBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const parsedEntrega = parseShipping(body.entrega);
  if (!parsedEntrega) {
    return NextResponse.json({ error: "Elige si quieres entrega a domicilio o recoger en el taller." }, { status: 400 });
  }
  const missingAddress = missingAddressField(parsedEntrega);
  if (missingAddress) {
    return NextResponse.json({ error: `Para la entrega a domicilio falta ${missingAddress}.` }, { status: 400 });
  }

  const factura = body.factura ? parseBilling(body.factura) : null;
  if (body.factura && (!factura || missingBillingField(factura))) {
    return NextResponse.json({ error: "Revisa el nombre y el número RUC para tu factura." }, { status: 400 });
  }

  // El total SIEMPRE se recalcula en el servidor — nunca se confía en un
  // monto enviado por el cliente. Este es también el punto donde, cuando la
  // pasarela de BAC esté activa, se llamaría a getActivePaymentProvider().
  const pricing = calculateOrderTotal(body.items, body.tecnica);

  // El delivery se calcula aquí de nuevo (nunca se confía en el monto del navegador)
  // y queda guardado con la dirección.
  const envio = deliveryQuote(parsedEntrega);
  const entrega = envio ? { ...parsedEntrega, envio } : { ...parsedEntrega, envio: undefined };
  const total = Math.round((pricing.total + (envio?.costo ?? 0)) * 100) / 100;

  if (pricing.totalQuantity === 0) {
    return NextResponse.json({ error: "El pedido no tiene productos válidos." }, { status: 400 });
  }

  // Cada zona de cada diseño guarda también las piezas que llevan ese diseño.
  const piezasDelGrupo = (grupo: number) =>
    body.items
      .filter((i) => i.diseno === grupo)
      .map((i) => ({
        productId: i.productId,
        tecnica: i.technique ?? body.tecnica,
        tela: i.fabric ?? null,
        color: i.color,
        talla: i.size,
        cantidad: i.quantity,
      }));
  const disenos = (body.disenos ?? []).map((d) => ({
    ...(isGroup(d.grupo) ? { grupo: d.grupo, piezas: piezasDelGrupo(d.grupo) } : {}),
    zona: d.zona,
    tipo: d.tipo,
    path: d.tipo === "imagen" ? d.path : undefined,
    ajuste: d.tipo === "imagen" ? (d.ajuste === "llenar" ? "llenar" : "completa") : undefined,
    anchoPx: d.tipo === "imagen" ? Math.round(clamp(d.anchoPx ?? 0, 0, 100000)) : undefined,
    altoPx: d.tipo === "imagen" ? Math.round(clamp(d.altoPx ?? 0, 0, 100000)) : undefined,
    texto: d.tipo === "texto" ? d.texto : undefined,
    color: d.tipo === "texto" ? d.color : undefined,
    fuente: d.tipo === "texto" ? d.fuente ?? "sans" : undefined,
    contorno: d.tipo === "texto" && /^#[0-9a-f]{6}$/i.test(d.contorno ?? "") ? d.contorno : undefined,
    posX: clamp(d.posX, 0, 100),
    posY: clamp(d.posY, 0, 100),
    escala: clamp(d.escala, 0.1, 5),
    rotacion: ((clamp(d.rotacion ?? 0, -3600, 3600) % 360) + 360) % 360,
  }));

  const supabase = createServiceClient();

  const row = {
    ...(body.orderId && UUID.test(body.orderId) ? { id: body.orderId.toLowerCase() } : {}),
    cliente_nombre: body.clienteNombre.trim(),
    cliente_telefono: body.clienteTelefono.trim(),
    cliente_email: body.clienteEmail?.trim() || null,
    tecnica: body.tecnica,
    disenos,
    notas: body.notas,
    payment_method: "transferencia",
    payment_status: "en_revision",
    comprobante_url: body.comprobantePath,
    subtotal: pricing.subtotal,
    descuento_pct: pricing.discountPct,
    descuento_monto: pricing.discountAmount,
    cargo_diseno: pricing.setupFee,
    total,
  };

  const payload: Record<string, unknown> = { ...row, entrega, ...(factura ? { factura } : {}) };
  const insertOrder = () => supabase.from("orders").insert(payload).select("id").single();
  let { data: order, error: orderError } = await insertOrder();

  // Si una columna nueva todavía no existe en Supabase (falta correr su .sql), el
  // pedido no se pierde: ese dato se guarda en las notas para que el taller lo vea.
  const notes = body.notas ? [body.notas] : [];
  for (let i = 0; i < 2 && orderError?.code === "PGRST204"; i++) {
    const missing = /'(\w+)' column/.exec(orderError.message)?.[1];
    if (missing === "entrega") notes.push(addressText(entrega));
    else if (missing === "factura" && factura) notes.push(billingText(factura));
    else break;
    console.error(`Falta la columna orders.${missing}; guardando ese dato en las notas.`);
    delete payload[missing];
    payload.notas = notes.join("\n\n");
    ({ data: order, error: orderError } = await insertOrder());
  }

  // "bordado" y "dtf" son valores nuevos del tipo technique en la base de datos; si
  // todavía no se agregaron (supabase/bordado.sql, supabase/dtf.sql), el pedido no se
  // puede guardar.
  if (orderError?.code === "22P02" && (body.tecnica === "bordado" || body.tecnica === "dtf")) {
    return NextResponse.json(
      {
        error: `Por ahora los pedidos con ${body.tecnica === "dtf" ? "DTF" : "bordado"} se reciben por WhatsApp. Escríbenos y te atendemos.`,
      },
      { status: 503 }
    );
  }

  // El código ya estaba usado (muy raro): el navegador pide uno nuevo.
  if (orderError?.code === "23505") {
    return NextResponse.json({ error: "Código de pedido repetido.", codigoRepetido: true }, { status: 409 });
  }

  if (orderError || !order) {
    return NextResponse.json(
      { error: `No se pudo crear el pedido: ${orderError?.message}` },
      { status: 500 }
    );
  }

  // Pedido armado desde una lista de tallas: la lista queda unida al pedido (y cerrada),
  // así el taller ve en el panel quién lleva qué talla. Si falla, el pedido sigue igual.
  let listaPersonas = 0;
  let listaCategory: ProductCategory | undefined;
  const nameStyle = parseNameStyle(body.personalizacion);
  if (typeof body.listaId === "string" && UUID.test(body.listaId)) {
    // El estilo de los nombres se suma a lo que ya tenía la lista (su diseño del grupo).
    const { data: current } = await supabase.from("listas_tallas").select("*").eq("id", body.listaId).maybeSingle();
    const saved = current?.estilo && typeof current.estilo === "object" ? current.estilo : {};
    const link = (withStyle: boolean) =>
      supabase
        .from("listas_tallas")
        .update({ order_id: order.id, cerrada: true, ...(withStyle && nameStyle ? { estilo: { ...saved, ...nameStyle } } : {}) })
        .eq("id", body.listaId!)
        .is("order_id", null)
        .select("id, product_id");
    let { data: linked, error: listError } = await link(true);
    // Sin la columna "estilo" (falta la parte nueva de listas.sql): la lista se une igual
    // y el estilo de los nombres queda en las notas del pedido para que el taller lo vea.
    if (listError?.code === "PGRST204" && nameStyle) {
      ({ data: linked, error: listError } = await link(false));
      const nota = `Cada camisa personalizada: ${describeNameStyle(nameStyle)}`;
      await supabase
        .from("orders")
        .update({ notas: body.notas ? `${body.notas}\n\n${nota}` : nota })
        .eq("id", order.id);
    }
    if (listError) console.error("No se pudo unir la lista de tallas al pedido:", listError.message);
    if (linked?.length) {
      listaCategory = getProductById(linked[0].product_id as string)?.category;
      const { count } = await supabase
        .from("listas_tallas_personas")
        .select("id", { count: "exact", head: true })
        .eq("lista_id", body.listaId);
      listaPersonas = count ?? 0;
    }
  }

  let itemRows: Record<string, unknown>[] = body.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    color: item.color,
    talla: item.size,
    cantidad: item.quantity,
    tecnica: item.technique ?? body.tecnica,
    ...(item.fabric ? { tela: item.fabric } : {}),
  }));
  let { error: itemsError } = await supabase.from("order_items").insert(itemRows);

  // Si falta alguna columna nueva de order_items (telas.sql, tecnica-por-pieza.sql),
  // la pieza se guarda sin ella y el dato se anota en las notas del pedido para que
  // el taller no lo pierda.
  const pieceText = (i: ItemInput) => `${i.quantity}× ${getProductById(i.productId)?.name} ${i.color} ${i.size}`;
  const extraNotes: string[] = [];
  for (let attempt = 0; attempt < 2 && itemsError?.code === "PGRST204"; attempt++) {
    const missing = /'(\w+)' column/.exec(itemsError.message)?.[1];
    if (missing === "tela") {
      const telas = body.items.filter((i) => i.fabric);
      if (telas.length) {
        extraNotes.push(`Telas:\n${telas.map((i) => `${pieceText(i)}: ${getFabric(i.productId, i.fabric)?.name ?? i.fabric}`).join("\n")}`);
      }
    } else if (missing === "tecnica") {
      extraNotes.push(
        `Técnica de cada pieza:\n${body.items.map((i) => `${pieceText(i)}: ${TECHNIQUE_LABEL[i.technique ?? body.tecnica]}`).join("\n")}`
      );
    } else break;
    console.error(`Falta la columna order_items.${missing}; guardando ese dato en las notas.`);
    itemRows = itemRows.map(({ [missing]: _drop, ...rest }) => rest);
    ({ error: itemsError } = await supabase.from("order_items").insert(itemRows));
  }
  if (!itemsError && extraNotes.length) {
    const notas = [payload.notas, ...extraNotes].filter(Boolean).join("\n\n");
    await supabase.from("orders").update({ notas }).eq("id", order.id);
  }

  if (itemsError) {
    return NextResponse.json(
      { error: `No se pudieron guardar los productos: ${itemsError.message}` },
      { status: 500 }
    );
  }

  // after() responde al cliente de inmediato y mantiene viva la función en
  // Vercel hasta que los correos terminen; sin él se cortaban a medio envío.
  const clienteNombre = body.clienteNombre.trim();
  const clienteEmail = body.clienteEmail?.trim() || null;
  after(async () => {
    await Promise.all([
      sendNewOrderEmail({
        orderId: order.id,
        clienteNombre,
        clienteTelefono: body.clienteTelefono.trim(),
        clienteEmail,
        total,
        tecnica: techniquesText(body.items, body.tecnica),
        piezas: pricing.totalQuantity,
        entrega,
        factura,
        sinDiseno: disenos.length === 0,
        piezasSinDiseno:
          disenos.length > 0 && disenos.some((d) => "grupo" in d)
            ? body.items.filter((i) => !isGroup(i.diseno)).reduce((sum, i) => sum + i.quantity, 0)
            : 0,
        disenosDistintos: new Set(disenos.map((d) => ("grupo" in d ? d.grupo : 1))).size,
        listaPersonas,
        nombresEstilo: listaPersonas && nameStyle ? describeNameStyle(nameStyle, listaCategory) : undefined,
      }),
      clienteEmail
        ? sendCustomerConfirmationEmail({
            orderId: order.id,
            clienteNombre,
            clienteEmail,
            total,
            lines: buildInvoiceLines(body.items, body.tecnica),
            entrega,
          })
        : Promise.resolve(),
    ]);
  });

  return NextResponse.json({ orderId: order.id, total });
}

function validate(body: CreateOrderBody): string | null {
  if (!body.clienteNombre?.trim() || body.clienteNombre.trim().length < 2) {
    return "El nombre del cliente es requerido.";
  }
  if (!body.clienteTelefono?.trim() || body.clienteTelefono.trim().length < 6) {
    return "El teléfono del cliente es requerido.";
  }
  if (body.clienteEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.clienteEmail.trim())) {
    return "El correo no es válido.";
  }
  if (!body.tecnica || !(body.tecnica in TECHNIQUE_LABEL)) {
    return "Técnica de impresión inválida.";
  }
  // Ningún diseño es obligatorio: el cliente puede mandarlo después por WhatsApp.
  if (body.disenos != null && !Array.isArray(body.disenos)) {
    return "Diseños inválidos.";
  }
  const groups = new Set<number>();
  for (const d of body.disenos ?? []) {
    if (!VALID_ZONES.includes(d.zona)) {
      return `Zona de diseño inválida: ${d.zona}`;
    }
    if (d.grupo != null) {
      if (!isGroup(d.grupo)) return "Número de diseño inválido.";
      groups.add(d.grupo);
    }
    if (d.tipo === "imagen" && !d.path) {
      return `Falta el archivo de diseño para la zona ${d.zona}.`;
    }
    if (d.tipo === "texto" && !d.texto?.trim()) {
      return `Falta el texto para la zona ${d.zona}.`;
    }
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return "El pedido debe tener al menos un producto.";
  }
  for (const item of body.items) {
    const product = getProductById(item.productId);
    if (!product) {
      return `Producto inválido: ${item.productId}`;
    }
    // Cada pieza puede ir con su propia técnica; sin técnica propia, la del pedido.
    const lineTechnique = item.technique ?? body.tecnica;
    if (!(lineTechnique in TECHNIQUE_LABEL)) {
      return "Técnica de impresión inválida.";
    }
    if (!product.techniques.includes(lineTechnique)) {
      return `${product.name} no se hace con ${TECHNIQUE_LABEL[lineTechnique].toLowerCase()}.`;
    }
    if (item.fabric != null) {
      const fabric = getFabric(item.productId, item.fabric);
      if (!fabric) return `Tela inválida para ${product.name}.`;
      if (!fabric.techniques.includes(lineTechnique)) {
        return `La tela ${fabric.name} no se puede imprimir con ${TECHNIQUE_LABEL[lineTechnique].toLowerCase()}.`;
      }
    }
    if (!item.quantity || item.quantity < 1) {
      return "Cada producto debe tener cantidad válida.";
    }
    if (item.diseno != null && !groups.has(item.diseno)) {
      return "Un producto del pedido apunta a un diseño que no existe. Vuelve a agregarlo.";
    }
  }
  if (body.paymentMethod !== "transferencia") {
    return "Solo aceptamos pago por transferencia bancaria.";
  }
  if (
    typeof body.comprobantePath !== "string" ||
    !body.comprobantePath.startsWith("comprobantes/") ||
    body.comprobantePath.includes("..")
  ) {
    return "Adjunta el comprobante de transferencia para confirmar el pedido.";
  }
  return null;
}

function clamp(value: number, min: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
