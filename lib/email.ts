import { Resend } from "resend";
import { formatBoth } from "./currency";

// onboarding@resend.dev funciona sin verificar dominio propio — suficiente
// para empezar. Cuando el taller tenga su propio dominio, se puede cambiar
// a algo como "pedidos@impreza.com" verificándolo en Resend.
const FROM_ADDRESS = "Impreza <onboarding@resend.dev>";

export async function sendNewOrderEmail(params: {
  orderId: string;
  clienteNombre: string;
  clienteTelefono: string;
  total: number;
  tecnica: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;

  // Si no está configurado, simplemente no se envía — nunca debe tumbar la
  // creación del pedido por falta de este servicio opcional.
  if (!apiKey || !to) return;

  const resend = new Resend(apiKey);
  const shortId = params.orderId.slice(0, 8).toUpperCase();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Nuevo pedido #${shortId} — ${formatBoth(params.total)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Nuevo pedido en Impreza</h2>
          <p><strong>Pedido:</strong> #${shortId}</p>
          <p><strong>Cliente:</strong> ${escapeHtml(params.clienteNombre)}</p>
          <p><strong>Teléfono:</strong> ${escapeHtml(params.clienteTelefono)}</p>
          <p><strong>Técnica:</strong> ${escapeHtml(params.tecnica)}</p>
          <p><strong>Total:</strong> ${formatBoth(params.total)}</p>
          <p>El cliente adjuntó su comprobante de transferencia. Verifica el pago en el panel.</p>
          <p style="margin-top: 24px;">
            <a href="${siteUrl}/admin/pedidos/${params.orderId}"
               style="background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
              Ver pedido
            </a>
          </p>
        </div>
      `,
    });
  } catch (err) {
    // No relanzar: un fallo de correo no debe hacer fallar el pedido.
    console.error("No se pudo enviar el correo de notificación:", err);
  }
}

export async function sendCustomerConfirmationEmail(params: {
  orderId: string;
  clienteNombre: string;
  clienteEmail: string;
  total: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const shortId = params.orderId.slice(0, 8).toUpperCase();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const waMessage = encodeURIComponent(
    `Hola, soy ${params.clienteNombre}. Quiero confirmar mi pedido #${shortId} en Impreza.`
  );

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.clienteEmail,
      subject: `Recibimos tu pedido #${shortId} — Impreza`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>¡Gracias por tu pedido, ${escapeHtml(params.clienteNombre)}!</h2>
          <p>Tu pedido <strong>#${shortId}</strong> está confirmado. Recibimos tu comprobante
          de transferencia; vamos a verificar el pago y te escribimos por WhatsApp.</p>
          <p><strong>Total:</strong> ${formatBoth(params.total)}</p>
          <p style="margin-top: 24px;">
            <a href="https://wa.me/${whatsappNumber}?text=${waMessage}"
               style="background:#25D366;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
              Confirmar por WhatsApp
            </a>
          </p>
        </div>
      `,
    });
  } catch (err) {
    // No relanzar: un fallo de correo no debe hacer fallar el pedido.
    console.error("No se pudo enviar el correo de confirmación al cliente:", err);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
