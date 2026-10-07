import { SizeListCreate } from "@/components/SizeListCreate";

export const metadata = {
  title: "Lista de tallas para tu grupo",
  alternates: { canonical: "/lista-de-tallas" },
  description:
    "Junta las tallas de tu graduación, equipo o empresa sin perseguir a nadie por WhatsApp: comparte un enlace, cada quien anota su talla y tú ves el resumen al instante.",
};

const STEPS: [string, string][] = [
  ["Crea la lista", "Ponle nombre al grupo y elige la prenda. Toma menos de un minuto."],
  ["Haz el diseño", "Pones el diseño del grupo y, si quieres, dónde va el nombre o número de cada quien."],
  ["Compártela", "Manda el enlace al chat. Cada quien ve su camisa con su nombre, lo escribe y toca su talla."],
  ["Arma el pedido", "Con un botón pasan el diseño, las tallas y los nombres. No hay que repetir nada."],
];

export default function ListaDeTallasPage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-14 md:px-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="lg:pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Para grupos</p>
          <h1 className="mt-2 max-w-3xl font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-7xl">
            Lista de tallas
          </h1>
          <p className="mt-4 max-w-xl text-ink-soft">
            Juntar las tallas de 30 personas por WhatsApp es un dolor de cabeza. Crea una lista, comparte el enlace con tu grupo
            y cada quien anota su talla. Tú solo ves el resumen y armas el pedido.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-ink">
            {[
              "Gratis y sin cuenta, para el organizador y para el grupo",
              "Cada quien se anota desde su teléfono en un minuto",
              "Resumen en vivo por talla, listo para pedir",
              "Ideal para graduaciones, equipos, iglesias y empresas",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] text-paper">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <SizeListCreate />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <h2 className="font-display text-4xl uppercase leading-none tracking-wide text-ink md:text-5xl">Cómo funciona</h2>
        <ol className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-brand border border-black/10 bg-black/10 md:grid-cols-4">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="bg-white p-4 sm:p-6">
              <span className="font-display text-5xl leading-none text-ink/15">{i + 1}</span>
              <p className="mt-3 font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
