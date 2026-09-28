"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentStatus } from "@/lib/types";

const OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "en_revision", label: "En revisión" },
  { value: "pagado", label: "Pago verificado" },
  { value: "fallido", label: "Pago rechazado" },
];

export function PaymentStatusChanger({ orderId, status }: { orderId: string; status: PaymentStatus }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(next: PaymentStatus) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/pedidos/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: next }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo actualizar el pago.");
      return;
    }
    setCurrent(next);
    router.refresh();
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Pago</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={loading}
            onClick={() => update(o.value)}
            className={`rounded-brand border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              current === o.value ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
