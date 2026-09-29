"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Archiva uno o varios pedidos completados (o los saca del archivo).
export function ArchiveButton({
  ids,
  archivar,
  label,
  className,
}: {
  ids: string[];
  archivar: boolean;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/pedidos/archivar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, archivar }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "No se pudo actualizar el pedido.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="print:hidden">
      <button
        type="button"
        onClick={run}
        disabled={loading || ids.length === 0}
        className={
          className ??
          "rounded-brand border border-black/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-50"
        }
      >
        {loading ? "Guardando..." : label}
      </button>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
