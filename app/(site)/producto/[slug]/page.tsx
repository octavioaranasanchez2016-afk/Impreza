import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, PRODUCTS } from "@/lib/catalog";
import { formatCordobas, formatInDollars } from "@/lib/currency";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <section className="mx-auto max-w-5xl px-4 py-14 md:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-brand bg-paper-soft">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-ink">{product.name}</h1>
          <p className="mt-3 text-ink-soft">{product.description}</p>
          <p className="mt-4 text-2xl font-semibold text-ink">
            Desde {formatCordobas(product.basePrice)}
            <span className="ml-2 text-base font-medium text-ink-soft">{formatInDollars(product.basePrice)}</span>
          </p>

          <div className="mt-6">
            <p className="text-sm font-semibold text-ink">Colores disponibles</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <span
                  key={v.color}
                  className="flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 text-sm"
                >
                  <span
                    className="h-3 w-3 rounded-full border border-black/10"
                    style={{ backgroundColor: v.colorHex }}
                  />
                  {v.color}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-ink">Técnicas disponibles</p>
            <div className="mt-2 flex gap-2">
              {product.techniques.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-ink/15 px-3 py-1 text-sm font-medium text-ink"
                >
                  {t === "serigrafia" ? "Serigrafía" : "Sublimado"}
                </span>
              ))}
            </div>
          </div>

          <Link
            href={`/pedido?producto=${product.id}`}
            className="mt-8 inline-block rounded-brand bg-ink px-6 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-80"
          >
            Personalizar y pedir
          </Link>
        </div>
      </div>
    </section>
  );
}
