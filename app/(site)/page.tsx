import Link from "next/link";
import { PRODUCTS } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { Marquee } from "@/components/Marquee";
import { DesignMockup } from "@/components/DesignMockup";
import { VolumeDiscountBar } from "@/components/VolumeDiscountBar";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";
import { businessJsonLd } from "@/lib/site";
import { getApprovedReviews } from "@/lib/reviews";
import { ReviewGrid, ReviewSummary } from "@/components/ReviewCards";

// Las reseñas aprobadas se actualizan cada 5 minutos sin volver a publicar el sitio.
export const revalidate = 300;

const PROCESS_PHOTO = "https://images.unsplash.com/photo-1643216674491-33878507b402?w=900&q=80&auto=format&fit=crop";
const STUDIO_PHOTO = "https://images.unsplash.com/photo-1456456496250-d5e7c0a9b44d?w=900&q=80&auto=format&fit=crop";

const STATS = [
  { value: `${PRODUCTION_BUSINESS_DAYS} días`, label: "hábiles de entrega" },
  { value: "1 pieza", label: "pedido mínimo" },
  { value: "40%", label: "descuento máximo por volumen" },
];

const STEPS = [
  ["01", "Crea tu diseño", "Sube una imagen JPG o escribe tu texto, y acomódalo a escala real."],
  ["02", "Elige producto", "Talla, color, cantidad y técnica. El precio se calcula al instante."],
  ["03", "Paga por transferencia", "Revisa tu factura, transfiere y adjunta el comprobante. Así queda confirmado."],
  ["04", "Recíbelo en tu puerta", `En ${PRODUCTION_BUSINESS_DAYS} días hábiles desde que verificamos tu pago: te lo llevamos a domicilio o lo recoges en el taller.`],
];

export default async function HomePage() {
  const [tee, hoodie] = PRODUCTS;
  const { reviews, stats } = await getApprovedReviews(6);

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
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pedido"
                className="rounded-brand bg-ink px-7 py-3.5 text-sm font-semibold text-paper transition-opacity hover:opacity-80"
              >
                Empezar mi diseño →
              </Link>
              <Link
                href="/catalogo"
                className="rounded-brand border border-ink/20 px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                Ver productos
              </Link>
            </div>
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
              <img src={PROCESS_PHOTO} alt="Serigrafía en proceso" className="h-full w-full object-cover" />
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
        items={["Serigrafía", "Sublimado", "Bordado", "Camisas", "Polos", "Hoodies", "Gorras", "Tote bags", "Desde 1 pieza", `Listo en ${PRODUCTION_BUSINESS_DAYS} días hábiles`, "Entrega a domicilio"]}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <SectionTitle eyebrow="Catálogo" title="Elige tu prenda" link={{ href: "/catalogo", label: "Ver todo" }} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-paper-soft py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2 md:px-6">
          <div className="order-2 md:order-1">
            <div className="relative mx-auto max-w-md rounded-brand bg-white p-4 shadow-xl ring-1 ring-black/5">
              <DesignMockup
                category="camisa"
                zone="frente"
                color="#111111"
                size="M"
                content={{ kind: "texto", texto: "IMPREZA", color: "#FFFFFF", fontFamily: "display" }}
                transform={{ x: 50, y: 34, scale: 0.8, rotation: 0 }}
                interactive={false}
              />
              <span className="absolute -right-3 -top-3 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper shadow">
                Vista previa real
              </span>
            </div>
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
                "Frente, espalda y manga, cada uno con su propio diseño",
                "Textos con 5 tipos de letra, 14 colores y emojis",
                "Aviso automático si tu imagen se va a ver borrosa",
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
        <ol className="mt-10 grid gap-px overflow-hidden rounded-brand border border-black/10 bg-black/10 md:grid-cols-4">
          {STEPS.map(([n, title, text]) => (
            <li key={n} className="bg-white p-6">
              <span className="font-display text-5xl leading-none text-ink/15">{n}</span>
              <p className="mt-3 font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="tecnicas" className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <SectionTitle eyebrow="Calidad" title="Nuestras técnicas" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-brand bg-ink p-8 text-paper">
            <p className="font-display text-4xl uppercase tracking-wide">Serigrafía</p>
            <p className="mt-3 text-paper/80">
              Tinta directa sobre la tela con malla. Colores sólidos y muy duraderos.
            </p>
            <ul className="mt-5 space-y-1.5 text-sm text-paper/90">
              <li>✦ Ideal para logos de 1 a 3 colores</li>
              <li>✦ La mejor opción para pedidos grandes</li>
              <li>✦ Entre más piezas, más barato por unidad</li>
            </ul>
          </div>
          <div className="rounded-brand border-2 border-ink bg-white p-8 text-ink">
            <p className="font-display text-4xl uppercase tracking-wide">Sublimado</p>
            <p className="mt-3 text-ink-soft">
              La tinta se funde con la tela con calor. Colores vivos y detalle fotográfico.
            </p>
            <ul className="mt-5 space-y-1.5 text-sm">
              <li>✦ Ideal para fotos y diseños a todo color</li>
              <li>✦ Acabado que no se agrieta ni se despega</li>
              <li>✦ Para prendas blancas o claras</li>
            </ul>
          </div>
          <div className="rounded-brand bg-paper-soft p-8 text-ink">
            <p className="font-display text-4xl uppercase tracking-wide">Bordado</p>
            <p className="mt-3 text-ink-soft">
              Tu logo cosido con hilo directo en la prenda. Un acabado elegante que dura años.
            </p>
            <ul className="mt-5 space-y-1.5 text-sm">
              <li>✦ Ideal para logos en polos y gorras</li>
              <li>✦ Perfecto para uniformes de empresa</li>
              <li>✦ No se despinta ni se agrieta al lavar</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-[1fr_1.3fr] md:px-6">
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
          <VolumeDiscountBar />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="aspect-[4/3] overflow-hidden rounded-brand">
            <img src={STUDIO_PHOTO} alt="Taller de impresión" className="h-full w-full object-cover" />
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
            <div className="mt-10">
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
