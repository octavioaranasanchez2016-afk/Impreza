import { Resend } from "resend";
import { formatBoth } from "./currency";
import { estimateReadyDate, formatReadyDate, PRODUCTION_BUSINESS_DAYS } from "./delivery";
import { ShippingInfo, addressMapsUrl, areaLabel } from "./shipping";
import { siteUrl } from "./site";
import { BillingInfo } from "./billing";
import { TECHNIQUE_LABEL } from "./catalog";
import { Technique } from "./types";

// onboarding@resend.dev solo puede enviar al correo dueño de la cuenta de
// Resend. Para escribirle a los clientes hay que verificar un dominio propio en
// Resend y poner EMAIL_FROM, p. ej. "Impreza <pedidos@tudominio.com>".
const FROM_ADDRESS = process.env.EMAIL_FROM || "Impreza <onboarding@resend.dev>";

const shortId = (orderId: string) => orderId.slice(0, 8).toUpperCase();

// Nunca lanza: un correo fallido no debe tumbar un pedido ni un cambio de estado.
// Resend devuelve los errores de la API en `error` en vez de lanzarlos.
async function send(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(`Sin RESEND_API_KEY: no se envió el correo "${subject}".`);
    return { ok: false, error: "falta RESEND_API_KEY" };
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({ from: FROM_ADDRESS, to, subject, html });
    if (error) {
      console.error(`Resend rechazó el correo "${subject}" para ${to}:`, error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error(`No se pudo enviar el correo "${subject}" para ${to}:`, err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Para el botón "Probar correo de avisos" del panel: explica en español qué falla.
export async function sendAdminTestEmail(): Promise<{ ok: boolean; message: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, message: "En Vercel falta la variable RESEND_API_KEY (la clave de Resend)." };
  }
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!to) {
    return { ok: false, message: "En Vercel falta la variable ADMIN_NOTIFICATION_EMAIL (tu correo para los avisos)." };
  }
  const result = await send(
    to,
    "Prueba de avisos — Impreza",
    layout(`<h2 style="margin:0 0 12px;">¡Los avisos funcionan!</h2><p>Así te van a llegar los correos de cada pedido nuevo.</p>`)
  );
  const masked = to.replace(/^(.{3}).*@/, "$1…@");
  if (result.ok) {
    return { ok: true, message: `Correo de prueba enviado a ${masked}. Si no lo ves en 2 minutos, revisa Spam y Promociones.` };
  }
  return { ok: false, message: `Resend no pudo enviarlo a ${masked}: ${result.error}` };
}

function layout(body: string) {
  return `
  <div style="background:#f4f4f4;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#111;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;">
      <div style="background:#111;color:#fff;padding:18px 24px;font-size:22px;font-weight:bold;letter-spacing:2px;">IMPREZA</div>
      <div style="padding:24px;font-size:15px;line-height:1.5;">${body}</div>
      <div style="padding:16px 24px;border-top:1px solid #eee;font-size:12px;color:#8a8a8d;">
        Impreza · Serigrafía, DTF, sublimado y bordado en Managua, Nicaragua
      </div>
    </div>
  </div>`;
}

function button(href: string, label: string, color = "#111") {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">${label}</a>`;
}

function whatsappButton(message: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  return button(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "Escribir por WhatsApp", "#25D366");
}

function orderLink(orderId: string) {
  return button(`${siteUrl()}/pedido/${orderId}/confirmacion`, "Ver mi pedido");
}

interface NewOrderParams {
  orderId: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string | null;
  total: number;
  tecnica: string;
  piezas: number;
  entrega: ShippingInfo | null;
  factura: BillingInfo | null;
  sinDiseno?: boolean;
  piezasSinDiseno?: number;
  disenosDistintos?: number;
}

export async function sendNewOrderEmail(params: NewOrderParams) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!to) return;
  const { subject, html } = buildNewOrderEmail(params);
  await send(to, subject, html);
}

// Aviso al admin: un cliente con el pago rechazado subió un comprobante nuevo.
export async function sendReceiptResubmittedEmail(params: { orderId: string; clienteNombre: string; total: number }) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!to) return;
  const id = shortId(params.orderId);
  await send(
    to,
    `Comprobante nuevo — pedido #${id}`,
    layout(`
      <h2 style="margin:0 0 12px;">Comprobante nuevo para el pedido #${id}</h2>
      <p>${escapeHtml(params.clienteNombre)} subió otra vez su comprobante de <strong>${formatBoth(params.total)}</strong>.
      El pedido volvió a «Pago por verificar».</p>
      <p style="margin:20px 0;">${button(`${siteUrl()}/admin/pedidos/${params.orderId}`, "Revisar el pago en el panel")}</p>`)
  );
}

