import Link from "next/link";
import { notFound } from "next/navigation";
import { TECHNIQUE_LABEL, getProductBySlug, PRODUCTS } from "@/lib/catalog";
import { formatCordobas, formatInDollars } from "@/lib/currency";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";
import { SIZE_MEASUREMENTS, ZONE_LABEL, getPrintAreaCm, getZonesForCategory } from "@/components/GarmentShape";
import { TechniqueGuide } from "@/components/TechniqueGuide";

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

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <nav className="text-sm text-ink-soft">
        <Link href="/catalogo" className="hover:text-ink">
          Catálogo
        </Link>{" "}
        / <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-brand bg-paper-soft md:sticky md:top-24">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div>
          <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-6xl">{product.name}</h1>
          <p className="mt-4 text-ink-soft">{product.description}</p>
          <p className="mt-5 text-ink-soft">
            Desde <span className="text-3xl font-bold text-ink">{formatCordobas(product.basePrice)}</span>
            <span className="ml-2 text-base font-medium">{formatInDollars(product.basePrice)}</span>
          </p>
          <p className="mt-1 text-xs text-ink-muted">Precio por pieza antes de impresión y descuentos por volumen.</p>

          <div className="mt-8">
            <p className="text-sm font-semibold text-ink">Colores</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <span key={v.color} className="flex items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-sm">
                  <span className="h-4 w-4 rounded-full border border-black/15" style={{ backgroundColor: v.colorHex }} />
                  {v.color}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-ink">Técnicas</p>
            <p className="mt-1 text-xs text-ink-soft">Así se puede imprimir este producto. Eliges la técnica al armar tu pedido.</p>
            <div className="mt-2">
              <TechniqueGuide techniques={product.techniques} compact />
            </div>
            <Link
              href="/preguntas-frecuentes#tecnicas"
              className="mt-2 inline-block text-xs font-semibold text-ink underline"
            >
              Comparar todas las técnicas →
            </Link>
          </div>

          {product.fabrics && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-ink">Telas</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {product.fabrics.map((f) => (
                  <li key={f.id} className="rounded-brand border border-black/10 px-3 py-2.5">
                    <p className="text-sm font-semibold text-ink">{f.name}</p>
                    <p className="text-xs text-ink-soft">{f.description}</p>
                    <p className="mt-1 text-[11px] font-medium text-ink-muted">
                      {f.techniques.map((t) => TECHNIQUE_LABEL[t]).join(" o ")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href={`/pedido?producto=${product.id}`}
            className="mt-8 block rounded-brand bg-ink px-6 py-4 text-center text-base font-semibold text-paper transition-opacity hover:opacity-80"
          >
            Personalizar y pedir →
          </Link>
          <ul className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-ink-soft">
            <li className="rounded-brand bg-paper-soft px-2 py-3">
              <span className="block font-semibold text-ink">{PRODUCTION_BUSINESS_DAYS} días hábiles</span>de entrega
            </li>
            <li className="rounded-brand bg-paper-soft px-2 py-3">
              <span className="block font-semibold text-ink">Desde 1 pieza</span>sin mínimo
            </li>
            <li className="rounded-brand bg-paper-soft px-2 py-3">
              <span className="block font-semibold text-ink">C$ o US$</span>transferencia BAC
            </li>
          </ul>

          {product.category === "gorra" ? (
            <div className="mt-10 rounded-brand border border-black/10 p-5">
              <p className="font-semibold text-ink">Talla</p>
              <p className="mt-1 text-sm text-ink-soft">
                Talla única con cierre ajustable atrás. El frente mide unos {sizes[0]?.[1].ancho} cm de ancho y{" "}
                {sizes[0]?.[1].largo} cm de alto.
              </p>
            </div>
          ) : (
            <div className="mt-10 rounded-brand border border-black/10 p-5">
              <p className="font-semibold text-ink">Guía de tallas</p>
              <p className="mt-1 text-xs text-ink-soft">Medidas aproximadas de la prenda extendida, en centímetros.</p>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-xs text-ink-muted">
                    <th className="pb-2 font-medium">Talla</th>
                    <th className="pb-2 font-medium">Ancho (pecho)</th>
                    <th className="pb-2 font-medium">Largo</th>
                  </tr>
                </thead>
                <tbody>
                  {sizes.map(([size, m]) => (
                    <tr key={size} className="border-b border-black/5 last:border-0">
                      <td className="py-2 font-semibold text-ink">{size}</td>
                      <td className="py-2 text-ink">{m.ancho} cm</td>
                      <td className="py-2 text-ink">{m.largo} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 rounded-brand border border-black/10 p-5">
            <p className="font-semibold text-ink">
              Área máxima de {product.techniques.every((t) => t === "bordado") ? "bordado" : "impresión"}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {zones.map((z) => {
                const area = getPrintAreaCm(product.category, z);
                return (
                  <div key={z} className="rounded-brand bg-paper-soft p-3 text-center">
                    <p className="text-xs text-ink-soft">{ZONE_LABEL[z]}</p>
                    <p className="mt-0.5 font-semibold text-ink">
                      {area.w} × {area.h} cm
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
