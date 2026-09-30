import { OrderStatus, PaymentStatus } from "./types";
import { ShippingInfo, WORKSHOP, areaLabel } from "./shipping";

export interface NotifyInfo {
  nombre: string;
  telefono: string;
  code: string; // código de 8 caracteres que ve el cliente, p. ej. "CB07F9DB"
  totalText: string;
  readyText: string;
  entrega: ShippingInfo | null;
}

function readyMessage(info: NotifyInfo, trackUrl: string): string {
  const review = `

Cuando lo recibas, nos ayudas mucho contándonos qué te pareció aquí: ${trackUrl}`;
  const intro = `Hola ${info.nombre}, ¡tu pedido #${info.code} está listo!`;
  if (info.entrega?.metodo === "domicilio") {
    return `${intro} Lo llevamos a tu dirección en ${areaLabel(info.entrega)}. ¿En qué horario te queda bien recibirlo?${review}`;
  }
  if (info.entrega?.metodo === "retiro") {
    return `${intro} Puedes recogerlo en ${WORKSHOP.name} (${WORKSHOP.hours}). Ubicación: ${WORKSHOP.mapsUrl}${review}`;
  }
  return `${intro} ¿Cuándo te queda bien para la entrega o recogida?${review}`;
}

// Mensaje de WhatsApp que el admin le manda al cliente al cambiar el estado.
// null = ese estado no amerita aviso (p. ej. volver a "por verificar").
export function statusWhatsAppMessage(
  state: OrderStatus | PaymentStatus,
  info: NotifyInfo,
  trackUrl: string
): string | null {
  const track = `\n\nPuedes ver el estado de tu pedido aquí: ${trackUrl}`;
  switch (state) {
    case "pagado":
      return `Hola ${info.nombre}, ¡confirmamos tu pago del pedido #${info.code}! Estará listo aproximadamente el ${info.readyText}.${track}`;
    case "fallido":
      return `Hola ${info.nombre}, no pudimos verificar la transferencia de tu pedido #${info.code} por ${info.totalText}. Puedes subir el comprobante de nuevo aquí: ${trackUrl}\n\nO confírmanos a qué cuenta transferiste.`;
    case "diseno_aprobado":
      return `Hola ${info.nombre}, ¡aprobamos el diseño de tu pedido #${info.code}! Pronto pasa a producción.${track}`;
    case "en_produccion":
      return `Hola ${info.nombre}, tu pedido #${info.code} ya está en producción. Te avisamos cuando esté listo.${track}`;
    case "listo_entregado":
      return readyMessage(info, trackUrl);
    default:
      return null;
  }
}

export function trackingPath(code: string) {
  return `/seguimiento?codigo=${code}`;
}
