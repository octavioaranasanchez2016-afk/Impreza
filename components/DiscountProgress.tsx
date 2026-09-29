"use client";

import { useEffect, useRef, useState } from "react";
import { VOLUME_TIERS } from "@/lib/pricing";
import { formatCordobas } from "@/lib/currency";

// Escalones de menor a mayor: 1, 12, 24, 48, 96, 144 piezas.
const TIERS = [...VOLUME_TIERS].sort((a, b) => a.min - b.min);
// Tramos de la barra: 0→12, 12→24, 24→48, 48→96, 96→144.
const SEGMENTS = TIERS.slice(1).map((t, i) => ({ from: i === 0 ? 0 : TIERS[i].min, to: t.min, tier: t }));

function tierIndex(quantity: number): number {
  let index = 0;
  TIERS.forEach((t, i) => {
    if (quantity >= t.min) index = i;
  });
  return quantity > 0 ? index : 0;
}

// Cuánto de cada tramo está lleno (0 a 1).
function segmentFill(quantity: number, seg: { from: number; to: number }) {
  return Math.max(0, Math.min(1, (quantity - seg.from) / (seg.to - seg.from)));
}

// Posición en la barra completa (0 a 100); cada tramo ocupa lo mismo.
function overallPosition(quantity: number) {
  return SEGMENTS.reduce((sum, seg) => sum + segmentFill(quantity, seg), 0) * (100 / SEGMENTS.length);
}

// Al revés: qué cantidad corresponde a un punto de la barra (para arrastrarla).
function quantityAt(position: number): number {
  const width = 100 / SEGMENTS.length;
  const i = Math.min(SEGMENTS.length - 1, Math.max(0, Math.floor(position / width)));
  const seg = SEGMENTS[i];
  const t = Math.max(0, Math.min(1, (position - i * width) / width));
  return Math.max(1, Math.round(seg.from + t * (seg.to - seg.from)));
}

const pct = (p: number) => `${Math.round(p * 100)}%`;
const pieces = (n: number) => `${n} pieza${n === 1 ? "" : "s"}`;

// Número que sube o baja con animación en vez de saltar.
function useAnimatedNumber(value: number, duration = 550) {
  const [display, setDisplay] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    const from = current.current;
    if (from === value) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = value;
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const v = from + (value - from) * (1 - Math.pow(1 - t, 3));
      current.current = v;
      setDisplay(v);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return display;
}

const STRIPES = {
  backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.22) 0 6px, transparent 6px 12px)",
  backgroundSize: "17px 17px",
};

