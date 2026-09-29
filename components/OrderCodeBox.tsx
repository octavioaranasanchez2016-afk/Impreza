"use client";

import { useState } from "react";

// El código del pedido, para que el cliente lo escriba en el concepto de su
// transferencia y el taller pueda cuadrar cada pago con su pedido.
export function OrderCodeBox({ code }: { code: string | null }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el código sigue visible para copiarlo a mano.
    }
  }

  return (
    <div className="rounded-brand border-2 border-ink p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">Concepto de tu transferencia</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <span className="font-mono text-3xl font-bold tracking-widest text-ink">{code ?? "········"}</span>
        <button
          type="button"
          onClick={copy}
          disabled={!code}
          className="rounded border border-black/15 bg-white px-3 py-1 text-xs font-semibold text-ink hover:border-ink disabled:opacity-40"
        >
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        Escribe este código en el concepto o descripción de tu transferencia: así identificamos tu pago más rápido. Es
        también el código para rastrear tu pedido.
      </p>
    </div>
  );
}
