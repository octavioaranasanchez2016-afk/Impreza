import Link from "next/link";
import { notFound } from "next/navigation";
import { TECHNIQUE_LABEL, getProductBySlug, PRODUCTS } from "@/lib/catalog";
import { formatCordobas, formatInDollars } from "@/lib/currency";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";
import { SIZE_MEASUREMENTS, ZONE_LABEL, getPrintAreaCm, getZonesForCategory } from "@/components/GarmentShape";

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

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const sizes = Object.entries(SIZE_MEASUREMENTS[product.category]);
  const zones = getZonesForCategory(product.category);
  const onlyEmbroidery = product.techniques.every((t) => t === "bordado");

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <nav className="text-xs text-ink-muted">
        <Link href="/catalogo" className="hover:text-ink">
          Catálogo
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-soft">{product.name}</span>
      </nav>

      <div className="mt-5 grid gap-10 md:grid-cols-2 md:gap-14">
        <div className="aspect-square overflow-hidden rounded-brand bg-paper-soft md:sticky md:top-24 md:self-start">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div>
          <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-6xl">{product.name}</h1>
          <p className="mt-3 max-w-md text-ink-soft">{product.description}</p>

          <p className="mt-6 flex items-baseline gap-2">
            <span className="text-xs text-ink-muted">Desde</span>
            <span className="text-3xl font-bold text-ink">{formatCordobas(product.basePrice)}</span>
            <span className="text-sm text-ink-soft">{formatInDollars(product.basePrice)}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted">Por pieza · baja hasta 40% según la cantidad.</p>

          <Link
            href={`/pedido?producto=${product.id}`}
            className="mt-6 block rounded-brand bg-ink px-6 py-4 text-center text-base font-semibold text-paper transition-opacity hover:opacity-80"
          >
            Personalizar y pedir →
          </Link>
          <p className="mt-3 text-center text-xs text-ink-soft">
            Listo en {PRODUCTION_BUSINESS_DAYS} días hábiles · Desde 1 pieza · Pago en C$ o US$
          </p>

          <dl className="mt-8 divide-y divide-black/10 border-y border-black/10">
            <Spec label={`Colores (${product.variants.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {product.variants.map((v) => (
                  <span
                    key={v.color}
                    title={v.color}
                    aria-label={v.color}
                    className="h-6 w-6 rounded-full border border-black/15"
                    style={{ backgroundColor: v.colorHex }}
                  />
                ))}
              </div>
            </Spec>
            <Spec label="Técnicas">
              <p className="text-sm text-ink">{product.techniques.map((t) => TECHNIQUE_LABEL[t]).join(" · ")}</p>
              <Link href="/preguntas-frecuentes#tecnicas" className="mt-1 inline-block text-xs font-semibold text-ink underline">
                ¿Cuál me conviene? Ver diferencias
              </Link>
            </Spec>
            {product.fabrics && (
              <Spec label="Telas">
                <p className="text-sm text-ink">{product.fabrics.map((f) => f.name).join(" · ")}</p>
              </Spec>
            )}
          </dl>

          <div className="mt-6 divide-y divide-black/10 border-b border-black/10">
            {product.fabrics && (
              <Detail title="Sobre las telas">
                <ul className="space-y-2.5">
                  {product.fabrics.map((f) => (
                    <li key={f.id}>
                      <p className="text-sm font-semibold text-ink">{f.name}</p>
                      <p className="text-xs text-ink-soft">
                        {f.description} · {f.techniques.map((t) => TECHNIQUE_LABEL[t]).join(", ")}
                      </p>
                    </li>
                  ))}
                </ul>
              </Detail>
            )}

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
        </div>
      </div>
    </section>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-3.5">
      <dt className="pt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">{label}</dt>
      <dd>{children}</dd>
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
