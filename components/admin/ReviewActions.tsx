"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Aprobar, ocultar o eliminar una reseña desde el panel.
export function ReviewActions({ id, aprobada }: { id: string; aprobada: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(method: "PATCH" | "DELETE", body?: object) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/resenas/${id}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo actualizar la reseña.");
      return;
    }
    setConfirmDelete(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {aprobada ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => call("PATCH", { aprobada: false })}
          className="rounded-brand border border-black/15 px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink disabled:opacity-50"
        >
          Ocultar del sitio
        </button>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => call("PATCH", { aprobada: true })}
          className="rounded-brand bg-ink px-3 py-1.5 text-xs font-semibold text-paper hover:opacity-80 disabled:opacity-50"
        >
          Aprobar y publicar
        </button>
      )}
      {confirmDelete ? (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={() => call("DELETE")}
            className="rounded-brand bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Sí, eliminar
          </button>
          <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs font-semibold text-ink-soft hover:underline">
            Cancelar
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs font-semibold text-ink-soft hover:text-red-700 hover:underline">
          Eliminar
        </button>
      )}
      {error && <p className="w-full text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
