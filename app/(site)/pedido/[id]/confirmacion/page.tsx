import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";
import { formatCordobas } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function ConfirmacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, cliente_nombre, total, payment_method, status")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const shortId = order.id.slice(0, 8).toUpperCase();
  const message = `Hola, soy ${order.cliente_nombre}. Acabo de hacer el pedido #${shortId} en Impreza por un total de ${formatCordobas(
    Number(order.total)
  )}. Quiero confirmar los detalles.`;

  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center md:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink text-3xl text-paper">
        ✓
      </div>
      <h1 className="mt-6 text-3xl font-bold text-ink">¡Pedido recibido!</h1>
      <p className="mt-2 text-ink-soft">
        Tu pedido <span className="font-semibold text-ink">#{shortId}</span> está en revisión.
        Nuestro equipo va a confirmar el diseño y coordinar el pago contigo.
      </p>

      <div className="mt-6 rounded-brand border border-black/10 bg-white p-6 text-left">
        <Row label="Total" value={formatCordobas(Number(order.total))} />
        <Row label="Forma de pago" value={paymentLabel(order.payment_method)} />
        <Row label="Estado" value="Recibido" />
      </div>

      <WhatsAppLinkButton
        message={message}
        className="mt-8 inline-block rounded-brand bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
      >
        Confirmar por WhatsApp
      </WhatsAppLinkButton>

      <div className="mt-4">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-black/5 py-2 text-sm last:border-0">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function paymentLabel(method: string) {
  const map: Record<string, string> = {
    contra_entrega: "Pago contra entrega",
    transferencia: "Transferencia bancaria",
    whatsapp: "Coordinar por WhatsApp",
    en_linea: "Pago en línea",
  };
  return map[method] ?? method;
}
