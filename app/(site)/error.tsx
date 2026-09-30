"use client";

import { useEffect } from "react";
import Link from "next/link";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";

// Si una página falla (sin internet, la base de datos no responde...), el cliente
// ve esto en vez de una pantalla en blanco, con el menú y el pie de página.
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center md:px-6">
      <p className="font-display text-7xl leading-none tracking-wide text-ink/10 md:text-8xl">Uy</p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-6xl">Algo salió mal</h1>
      <p className="mx-auto mt-4 max-w-md text-ink-soft">
        No pudimos cargar esta página. Revisa tu conexión e inténtalo de nuevo; si sigue pasando, escríbenos y te ayudamos.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-brand bg-ink px-6 py-3 text-sm font-semibold text-paper hover:opacity-80"
        >
          Intentar de nuevo
        </button>
        <Link href="/" className="rounded-brand border border-ink/20 px-6 py-3 text-sm font-semibold text-ink hover:border-ink">
          Ir al inicio
        </Link>
        <WhatsAppLinkButton
          message={`Hola, una página de Impreza no me cargó${error.digest ? ` (código ${error.digest})` : ""}.`}
          className="rounded-brand bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Escríbenos por WhatsApp
        </WhatsAppLinkButton>
      </div>
    </section>
  );
}
