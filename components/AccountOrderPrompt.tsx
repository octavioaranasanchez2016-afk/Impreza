"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AccountData, fetchAccount } from "@/lib/account-client";

// En la página de un pedido: invita (sin obligar) a entrar a la cuenta para ver todos
// los pedidos juntos, o guarda en la cuenta un pedido que se hizo sin correo.
export function AccountOrderPrompt({ orderId, hasEmail }: { orderId: string; hasEmail: boolean }) {
  const [account, setAccount] = useState<AccountData | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccount().then(setAccount);
  }, []);

  if (account === undefined) return null;

  const box = "mt-4 rounded-brand bg-paper-soft px-4 py-3 text-sm text-ink-soft";

  if (!account) {
    return (
      <p className={box}>
        {hasEmail ? "Mira este y todos tus pedidos en un solo lugar: " : "¿Quieres tener tus pedidos en un solo lugar? "}
        <Link
          href={`/cuenta?volver=${encodeURIComponent(`/pedido/${orderId}/confirmacion`)}`}
          className="font-semibold text-ink underline"
        >
          entra a tu cuenta con tu correo
        </Link>{" "}
        (opcional).
      </p>
    );
  }

  if (saved || account.pedidos.some((p) => p.id === orderId)) {
    return (
      <p className={box}>
        <span className="font-semibold text-ink">✓ Este pedido está en tu cuenta.</span>{" "}
        <Link href="/cuenta" className="font-semibold text-ink underline">
          Ver mis pedidos
        </Link>
      </p>
    );
  }

  // De otro correo: no se toca.
  if (hasEmail) return null;

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/cuenta/pedidos/${orderId}`, { method: "POST" }).catch(() => null);
    setBusy(false);
    if (res?.ok) setSaved(true);
    else setError((await res?.json().catch(() => null))?.error ?? "No se pudo guardar. Intenta de nuevo.");
  }

  return (
    <div className={`${box} flex flex-wrap items-center justify-between gap-3`}>
      <p>
        Este pedido se hizo sin correo. Guárdalo en tu cuenta y te avisamos ahí cómo va.
        {error && <span className="mt-1 block font-medium text-red-600">{error}</span>}
      </p>
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="shrink-0 rounded-brand bg-ink px-4 py-2 text-xs font-semibold text-paper hover:opacity-80 disabled:opacity-50"
      >
        {busy ? "Guardando…" : "Guardar en mi cuenta"}
      </button>
    </div>
  );
}
