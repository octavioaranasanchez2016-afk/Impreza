"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountData, fetchAccount, safeReturnPath } from "@/lib/account-client";
import { formatCordobas } from "@/lib/currency";
import { PaymentStatus } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { useHoneypot } from "./Honeypot";

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pendiente: "Pago pendiente",
  en_revision: "Pago en revisión",
  pagado: "Pago verificado",
  fallido: "Pago con problema",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-NI", { day: "numeric", month: "short", year: "numeric" });

// "Mi cuenta": entrar con un código que llega al correo, y ver los pedidos de ese correo.
export function AccountPanel() {
  const router = useRouter();
  const volver = safeReturnPath(useSearchParams().get("volver"));
  const [account, setAccount] = useState<AccountData | null | undefined>(undefined); // undefined: cargando
  const [step, setStep] = useState<"correo" | "codigo">("correo");
  const [email, setEmail] = useState("");
  const { hp, honeypot } = useHoneypot();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    fetchAccount().then(setAccount);
  }, []);

  async function post(url: string, body?: unknown): Promise<string | null> {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) return null;
      const data = await res.json().catch(() => ({}));
      return data.error || "Algo salió mal. Intenta de nuevo.";
    } catch {
      return "No hay conexión. Revisa tu internet e intenta de nuevo.";
    }
  }

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    const err = await post("/api/cuenta/codigo", { email, impreza_hp: hp });
    setBusy(false);
    if (err) return setError(err);
    setResent(step === "codigo");
    setStep("codigo");
    setCode("");
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await post("/api/cuenta/entrar", { email, code });
    if (err) {
      setBusy(false);
      return setError(err);
    }
    if (volver) {
      router.push(volver);
      return;
    }
    setAccount(await fetchAccount());
    setBusy(false);
  }

  async function signOut() {
    setBusy(true);
    await post("/api/cuenta/salir");
    setAccount(null);
    setStep("correo");
    setCode("");
    setBusy(false);
  }

  if (account === undefined) {
    return (
      <>
        <Title>Mi cuenta</Title>
        <p className="mt-8 text-sm text-ink-soft">Cargando…</p>
      </>
    );
  }

  if (!account) {
    return (
      <>
        <Title>Entra a tu cuenta</Title>
        <p className="mt-3 text-ink-soft">
          Con tu cuenta ves todos tus pedidos y en qué paso va cada uno, en un solo lugar. Es opcional: para pedir no
          necesitas cuenta.
        </p>

        <div className="mt-8 rounded-brand border border-black/10 bg-white p-5">
          {step === "correo" ? (
            <form onSubmit={sendCode}>
              {honeypot}
              <label htmlFor="cuenta-correo" className="text-sm font-medium text-ink">
                Tu correo
              </label>
              <input
                id="cuenta-correo"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                inputMode="email"
                required
                className="input mt-2"
              />
              <button
                type="submit"
                disabled={busy}
                className="mt-3 w-full rounded-brand bg-ink px-5 py-3 text-sm font-semibold text-paper hover:opacity-80 disabled:opacity-50"
              >
                {busy ? "Enviando…" : "Enviarme el código"}
              </button>
              <p className="mt-2 text-xs text-ink-muted">
                Te mandamos un código de 6 números para entrar. No hay contraseñas que recordar.
              </p>
            </form>
          ) : (
            <form onSubmit={verify}>
              <p className="text-sm text-ink">
                {resent ? "Te enviamos otro código" : "Te enviamos un código"} a <span className="font-semibold">{email}</span>.
                <span className="block text-xs text-ink-soft">Si no lo ves en un minuto, revisa Spam o Promociones.</span>
              </p>
              <label htmlFor="cuenta-codigo" className="mt-4 block text-sm font-medium text-ink">
                Código
              </label>
              <input
                id="cuenta-codigo"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="123456"
                autoComplete="one-time-code"
                inputMode="numeric"
                autoFocus
                className="input mt-2 text-center font-mono text-2xl tracking-[0.4em]"
              />
              <button
                type="submit"
                disabled={busy || code.length < 6}
                className="mt-3 w-full rounded-brand bg-ink px-5 py-3 text-sm font-semibold text-paper hover:opacity-80 disabled:opacity-50"
              >
                {busy ? "Entrando…" : "Entrar"}
              </button>
              <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("correo");
                    setError(null);
                  }}
                  className="font-semibold text-ink-soft hover:text-ink hover:underline"
                >
                  Cambiar correo
                </button>
                <button
                  type="button"
                  onClick={() => sendCode()}
                  disabled={busy}
                  className="font-semibold text-ink hover:underline disabled:opacity-50"
                >
                  Enviar otro código
                </button>
              </div>
            </form>
          )}
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        </div>

        <p className="mt-6 text-sm text-ink-soft">
          ¿Solo quieres ver un pedido?{" "}
          <Link href="/seguimiento" className="font-semibold text-ink underline">
            Rastréalo con su código
          </Link>
          .
        </p>
      </>
    );
  }

  return (
    <>
      <Title>Tus pedidos</Title>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
        <p>
          Entraste como <span className="font-semibold text-ink">{account.email}</span>
        </p>
        <button type="button" onClick={signOut} disabled={busy} className="text-xs font-semibold text-ink hover:underline">
          Salir
        </button>
      </div>

      {account.pedidos.length === 0 ? (
        <div className="mt-8 rounded-brand border border-black/10 bg-white p-5 text-sm text-ink-soft">
          <p className="font-semibold text-ink">Todavía no hay pedidos con este correo.</p>
          <p className="mt-1">
            Los que hagas con tu cuenta abierta aparecen aquí solos. Si hiciste uno sin correo, ábrelo con su código en
            Rastrear pedido y toca «Guardar en mi cuenta».
          </p>
          <Link
            href="/pedido"
            className="mt-4 inline-block rounded-brand bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-80"
          >
            Hacer un pedido
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {account.pedidos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/pedido/${p.id}/confirmacion`}
                className="block rounded-brand border border-black/10 bg-white p-4 transition-colors hover:border-ink"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold tracking-widest text-ink">#{p.codigo}</p>
                    <p className="text-xs text-ink-muted">{formatDate(p.fecha)}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-2 truncate text-sm text-ink">
                  {p.resumen || "Pedido"} · {p.piezas} pieza{p.piezas === 1 ? "" : "s"}
                </p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-ink-soft">
                    <span className="font-semibold text-ink">{formatCordobas(p.total)}</span> ·{" "}
                    <span className={p.pago === "fallido" ? "font-semibold text-red-600" : ""}>{PAYMENT_LABEL[p.pago]}</span>
                  </span>
                  <span className="font-semibold text-ink">Ver pedido →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-6xl">{children}</h1>
  );
}