export function buildNewOrderEmail(params: NewOrderParams) {
  const id = shortId(params.orderId);
  return {
    subject: `Nuevo pedido #${id} — ${formatBoth(params.total)}`,
    html: layout(`
      <h2 style="margin:0 0 12px;">Nuevo pedido #${id}</h2>
      <p style="margin:4px 0;"><strong>Cliente:</strong> ${escapeHtml(params.clienteNombre)}</p>
      <p style="margin:4px 0;"><strong>Teléfono:</strong> ${escapeHtml(params.clienteTelefono)}</p>
      ${params.clienteEmail ? `<p style="margin:4px 0;"><strong>Correo:</strong> ${escapeHtml(params.clienteEmail)}</p>` : ""}
      <p style="margin:4px 0;"><strong>Técnica:</strong> ${TECHNIQUE_LABEL[params.tecnica as Technique] ?? escapeHtml(params.tecnica)} · ${params.piezas} pieza${params.piezas === 1 ? "" : "s"}</p>
      <p style="margin:4px 0;"><strong>Total:</strong> ${formatBoth(params.total)}</p>
      ${params.sinDiseno ? `<p style="margin:4px 0;"><strong>Diseño:</strong> el cliente no subió diseño; pídeselo por WhatsApp.</p>` : ""}
      ${!params.sinDiseno && (params.disenosDistintos ?? 1) > 1 ? `<p style="margin:4px 0;"><strong>Diseños:</strong> ${params.disenosDistintos} diseños distintos (el panel dice qué piezas lleva cada uno).</p>` : ""}
      ${params.piezasSinDiseno ? `<p style="margin:4px 0;"><strong>Sin diseño:</strong> ${params.piezasSinDiseno} pieza${params.piezasSinDiseno === 1 ? "" : "s"}; pregúntale al cliente por WhatsApp.</p>` : ""}
      ${shippingHtml(params.entrega)}
      ${params.factura ? `<p style="margin:4px 0;"><strong>Factura con RUC:</strong> ${escapeHtml(params.factura.razonSocial)} · RUC ${escapeHtml(params.factura.ruc)}</p>` : ""}
      <p style="margin:16px 0;">El cliente adjuntó su comprobante de transferencia. Verifica el pago en el panel.</p>
      ${button(`${siteUrl()}/admin/pedidos/${params.orderId}`, "Ver pedido en el panel")}
    `),
  };
}

interface CustomerParams {
  orderId: string;
  clienteNombre: string;
  clienteEmail: string;
  total: number;
  // Lo que pidió, como en su factura ("Camisa básica — Blanco, talla M · Serigrafía").
  lines?: { description: string; quantity: number }[];
  entrega?: ShippingInfo | null;
}

// Los correos a clientes solo salen con un dominio verificado (EMAIL_FROM);
// sin él Resend los rechaza y los avisos van por WhatsApp desde el panel.
const canEmailCustomers = () => Boolean(process.env.EMAIL_FROM);

export async function sendCustomerConfirmationEmail(params: CustomerParams) {
  if (!canEmailCustomers()) return;
  const { subject, html } = buildCustomerConfirmationEmail(params);
  await send(params.clienteEmail, subject, html);
}

