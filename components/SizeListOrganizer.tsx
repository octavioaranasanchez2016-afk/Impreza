"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { shareWhatsAppUrl } from "@/lib/whatsapp";

interface Entry {
  id: string;
  nombre: string;
  talla: string;
  cantidad: number;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copia el enlace:", text);
        }
      }}
      className="rounded-brand border border-black/15 bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-ink"
    >
      {copied ? "¡Copiado!" : label}
    </button>
  );
}

// Lo que ve el organizador: cuántos hay de cada talla, a quién quitar, cómo
// compartir la lista y el botón que pasa todo al diseñador.
export function SizeListOrganizer({
  listId,
  clave,
  listName,
  sizes,
  entries,
  closed,
  orderHref,
  baseUrl,
}: {
  listId: string;
  clave: string;
  listName: string;
  sizes: string[];
  entries: Entry[];
  closed: boolean;
  orderHref: string;
  baseUrl: string; // dirección oficial del sitio, para que el enlace compartido sea el bueno
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const shareUrl = `${baseUrl}/lista-de-tallas/${listId}`;
  const organizerUrl = `${shareUrl}?clave=${encodeURIComponent(clave)}`;

  const counts = new Map<string, number>(sizes.map((s) => [s, 0]));
  for (const e of entries) counts.set(e.talla, (counts.get(e.talla) ?? 0) + e.cantidad);
  const total = entries.reduce((sum, e) => sum + e.cantidad, 0);

  async function call(method: "PATCH" | "DELETE", url: string, body: object) {
    setError(null);
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo guardar.");
      return;
    }
    setConfirming(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-brand bg-ink p-5 text-paper">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-paper/60">Llevan anotadas</p>
            <p className="font-display text-5xl leading-none tracking-wide">
              {total} pieza{total === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-xs text-paper/60">
              {entries.length} persona{entries.length === 1 ? "" : "s"}
              {closed ? " · lista cerrada" : ""}
            </p>
          </div>
          {total > 0 && orderHref && (
            <Link
              href={orderHref}
              className="rounded-brand bg-paper px-5 py-3 text-sm font-semibold text-ink hover:opacity-90"
            >
              Armar el pedido con estas tallas →
            </Link>
          )}
        </div>
        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {[...counts].map(([talla, n]) => (
            <div key={talla} className="rounded-brand bg-paper/10 py-2 text-center">
              <p className="text-[11px] text-paper/60">{talla}</p>
              <p className="text-lg font-bold">{n}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-brand border border-black/10 bg-white p-5">
        <p className="font-semibold text-ink">Comparte la lista con tu grupo</p>
        <p className="mt-1 text-xs text-ink-soft">Cada quien abre el enlace, escribe su nombre y elige su talla. No necesitan cuenta.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={shareWhatsAppUrl(`Anota tu talla para «${listName}» aquí, solo toma un minuto: ${shareUrl}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-brand bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Enviar por WhatsApp
          </a>
          <CopyButton text={shareUrl} label="Copiar enlace" />
        </div>
        <div className="mt-4 rounded-brand bg-paper-soft p-3 text-xs text-ink-soft">
          <span className="font-semibold text-ink">Guarda tu enlace de organizador:</span> con él vuelves a ver y manejar la
          lista desde cualquier teléfono. No lo compartas con el grupo.
          <div className="mt-2">
            <CopyButton text={organizerUrl} label="Copiar mi enlace de organizador" />
          </div>
        </div>
      </div>

      {error && <p className="rounded-brand bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="rounded-brand border border-black/10 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-ink">Quiénes se anotaron</p>
          <button
            type="button"
            onClick={() => call("PATCH", `/api/listas/${listId}`, { clave, cerrada: !closed })}
            className="rounded-brand border border-black/15 px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink"
          >
            {closed ? "Volver a abrir la lista" : "Cerrar la lista"}
          </button>
        </div>
        {entries.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Todavía nadie. Comparte el enlace y aquí van a ir apareciendo.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate text-ink">{e.nombre}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold text-ink">
                    {e.talla}
                    {e.cantidad > 1 ? ` × ${e.cantidad}` : ""}
                  </span>
                  {confirming === e.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => call("DELETE", `/api/listas/${listId}/personas`, { personaId: e.id, clave })}
                        className="rounded bg-red-600 px-2 py-1 text-[11px] font-semibold text-white"
                      >
                        Sí, quitar
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} className="text-[11px] text-ink-soft">
                        No
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setConfirming(e.id)} className="text-xs font-semibold text-red-700 hover:underline">
                      Quitar
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
