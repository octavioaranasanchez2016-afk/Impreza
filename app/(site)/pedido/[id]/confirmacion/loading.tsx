// Mientras se busca el pedido (al rastrearlo o al terminar de pedir).
export default function ConfirmacionLoading() {
  return (
    <section className="mx-auto max-w-2xl animate-pulse px-4 py-14 md:px-6" aria-busy="true">
      <div className="h-3 w-24 rounded bg-paper-soft" />
      <div className="mt-3 h-12 w-3/4 rounded-brand bg-paper-soft" />
      <div className="mt-8 grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-2 rounded-full bg-paper-soft" />
        ))}
      </div>
      <div className="mt-8 h-48 rounded-brand bg-paper-soft" />
      <p className="mt-4 text-center text-sm text-ink-muted">Buscando tu pedido…</p>
    </section>
  );
}
