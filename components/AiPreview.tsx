"use client";

import { useEffect, useState } from "react";
import { DesignZone, ProductCategory } from "@/lib/types";
import { AI_CONTEXT_MAX, AI_PEOPLE, AI_PHOTOS_PER_DEVICE, AI_SCENES, AiPerson, AiScene } from "@/lib/vista-ia";
import { snapshotMockup } from "@/lib/mockup-snapshot";

// "Verla puesta": una foto de ejemplo, hecha con IA, de alguien usando la prenda con el
// diseño. Solo aparece si el sitio tiene la clave de la IA (GET /api/vista-ia).

type Status = { disponible: boolean; restantes: number | null };

// Si está activada y cuántas fotos le quedan hoy a este dispositivo.
function fetchStatus(): Promise<Status> {
  return fetch("/api/vista-ia")
    .then((r) => (r.ok ? r.json() : {}))
    .then((d: { disponible?: boolean; restantes?: number }) => ({
      disponible: Boolean(d.disponible),
      restantes: typeof d.restantes === "number" ? d.restantes : null,
    }))
    .catch(() => ({ disponible: false, restantes: null }));
}

export function AiPreview({
  category,
  zone,
  getMockup,
}: {
  category: ProductCategory;
  zone: DesignZone;
  // El lienzo del diseñador (la prenda con su diseño) para sacarle la foto plana.
  getMockup: () => HTMLElement | null;
}) {
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState<AiScene>("deportiva");
  const [person, setPerson] = useState<AiPerson>("mujer");
  // Lo que el cliente quiera contar de la escena (opcional).
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El motivo técnico que dio la IA, en letra chica, para poder ayudar si falla.
  const [detail, setDetail] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  // Cuántas fotos le quedan hoy (null mientras no se sabe).
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetchStatus().then((status) => {
      if (!alive) return;
      setAvailable(status.disponible);
      setLeft(status.restantes);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !loading && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading]);

  if (!available || zone === "etiqueta") return null;

  async function create() {
    const mockup = getMockup();
    if (!mockup) return;
    setLoading(true);
    setError(null);
    setDetail(null);
    setPhoto(null);
    try {
      const imagen = await snapshotMockup(mockup);
      const res = await fetch("/api/vista-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen, prenda: category, zona: zone, escena: scene, persona: person, contexto: context }),
      });
      const data = await res.json().catch(() => ({}));
      if (typeof data.restantes === "number") setLeft(data.restantes);
      if (!res.ok || typeof data.imagen !== "string") {
        setDetail(typeof data.detalle === "string" ? data.detalle : null);
        throw new Error(data.error || "No pudimos crear la foto ahora.");
      }
      setPhoto(data.imagen);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la foto ahora.");
    }
    setLoading(false);
  }

  // Al abrir la ventana se pregunta cuántas le quedan (pudo crear otras en otra pestaña).
  function openWindow() {
    setOpen(true);
    fetchStatus().then((status) => status.restantes !== null && setLeft(status.restantes));
  }

  const noneLeft = left === 0;
  const used = left === null ? null : AI_PHOTOS_PER_DEVICE - left;

  return (
    <>
      <button
        type="button"
        onClick={openWindow}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-brand border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
      >
        <SparkIcon /> Verla puesta (foto con IA)
        {used !== null && (
          <span className="text-xs font-medium text-ink-muted">
            · {used}/{AI_PHOTOS_PER_DEVICE} hoy
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Verla puesta"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-brand bg-white p-5 sm:rounded-brand"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl uppercase leading-none tracking-wide text-ink">Así se vería puesta</p>
                <p className="mt-1 text-xs text-ink-muted">Una foto de ejemplo con tu diseño, hecha con inteligencia artificial.</p>
              </div>
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                aria-label="Cerrar"
                className="px-1 text-xl leading-none text-ink-muted hover:text-ink"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">Escena</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {AI_SCENES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  disabled={loading}
                  onClick={() => setScene(s.value)}
                  aria-pressed={scene === s.value}
                  className={`rounded-brand border px-2 py-2 text-left disabled:opacity-50 ${
                    scene === s.value ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                  }`}
                >
                  <span className="block text-sm font-semibold">{s.label}</span>
                  <span className={`block text-[11px] ${scene === s.value ? "text-paper/70" : "text-ink-muted"}`}>{s.hint}</span>
                </button>
              ))}
            </div>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">Quién la usa</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {AI_PEOPLE.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  disabled={loading}
                  onClick={() => setPerson(p.value)}
                  aria-pressed={person === p.value}
                  className={`rounded-brand border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
                    person === p.value ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">Detalles (opcional)</span>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value.slice(0, AI_CONTEXT_MAX))}
                disabled={loading}
                rows={2}
                maxLength={AI_CONTEXT_MAX}
                placeholder="Ej.: en la graduación de mi colegio, con amigos; o jugando fútbol con mi equipo"
                className="input mt-2 resize-none text-sm"
              />
              <span className="mt-1 block text-right text-[11px] text-ink-muted">
                {context.length}/{AI_CONTEXT_MAX}
              </span>
            </label>

            {used !== null && (
              <div className="mt-4">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-ink">
                    Llevas {used} de {AI_PHOTOS_PER_DEVICE} fotos hoy
                  </span>
                  <span className={noneLeft ? "font-semibold text-red-600" : "text-ink-muted"}>
                    {noneLeft ? "Vuelve mañana" : `te quedan ${left}`}
                  </span>
                </div>
                <div className="mt-1.5 flex gap-1" aria-hidden>
                  {Array.from({ length: AI_PHOTOS_PER_DEVICE }, (_, i) => (
                    <span key={i} className={`h-1.5 flex-1 rounded-full ${i < used ? "bg-ink" : "bg-black/10"}`} />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-brand bg-paper-soft">
              {photo ? (
                <img src={photo} alt="Foto de ejemplo de la prenda puesta, hecha con IA" className="h-full w-full object-contain" />
              ) : (
                <p className="px-6 text-center text-sm text-ink-muted">
                  {loading ? "Creando tu foto… puede tardar unos 20 segundos." : "Elige una escena y toca «Crear foto»."}
                </p>
              )}
            </div>

            {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
            {detail && <p className="mt-1 break-words text-[11px] text-ink-muted">Detalle: {detail}</p>}

            {noneLeft && (
              <p className="mt-3 text-center text-xs font-semibold text-red-600">
                Ya usaste tus {AI_PHOTOS_PER_DEVICE} fotos de hoy. Vuelve mañana para crear más.
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={create}
                disabled={loading || noneLeft}
                className="flex-1 rounded-brand bg-ink px-4 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {loading ? "Creando…" : photo ? "Crear otra" : "Crear foto"}
              </button>
              {photo && (
                <a
                  href={photo}
                  download="impreza-vista.png"
                  className="rounded-brand border border-black/15 px-4 py-3 text-sm font-semibold text-ink hover:border-ink"
                >
                  Guardar
                </a>
              )}
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
              Es una imagen de ejemplo: la IA puede cambiar detalles del diseño, de la tela o del color. Lo que se imprime es
              exactamente lo que armaste en el diseñador.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 5.6L19.5 9.5l-5.7 1.9L12 17l-1.8-5.6L4.5 9.5l5.7-1.9z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" opacity="0.7" />
    </svg>
  );
}
