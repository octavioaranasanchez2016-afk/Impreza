import Link from "next/link";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";

export const metadata = {
  title: "Privacidad",
  description: "Qué datos pedimos al hacer un pedido en Impreza, para qué los usamos y cómo los cuidamos.",
};

const SECTIONS = [
  {
    title: "Qué datos pedimos",
    items: [
      "Tu nombre, teléfono/WhatsApp y, si quieres, tu correo.",
      "Tu dirección con señas si eliges entrega a domicilio, y tu ubicación GPS solo si decides compartirla.",
      "Los diseños que subes y la foto del comprobante de tu transferencia.",
    ],
  },
  {
    title: "Para qué los usamos",
    items: [
      "Para producir tu pedido, verificar tu pago y avisarte por WhatsApp cómo va.",
      "Para entregarte el pedido: tu dirección solo se comparte con la persona que hace la entrega.",
      "No vendemos ni compartimos tus datos con nadie más, y no te enviamos publicidad sin tu permiso.",
    ],
  },
  {
    title: "Cómo los cuidamos",
    items: [
      "Tus diseños y comprobantes se guardan en un almacenamiento privado: solo el equipo de Impreza puede verlos.",
      "La página de estado de tu pedido muestra solo tu zona de entrega, nunca tu dirección completa.",
      "Usamos tus diseños únicamente para imprimir tu pedido; nunca los publicamos sin tu autorización.",
    ],
  },
  {
    title: "Tus derechos",
    items: [
      "Puedes pedirnos por WhatsApp ver, corregir o borrar tus datos cuando quieras.",
      "Guardamos los datos de tus pedidos solo el tiempo necesario para atenderte y llevar nuestra contabilidad.",
    ],
  },
];

export default function PrivacidadPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Tus datos</p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-7xl">Privacidad</h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        Pedimos solo lo necesario para hacer y entregar tu pedido. Aquí te explicamos qué datos son y cómo los cuidamos.
      </p>

      <div className="mt-10 space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.title} className="rounded-brand border border-black/10 bg-white p-6">
            <h2 className="font-display text-3xl uppercase tracking-wide text-ink">{s.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {s.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-brand bg-ink p-6 text-center text-paper">
        <p className="font-semibold">¿Quieres ver, corregir o borrar tus datos?</p>
        <WhatsAppLinkButton
          message="Hola, quiero hacer una consulta sobre mis datos personales en Impreza."
          className="mt-3 inline-block rounded-brand bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Escríbenos por WhatsApp
        </WhatsAppLinkButton>
        <p className="mt-4 text-xs text-paper/60">
          <Link href="/preguntas-frecuentes" className="underline">
            Preguntas frecuentes
          </Link>
        </p>
      </div>
    </section>
  );
}
