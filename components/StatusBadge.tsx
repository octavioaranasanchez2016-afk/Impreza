import { OrderStatus } from "@/lib/types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  recibido: "Recibido",
  diseno_aprobado: "Diseño aprobado",
  en_produccion: "En producción",
  listo_entregado: "Listo / entregado",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  recibido: "bg-black/5 text-ink-soft",
  diseno_aprobado: "bg-black/10 text-ink",
  en_produccion: "bg-ink text-paper",
  listo_entregado: "bg-green-100 text-green-700",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
