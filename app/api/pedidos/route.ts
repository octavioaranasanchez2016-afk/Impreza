import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { calculateOrderTotal } from "@/lib/pricing";
import { getProductById } from "@/lib/catalog";
import { DesignZone, OrderItemInput, PaymentMethod, Technique } from "@/lib/types";
import { sendCustomerConfirmationEmail, sendNewOrderEmail } from "@/lib/email";

interface DisenoInput {
  zona: DesignZone;
  tipo: "imagen" | "texto";
  path?: string;
  texto?: string;
  color?: string;
  fuente?: string;
  posX: number;
  posY: number;
  escala: number;
  rotacion: number;
}

interface CreateOrderBody {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string | null;
  tecnica: Technique;
  disenos: DisenoInput[];
  notas: string | null;
  items: OrderItemInput[];
  paymentMethod: PaymentMethod;
  comprobantePath: string | null;
}

const VALID_ZONES: DesignZone[] = ["frente", "espalda", "manga"];

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

  // El total SIEMPRE se recalcula en el servidor — nunca se confía en un
  // monto enviado por el cliente. Este es también el punto donde, cuando la
  // pasarela de BAC esté activa, se llamaría a getActivePaymentProvider().
  const pricing = calculateOrderTotal(body.items, body.tecnica);

  if (pricing.totalQuantity === 0) {
    return NextResponse.json({ error: "El pedido no tiene productos válidos." }, { status: 400 });
  }

  const disenos = body.disenos.map((d) => ({
    zona: d.zona,
    tipo: d.tipo,
    path: d.tipo === "imagen" ? d.path : undefined,
    texto: d.tipo === "texto" ? d.texto : undefined,
    color: d.tipo === "texto" ? d.color : undefined,
    fuente: d.tipo === "texto" ? d.fuente ?? "sans" : undefined,
    posX: clamp(d.posX, 0, 100),
    posY: clamp(d.posY, 0, 100),
    escala: clamp(d.escala, 0.1, 5),
    rotacion: ((clamp(d.rotacion ?? 0, -3600, 3600) % 360) + 360) % 360,
  }));

  const supabase = createServiceClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      cliente_nombre: body.clienteNombre.trim(),
      cliente_telefono: body.clienteTelefono.trim(),
      cliente_email: body.clienteEmail,
      tecnica: body.tecnica,
      disenos,
      notas: body.notas,
      payment_method: body.paymentMethod,
      payment_status: body.comprobantePath ? "en_revision" : "pendiente",
      comprobante_url: body.comprobantePath,
      subtotal: pricing.subtotal,
      descuento_pct: pricing.discountPct,
      descuento_monto: pricing.discountAmount,
      cargo_diseno: pricing.setupFee,
      total: pricing.total,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: `No se pudo crear el pedido: ${orderError?.message}` },
      { status: 500 }
    );
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    body.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      color: item.color,
      talla: item.size,
      cantidad: item.quantity,
    }))
  );

  if (itemsError) {
    return NextResponse.json(
      { error: `No se pudieron guardar los productos: ${itemsError.message}` },
      { status: 500 }
    );
  }

  // No se espera (await) para no retrasar la respuesta al cliente, y un
  // fallo aquí nunca debe hacer fallar el pedido (ver lib/email.ts).
  sendNewOrderEmail({
    orderId: order.id,
    clienteNombre: body.clienteNombre.trim(),
    clienteTelefono: body.clienteTelefono.trim(),
    total: pricing.total,
    tecnica: body.tecnica,
  });

  if (body.clienteEmail) {
    sendCustomerConfirmationEmail({
      orderId: order.id,
      clienteNombre: body.clienteNombre.trim(),
      clienteEmail: body.clienteEmail,
      total: pricing.total,
    });
  }

  return NextResponse.json({ orderId: order.id, total: pricing.total });
}

function validate(body: CreateOrderBody): string | null {
  if (!body.clienteNombre?.trim() || body.clienteNombre.trim().length < 2) {
    return "El nombre del cliente es requerido.";
  }
  if (!body.clienteTelefono?.trim() || body.clienteTelefono.trim().length < 6) {
    return "El teléfono del cliente es requerido.";
  }
  if (!body.tecnica || !["serigrafia", "sublimado"].includes(body.tecnica)) {
    return "Técnica de impresión inválida.";
  }
  if (!Array.isArray(body.disenos) || body.disenos.length === 0) {
    return "Falta el diseño del pedido.";
  }
  if (!body.disenos.some((d) => d.zona === "frente")) {
    return "El diseño del frente es obligatorio.";
  }
  for (const d of body.disenos) {
    if (!VALID_ZONES.includes(d.zona)) {
      return `Zona de diseño inválida: ${d.zona}`;
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
    if (!getProductById(item.productId)) {
      return `Producto inválido: ${item.productId}`;
    }
    if (!item.quantity || item.quantity < 1) {
      return "Cada producto debe tener cantidad válida.";
    }
  }
  if (!["contra_entrega", "transferencia", "whatsapp", "en_linea"].includes(body.paymentMethod)) {
    return "Método de pago inválido.";
  }
  return null;
}

function clamp(value: number, min: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
