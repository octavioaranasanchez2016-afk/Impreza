"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_COMMENT_LENGTH, MIN_COMMENT_LENGTH } from "@/lib/review-rules";

// Formulario del panel para publicar la reseña que un cliente te dio en persona o por WhatsApp.
export function AddReviewForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState("");
  const [codigo, setCodigo] = useState("");
  const [publicar, setPublicar] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const canSave = nombre.trim().length >= 2 && comentario.trim().length >= MIN_COMMENT_LENGTH && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/resenas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, calificacion, comentario, codigo, aprobada: publicar }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "No se pudo guardar la reseña.");
      return;
    }
    setNombre("");
    setCalificacion(5);
    setComentario("");
    setCodigo("");
    setOpen(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-brand bg-ink px-4 py-2 text-sm font-semibold text-paper hover:opacity-80"
        >
          + Agregar reseña
        </button>
        {saved && <span className="text-sm font-medium text-green-700">Reseña guardada.</span>}
      </div>
    );
  }

  return (
    <div className="rounded-brand border-2 border-ink bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-ink">Agregar reseña</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-ink-soft hover:underline">
          Cerrar
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        Publica lo que te dijo un cliente real, por WhatsApp o en persona. Si pones el código de su pedido, la reseña sale
        como «Compra verificada».
      </p>

      <div className="mt-4 flex gap-1" role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={calificacion === n}
            aria-label={`${n} estrella${n === 1 ? "" : "s"}`}
            onClick={() => setCalificacion(n)}
            className={`text-3xl leading-none ${n <= calificacion ? "text-ink" : "text-black/15"}`}
          >
            ★
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink-soft">Nombre del cliente *</span>
          <input
            id="nueva-resena-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={60}
            className="input"
            placeholder="Ej. Sofía Martínez"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink-soft">Código del pedido (opcional)</span>
          <input
            id="nueva-resena-codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            maxLength={12}
            className="input font-mono uppercase"
            placeholder="Ej. CB07F9DB"
          />
        </label>
      </div>
      <label className="mt-3 block text-sm">
        <span className="mb-1 block font-medium text-ink-soft">Comentario *</span>
        <textarea
          id="nueva-resena-comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          className="input min-h-[90px] resize-y"
          placeholder="Lo que dijo el cliente sobre su pedido"
        />
        <span className="mt-1 block text-right text-xs text-ink-muted">
          {comentario.trim().length}/{MAX_COMMENT_LENGTH} · mínimo {MIN_COMMENT_LENGTH}
        </span>
      </label>
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input
          id="nueva-resena-publicar"
          type="checkbox"
          checked={publicar}
          onChange={(e) => setPublicar(e.target.checked)}
          className="h-4 w-4 accent-ink"
        />
        Publicar en el sitio de una vez
      </label>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={!canSave}
        className="mt-4 rounded-brand bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Guardando..." : "Guardar reseña"}
      </button>
    </div>
  );
}
