import Link from "next/link";
import { PRODUCTS } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { Marquee } from "@/components/Marquee";
import { HomeDesignDemo } from "@/components/HomeDesignDemo";
import { DiscountCalculator } from "@/components/DiscountCalculator";
import { TechniqueGuide } from "@/components/TechniqueGuide";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";
import { FONT_OPTIONS } from "@/lib/design";
import { businessJsonLd } from "@/lib/site";
import { getApprovedReviews } from "@/lib/reviews";
import { listTrabajos } from "@/lib/trabajos";
import { ReviewGrid, ReviewSummary, Stars } from "@/components/ReviewCards";

// Las reseñas aprobadas se actualizan cada 5 minutos sin volver a publicar el sitio.
export const revalidate = 300;

// Dirección oficial: aunque el sitio también abra desde otro dominio, Google cuenta esta.
export const metadata = { alternates: { canonical: "/" } };

const PROCESS_PHOTO = "https://images.unsplash.com/photo-1643216674491-33878507b402?w=900&q=80&auto=format&fit=crop";
const STUDIO_PHOTO = "https://images.unsplash.com/photo-1456456496250-d5e7c0a9b44d?w=900&q=80&auto=format&fit=crop";

const STATS = [
  { value: `${PRODUCTION_BUSINESS_DAYS} días`, label: "hábiles de entrega" },
  { value: "1 pieza", label: "pedido mínimo" },
  { value: "40%", label: "descuento máximo por volumen" },
];

const OCCASIONS = [
  { title: "Graduaciones", text: "La camisa de tu promoción, con el nombre y el año.", cta: "Cotizar", href: "/camisas-de-graduacion" },
  { title: "Empresas", text: "Uniformes con tu logo y factura con RUC.", cta: "Cotizar", href: "/uniformes-para-empresas" },
  { title: "Iglesias y grupos", text: "Retiros, campamentos y actividades.", cta: "Cotizar", href: "/por-mayor" },
  { title: "Equipos", text: "Ligas, carreras y torneos, con número y nombre.", cta: "Cotizar", href: "/camisas-para-equipos" },
  { title: "Marcas de ropa", text: "Tus diseños, iguales en cada reposición.", cta: "Cotizar", href: "/por-mayor" },
  { title: "Regalos", text: "Una sola pieza con tu foto o tu frase.", cta: "Diseñar", href: "/pedido" },
];

// Lo que el cliente puede esperar de cada pedido (íconos de línea, 24 × 24).
const PROMISES = [
  {
    title: "Revisamos tu diseño",
    text: "Una persona lo revisa antes de imprimir y te escribe si algo no está claro.",
    icon: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  },
  {
    title: "Garantía de impresión",
    text: "Si hay un defecto de impresión o producción, lo reponemos.",
    icon: "M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z M9 12l2 2 4-4",
  },
  {
    title: "Factura con RUC",
    text: "Y proforma en PDF para que tu empresa la apruebe.",
    icon: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z M14 3v5h5 M9 13h6 M9 17h4",
  },
  {
    title: "Sigue tu pedido",
    text: "Con tu código ves en qué paso va, y te avisamos por WhatsApp.",
    icon: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  },
];

const STEPS = [
  ["01", "Crea tu diseño", "Sube una imagen JPG o escribe tu texto, y acomódalo a escala real."],
  ["02", "Elige producto", "Talla, color, cantidad y técnica. El precio se calcula al instante."],
  ["03", "Paga por transferencia", "Revisa tu factura, transfiere y adjunta el comprobante. Así queda confirmado."],
  ["04", "Recíbelo en tu puerta", `En ${PRODUCTION_BUSINESS_DAYS} días hábiles desde que verificamos tu pago: te lo llevamos a domicilio o lo recoges en el taller.`],
];

