import Link from "next/link";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";
import { VOLUME_TIERS, calculateOrderTotal, getUnitPrice } from "@/lib/pricing";
import { formatCordobas, formatInDollars } from "@/lib/currency";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";

export const metadata = {
  title: "Pedidos por mayor",
  alternates: { canonical: "/por-mayor" },
  description:
    "Camisas y hoodies para graduaciones, empresas, iglesias, equipos y marcas en Managua. Desde 12 piezas ahorras 15% y hasta 40% desde 144.",
};

const GROUPS = [
  {
    title: "Graduaciones",
    text: "La camisa de tu promoción con el nombre del colegio y el año. Cada quien elige su talla.",
    pieces: "30 – 60 piezas",
    cta: "Cotizar mi graduación",
    message: "Hola, quiero cotizar camisas de graduación para mi promoción (colegio: ___, somos ___ personas).",
  },
  {
    title: "Empresas y uniformes",
    text: "Tu logo bordado en polos y gorras, o impreso en camisas y hoodies, para tu equipo o tus clientes. Con factura con RUC.",
    pieces: "12 – 100 piezas",
    cta: "Cotizar para mi empresa",
    message: "Hola, quiero cotizar camisas con el logo de mi empresa (___ piezas).",
  },
  {
    title: "Iglesias, equipos y eventos",
    text: "Retiros, ligas, carreras, excursiones, cumpleaños y actividades de todo tipo.",
    pieces: "20 – 100 piezas",
    cta: "Cotizar para mi grupo",
    message: "Hola, quiero cotizar camisas para un grupo/evento (___ personas, fecha: ___).",
  },
  {
    title: "Marcas de ropa",
    text: "Imprime tus diseños para vender, con la misma calidad en cada reposición.",
    pieces: "24 – 200 piezas",
    cta: "Cotizar para mi marca",
    message: "Hola, tengo una marca de ropa y quiero cotizar la impresión de mis diseños (___ piezas).",
  },
];

const TIER_LABELS: Record<number, string> = { 1: "1 – 11", 12: "12 – 23", 24: "24 – 47", 48: "48 – 95", 96: "96 – 143", 144: "144 o más" };

// Un ejemplo real calculado con los mismos precios del diseñador.
const EXAMPLE_PIECES = 30;
const example = calculateOrderTotal(
  [{ productId: "camisa-basica", color: "Blanco", size: "M", quantity: EXAMPLE_PIECES }],
  "serigrafia"
);

export default function PorMayorPage() {
  const tiers = [...VOLUME_TIERS].reverse();
  const teeSerigrafia = getUnitPrice("camisa-basica", "serigrafia");

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-14 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Por mayor</p>
        <h1 className="mt-2 max-w-3xl font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-7xl">
          Camisas para todo tu grupo
        </h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          Graduaciones, empresas, iglesias, equipos y marcas. Desde 12 piezas ahorras 15%, y hasta 40% desde 144. Pueden
          ser tallas y colores distintos: el descuento cuenta el total de piezas.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <WhatsAppLinkButton
            message="Hola, quiero cotizar un pedido por mayor en Impreza."
            className="rounded-brand bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Cotizar por WhatsApp
          </WhatsAppLinkButton>
          <Link
            href="/pedido"
            className="rounded-brand border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
          >
            Armarlo yo en el diseñador →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {GROUPS.map((g) => (
            <div key={g.title} className="flex flex-col rounded-brand border border-black/10 bg-white p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-3xl uppercase tracking-wide text-ink">{g.title}</h2>
                <span className="shrink-0 text-xs font-semibold text-ink-soft">{g.pieces}</span>
              </div>
              <p className="mt-2 flex-1 text-sm text-ink-soft">{g.text}</p>
              <WhatsAppLinkButton
                message={g.message}
                className="mt-5 self-start rounded-brand bg-ink px-4 py-2 text-sm font-semibold text-paper hover:opacity-80"
              >
                {g.cta}
              </WhatsAppLinkButton>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-4 rounded-brand bg-ink p-6 text-paper sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div>
            <h2 className="font-display text-3xl uppercase tracking-wide md:text-4xl">¿Necesitas más personalización?</h2>
            <p className="mt-1 max-w-xl text-sm text-paper/70">
              Si tu idea no cabe en el diseñador en línea, cuéntasela a nuestro diseñador y la vemos juntos.
            </p>
          </div>
          <WhatsAppLinkButton
            message="Hola, necesito una personalización especial y quiero hablar con el diseñador de Impreza."
            className="shrink-0 self-start rounded-brand bg-paper px-5 py-3 text-sm font-semibold text-ink hover:opacity-90 sm:self-center"
          >
            Contactar a nuestro diseñador
          </WhatsAppLinkButton>
        </div>
      </section>

      <section className="border-y border-black/10 bg-paper-soft py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1fr_1.1fr] md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Precios</p>
            <h2 className="mt-2 font-display text-4xl uppercase leading-none tracking-wide text-ink md:text-5xl">
              Entre más piezas, menos pagas
            </h2>
            <p className="mt-4 text-ink-soft">
              Precio por camisa básica en serigrafía. El descuento se aplica igual en polos, gorras, hoodies y tote
              bags.
            </p>
            <div className="mt-6 rounded-brand bg-ink p-5 text-paper">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-paper/60">Ejemplo</p>
              <p className="mt-1 font-semibold">
                {EXAMPLE_PIECES} camisas para una graduación: {formatCordobas(example.total)}
              </p>
              <p className="mt-1 text-sm text-paper/70">
                {formatCordobas(Math.round(example.total / EXAMPLE_PIECES))} por persona ({formatInDollars(example.total / EXAMPLE_PIECES)}),
                con {Math.round(example.discountPct * 100)}% de descuento.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-brand border border-black/10 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs text-ink-muted">
                  <th className="px-4 py-3 font-medium">Piezas en el pedido</th>
                  <th className="px-4 py-3 text-right font-medium">Descuento</th>
                  <th className="px-4 py-3 text-right font-medium">Precio por camisa</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t) => (
                  <tr key={t.min} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{TIER_LABELS[t.min] ?? `${t.min}+`}</td>
                    <td className="px-4 py-3 text-right text-ink-soft">{t.discountPct ? `${Math.round(t.discountPct * 100)}%` : "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">
                      {formatCordobas(Math.round(teeSerigrafia * (1 - t.discountPct)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="font-display text-4xl uppercase leading-none tracking-wide text-ink md:text-5xl">Cómo funciona un pedido grande</h2>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-brand border border-black/10 bg-black/10 md:grid-cols-4">
          {[
            ["Nos escribes", "Cuántas piezas, qué prenda y tu diseño o logo."],
            ["Recibes tu factura", "Con el descuento aplicado, en córdobas y en dólares."],
            ["Reúnes las tallas", "Nos pasas la lista de tallas y colores; pueden ser distintas para cada persona."],
            ["Lo entregamos", `En ${PRODUCTION_BUSINESS_DAYS} días hábiles desde el pago, en un solo lugar o a domicilio.`],
          ].map(([title, text], i) => (
            <li key={title} className="bg-white p-6">
              <span className="font-display text-5xl leading-none text-ink/15">{i + 1}</span>
              <p className="mt-3 font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
