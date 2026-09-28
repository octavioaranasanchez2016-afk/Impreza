const STYLES: Record<string, string> = {
  pendiente: "bg-black/5 text-ink-soft",
  en_revision: "bg-yellow-100 text-yellow-800",
  pagado: "bg-green-100 text-green-700",
  fallido: "bg-red-100 text-red-700",
};

export const PAYMENT_LABEL: Record<string, string> = {
  pendiente: "Sin comprobante",
  en_revision: "Pago por verificar",
  pagado: "Pagado",
  fallido: "Pago rechazado",
};

export function PaymentBadge({ status }: { status: string }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${STYLES[status] ?? ""}`}>
      {PAYMENT_LABEL[status] ?? status}
    </span>
  );
}