// Barra de descuento por cantidad. Se llena con las piezas del pedido; las que el
// cliente escribió pero no agregó (pending) se ven en gris como adelanto.
// unitPrice: precio promedio por pieza sin descuento (para el precio de cada escalón).
// onQuickAdd: si viene, muestra un botón para sumar las piezas que faltan.
// onQuantityChange: si viene, la barra se puede arrastrar para elegir la cantidad.
export function DiscountProgress({
  quantity,
  pending = 0,
  unitPrice,
  compact = false,
  onQuickAdd,
  quickAddLabel,
  onQuantityChange,
}: {
  quantity: number;
  pending?: number;
  unitPrice?: number;
  compact?: boolean;
  onQuickAdd?: (pieces: number) => void;
  quickAddLabel?: string;
  onQuantityChange?: (quantity: number) => void;
}) {
  const interactive = Boolean(onQuantityChange);
  // Al arrastrar, la barra sigue al dedo sin animación de retraso.
  const motion = interactive ? "" : "transition-[width] duration-500 ease-out motion-reduce:transition-none";
  const current = tierIndex(quantity);
  const currentPct = quantity > 0 ? TIERS[current].discountPct : 0;
  const next = TIERS[current + 1];
  const missing = next ? next.min - quantity : 0;
  const withPending = quantity + pending;
  const pendingTier = tierIndex(withPending);
  const nextAfterPending = TIERS[pendingTier + 1];
  const savings = unitPrice ? unitPrice * quantity * currentPct : 0;

  const shownPct = useAnimatedNumber(currentPct * 100);
  const shownSavings = useAnimatedNumber(savings);

  // Aviso de "¡desbloqueaste!" solo al subir de escalón (no al cargar la página).
  const previousTier = useRef(current);
  const [unlocked, setUnlocked] = useState<number | null>(null);
  useEffect(() => {
    const before = previousTier.current;
    previousTier.current = current;
    // Al bajar de escalón se quita el aviso: no puede decir 40% si ya estás en 25%.
    if (current < before) setUnlocked(null);
    if (current <= before || quantity === 0) return;
    setUnlocked(current);
    const timer = setTimeout(() => setUnlocked(null), 2800);
    return () => clearTimeout(timer);
  }, [current, quantity]);

  const segments = (
    <div className={`flex ${compact ? "gap-0.5" : "gap-1"}`}>
      {SEGMENTS.map((seg) => {
        const fill = segmentFill(quantity, seg);
        const ghost = segmentFill(withPending, seg);
        const inProgress = fill > 0 && fill < 1;
        return (
          <div
            key={seg.to}
            className={`relative flex-1 overflow-hidden rounded-full bg-black/10 ${compact ? "h-1.5" : interactive ? "h-4" : "h-3"}`}
          >
            {ghost > fill && (
              <div className={`absolute inset-y-0 left-0 bg-ink/25 ${motion}`} style={{ width: `${ghost * 100}%` }} />
            )}
            <div
              className={`absolute inset-y-0 left-0 bg-ink ${motion} ${
                inProgress && !compact ? "motion-safe:animate-stripes" : ""
              }`}
              style={{ width: `${fill * 100}%`, ...(inProgress && !compact ? STRIPES : {}) }}
            />
          </div>
        );
      })}
    </div>
  );

  if (compact) {
    return (
      <div>
        {segments}
        <p className="mt-1 truncate text-[11px] text-ink-soft">
          {unlocked !== null ? (
            <span className="font-semibold text-ink">¡Desbloqueaste {pct(TIERS[unlocked].discountPct)} de descuento!</span>
          ) : (
            <>
              {currentPct > 0 ? (
                <span className="font-semibold text-ink">{pct(currentPct)} de descuento</span>
              ) : (
                "Sin descuento"
              )}
              {next ? ` · faltan ${pieces(missing)} para ${pct(next.discountPct)}` : " · ¡descuento máximo!"}
            </>
          )}
        </p>
      </div>
    );
  }

  const position = overallPosition(quantity);
  const unitNow = unitPrice ? unitPrice * (1 - currentPct) : null;
  const unitNext = unitPrice && next ? unitPrice * (1 - next.discountPct) : null;
  const toQuickAdd = nextAfterPending ? nextAfterPending.min - withPending : 0;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-5xl leading-none text-ink tabular-nums">{Math.round(shownPct)}%</p>
          {unlocked !== null ? (
            <p key={unlocked} className="mt-1 text-xs font-bold text-ink motion-safe:animate-pop" role="status">
              ✦ ¡Desbloqueaste {pct(TIERS[unlocked].discountPct)}!
            </p>
          ) : (
            <p className="mt-1 text-xs font-medium text-ink-soft">de descuento por cantidad</p>
          )}
        </div>
        <div className="text-right">
          {savings > 0 ? (
            <>
              <p className="text-lg font-bold text-ink tabular-nums">{formatCordobas(Math.round(shownSavings))}</p>
              <p className="text-xs text-ink-soft">que ahorras</p>
            </>
          ) : (
            <p className="text-xs text-ink-soft">{quantity > 0 ? pieces(quantity) : "Sin piezas aún"}</p>
          )}
        </div>
      </div>

      <div className="relative mt-9">
        {quantity > 0 && (
          <span
            className={`pointer-events-none absolute bottom-full -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-paper ${
              interactive ? "mb-3.5" : "mb-2 transition-[left] duration-500 ease-out motion-reduce:transition-none"
            }`}
            style={{ left: `${Math.min(96, Math.max(4, position))}%` }}
          >
            {quantity} pzs
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-ink" />
          </span>
        )}
        {segments}
        {onQuantityChange && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-white shadow-md"
              style={{ left: `${position}%` }}
            />
            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Math.round(position * 10)}
              aria-label="Cantidad de piezas"
              aria-valuetext={pieces(quantity)}
              onChange={(e) => onQuantityChange(quantityAt(Number(e.target.value) / 10))}
              onKeyDown={(e) => {
                const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
                if (!delta) return;
                e.preventDefault();
                onQuantityChange(Math.max(1, quantity + delta));
              }}
              className="absolute inset-x-0 top-1/2 h-12 w-full -translate-y-1/2 cursor-grab opacity-0 active:cursor-grabbing"
            />
          </>
        )}
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1 text-right">
        {SEGMENTS.map((seg) => {
          const reached = quantity >= seg.to;
          return (
            <div key={seg.to} className={reached ? "text-ink" : "text-ink-muted"}>
              <p className="text-xs font-bold">
                {reached && "✓ "}
                {pct(seg.tier.discountPct)}
              </p>
              <p className="text-[10px]">{seg.to}+</p>
              {unitPrice ? (
                <p className="text-[10px] tabular-nums">{formatCordobas(Math.round(unitPrice * (1 - seg.tier.discountPct)))}</p>
              ) : null}
            </div>
          );
        })}
      </div>
      {unitPrice ? <p className="mt-1 text-right text-[10px] text-ink-muted">precio por pieza en cada escalón</p> : null}

      <div className="mt-4 rounded-brand bg-paper-soft px-3 py-2.5 text-sm text-ink" aria-live="polite">
        {next ? (
          <p>
            {quantity === 0 ? (
              <>
                Desde <span className="font-semibold">{pieces(next.min)}</span> tu pedido tiene{" "}
                <span className="font-semibold">{pct(next.discountPct)}</span> de descuento.
              </>
            ) : (
              <>
                Te faltan <span className="font-semibold">{pieces(missing)}</span> para{" "}
                <span className="font-semibold">{pct(next.discountPct)}</span>.
                {unitNow !== null && unitNext !== null && (
                  <span className="text-ink-soft">
                    {" "}
                    Cada pieza baja de {formatCordobas(Math.round(unitNow))} a {formatCordobas(Math.round(unitNext))}.
                  </span>
                )}
              </>
            )}
          </p>
        ) : (
          <p className="font-semibold">¡Tienes el descuento máximo: {pct(currentPct)}!</p>
        )}
        {pending > 0 && pendingTier > current && (
          <p className="mt-1 text-xs font-semibold">
            Al agregar {pieces(pending)} llegas a {pct(TIERS[pendingTier].discountPct)}.
          </p>
        )}
        {onQuickAdd && nextAfterPending && withPending > 0 && toQuickAdd <= 12 && (
          <button
            type="button"
            onClick={() => onQuickAdd(toQuickAdd)}
            className="mt-2 rounded-full border border-ink px-3 py-1 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            + Sumar {toQuickAdd} {quickAddLabel ?? ""} y llegar a {pct(nextAfterPending.discountPct)}
          </button>
        )}
      </div>
    </div>
  );
}