export default async function HomePage() {
  const [tee, hoodie] = PRODUCTS;
  const [{ reviews, stats }, { trabajos }] = await Promise.all([getApprovedReviews(6), listTrabajos(8)]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd()) }} />
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-16">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-ink" /> Hecho en Managua, Nicaragua
            </p>
            <h1 className="mt-5 font-display text-6xl uppercase leading-[0.9] tracking-wide text-ink sm:text-7xl lg:text-8xl">
              Tu diseño.
              <br />
              Impreso como
              <br />
              debe ser.
            </h1>
            <p className="mt-6 max-w-md text-base text-ink-soft md:text-lg">
              Camisas, polos, hoodies, gorras y tote bags con tu diseño. Lo creas en línea, ves el tamaño real en centímetros y
              nosotros lo imprimimos, desde 1 pieza hasta pedidos por mayor.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/pedido"
                className="rounded-brand bg-ink px-7 py-3.5 text-center text-sm font-semibold text-paper transition-opacity hover:opacity-80"
              >
                Empezar mi diseño →
              </Link>
              <Link
                href="/catalogo"
                className="rounded-brand border border-ink/20 px-7 py-3.5 text-center text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                Ver productos
              </Link>
            </div>
            {stats.count > 0 && (
              <Link href="/resenas" className="mt-5 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
                <Stars value={stats.average} className="text-base" />
                <span>
                  <span className="font-semibold text-ink">{stats.average.toFixed(1)}</span> · {stats.count} reseña
                  {stats.count === 1 ? "" : "s"} de clientes
                </span>
              </Link>
            )}
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-black/10 pt-6">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-3xl uppercase leading-none tracking-wide text-ink">{s.value}</dt>
                  <dd className="mt-1 text-xs text-ink-soft">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative grid grid-cols-2 grid-rows-2 gap-3">
            <div className="row-span-2 overflow-hidden rounded-brand">
              <img src={PROCESS_PHOTO} alt="Serigrafía en proceso" fetchPriority="high" className="h-full w-full object-cover" />
            </div>
            <div className="aspect-square overflow-hidden rounded-brand bg-paper-soft">
              <img src={tee.image} alt={tee.name} className="h-full w-full object-cover" />
            </div>
            <div className="aspect-square overflow-hidden rounded-brand bg-paper-soft">
              <img src={hoodie.image} alt={hoodie.name} className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-5 left-4 rounded-brand bg-ink px-4 py-3 text-paper shadow-xl">
              <p className="font-display text-2xl uppercase leading-none tracking-wide">Hasta 40% menos</p>
              <p className="text-[11px] text-paper/70">en pedidos por volumen</p>
            </div>
          </div>
        </div>
      </section>

      <Marquee
        items={["Serigrafía", "DTF", "Sublimado", "Bordado", "Camisas", "Polos", "Hoodies", "Gorras", "Tote bags", "Tu propia etiqueta", "Desde 1 pieza", `Listo en ${PRODUCTION_BUSINESS_DAYS} días hábiles`, "Entrega a domicilio"]}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <SectionTitle eyebrow="Catálogo" title="Elige tu prenda" link={{ href: "/catalogo", label: "Ver todo" }} />
        <div className="reveal swipe-row mt-10 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
          {PRODUCTS.map((product) => (
            <div key={product.id} className="swipe-item grid">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <SectionTitle eyebrow="Para cada ocasión" title="¿Para qué lo necesitas?" />
        <ul className="reveal mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
          {OCCASIONS.map((o) => (
            <li key={o.title}>
              <Link
                href={o.href}
                className="group flex h-full flex-col rounded-brand border border-black/10 bg-white p-4 transition-colors hover:border-ink hover:bg-ink md:p-6"
              >
                <p className="font-display text-2xl uppercase leading-none tracking-wide text-ink group-hover:text-paper md:text-3xl">
                  {o.title}
                </p>
                <p className="mt-2 text-xs text-ink-soft group-hover:text-paper/70 md:text-sm">{o.text}</p>
                <span className="mt-auto pt-4 text-xs font-semibold text-ink group-hover:text-paper md:text-sm">{o.cta} →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {trabajos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
          <SectionTitle eyebrow="Hecho en nuestro taller" title="Trabajos recientes" />
          <ul className="reveal swipe-row mt-10 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {trabajos.map((t) => (
              <li key={t.path} className="swipe-item">
                <figure className="overflow-hidden rounded-brand bg-paper-soft">
                  <img
                    src={t.url}
                    alt={t.titulo || "Pedido hecho por Impreza"}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                  {t.titulo && <figcaption className="px-3 py-2.5 text-xs text-ink-soft">{t.titulo}</figcaption>}
                </figure>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-paper-soft py-20">
        <div className="reveal mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2 md:px-6">
          <div className="order-2 md:order-1">
            <HomeDesignDemo />
          </div>
          <div className="order-1 md:order-2">
            <SectionTitle eyebrow="Diseñador en línea" title="Lo que ves es lo que se imprime" />
            <p className="mt-4 text-ink-soft">
              Nuestro diseñador dibuja cada prenda con sus medidas reales por talla. Mientras acomodas tu diseño ves su
              tamaño exacto en centímetros, así no hay sorpresas al recibirlo.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink">
              {[
                "Tamaño real en cm y área máxima de impresión de cada prenda",
                "Frente, espalda, cada manga y tu propia etiqueta por dentro",
                "Recorta tu imagen y elige qué parte se imprime",
                `Textos con ${FONT_OPTIONS.length} tipos de letra, colores y contorno`,
                "Varios diseños y técnicas en un mismo pedido",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] text-paper">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/pedido"
              className="mt-8 inline-block rounded-brand bg-ink px-6 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-80"
            >
              Probar el diseñador →
            </Link>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <SectionTitle eyebrow="Así de fácil" title="Cómo funciona" />
        <ol className="reveal mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-brand border border-black/10 bg-black/10 md:grid-cols-4">
          {STEPS.map(([n, title, text]) => (
            <li key={n} className="bg-white p-4 sm:p-6">
              <span className="font-display text-5xl leading-none text-ink/15">{n}</span>
              <p className="mt-3 font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>

        <ul className="reveal mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((p) => (
            <li key={p.title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-ink">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={p.icon} />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{p.title}</span>
                <span className="block text-xs text-ink-soft">{p.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section id="tecnicas" className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <SectionTitle eyebrow="Calidad" title="Nuestras técnicas" />
        <div className="reveal mt-10">
          <TechniqueGuide comparison />
        </div>
      </section>

      <section className="border-y border-black/10 bg-white py-20">
        <div className="reveal mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-[1fr_1.3fr] md:px-6">
          <div>
            <SectionTitle eyebrow="Por mayor" title="Entre más pides, menos pagas" />
            <p className="mt-4 text-ink-soft">
              El descuento se aplica solo sobre el total de piezas de tu pedido, sin importar si mezclas tallas, colores
              o productos.
            </p>
            <Link href="/por-mayor" className="mt-6 inline-block text-sm font-semibold text-ink hover:underline">
              Graduaciones, empresas y equipos: ver precios por mayor →
            </Link>
          </div>
          <DiscountCalculator />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="reveal grid items-center gap-10 md:grid-cols-2">
          <div className="aspect-[4/3] overflow-hidden rounded-brand">
            <img src={STUDIO_PHOTO} alt="Taller de impresión" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div>
            <SectionTitle eyebrow="Quiénes somos" title="Una marca nicaragüense fundada en 2026" />
            <p className="mt-4 text-ink-soft">
              Impreza nace de una idea simple: que acceder a diseños personalizados de calidad sea sencillo para
              cualquiera. Sencillez, atención y facilidad: así trabajamos cada pedido.
            </p>
            <Link href="/nosotros" className="mt-6 inline-block text-sm font-semibold text-ink hover:underline">
              Conoce nuestra historia →
            </Link>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="border-t border-black/10 bg-paper-soft py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionTitle eyebrow="Reseñas" title="Lo que dicen nuestros clientes" />
              <ReviewSummary stats={stats} />
            </div>
            <div className="reveal mt-10">
              <ReviewGrid reviews={reviews} />
            </div>
            <Link href="/resenas" className="mt-8 inline-block text-sm font-semibold text-ink hover:underline">
              Ver todas las reseñas →
            </Link>
          </div>
        </section>
      )}

      <section className="bg-ink py-20 text-center text-paper">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-display text-5xl uppercase leading-none tracking-wide md:text-7xl">¿Listo para crear?</h2>
          <p className="mx-auto mt-4 max-w-md text-paper/70">
            Diseña tu prenda en minutos y recíbela en {PRODUCTION_BUSINESS_DAYS} días hábiles.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/pedido"
              className="rounded-brand bg-paper px-7 py-3.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
            >
              Empezar mi diseño →
            </Link>
            <Link
              href="/preguntas-frecuentes"
              className="rounded-brand border border-paper/30 px-7 py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-paper hover:text-ink"
            >
              Preguntas frecuentes
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionTitle({ eyebrow, title, link }: { eyebrow: string; title: string; link?: { href: string; label: string } }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">{eyebrow}</p>
        <h2 className="mt-2 font-display text-4xl uppercase leading-none tracking-wide text-ink md:text-5xl">{title}</h2>
      </div>
      {link && (
        <Link href={link.href} className="shrink-0 text-sm font-semibold text-ink hover:underline">
          {link.label} →
        </Link>
      )}
    </div>
  );
}
