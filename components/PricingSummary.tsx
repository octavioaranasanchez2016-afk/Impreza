import { PricingBreakdown } from "@/lib/types";
import { formatCordobas } from "@/lib/currency";
import { VolumeDiscountBar } from "./VolumeDiscountBar";

export function PricingSummary({ pricing }: { pricing: PricingBreakdown }) {
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
        {pricing.setupFee > 0 && (
          <Row label="Cargo por preparación de diseño" value={money(pricing.setupFee)} />
        )}
      </dl>

      <div className="mt-4 flex items-baseline justify-between border-t border-black/10 pt-4">
        <span className="text-sm font-semibold text-ink">Total</span>
        <span className="text-2xl font-bold text-ink">{money(pricing.total)}</span>
      </div>

      {pricing.totalQuantity > 0 && pricing.discountPct === 0 && (
        <p className="mt-3 text-xs text-ink-soft">
          Tip: desde 12 piezas obtienes 15% de descuento.
        </p>
      )}

      <div className="mt-5 border-t border-black/10 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Descuento por cantidad
        </p>
        <VolumeDiscountBar compact />
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
