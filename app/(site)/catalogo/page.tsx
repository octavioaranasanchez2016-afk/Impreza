import Link from "next/link";
import { PRODUCTS, TECHNIQUE_LABEL } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";
import { formatCordobas } from "@/lib/currency";
import { ZONE_LABEL, getZonesForCategory, isSleeve } from "@/components/GarmentShape";
import { Product } from "@/lib/types";

export const metadata = {
  title: "Catálogo",
  alternates: { canonical: "/catalogo" },
  description: "Camisas, polos, hoodies, gorras y tote bags para personalizar con serigrafía, DTF, sublimado o bordado en Managua. Precios en córdobas y dólares.",
};

// "Frente · Espalda · Mangas · Etiqueta": las dos mangas se nombran juntas.
function zonesText(product: Product): string {
  const zones = getZonesForCategory(product.category);
  const labels = zones.filter((z) => !isSleeve(z)).map((z) => ZONE_LABEL[z]);
  if (zones.some(isSleeve)) labels.splice(Math.min(2, labels.length), 0, "Mangas");
  return labels.join(" · ");
}

// "S – XXL", o la única talla ("Único", "Ajustable").
function sizesText(product: Product): string {
  const sizes = [...new Set(product.variants.flatMap((v) => v.sizes))];
  return sizes.length > 1 ? `${sizes[0]} – ${sizes[sizes.length - 1]}` : sizes[0] ?? "";
}

export default function CatalogoPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Catálogo</p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-7xl">
        Elige tu prenda
      </h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        Todas se personalizan al frente; camisas, polos y hoodies también en la espalda, y camisas y polos en cada manga y en la
        etiqueta de adentro. Elige una para ver colores, precios y guía de tallas.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-ink">
        {["Serigrafía, DTF, sublimado y bordado", "Desde 1 pieza", `Listo en ${PRODUCTION_BUSINESS_DAYS} días hábiles`, "Hasta 40% por volumen"].map((c) => (
          <span key={c} className="rounded-full border border-black/15 px-3 py-1.5">
            {c}
          </span>
        ))}
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-16">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">Compara de un vistazo</h2>
        <div className="mt-4 overflow-x-auto rounded-brand border border-black/10 bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs text-ink-muted">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Desde</th>
                <th className="px-4 py-3 font-medium">Técnicas</th>
                <th className="px-4 py-3 font-medium">Se personaliza en</th>
                <th className="px-4 py-3 font-medium">Tallas</th>
                <th className="px-4 py-3 text-right font-medium">Colores</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/producto/${p.slug}`} className="font-semibold text-ink hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{formatCordobas(p.basePrice)}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.techniques.map((t) => TECHNIQUE_LABEL[t]).join(" · ")}</td>
                  <td className="px-4 py-3 text-ink-soft">{zonesText(p)}</td>
                  <td className="px-4 py-3 text-ink-soft">{sizesText(p)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1.5 text-ink-soft">
                      <span className="flex -space-x-1">
                        {p.variants.slice(0, 4).map((v) => (
                          <span
                            key={v.color}
                            className="h-3.5 w-3.5 rounded-full border border-black/20 ring-2 ring-white"
                            style={{ backgroundColor: v.colorHex }}
                          />
                        ))}
                      </span>
                      {p.variants.length}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-ink-muted">Precio por pieza antes del descuento por cantidad.</p>
      </div>
    </section>
  );
}
