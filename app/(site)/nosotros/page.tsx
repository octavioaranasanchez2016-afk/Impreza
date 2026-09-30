import Link from "next/link";
import { WorkshopMap } from "@/components/WorkshopMap";
import { WORKSHOP } from "@/lib/shipping";

export const metadata = {
  title: "Quiénes somos",
  alternates: { canonical: "/nosotros" },
  description: "La historia y los valores detrás de Impreza, ropa personalizada hecha en Managua, Nicaragua. Horario y cómo llegar.",
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
        <p className="mt-5 text-lg leading-relaxed text-ink">
          Todo empezó con una pregunta, a los 17 años: ¿por qué es tan difícil conseguir una camisa con tu propio diseño, bien
          hecha y sin complicaciones?
        </p>
        <p className="mt-4 leading-relaxed text-ink-soft">
          La respuesta estaba en todas partes. Para una camisa de graduación, el uniforme de un equipo o un regalo con una
          foto, había que escribir a varios talleres, mandar la idea por partes, explicar lo mismo una y otra vez y esperar
          sin saber cuánto iba a costar, cuándo iba a estar listo ni cómo iba a quedar. Muchas buenas ideas se quedaban en el
          camino, no por falta de ganas, sino porque el proceso cansaba.
        </p>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Esa pregunta nunca se fue. Creció con cada camisa que no se hizo y con cada pedido que llegó distinto a lo que
          alguien se imaginaba. Hasta que dejó de ser una pregunta y se volvió un plan: si pedir ropa personalizada era
          complicado, había que construir la forma fácil.
        </p>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Así nació Impreza, en Managua, en 2026. La idea es simple: que cualquier persona pueda crear su diseño, verlo en la
          prenda a tamaño real y saber el precio en el mismo momento, sin llamadas, sin vueltas y sin sorpresas. Diseñas en
          línea, eliges tu técnica, pagas y sigues tu pedido paso a paso hasta tenerlo en tus manos, sea una sola camisa o la
          de toda tu promoción.
        </p>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Detrás de cada pedido hay personas que lo revisan antes de imprimir, que se fijan en los detalles y que te escriben
          si algo no está claro. Porque una camisa de graduación guarda un recuerdo, un uniforme representa a un equipo y una
          marca que apenas empieza merece verse profesional desde la primera pieza.
        </p>
        <blockquote className="my-8 border-l-4 border-ink pl-5 font-display text-3xl uppercase leading-tight tracking-wide text-ink md:text-4xl">
          No queremos ser los más grandes. Queremos ser los más fáciles, los más atentos y los más cercanos.
        </blockquote>
        <p className="leading-relaxed text-ink-soft">
          Hoy empezamos en Nicaragua, una camisa a la vez. Mañana queremos que pedir tu propio diseño sea así de fácil en toda
          Centroamérica. Si tienes una idea y quieres verla puesta, este es el lugar.
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
              Nuestro taller en Managua: aquí se produce cada pedido, y aquí lo recoges gratis si no quieres delivery.
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
