import { OrderStatus, PaymentStatus } from "./types";

export interface NotifyInfo {
  nombre: string;
  telefono: string;
  code: string; // código de 8 caracteres que ve el cliente, p. ej. "CB07F9DB"
  totalText: string;
  readyText: string;
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
      return `Hola ${info.nombre}, no pudimos verificar la transferencia de tu pedido #${info.code} por ${info.totalText}. ¿Nos puedes enviar el comprobante de nuevo o confirmar a qué cuenta transferiste?`;
    case "diseno_aprobado":
      return `Hola ${info.nombre}, ¡aprobamos el diseño de tu pedido #${info.code}! Pronto pasa a producción.${track}`;
    case "en_produccion":
      return `Hola ${info.nombre}, tu pedido #${info.code} ya está en producción. Te avisamos cuando esté listo.${track}`;
    case "listo_entregado":
      return `Hola ${info.nombre}, ¡tu pedido #${info.code} está listo! ¿Cuándo te queda bien para la entrega o recogida?`;
    default:
      return null;
  }
}

export function trackingPath(code: string) {
  return `/seguimiento?codigo=${code}`;
}
