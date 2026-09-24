import { VOLUME_TIERS } from "@/lib/pricing";

const LABELS = ["1–11", "12–23", "24–47", "48–95", "96–143", "144+"];

export function VolumeDiscountBar({ compact = false }: { compact?: boolean }) {
  const tiers = [...VOLUME_TIERS].reverse(); // de menor a mayor cantidad

  return (
    <div>
      <div className="flex overflow-hidden rounded-brand border border-black/10">
        {tiers.map((tier, i) => (
          <div
            key={tier.min}
            className="flex-1 border-r border-black/10 bg-white px-2 py-3 text-center last:border-r-0"
            style={{
              backgroundColor: tier.discountPct === 0 ? undefined : `rgba(17,17,17,${0.05 + i * 0.05})`,
            }}
          >
            <p className={`font-bold text-ink ${compact ? "text-sm" : "text-lg"}`}>
              {Math.round(tier.discountPct * 100)}%
            </p>
            {!compact && <p className="mt-0.5 text-[11px] text-ink-soft">{LABELS[i]} piezas</p>}
          </div>
        ))}
      </div>
      {compact && (
        <div className="mt-1 flex text-center text-[10px] text-ink-soft">
          {LABELS.map((l) => (
            <span key={l} className="flex-1">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
