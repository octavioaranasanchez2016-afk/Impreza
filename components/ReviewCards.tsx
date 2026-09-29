import { PublicReview, ReviewStats } from "@/lib/reviews";

export function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`tracking-tight ${className}`} aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? "text-ink" : "text-black/15"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ReviewSummary({ stats }: { stats: ReviewStats }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-display text-5xl leading-none text-ink">{stats.average.toFixed(1)}</span>
      <span>
        <Stars value={stats.average} className="text-xl" />
        <span className="block text-xs text-ink-soft">
          {stats.count} reseña{stats.count === 1 ? "" : "s"} de clientes
        </span>
      </span>
    </div>
  );
}

export function ReviewGrid({ reviews }: { reviews: PublicReview[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((r) => (
        <li key={r.id} className="flex flex-col rounded-brand border border-black/10 bg-white p-5">
          <Stars value={r.calificacion} className="text-lg" />
          <p className="mt-3 flex-1 text-sm leading-relaxed text-ink">“{r.comentario}”</p>
          <div className="mt-4 flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-ink">{r.nombre}</span>
            <span className="text-ink-soft">
              {r.verificada && "✓ Compra verificada · "}
              {new Date(r.created_at).toLocaleDateString("es-NI", { month: "short", year: "numeric", timeZone: "America/Managua" })}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
