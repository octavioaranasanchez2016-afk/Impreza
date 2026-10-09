"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

// Verificación en dos pasos del panel: además de la contraseña, un código de 6 números
// de una app del celular (Google Authenticator, Microsoft Authenticator…) que cambia
// cada 30 segundos. "configurar": la primera vez (código QR); "entrar": las demás.
export function AdminTwoFactor({ mode, nombre }: { mode: "configurar" | "entrar"; nombre: string }) {
  const router = useRouter();
  const [setup, setSetup] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (mode !== "configurar" || started.current) return;
    started.current = true;
    (async () => {
      const supabase = createClient();
      // Si quedó una configuración a medias (se cerró la página), se borra para empezar limpia.
      const { data: list } = await supabase.auth.mfa.listFactors();
      for (const factor of list?.all ?? []) {
        if (factor.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Impreza ${new Date().toISOString().slice(0, 10)}`,
      });
      if (enrollError || !data) {
        setError(
          enrollError?.code === "mfa_totp_enroll_not_enabled"
            ? "En Supabase falta activar la app de autenticación: Authentication → Multi-Factor → TOTP (App Authenticator) → Enabled."
            : "No se pudo preparar el código. Recarga la página."
        );
        return;
      }
      setSetup({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    })();
  }, [mode]);

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    let factorId = setup?.factorId;
    if (!factorId) {
      const { data } = await supabase.auth.mfa.listFactors();
      factorId = data?.totp[0]?.id;
    }
    if (!factorId) {
      setBusy(false);
      setError("No encontramos tu app configurada. Recarga la página.");
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (verifyError) {
      setBusy(false);
      setCode("");
      setError("Ese código no es correcto o ya cambió. Escribe el que aparece ahora en la app.");
      return;
    }
    router.replace("/admin/pedidos");
    router.refresh();
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <form onSubmit={verify} className="w-full max-w-sm rounded-brand bg-white p-8 shadow-lg">
        <Logo className="text-[26px]" />

        {mode === "configurar" ? (
          <>
            <h1 className="mt-6 text-xl font-bold text-ink">Protege tu panel{nombre ? `, ${nombre}` : ""}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Desde ahora entras con tu contraseña y un código de tu celular. Aunque alguien sepa tu contraseña, sin tu
              celular no puede entrar.
            </p>
            <ol className="mt-4 space-y-2 text-sm text-ink">
              <li>
                <span className="font-semibold">1.</span> Instala <span className="font-semibold">Google Authenticator</span> o{" "}
                <span className="font-semibold">Microsoft Authenticator</span> (gratis).
              </li>
              <li>
                <span className="font-semibold">2.</span> En la app toca <span className="font-semibold">+</span> y escanea
                este código:
              </li>
            </ol>
            <div className="mt-3 flex justify-center rounded-brand border border-black/10 bg-white p-3">
              {setup ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={setup.qr} alt="Código QR para la app de autenticación" className="h-44 w-44" />
              ) : (
                <p className="flex h-44 items-center text-sm text-ink-soft">{error ? "—" : "Preparando…"}</p>
              )}
            </div>
            {setup && (
              <div className="mt-3 rounded-brand bg-paper-soft p-3 text-xs text-ink-soft">
                <p>¿No puedes escanear? En la app elige «Ingresar clave» y escribe:</p>
                <p className="mt-1 break-all font-mono text-sm font-bold tracking-wider text-ink">{setup.secret}</p>
                <p className="mt-1">
                  Guarda esta clave en un lugar seguro (en papel): si pierdes el celular, con ella pones el código en otro.
                </p>
              </div>
            )}
            <p className="mt-4 text-sm text-ink">
              <span className="font-semibold">3.</span> Escribe el código de 6 números que te muestra la app:
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-xl font-bold text-ink">Código del celular</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Abre tu app de autenticación y escribe el código de 6 números de Impreza.
            </p>
          </>
        )}

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus={mode === "entrar"}
          placeholder="123456"
          aria-label="Código de 6 números"
          className="input mt-3 text-center font-mono text-2xl tracking-[0.4em]"
        />

        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy || code.length !== 6 || (mode === "configurar" && !setup)}
          className="mt-4 w-full rounded-brand bg-ink px-4 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {busy ? "Revisando…" : mode === "configurar" ? "Activar y entrar" : "Entrar al panel"}
        </button>

        <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs">
          <button type="button" onClick={signOut} className="font-semibold text-ink-soft hover:text-ink hover:underline">
            Cerrar sesión
          </button>
          {mode === "entrar" && (
            <span className="text-ink-muted">¿Perdiste el celular? Usa la clave que guardaste.</span>
          )}
        </div>
      </form>
    </div>
  );
}
