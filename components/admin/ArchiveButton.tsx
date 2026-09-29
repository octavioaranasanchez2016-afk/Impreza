"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Archiva pedidos completados, descarta pedidos malos o los restaura.
// Con `confirmText`, pide confirmar antes (para descartar).
export function ArchiveButton({
  ids,
  accion,
  label,
  className,
  confirmText,
}: {
  ids: string[];
  accion: "archivar" | "descartar" | "restaurar";
  label: string;
  className?: string;
  confirmText?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/pedidos/archivar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, accion }),
    });
    setLoading(false);
    setConfirming(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "No se pudo actualizar el pedido.");
      return;
    }
    router.refresh();
  }

  const buttonClass =
    className ??
    "rounded-brand border border-black/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-50";

  return (
    <div className="print:hidden">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink">{confirmText}</span>
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="rounded-brand bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Sí, continuar"}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="text-sm font-semibold text-ink-soft hover:underline">
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (confirmText ? setConfirming(true) : run())}
          disabled={loading || ids.length === 0}
          className={buttonClass}
        >
          {loading ? "Guardando..." : label}
        </button>
      )}
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
