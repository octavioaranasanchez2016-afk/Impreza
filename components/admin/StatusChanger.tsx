"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@/lib/types";
import { NotifyInfo } from "@/lib/notifications";
import { STATUS_LABEL } from "@/components/StatusBadge";
import { NotifyButton } from "./NotifyButton";

const ORDER: OrderStatus[] = ["recibido", "diseno_aprobado", "en_produccion", "listo_entregado"];

export function StatusChanger({ orderId, status, notify }: { orderId: string; status: OrderStatus; notify: NotifyInfo }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [changed, setChanged] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentIndex = ORDER.indexOf(current);

  async function updateStatus(next: OrderStatus) {
    if (next === current) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/pedidos/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo actualizar el estado.");
      return;
    }
    setCurrent(next);
    setChanged(next);
    router.refresh();
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Estado del pedido</p>
      <ol className="mt-3 grid grid-cols-4 gap-1.5">
        {ORDER.map((s, i) => {
          const done = i <= currentIndex;
          return (
            <li key={s}>
              <button
                type="button"
                disabled={loading}
                onClick={() => updateStatus(s)}
                className="group flex w-full flex-col items-center gap-1.5 text-center disabled:opacity-50"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    i === currentIndex
                      ? "border-ink bg-ink text-paper"
                      : done
                      ? "border-ink bg-paper-soft text-ink"
                      : "border-black/15 bg-white text-ink-muted group-hover:border-ink"
                  }`}
                >
                  {done && i !== currentIndex ? "✓" : i + 1}
                </span>
                <span className={`text-[11px] leading-tight ${i === currentIndex ? "font-semibold text-ink" : "text-ink-soft"}`}>
                  {STATUS_LABEL[s]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {changed && <NotifyButton state={changed} info={notify} />}
    </div>
  );
}
