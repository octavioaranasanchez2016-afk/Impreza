"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_COMMENT_LENGTH, MIN_COMMENT_LENGTH } from "@/lib/review-rules";

interface Review {
  id: string;
  nombre: string;
  calificacion: number;
  comentario: string;
  aprobada: boolean;
}

// Aprobar, ocultar, editar o eliminar una reseña desde el panel.
export function ReviewActions({ review }: { review: Review }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(review.nombre);
  const [calificacion, setCalificacion] = useState(review.calificacion);
  const [comentario, setComentario] = useState(review.comentario);
  const [error, setError] = useState<string | null>(null);

  async function call(method: "PATCH" | "DELETE", body?: object) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/resenas/${review.id}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo actualizar la reseña.");
      return false;
    }
    setConfirmDelete(false);
    router.refresh();
    return true;
  }

  async function save() {
    if (await call("PATCH", { nombre, calificacion, comentario })) setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-brand bg-paper-soft p-3">
        <div className="flex gap-1" role="radiogroup" aria-label="Calificación">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={calificacion === n}
              aria-label={`${n} estrella${n === 1 ? "" : "s"}`}
              onClick={() => setCalificacion(n)}
              className={`text-2xl leading-none ${n <= calificacion ? "text-ink" : "text-black/15"}`}
            >
              ★
            </button>
          ))}
        </div>
        <label className="block text-xs">
          <span className="mb-1 block font-medium text-ink-soft">Nombre</span>
          <input id={`nombre-${review.id}`} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} className="input" />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block font-medium text-ink-soft">Comentario</span>
          <textarea
            id={`comentario-${review.id}`}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            className="input min-h-[80px] resize-y"
          />
          <span className="mt-1 block text-ink-muted">
            {comentario.trim().length}/{MAX_COMMENT_LENGTH} · mínimo {MIN_COMMENT_LENGTH}
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={save}
            className="rounded-brand bg-ink px-3 py-1.5 text-xs font-semibold text-paper hover:opacity-80 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setNombre(review.nombre);
              setCalificacion(review.calificacion);
              setComentario(review.comentario);
              setError(null);
            }}
            className="text-xs font-semibold text-ink-soft hover:underline"
          >
            Cancelar
          </button>
        </div>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {review.aprobada ? (
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
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-brand border border-black/15 px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink"
      >
        Editar
      </button>
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
