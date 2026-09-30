import Link from "next/link";
import { WorkshopMap } from "@/components/WorkshopMap";
import { WORKSHOP } from "@/lib/shipping";

export const metadata = {
  title: "Quiénes somos",
  alternates: { canonical: "/nosotros" },
  description: "La historia y los valores detrás de Impreza, ropa personalizada hecha en Arango Textil, Managua. Horario y cómo llegar.",
};

const VALUES = [
  {
    title: "Sencillez",
    text: "Pedir tu diseño personalizado no debería ser complicado. Simplificamos cada paso, desde subir tu diseño hasta recibir tu pedido.",
  },
  {
    title: "Atención",
    text: "Cada pedido lo revisa una persona antes de producirlo. No eres un número en una fila de producción automática.",
  },
  {
    title: "Facilidad",
    text: "Acceso directo a impresión de calidad sin mínimos imposibles ni procesos que solo entienden los expertos.",
  },
];

export default function NosotrosPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1456456496250-d5e7c0a9b44d?w=1600&q=80&auto=format&fit=crop"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/70" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center text-paper md:px-6 md:py-32">
          <p className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
            Fundada en 2026
          </p>
          <h1 className="mt-4 font-display text-5xl uppercase leading-none tracking-wide md:text-7xl">
            Impresión personalizada, sin complicaciones.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-paper/80">
            Impreza nace en Managua con una idea simple: que cualquiera pueda
            acceder a diseños personalizados de calidad, sin vueltas.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <h2 className="font-display text-4xl uppercase tracking-wide text-ink md:text-5xl">Cómo empezó</h2>
        <p className="mt-4 leading-relaxed text-ink-soft">
          La idea de Impreza nació mucho antes de que existiera la empresa —
          desde los 17 años, con una inquietud simple: ¿por qué es tan difícil
          conseguir un diseño personalizado de calidad? Esa pregunta se quedó
          rondando hasta convertirse, en 2026, en Impreza: una marca nicaragüense
          enfocada en hacer que personalizar tu propia ropa sea tan fácil como
          debería haber sido siempre.
        </p>
        <p className="mt-4 leading-relaxed text-ink-soft">
          No competimos por ser los más grandes. Competimos por ser los más
          sencillos de usar, los más atentos con cada pedido, y los más
          accesibles para cualquiera que tenga una idea y quiera verla en una
          camisa, una polo, un hoodie, una gorra o una tote bag.
        </p>

        <Link
          href="/pedido"
          className="mt-8 inline-block rounded-brand bg-ink px-6 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-80"
        >
          Empezar mi pedido
        </Link>
      </section>

      <section className="border-y border-black/5 bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <h2 className="font-display text-4xl uppercase tracking-wide text-ink md:text-5xl">Lo que nos guía</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <div key={v.title} className="rounded-brand border border-black/5 p-6">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                  0{i + 1}
                </span>
                <p className="mt-2 font-display text-3xl uppercase tracking-wide text-ink">{v.title}</p>
                <p className="mt-2 text-sm text-ink-soft">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        <div className="grid overflow-hidden rounded-brand border border-black/10 md:grid-cols-2">
          <div className="h-72 md:h-auto md:min-h-[22rem]">
            <WorkshopMap />
          </div>
          <div className="flex flex-col justify-center p-8">
            <h2 className="font-display text-3xl uppercase tracking-wide text-ink">Dónde estamos</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Arango Textil, Managua. Aquí se produce cada pedido, y aquí lo recoges gratis si no quieres delivery.
            </p>

            <div className="mt-6 space-y-1 text-sm text-ink-soft">
              <HorarioRow dia="Lunes – Viernes" horario="8:00 a.m. – 5:00 p.m." />
              <HorarioRow dia="Sábado" horario="8:00 a.m. – 12:00 p.m." />
              <HorarioRow dia="Domingo" horario="Cerrado" />
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${WORKSHOP.lat},${WORKSHOP.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block self-start text-sm font-semibold text-ink underline"
            >
              Cómo llegar ↗
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function HorarioRow({ dia, horario }: { dia: string; horario: string }) {
  return (
    <div className="flex justify-between border-b border-black/5 py-1.5 last:border-0">
      <span>{dia}</span>
      <span className="font-medium text-ink">{horario}</span>
    </div>
  );
}
