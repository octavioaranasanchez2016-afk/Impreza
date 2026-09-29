import { PRODUCTS } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";

export const metadata = {
  title: "Catálogo",
  description: "Camisas, polos, hoodies, gorras y tote bags para personalizar con serigrafía, sublimado o bordado en Managua. Precios en córdobas y dólares.",
};

export default function CatalogoPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Catálogo</p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-7xl">
        Elige tu prenda
      </h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        Todas se personalizan al frente; camisas, polos y hoodies también en la espalda, y camisas y polos en la manga. Elige una
        para ver colores, guía de tallas y empezar tu diseño.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-ink">
        {["Serigrafía, sublimado y bordado", "Desde 1 pieza", `Listo en ${PRODUCTION_BUSINESS_DAYS} días hábiles`, "Hasta 40% por volumen"].map((c) => (
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
    </section>
  );
}
