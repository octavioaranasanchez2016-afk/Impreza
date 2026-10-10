import Link from "next/link";

// La garantía de Impreza, bien visible donde el cliente decide comprar: la página de cada
// producto y junto al botón de confirmar el pedido. El detalle está en Términos (#garantia).
export function GuaranteeBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-brand border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-emerald-950 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <div>
        <p className="text-sm font-bold">Garantía Impreza: si sale mal, te la hacemos de nuevo gratis</p>
        <p className="mt-0.5 text-xs text-emerald-900/80">
          Si tu pedido llega con un defecto de impresión o de producción, lo reponemos sin costo.{" "}
          <Link href="/terminos#garantia" className="font-semibold underline">
            Ver la garantía
          </Link>
        </p>
      </div>
    </div>
  );
}
