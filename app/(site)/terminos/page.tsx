import Link from "next/link";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";

export const metadata = {
  title: "Términos y condiciones",
  alternates: { canonical: "/terminos" },
  description: "Cómo funcionan los pedidos en Impreza: pagos, producción, entregas, tus diseños, garantía y cambios.",
};

// Las mismas reglas que ya dicen las preguntas frecuentes y el inicio, juntas en un lugar.
const SECTIONS = [
  {
    title: "Tu pedido",
    items: [
      "Armas tu pedido en el sitio y queda confirmado cuando pagas y adjuntas el comprobante.",
      "Antes de imprimir, una persona revisa tu diseño. Si algo no está claro (por ejemplo, una imagen con poca resolución), te escribimos antes de producir.",
      "El diseñador muestra tu diseño a escala real como guía. Los colores pueden verse un poco distintos en la tela que en la pantalla, según la técnica.",
    ],
  },
  {
    title: "Precios y pagos",
    items: [
      "Los precios están en córdobas, con su equivalente en dólares. El total, con el descuento por cantidad, aparece en tu factura antes de pagar.",
      "El delivery se cobra aparte según la distancia y también lo ves en tu factura.",
      "Por ahora el pago es por transferencia bancaria; muy pronto también con tarjeta. Si la necesitas, te damos factura con RUC.",
    ],
  },
  {
    title: "Producción y entrega",
    items: [
      `Tu pedido está listo en ${PRODUCTION_BUSINESS_DAYS} días hábiles desde que verificamos tu pago.`,
      "Te lo llevamos a domicilio o lo recoges gratis en el taller, en su horario.",
      "Te avisamos cómo va por WhatsApp o por correo, y lo sigues con tu código en Rastrear pedido.",
    ],
  },
  {
    title: "Tus diseños",
    items: [
      "Al subir un diseño confirmas que tienes derecho a usarlo: logos, marcas, fotos y textos.",
      "No imprimimos diseños que copien marcas de otros sin permiso, ni contenido ofensivo o ilegal. Si un diseño no se puede imprimir, te avisamos y te devolvemos tu pago.",
      "Tus diseños se usan solo para producir tu pedido; nunca los publicamos sin tu permiso.",
    ],
  },
  {
    title: "Garantía, cambios y devoluciones",
    items: [
      "Si tu pedido llega con un defecto de impresión o de producción, lo reponemos sin costo. Escríbenos por WhatsApp con fotos apenas lo recibas.",
      "Cada pieza se hace a la medida de tu pedido, así que no tiene cambio por la talla, el color o el diseño que elegiste. Revisa la guía de tallas antes de confirmar.",
      "Si el problema viene del diseño que subiste, lo vemos contigo caso por caso.",
    ],
  },
  {
    title: "Cancelaciones",
    items: [
      "Si necesitas cancelar o cambiar algo, escríbenos cuanto antes: mientras tu pedido no haya entrado a producción, lo resolvemos contigo.",
    ],
  },
];

export default function TerminosPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Cómo trabajamos</p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-7xl">
        Términos y condiciones
      </h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        Lo que puedes esperar de tu pedido en Impreza, desde que lo diseñas hasta que lo tienes en tus manos.
      </p>
      <div className="mt-10 space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.title} className="rounded-brand border border-black/10 bg-white p-6">
            <h2 className="font-display text-3xl uppercase tracking-wide text-ink">{s.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {s.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-ink-muted">
        Actualizado el 9 de octubre de 2026. Cómo cuidamos tus datos está en{" "}
        <Link href="/privacidad" className="font-semibold text-ink underline">
          Privacidad
        </Link>
        .
      </p>
      <div className="mt-10 rounded-brand bg-ink p-6 text-center text-paper">
        <p className="font-semibold">¿Una duda sobre tu pedido?</p>
        <WhatsAppLinkButton
          message="Hola, tengo una duda sobre cómo funcionan los pedidos en Impreza."
          className="mt-3 inline-block rounded-brand bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Escríbenos por WhatsApp
        </WhatsAppLinkButton>
        <p className="mt-4 text-xs text-paper/60">
          <Link href="/preguntas-frecuentes" className="underline">
            Preguntas frecuentes
          </Link>
        </p>
      </div>
    </section>
  );
}
