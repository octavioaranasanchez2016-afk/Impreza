"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { imageAt } from "@/lib/catalog";
import { GarmentShape, getZonesForCategory } from "./GarmentShape";

// Color elegido en la página del producto: lo comparten la galería, los botones
// de color y el enlace para pedir (que lo lleva al diseñador).
type View = "foto" | "frente" | "espalda";

const ColorContext = createContext<{
  color: string;
  setColor: (color: string) => void;
  view: View;
  setView: (view: View) => void;
} | null>(null);

function useProductColor() {
  const ctx = useContext(ColorContext);
  if (!ctx) throw new Error("Falta ProductColorProvider");
  return ctx;
}

export function ProductColorProvider({ product, children }: { product: Product; children: React.ReactNode }) {
  const [color, setColor] = useState(product.variants[0]?.color ?? "");
  const [view, setView] = useState<View>("foto");
  return <ColorContext.Provider value={{ color, setColor, view, setView }}>{children}</ColorContext.Provider>;
}

// Foto del producto y, al elegir un color, la prenda dibujada en ese color.
export function ProductGallery({ product }: { product: Product }) {
  const { color, view, setView } = useProductColor();
  const hex = product.variants.find((v) => v.color === color)?.colorHex ?? "#FFFFFF";
  const zones = getZonesForCategory(product.category);
  const views: View[] = ["foto", "frente", ...(zones.includes("espalda") ? (["espalda"] as View[]) : [])];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-brand bg-paper-soft">
        {view === "foto" ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full p-[8%]">
            <GarmentShape category={product.category} zone={view} color={hex} />
          </div>
        )}
        {view !== "foto" && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink shadow-sm">
            {color} · {view === "frente" ? "Frente" : "Espalda"}
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {views.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-label={v === "foto" ? "Ver foto" : `Ver ${v} en ${color}`}
            aria-pressed={view === v}
            className={`h-16 w-16 overflow-hidden rounded-brand border-2 bg-paper-soft transition-colors ${
              view === v ? "border-ink" : "border-transparent hover:border-black/20"
            }`}
          >
            {v === "foto" ? (
              <img src={imageAt(product.image, 160)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full p-1.5">
                <GarmentShape category={product.category} zone={v} color={hex} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Colores con su nombre; al tocar uno, la galería muestra la prenda en ese color.
export function ProductColorOptions({ product }: { product: Product }) {
  const { color, setColor, view, setView } = useProductColor();
  const hex = product.variants.find((v) => v.color === color)?.colorHex ?? "#FFFFFF";
  const [touched, setTouched] = useState(false);
  return (
    <div>
      {/* En el celular la galería queda arriba, fuera de la pantalla: una vista chica aquí mismo. */}
      {touched && (
        <div className="mb-3 flex items-center gap-3 rounded-brand bg-paper-soft p-2 md:hidden">
          <div className="h-20 w-20 shrink-0">
            <GarmentShape category={product.category} zone="frente" color={hex} />
          </div>
          <p className="text-sm text-ink-soft">
            Así se ve en <span className="font-semibold text-ink">{color.toLowerCase()}</span>
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {product.variants.map((v) => {
          const active = v.color === color;
          return (
            <button
              key={v.color}
              type="button"
              onClick={() => {
                setColor(v.color);
                setTouched(true);
                if (view === "foto") setView("frente");
              }}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active ? "border-ink bg-ink text-paper" : "border-black/10 text-ink hover:border-ink"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full border ${active ? "border-paper/40" : "border-black/15"}`}
                style={{ backgroundColor: v.colorHex }}
              />
              {v.color}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Lleva al diseñador con el producto y el color elegidos.
export function ProductOrderLink({
  product,
  className,
  children,
}: {
  product: Product;
  className?: string;
  children: React.ReactNode;
}) {
  const { color } = useProductColor();
  const params = new URLSearchParams({ producto: product.id, color });
  return (
    <Link href={`/pedido?${params.toString()}`} className={className}>
      {children}
    </Link>
  );
}
