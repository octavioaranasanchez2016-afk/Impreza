"use client";

import { OrderStatus, PaymentStatus } from "@/lib/types";
import { NotifyInfo, statusWhatsAppMessage, trackingPath } from "@/lib/notifications";
import { clientWhatsAppUrl } from "@/lib/whatsapp";

// Aparece justo después de un cambio de estado: abre el chat del cliente con
// el mensaje ya escrito, el admin solo le da enviar.
export function NotifyButton({ state, info }: { state: OrderStatus | PaymentStatus; info: NotifyInfo }) {
  const message = statusWhatsAppMessage(state, info, `${window.location.origin}${trackingPath(info.code)}`);
  if (!message) return null;
  return (
    <a
      href={clientWhatsAppUrl(info.telefono, message)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center justify-center gap-2 rounded-brand bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
    >
      Avisar a {info.nombre.split(" ")[0]} por WhatsApp
    </a>
  );
}
