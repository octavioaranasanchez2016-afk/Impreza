import { CORDOBAS_PER_DOLLAR, formatCordobas, formatInDollars } from "@/lib/currency";
import { InvoiceLine, SETUP_FEE_LABEL } from "@/lib/pricing";
import { PricingBreakdown, Technique } from "@/lib/types";
import { ShippingInfo } from "@/lib/shipping";

export function Invoice({
  lines,
  pricing,
  technique,
  clienteNombre,
  orderNumber,
  date,
  shipping,
  title = "Factura proforma",
}: {
  lines: InvoiceLine[];
  pricing: PricingBreakdown;
  technique: Technique;
  clienteNombre?: string;
  orderNumber?: string;
  date?: Date;
  shipping?: ShippingInfo | null;
  title?: string;
}) {
  return (
    <div className="rounded-brand border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 pb-4">
        <div>
          <p className="text-lg font-bold text-ink">{title}</p>
          <p className="text-xs text-ink-soft">Impreza · Managua, Nicaragua</p>
        </div>
        <div className="text-right text-xs text-ink-soft">
          {orderNumber && <p className="font-semibold text-ink">Pedido #{orderNumber}</p>}
          <p>
            {(date ?? new Date()).toLocaleDateString("es-NI", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "America/Managua",
            })}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {clienteNombre?.trim() && (
          <div>
            <dt className="text-ink-muted">Cliente</dt>
            <dd className="font-medium text-ink">{clienteNombre}</dd>
          </div>
        )}
        <div>
          <dt className="text-ink-muted">Técnica</dt>
          <dd className="font-medium text-ink">{technique === "serigrafia" ? "Serigrafía" : "Sublimado"}</dd>
        </div>
      </dl>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left text-xs text-ink-muted">
            <th className="pb-2 font-medium">Producto</th>
            <th className="pb-2 text-right font-medium">Cant.</th>
            <th className="hidden pb-2 text-right font-medium sm:table-cell">Precio unit.</th>
            <th className="pb-2 text-right font-medium">Importe</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="border-b border-black/5 align-top">
              <td className="py-2 pr-2 text-ink">
                {line.description}
                <span className="block text-xs text-ink-muted sm:hidden">{formatCordobas(line.unitPrice)} c/u</span>
              </td>
              <td className="py-2 text-right text-ink">{line.quantity}</td>
              <td className="hidden py-2 text-right text-ink sm:table-cell">{formatCordobas(line.unitPrice)}</td>
              <td className="py-2 text-right font-medium text-ink">
                {formatCordobas(line.lineTotal)}
                <span className="block text-xs font-normal text-ink-muted">{formatInDollars(line.lineTotal)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-3 space-y-1.5 text-sm">
        <Row label={`Subtotal (${pricing.totalQuantity} pieza${pricing.totalQuantity === 1 ? "" : "s"})`} value={formatCordobas(pricing.subtotal)} />
        {pricing.discountAmount > 0 && (
          <Row
            label={`Descuento por volumen (${Math.round(pricing.discountPct * 100)}%)`}
            value={`-${formatCordobas(pricing.discountAmount)}`}
          />
        )}
        {pricing.setupFee > 0 && <Row label={SETUP_FEE_LABEL} value={formatCordobas(pricing.setupFee)} />}
        {shipping?.metodo === "domicilio" && <Row label="Envío a domicilio" value="Según zona" />}
        {shipping?.metodo === "retiro" && <Row label="Recoger en el taller" value="Gratis" />}
      </dl>

      <div className="mt-3 flex items-start justify-between border-t-2 border-ink pt-3">
        <span className="pt-1 font-bold text-ink">Total a pagar</span>
        <span className="text-right">
          <span className="block text-2xl font-bold text-ink">{formatCordobas(pricing.total)}</span>
          <span className="block text-base font-semibold text-ink-soft">{formatInDollars(pricing.total)}</span>
        </span>
      </div>
      <p className="mt-2 text-right text-[11px] text-ink-muted">
        Tipo de cambio oficial: C${CORDOBAS_PER_DOLLAR} por US$1
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
