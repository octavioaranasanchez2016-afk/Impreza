"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentStatus } from "@/lib/types";

const OPTIONS: { value: PaymentStatus; label: string; active: string }[] = [
  { value: "en_revision", label: "Por verificar", active: "border-ink bg-ink text-paper" },
  { value: "pagado", label: "✓ Verificado", active: "border-green-700 bg-green-700 text-white" },
  { value: "fallido", label: "✕ Rechazado", active: "border-red-700 bg-red-700 text-white" },
];

export function PaymentStatusChanger({ orderId, status }: { orderId: string; status: PaymentStatus }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function update(next: PaymentStatus) {
    if (next === current) return;
    setLoading(true);
    setError(null);
    setNotice(null);
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
    const data = await res.json().catch(() => ({}));
    if (data.emailSent) setNotice("✓ Se le envió un correo al cliente.");
    setCurrent(next);
    router.refresh();
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">¿Llegó la transferencia?</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={loading}
            onClick={() => update(o.value)}
            className={`rounded-brand border px-2 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
              current === o.value ? o.active : "border-black/15 bg-white text-ink hover:border-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-2 text-sm text-green-700">{notice}</p>}
    </div>
  );
}
