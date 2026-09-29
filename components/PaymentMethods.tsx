// Formas de pago del paso 5. La tarjeta se muestra como "próximamente": todavía
// no hay pasarela conectada, así que no se puede elegir ni se piden datos de tarjeta.
export function PaymentMethods() {
  return (
    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Forma de pago">
      <div
        role="radio"
        aria-checked="true"
        className="flex items-center gap-3 rounded-brand border-2 border-ink bg-ink px-4 py-3 text-paper"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper/15">
          <BankIcon />
        </span>
        <span>
          <span className="block text-sm font-semibold">Transferencia bancaria</span>
          <span className="block text-xs text-paper/70">BAC · córdobas o dólares</span>
        </span>
      </div>
      <div
        role="radio"
        aria-checked="false"
        aria-disabled="true"
        className="relative flex cursor-not-allowed items-center gap-3 rounded-brand border-2 border-dashed border-black/15 bg-white px-4 py-3 text-ink"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-soft text-ink-soft">
          <CardIcon />
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink-soft">Tarjeta de crédito o débito</span>
          <span className="block text-xs text-ink-muted">Visa · Mastercard · American Express</span>
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper">
          Próximamente
        </span>
      </div>
    </div>
  );
}

function BankIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M3 8 10 4l7 4M4 8v7M8 8v7M12 8v7M16 8v7M3 16h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.8" />
      <path d="M2.5 8h15M5.5 12.5h3" strokeLinecap="round" />
    </svg>
  );
}
