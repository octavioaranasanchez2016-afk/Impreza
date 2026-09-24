"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/components/StatusBadge";

const ORDER: OrderStatus[] = ["recibido", "diseno_aprobado", "en_produccion", "listo_entregado"];

export function StatusChanger({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(next: OrderStatus) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/pedidos/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      setError("No se pudo actualizar el estado.");
      setLoading(false);
      return;
    }

    setCurrent(next);
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Estado del pedido</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ORDER.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading}
            onClick={() => updateStatus(s)}
            className={`rounded-brand border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              current === s
                ? "border-ink bg-ink text-paper"
                : "border-black/15 text-ink hover:border-ink"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