export function buildCustomerConfirmationEmail(params: Omit<CustomerParams, "clienteEmail">) {
  const id = shortId(params.orderId);
  return {
    subject: `Recibimos tu pedido #${id} — Impreza`,
    html: layout(`
      <h2 style="margin:0 0 12px;">¡Gracias por tu pedido, ${escapeHtml(params.clienteNombre)}!</h2>
      <p>Tu pedido <strong>#${id}</strong> por <strong>${formatBoth(params.total)}</strong> está confirmado.
      Recibimos tu comprobante de transferencia y lo estamos verificando.</p>
      <p>Cuando confirmemos el pago te avisamos por este medio. Tu pedido estará listo en
      ${PRODUCTION_BUSINESS_DAYS} días hábiles a partir de ese momento.</p>
      ${orderSummaryHtml(params.lines ?? [], params.total)}
      ${params.entrega?.metodo === "retiro" ? `<p style="margin:4px 0;"><strong>Entrega:</strong> lo recoges en el taller; te avisamos cuando esté listo.</p>` : shippingHtml(params.entrega ?? null)}
      ${thanksHtml()}
      <p style="margin:20px 0;">${orderLink(params.orderId)}</p>
      <p>${whatsappButton(`Hola, soy ${params.clienteNombre}. Tengo una consulta sobre mi pedido #${id}.`)}</p>
    `),
  };
}

export type StatusEmailKind = "pago_verificado" | "pago_rechazado" | "diseno_aprobado" | "en_produccion" | "listo";

interface StatusParams {
  kind: StatusEmailKind;
  orderId: string;
  clienteNombre: string;
  clienteEmail: string;
  total: number;
  createdAt: string;
}

export async function sendStatusUpdateEmail(params: StatusParams) {
  if (!canEmailCustomers()) return;
  const { subject, html } = buildStatusUpdateEmail(params);
  await send(params.clienteEmail, subject, html);
}

export function buildStatusUpdateEmail(params: Omit<StatusParams, "clienteEmail">) {
  const id = shortId(params.orderId);
  const nombre = escapeHtml(params.clienteNombre);
  const content: Record<StatusEmailKind, { subject: string; body: string }> = {
    pago_verificado: {
      subject: `Pago confirmado — pedido #${id}`,
      body: `<h2 style="margin:0 0 12px;">¡Pago confirmado!</h2>
        <p>Hola ${nombre}, verificamos tu transferencia de <strong>${formatBoth(params.total)}</strong> para el pedido
        <strong>#${id}</strong>.</p>
        <p>Tu pedido estará listo aproximadamente el <strong>${formatReadyDate(estimateReadyDate(new Date(params.createdAt)))}</strong>.</p>`,
    },
    pago_rechazado: {
      subject: `No pudimos verificar tu pago — pedido #${id}`,
      body: `<h2 style="margin:0 0 12px;">Necesitamos revisar tu pago</h2>
        <p>Hola ${nombre}, no pudimos verificar la transferencia de <strong>${formatBoth(params.total)}</strong> para tu
        pedido <strong>#${id}</strong>.</p>
        <p>Sube de nuevo tu comprobante (una foto o captura de la transferencia) y lo revisamos otra vez. Si tienes
        dudas, escríbenos por WhatsApp.</p>`,
    },
    diseno_aprobado: {
      subject: `Tu diseño fue aprobado — pedido #${id}`,
      body: `<h2 style="margin:0 0 12px;">¡Diseño aprobado!</h2>
        <p>Hola ${nombre}, revisamos el diseño de tu pedido <strong>#${id}</strong> y está listo para imprimirse.</p>`,
    },
    en_produccion: {
      subject: `Tu pedido está en producción — #${id}`,
      body: `<h2 style="margin:0 0 12px;">Estamos imprimiendo tu pedido</h2>
        <p>Hola ${nombre}, tu pedido <strong>#${id}</strong> ya está en producción. Te avisamos cuando esté listo.</p>`,
    },
    listo: {
      subject: `¡Tu pedido está listo! — #${id}`,
      body: `<h2 style="margin:0 0 12px;">¡Tu pedido está listo!</h2>
        <p>Hola ${nombre}, tu pedido <strong>#${id}</strong> está terminado. Escríbenos por WhatsApp para coordinar la
        entrega o recogida.</p>
        <p>Gracias por confiar en Impreza. Esperamos que lo disfrutes tanto como nosotros disfrutamos hacerlo, y nos
        encantaría verlo puesto: si nos mandas una foto, nos alegras el día.</p>`,
    },
  };
  const { subject, body } = content[params.kind];
  // Con el pago rechazado, el botón lleva directo a subir el comprobante otra vez.
  const primary =
    params.kind === "pago_rechazado"
      ? button(`${siteUrl()}/pedido/${params.orderId}/confirmacion#comprobante`, "Subir mi comprobante de nuevo")
      : orderLink(params.orderId);
  return {
    subject,
    html: layout(`${body}
      <p style="margin:20px 0;">${primary}</p>
      <p>${whatsappButton(`Hola, soy ${params.clienteNombre}. Te escribo por mi pedido #${id}.`)}</p>`),
  };
}

// Agradecimiento al final del correo de "Recibimos tu pedido".
function thanksHtml() {
  return `
    <div style="margin:20px 0;padding:16px;background:#f4f4f4;border-radius:8px;">
      <p style="margin:0;font-weight:bold;">¡Gracias por elegirnos!</p>
      <p style="margin:6px 0 0;">Tu idea ya está en buenas manos. La vamos a revisar con cuidado y a hacerla realidad pieza
      por pieza, como si fuera nuestra. Gracias por confiar en una marca hecha en Nicaragua: cada pedido como el tuyo
      nos impulsa a seguir creciendo.</p>
      <p style="margin:10px 0 0;font-weight:bold;">— Impreza</p>
    </div>`;
}

// Resumen del pedido para el cliente: cada línea y el total.
function orderSummaryHtml(lines: { description: string; quantity: number }[], total: number) {
  if (!lines.length) return "";
  const rows = lines
    .map(
      (l) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;">${l.quantity} × ${escapeHtml(l.description)}</td></tr>`
    )
    .join("");
  return `
    <p style="margin:16px 0 4px;font-weight:bold;">Tu pedido</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}
      <tr><td style="padding:8px 0;font-weight:bold;">Total: ${formatBoth(total)}</td></tr>
    </table>`;
}

function shippingHtml(entrega: ShippingInfo | null) {
  if (!entrega) return "";
  if (entrega.metodo === "retiro") return `<p style="margin:4px 0;"><strong>Entrega:</strong> recoge en el taller</p>`;
  return `
    <div style="margin:12px 0;padding:12px;border:2px solid #111;border-radius:8px;">
      <p style="margin:0 0 4px;"><strong>Entrega a domicilio:</strong> ${escapeHtml(areaLabel(entrega))}</p>
      ${entrega.direccion ? `<p style="margin:0 0 4px;">${escapeHtml(entrega.direccion)}</p>` : ""}
      ${entrega.recibe ? `<p style="margin:0 0 4px;">Recibe: ${escapeHtml(entrega.recibe)}</p>` : ""}
      <a href="${addressMapsUrl(entrega)}" style="color:#111;font-weight:bold;">Abrir en Google Maps</a>
    </div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
