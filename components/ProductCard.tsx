import Link from "next/link";
import { Product } from "@/lib/types";
import { formatCordobas, formatInDollars } from "@/lib/currency";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group overflow-hidden rounded-brand border border-black/5 bg-white transition-shadow hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden bg-paper-soft">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <p className="font-semibold text-ink">{product.name}</p>
        <p className="mt-1 text-sm text-ink-soft">
          Desde {formatCordobas(product.basePrice)} · {formatInDollars(product.basePrice)}
        </p>
      </div>
    </Link>
  );
}
