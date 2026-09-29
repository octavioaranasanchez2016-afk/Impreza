"use client";

import { useState } from "react";
import Link from "next/link";
import { getProductById } from "@/lib/catalog";
import { getVolumeDiscountPct } from "@/lib/pricing";
import { formatCordobas } from "@/lib/currency";
import { DiscountProgress } from "./DiscountProgress";

const QUICK = [12, 24, 48, 96, 144];
const MAX = 200;

// Calculadora de la página de inicio: el cliente mueve la barra y ve su descuento
// y el precio por camisa al instante.
export function DiscountCalculator() {
  const [quantity, setQuantity] = useState(24);
  const camisa = getProductById("camisa-basica");
  const unit = camisa?.basePrice ?? 0;
  const discount = getVolumeDiscountPct(quantity);
  const perPiece = unit * (1 - discount);

  const set = (n: number) => setQuantity(Math.max(1, Math.min(9999, Math.round(n) || 1)));

  return (
    <div className="rounded-brand border border-black/10 bg-paper p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label htmlFor="calc-piezas" className="text-sm font-semibold text-ink">
          ¿Cuántas piezas necesitas?
        </label>
        <div className="flex items-center gap-2">
          <input
            id="calc-piezas-numero"
            type="number"
            min={1}
            inputMode="numeric"
            value={quantity}
            onChange={(e) => set(Number(e.target.value))}
            aria-label="Cantidad de piezas"
            className="w-20 rounded-brand border border-black/15 bg-white px-2 py-1.5 text-center text-lg font-bold text-ink outline-none focus:border-ink"
          />
          <span className="text-sm text-ink-soft">piezas</span>
        </div>
      </div>

      <input
        id="calc-piezas"
        type="range"
        min={1}
        max={MAX}
        value={Math.min(quantity, MAX)}
        onChange={(e) => set(Number(e.target.value))}
        className="mt-4 w-full accent-ink"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {QUICK.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => set(n)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              quantity === n ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <DiscountProgress quantity={quantity} unitPrice={unit} />
      </div>

      {camisa && (
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-black/10 pt-4">
          <div>
            <p className="text-xs text-ink-soft">{camisa.name}, por pieza</p>
            <p className="text-2xl font-bold text-ink">
              {formatCordobas(perPiece)}
              {discount > 0 && (
                <span className="ml-2 text-sm font-medium text-ink-muted line-through">{formatCordobas(unit)}</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-soft">Total de {quantity} camisas</p>
            <p className="text-2xl font-bold text-ink">{formatCordobas(perPiece * quantity)}</p>
          </div>
        </div>
      )}

      <Link
        href="/pedido"
        className="mt-5 block rounded-brand bg-ink px-5 py-3 text-center text-sm font-semibold text-paper transition-opacity hover:opacity-80"
      >
        Armar mi pedido →
      </Link>
      <p className="mt-2 text-center text-[11px] text-ink-muted">
        El descuento cuenta todas las piezas del pedido: puedes mezclar tallas, colores y productos.
      </p>
    </div>
  );
}
