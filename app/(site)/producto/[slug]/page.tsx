import Link from "next/link";
import { notFound } from "next/navigation";
import { TECHNIQUE_HINT, TECHNIQUE_LABEL, getProductBySlug, PRODUCTS } from "@/lib/catalog";
import { formatCordobas, formatInDollars } from "@/lib/currency";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";
import { VOLUME_TIERS, getUnitPrice } from "@/lib/pricing";
import { SITE_NAME, siteUrl } from "@/lib/site";
import { SIZE_MEASUREMENTS, ZONE_LABEL, getPrintAreaCm, getZonesForCategory } from "@/components/GarmentShape";
import {
  ProductColorOptions,
  ProductColorProvider,
  ProductGallery,
  ProductOrderLink,
} from "@/components/ProductShowcase";
import { Product } from "@/lib/types";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const title = `${product.name} personalizable`;
  const techniques = product.techniques.map((t) => TECHNIQUE_LABEL[t]).join(" o ");
  const description = `${product.description} Desde ${formatCordobas(product.basePrice)} (${formatInDollars(product.basePrice)}). ${techniques} en Managua.`;
  return { title, description, openGraph: { title, description, images: [product.image] } };
}

// "Serigrafía, Sublimado o DTF"
function orList(labels: string[]): string {
  return labels.join(", ").replace(/, ([^,]+)$/, " o $1");
}

