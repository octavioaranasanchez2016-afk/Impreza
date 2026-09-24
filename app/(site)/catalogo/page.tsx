import { PRODUCTS } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export const metadata = {
  title: "Catálogo — Impreza",
};

export default function CatalogoPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <h1 className="text-3xl font-bold text-ink md:text-4xl">Catálogo</h1>
      <p className="mt-2 text-ink-soft">
        Elige un producto para personalizarlo con tu diseño.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
