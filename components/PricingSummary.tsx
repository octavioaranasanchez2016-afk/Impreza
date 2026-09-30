import { PricingBreakdown } from "@/lib/types";
import { formatCordobas, formatInDollars } from "@/lib/currency";
import { DiscountProgress } from "./DiscountProgress";

// pending y unitPrice alimentan la barra de descuento (ver DiscountProgress).
export function PricingSummary({
  pricing,
  pending = 0,
  unitPrice,
  onQuickAdd,
  quickAddLabel,
}: {
  pricing: PricingBreakdown;
  pending?: number;
  unitPrice?: number;
  onQuickAdd?: (pieces: number) => void;
  quickAddLabel?: string;
}) {
  return (
    <div className="rounded-brand border border-black/10 bg-white p-5">
      <p className="text-sm font-semibold text-ink">Resumen del pedido</p>

      <dl className="mt-3 space-y-2 text-sm">
        <Row label={`Piezas (${pricing.totalQuantity})`} value={money(pricing.subtotal)} />
        {pricing.discountPct > 0 && (
          <Row
            label={`Descuento por volumen (${Math.round(pricing.discountPct * 100)}%)`}
            value={`-${money(pricing.discountAmount)}`}
            highlight="font-semibold text-ink"
          />
        )}
        {(pricing.shipping ?? 0) > 0 && (
          <Row label={`Delivery (${pricing.shippingKm} km)`} value={money(pricing.shipping ?? 0)} />
        )}
        {pricing.setupFee > 0 && (
          <Row label="Cargo por preparación de diseño" value={money(pricing.setupFee)} />
        )}
      </dl>

      <div className="mt-4 flex items-start justify-between border-t border-black/10 pt-4">
        <span className="pt-1 text-sm font-semibold text-ink">Total</span>
        <span className="text-right">
          <span className="block text-2xl font-bold text-ink">{money(pricing.total)}</span>
          <span className="block text-sm font-semibold text-ink-soft">{formatInDollars(pricing.total)}</span>
        </span>
      </div>

      <div className="mt-5 border-t border-black/10 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Descuento por cantidad
        </p>
        <DiscountProgress
          quantity={pricing.totalQuantity}
          pending={pending}
          unitPrice={unitPrice}
          onQuickAdd={onQuickAdd}
          quickAddLabel={quickAddLabel}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={highlight ?? "text-ink"}>{value}</dd>
    </div>
  );
}

function money(n: number) {
  return formatCordobas(n);
}
