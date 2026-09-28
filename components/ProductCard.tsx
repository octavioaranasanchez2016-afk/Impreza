import Link from "next/link";
import { Product } from "@/lib/types";
import { formatCordobas, formatInDollars } from "@/lib/currency";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-brand border border-black/10 bg-white transition-all hover:-translate-y-1 hover:border-ink hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-paper-soft">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur">
          {product.techniques
            .map((t, i) => {
              const label = t === "serigrafia" ? "Serigrafía" : "Sublimado";
              return i === 0 ? label : label.toLowerCase();
            })
            .join(" o ")}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-2xl uppercase leading-none tracking-wide text-ink">{product.name}</p>
          <div className="flex shrink-0 -space-x-1 pt-0.5">
            {product.variants.map((v) => (
              <span
                key={v.color}
                title={v.color}
                className="h-4 w-4 rounded-full border border-black/20 ring-2 ring-white"
                style={{ backgroundColor: v.colorHex }}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm text-ink-soft">{product.description}</p>
        <div className="mt-auto flex items-end justify-between pt-5">
          <p className="text-sm text-ink-soft">
            Desde <span className="text-lg font-bold text-ink">{formatCordobas(product.basePrice)}</span>
            <span className="block text-xs text-ink-muted">{formatInDollars(product.basePrice)}</span>
          </p>
          <span className="rounded-brand bg-ink px-3 py-2 text-xs font-semibold text-paper transition-opacity group-hover:opacity-80">
            Personalizar →
          </span>
        </div>
      </div>
    </Link>
  );
}
