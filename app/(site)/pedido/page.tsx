import { Suspense } from "react";
import { OrderForm } from "@/components/OrderForm";

export const metadata = {
  title: "Hacer pedido",
  alternates: { canonical: "/pedido" },
  description: "Diseña tu camisa, polo, hoodie, gorra o tote bag en línea, a escala real. Ve tu factura al instante y paga por transferencia BAC.",
};

const STEPS = [
  { href: "#diseno", label: "Diseño" },
  { href: "#datos", label: "Tus datos" },
  { href: "#entrega", label: "Entrega" },
  { href: "#factura", label: "Factura" },
  { href: "#pago", label: "Pago" },
];

export default function PedidoPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Diseñador</p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-6xl">Arma tu pedido</h1>
      <p className="mt-3 text-ink-soft">Diseña a escala real, elige cómo recibirlo, revisa tu factura y paga por transferencia.</p>
      <ol className="mt-6 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li key={s.href}>
            <a
              href={s.href}
              className="flex items-center gap-2 rounded-full border border-black/15 py-1 pl-1 pr-3 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper">{i + 1}</span>
              {s.label}
            </a>
          </li>
        ))}
      </ol>
      <div className="mt-8">
        <Suspense fallback={null}>
          <OrderForm />
        </Suspense>
      </div>
    </section>
  );
}
