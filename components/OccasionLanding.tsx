import Link from "next/link";
import { QuickQuote, OccasionLabel } from "./QuickQuote";
import { WhatsAppLinkButton } from "./WhatsAppButton";
import { calculateOrderTotal } from "@/lib/pricing";
import { formatCordobas, formatInDollars } from "@/lib/currency";
import { getProductById, TECHNIQUE_LABEL } from "@/lib/catalog";
import { Technique } from "@/lib/types";

// Página para un tipo de pedido (graduaciones, empresas, equipos): lo que la gente
// busca en Google, con el cotizador ya puesto en ese caso.
export interface OccasionLandingProps {
  eyebrow: string;
  title: string;
  intro: string;
  start: OccasionLabel;
  points: string[];
  ideasTitle: string;
  ideas: { title: string; text: string }[];
  example: { label: string; productId: string; technique: Technique; fabric?: string; quantity: number };
  steps: [string, string][];
  faqs: { q: string; a: string }[];
  cta: { title: string; message: string; orderHref: string };
}

export function exampleTotal(example: OccasionLandingProps["example"]) {
  const product = getProductById(example.productId);
  const pricing = calculateOrderTotal(
    [
      {
        productId: example.productId,
        color: product?.variants[0].color ?? "",
        size: product?.variants[0].sizes[0] ?? "",
        quantity: example.quantity,
        technique: example.technique,
        fabric: example.fabric ?? null,
      },
    ],
    example.technique
  );
  return { ...pricing, perPiece: Math.round((pricing.total / example.quantity) * 100) / 100 };
}

export function OccasionLanding(props: OccasionLandingProps) {
  const example = exampleTotal(props.example);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: props.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-14 md:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div className="lg:pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">{props.eyebrow}</p>
          <h1 className="mt-2 max-w-3xl font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-7xl">
            {props.title}
          </h1>
          <p className="mt-4 max-w-xl text-ink-soft">{props.intro}</p>
          <ul className="mt-6 space-y-2 text-sm text-ink">
            {props.points.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] text-paper">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-brand bg-ink p-5 text-paper">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-paper/60">Ejemplo</p>
            <p className="mt-1 font-semibold">
              {props.example.label}: {formatCordobas(example.total)}
            </p>
            <p className="mt-1 text-sm text-paper/70">
              {formatCordobas(example.perPiece)} cada una ({formatInDollars(example.perPiece)}) en{" "}
              {props.example.technique === "dtf" ? "DTF" : TECHNIQUE_LABEL[props.example.technique].toLowerCase()}
              {example.discountPct ? `, con ${Math.round(example.discountPct * 100)}% de descuento` : ""}.
            </p>
          </div>
          <Link
            href="/lista-de-tallas"
            className="mt-4 flex items-center justify-between gap-3 rounded-brand border border-black/10 bg-white p-4 hover:border-ink"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">¿Hay que juntar las tallas del grupo?</span>
              <span className="block text-xs text-ink-soft">Crea una lista, compártela por WhatsApp y cada quien anota la suya.</span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-ink">Crear lista →</span>
          </Link>
        </div>
        <QuickQuote start={props.start} />
      </section>

      <section className="border-y border-black/10 bg-paper-soft py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="font-display text-4xl uppercase leading-none tracking-wide text-ink md:text-5xl">{props.ideasTitle}</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {props.ideas.map((idea) => (
              <li key={idea.title} className="rounded-brand border border-black/10 bg-white p-5">
                <p className="font-display text-2xl uppercase leading-none tracking-wide text-ink">{idea.title}</p>
                <p className="mt-2 text-sm text-ink-soft">{idea.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="font-display text-4xl uppercase leading-none tracking-wide text-ink md:text-5xl">Cómo funciona</h2>
        <ol className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-brand border border-black/10 bg-black/10 md:grid-cols-4">
          {props.steps.map(([title, text], i) => (
            <li key={title} className="bg-white p-4 sm:p-6">
              <span className="font-display text-5xl leading-none text-ink/15">{i + 1}</span>
              <p className="mt-3 font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 md:px-6">
        <h2 className="font-display text-4xl uppercase leading-none tracking-wide text-ink md:text-5xl">Preguntas frecuentes</h2>
        <div className="mt-6 divide-y divide-black/5 rounded-brand border border-black/10 bg-white">
          {props.faqs.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
                {f.q}
                <span className="shrink-0 text-xl leading-none text-ink-soft transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          ¿Otra duda?{" "}
          <Link href="/preguntas-frecuentes" className="font-semibold text-ink underline">
            Ver todas las preguntas
          </Link>
          {" · "}
          <Link href="/por-mayor" className="font-semibold text-ink underline">
            Precios por mayor
          </Link>
        </p>
      </section>

      <section className="bg-ink py-16 text-center text-paper">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-display text-5xl uppercase leading-none tracking-wide md:text-6xl">{props.cta.title}</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={props.cta.orderHref}
              className="rounded-brand bg-paper px-7 py-3.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
            >
              Armarlo yo mismo →
            </Link>
            <WhatsAppLinkButton
              message={props.cta.message}
              className="rounded-brand bg-[#25D366] px-7 py-3.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Contactar con diseñador
            </WhatsAppLinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
