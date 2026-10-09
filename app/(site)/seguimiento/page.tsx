import Link from "next/link";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";

export const metadata = {
  title: "Rastrear pedido",
  alternates: { canonical: "/seguimiento" },
  description: "Escribe el código de tu pedido y mira en qué paso va.",
};

export const dynamic = "force-dynamic";

// El código es el inicio del id del pedido (8 caracteres, p. ej. CB07F9DB).
// Como los uuid se ordenan por sus bytes, un rango de ids equivale a "empieza con".
async function findOrderId(code: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("orders")
    .select("id")
    .gte("id", `${code}-0000-0000-0000-000000000000`)
    .lte("id", `${code}-ffff-ffff-ffff-ffffffffffff`)
    .limit(1);
  return data?.[0]?.id ?? null;
}

export default async function SeguimientoPage({ searchParams }: { searchParams: Promise<{ codigo?: string }> }) {
  const { codigo } = await searchParams;
  const raw = (codigo ?? "").trim();
  const code = raw.replace(/[#\s-]/g, "").toLowerCase();
  let error: string | null = null;

  if (raw) {
    if (!/^[0-9a-f]{8}$/.test(code)) {
      error = "El código tiene 8 caracteres, letras de la A a la F y números (por ejemplo CB07F9DB).";
    } else {
      const id = await findOrderId(code);
      if (id) redirect(`/pedido/${id}/confirmacion`);
      error = "No encontramos un pedido con ese código. Revisa que esté bien escrito.";
    }
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-16 md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Seguimiento</p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-6xl">Rastrear pedido</h1>
      <p className="mt-3 text-ink-soft">
        Escribe el código de tu pedido para ver en qué paso va. Lo encuentras en tu factura y en los mensajes que te
        enviamos por WhatsApp.
      </p>

      <form action="/seguimiento" className="mt-8 rounded-brand border border-black/10 bg-white p-5">
        <label htmlFor="codigo" className="text-sm font-medium text-ink">
          Código de pedido
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="codigo"
            name="codigo"
            defaultValue={raw}
            placeholder="Ej. CB07F9DB"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={12}
            className="input font-mono uppercase tracking-widest"
          />
          <button type="submit" className="shrink-0 rounded-brand bg-ink px-5 text-sm font-semibold text-paper hover:opacity-80">
            Buscar
          </button>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
      </form>

      <p className="mt-4 text-sm text-ink-soft">
        ¿Quieres ver todos tus pedidos juntos?{" "}
        <Link href="/cuenta" className="font-semibold text-ink underline">
          Entra a tu cuenta
        </Link>{" "}
        con tu correo (opcional).
      </p>

      <div className="mt-8 rounded-brand bg-paper-soft p-5 text-sm text-ink-soft">
        <p className="font-semibold text-ink">¿No tienes tu código?</p>
        <p className="mt-1">Escríbenos por WhatsApp con tu nombre y te decimos cómo va tu pedido.</p>
        <WhatsAppLinkButton
          message="Hola, quiero saber el estado de mi pedido en Impreza."
          className="mt-3 inline-block rounded-brand bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Escribir por WhatsApp
        </WhatsAppLinkButton>
      </div>
    </section>
  );
}
