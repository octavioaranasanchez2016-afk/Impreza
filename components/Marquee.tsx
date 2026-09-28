// Franja que se desplaza sola. La lista se repite dos veces para que el
// recorrido de -50% empalme sin salto.
export function Marquee({ items }: { items: string[] }) {
  const row = items.map((item) => (
    <span key={item} className="flex items-center gap-8 px-4">
      {item}
      <span aria-hidden className="text-paper/40">✦</span>
    </span>
  ));
  return (
    <div className="overflow-hidden border-y border-ink bg-ink py-4 text-paper">
      <div className="flex w-max animate-marquee font-display text-2xl tracking-wide motion-reduce:animate-none md:text-3xl">
        <div className="flex">{row}</div>
        <div className="flex" aria-hidden>
          {row}
        </div>
      </div>
    </div>
  );
}