// Precio por pieza en cada escalón de descuento, con la técnica más económica.
function priceTiers(product: Product) {
  const prices = product.techniques.map((t) => ({ technique: t, price: getUnitPrice(product.id, t) }));
  const from = Math.min(...prices.map((p) => p.price));
  const tiers = [...VOLUME_TIERS].reverse();
  return {
    from,
    highest: Math.max(...prices.map((p) => p.price)),
    surcharges: prices.filter((p) => p.price > from),
    tiers: tiers.map((tier, i) => {
      const next = tiers[i + 1];
      return {
        label: next ? `${tier.min}–${next.min - 1}` : `${tier.min}+`,
        pct: tier.discountPct,
        price: Math.round(from * (1 - tier.discountPct) * 100) / 100,
      };
    }),
  };
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const sizes = Object.entries(SIZE_MEASUREMENTS[product.category]);
  const zones = getZonesForCategory(product.category);
  const onlyEmbroidery = product.techniques.every((t) => t === "bordado");
  const pricing = priceTiers(product);
  const others = PRODUCTS.filter((p) => p.id !== product.id);

  const base = siteUrl();
  const url = `${base}/producto/${product.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: [product.image],
      url,
      brand: { "@type": "Brand", name: SITE_NAME },
      color: product.variants.map((v) => v.color).join(", "),
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "NIO",
        lowPrice: pricing.tiers[pricing.tiers.length - 1].price,
        highPrice: pricing.highest,
        offerCount: product.variants.length,
        availability: "https://schema.org/InStock",
        url,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Catálogo", item: `${base}/catalogo` },
        { "@type": "ListItem", position: 2, name: product.name, item: url },
      ],
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-xs text-ink-muted">
        <Link href="/catalogo" className="hover:text-ink">
          Catálogo
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-soft">{product.name}</span>
      </nav>

      <ProductColorProvider product={product}>
        <div className="mt-5 grid gap-10 md:grid-cols-2 md:gap-14">
          <div className="md:sticky md:top-24 md:self-start">
            <ProductGallery product={product} />
          </div>

          <div>
            <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-6xl">{product.name}</h1>
            <p className="mt-3 max-w-md text-ink-soft">{product.description}</p>

            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-xs text-ink-muted">Desde</span>
              <span className="text-3xl font-bold text-ink">{formatCordobas(pricing.from)}</span>
              <span className="text-sm text-ink-soft">{formatInDollars(pricing.from)}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              Por pieza ·{" "}
              <a href="#precios" className="underline hover:text-ink">
                baja hasta 40% según la cantidad
              </a>
            </p>

            <dl className="mt-8 divide-y divide-black/10 border-y border-black/10">
              <Spec label="Colores">
                <ProductColorOptions product={product} />
                <p className="mt-2 text-[11px] text-ink-muted">Toca un color para ver la prenda en ese color.</p>
              </Spec>
              <Spec label="Técnicas">
                <ul className={`grid gap-2 ${product.techniques.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                  {product.techniques.map((t) => (
                    <li key={t} className="rounded-brand border border-black/10 px-3 py-2.5">
                      <p className="text-sm font-semibold text-ink">{TECHNIQUE_LABEL[t]}</p>
                      <p className="text-xs text-ink-soft">{TECHNIQUE_HINT[t]}</p>
                    </li>
                  ))}
                </ul>
                <Link href="/preguntas-frecuentes#tecnicas" className="mt-2.5 inline-block text-xs font-semibold text-ink underline">
                  ¿Cuál me conviene? Ver diferencias
                </Link>
              </Spec>
              {product.fabrics && (
                <Spec label="Telas">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {product.fabrics.map((f) => (
                      <li key={f.id} className="rounded-brand border border-black/10 px-3 py-2.5">
                        <p className="text-sm font-semibold text-ink">{f.name}</p>
                        <p className="text-xs text-ink-soft">{f.description}</p>
                        <p className="mt-1 text-[11px] font-medium text-ink-muted">
                          {orList(f.techniques.map((t) => TECHNIQUE_LABEL[t]))}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Spec>
              )}
              <Spec label="Precio por pieza según cantidad" id="precios">
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {pricing.tiers.map((tier) => (
                    <li
                      key={tier.label}
                      className={`rounded-brand border px-2 py-2.5 text-center ${
                        tier.pct >= 0.4 ? "border-ink bg-ink text-paper" : "border-black/10"
                      }`}
                    >
                      <p className={`text-[11px] ${tier.pct >= 0.4 ? "text-paper/70" : "text-ink-muted"}`}>{tier.label} pzs</p>
                      <p className="mt-0.5 text-sm font-bold">{formatCordobas(tier.price)}</p>
                      <p className={`text-[10px] font-semibold ${tier.pct >= 0.4 ? "text-paper/70" : "text-ink-soft"}`}>
                        {tier.pct > 0 ? `−${Math.round(tier.pct * 100)}%` : "Precio base"}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-ink-muted">
                  Cuenta el total de piezas del pedido, aunque mezcles tallas, colores y productos.
                  {pricing.surcharges.map(
                    (s) => ` Con ${TECHNIQUE_LABEL[s.technique].toLowerCase()}: ${formatCordobas(s.price - pricing.from)} más por pieza.`
                  )}
                </p>
              </Spec>
            </dl>

            <div className="mt-6 divide-y divide-black/10 border-b border-black/10">
              <Detail title={product.category === "gorra" ? "Talla" : "Guía de tallas"}>
                {product.category === "gorra" ? (
                  <p className="text-sm text-ink-soft">
                    Talla única con cierre ajustable atrás. El frente mide unos {sizes[0]?.[1].ancho} cm de ancho y{" "}
                    {sizes[0]?.[1].largo} cm de alto.
                  </p>
                ) : (
                  <>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-ink-muted">
                          <th className="pb-2 font-medium">Talla</th>
                          <th className="pb-2 font-medium">Ancho (pecho)</th>
                          <th className="pb-2 font-medium">Largo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizes.map(([size, m]) => (
                          <tr key={size} className="border-t border-black/5">
                            <td className="py-1.5 font-semibold text-ink">{size}</td>
                            <td className="py-1.5 text-ink">{m.ancho} cm</td>
                            <td className="py-1.5 text-ink">{m.largo} cm</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-2 text-[11px] text-ink-muted">Medidas aproximadas de la prenda extendida.</p>
                  </>
                )}
              </Detail>

              <Detail title={`Área máxima de ${onlyEmbroidery ? "bordado" : "impresión"}`}>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
                  {zones.map((z) => {
                    const area = getPrintAreaCm(product.category, z);
                    return (
                      <li key={z} className="flex justify-between gap-2">
                        <span className="text-ink-soft">{ZONE_LABEL[z]}</span>
                        <span className="font-semibold text-ink">
                          {area.w} × {area.h} cm
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Detail>
            </div>

            <ProductOrderLink
              product={product}
              className="mt-8 block rounded-brand bg-ink px-6 py-4 text-center text-base font-semibold text-paper transition-opacity hover:opacity-80"
            >
              Personalizar y pedir →
            </ProductOrderLink>
            <p className="mt-3 text-center text-xs text-ink-soft">
              Listo en {PRODUCTION_BUSINESS_DAYS} días hábiles · Desde 1 pieza · Pago en C$ o US$
            </p>
          </div>
        </div>
      </ProductColorProvider>

      <div className="mt-16 border-t border-black/10 pt-10 md:mt-24">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">También puedes personalizar</p>
        <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          {others.map((p) => (
            <li key={p.id}>
              <Link href={`/producto/${p.slug}`} className="group block">
                <div className="aspect-square overflow-hidden rounded-brand bg-paper-soft">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2.5 text-sm font-semibold text-ink">{p.name}</p>
                <p className="text-xs text-ink-soft">Desde {formatCordobas(p.basePrice)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Spec({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 py-4">
      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">{label}</dt>
      <dd className="mt-2.5">{children}</dd>
    </div>
  );
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group py-3.5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink">
        {title}
        <span className="text-lg leading-none text-ink-soft transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
