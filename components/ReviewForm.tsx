"use client";

import { useState } from "react";
import { MAX_COMMENT_LENGTH, MIN_COMMENT_LENGTH } from "@/lib/review-rules";

// Formulario para que el cliente califique su pedido ya listo o entregado.
export function ReviewForm({ orderId, defaultName }: { orderId: string; defaultName: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [nombre, setNombre] = useState(defaultName);
  const [comentario, setComentario] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const missing = [
    rating === 0 && "elige de 1 a 5 estrellas",
    nombre.trim().length < 2 && "escribe tu nombre",
    comentario.trim().length < MIN_COMMENT_LENGTH && `escribe un comentario de al menos ${MIN_COMMENT_LENGTH} letras`,
  ].filter(Boolean) as string[];
  const canSend = missing.length === 0 && !sending;

  async function send() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/resenas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, nombre, calificacion: rating, comentario }),
    });
    setSending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "No pudimos guardar tu reseña.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-brand border-2 border-ink bg-white p-5 text-center">
        <p className="font-display text-3xl uppercase tracking-wide text-ink">¡Gracias por tu reseña!</p>
        <p className="mt-1 text-sm text-ink-soft">La publicaremos en el sitio después de revisarla.</p>
      </div>
    );
  }

  const shown = hover || rating;
  return (
    <div className="rounded-brand border-2 border-ink bg-white p-5">
      <p className="font-display text-3xl uppercase tracking-wide text-ink">¿Qué te pareció tu pedido?</p>
      <p className="mt-1 text-sm text-ink-soft">Tu opinión ayuda a otros clientes a confiar en Impreza.</p>

      <div className="mt-4 flex gap-1" role="radiogroup" aria-label="Calificación" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} estrella${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            className={`text-4xl leading-none transition-transform hover:scale-110 ${n <= shown ? "text-ink" : "text-black/15"}`}
          >
            ★
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink-soft">Tu nombre</span>
          <input id="resena-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} className="input" />
          <span className="mt-1 block text-xs text-ink-muted">En el sitio solo se muestra tu nombre y la inicial de tu apellido.</span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink-soft">Tu comentario</span>
          <textarea
            id="resena-comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            placeholder="¿Cómo quedó la impresión? ¿Llegó a tiempo? ¿Nos recomendarías?"
            className="input min-h-[96px] resize-y"
          />
          <span className="mt-1 block text-right text-xs text-ink-muted">
            {comentario.trim().length}/{MAX_COMMENT_LENGTH}
          </span>
        </label>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
      <button
        type="button"
        onClick={send}
        disabled={!canSend}
        className="mt-4 w-full rounded-brand bg-ink px-5 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {sending ? "Enviando..." : "Enviar reseña"}
      </button>
      {missing.length > 0 && (
        <p className="mt-2 text-center text-xs text-ink-soft">Para enviar tu reseña: {missing.join(", ")}.</p>
      )}
    </div>
  );
}
