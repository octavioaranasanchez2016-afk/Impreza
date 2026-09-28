"use client";

// Imprime la hoja de producción: la página oculta al imprimir todo lo que no
// sirve en el taller (pagos, botones, factura).
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold text-ink hover:border-ink print:hidden"
    >
      Imprimir hoja
    </button>
  );
}
