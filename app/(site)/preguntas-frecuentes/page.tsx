import { VolumeDiscountBar } from "@/components/VolumeDiscountBar";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";

export const metadata = {
  title: "Preguntas frecuentes — Impreza",
};

const FAQS = [
  {
    q: "¿Cuánto tarda mi pedido?",
    a: "En promedio, alrededor de una semana desde que confirmamos el diseño hasta que está listo. El tiempo exacto depende de la técnica y la cantidad.",
  },
  {
    q: "¿Hacen entrega a domicilio?",
    a: "Estamos afinando los detalles de entrega a domicilio (costos según zona). Por ahora, coordina la entrega o recogida directamente por WhatsApp una vez confirmado tu pedido.",
  },
  {
    q: "¿Hay una cantidad mínima de pedido?",
    a: "No — aceptamos desde 1 sola pieza. Eso sí, entre más pidas, menos pagas por unidad (ver tabla de descuentos abajo).",
  },
  {
    q: "¿Puedo pedir cambios o devoluciones?",
    a: "Sí, siempre que el error sea nuestro (por ejemplo, un defecto de impresión o producción). Si el error es del diseño que el cliente subió, lo coordinamos caso por caso.",
  },
  {
    q: "¿Cómo se calcula el precio?",
    a: "El precio depende del producto, la técnica de impresión y la cantidad total del pedido. Entre más piezas, aplica un descuento automático — lo ves en tiempo real al armar tu pedido.",
  },
  {
    q: "¿Qué formas de pago aceptan?",
    a: "Solo transferencia bancaria. Al armar tu pedido ves la factura con el total, transfieres y adjuntas la foto o captura del comprobante. Así tu pedido queda confirmado; nosotros verificamos el pago y te escribimos por WhatsApp.",
  },
  {
    q: "¿Qué archivo necesito para mi diseño?",
    a: "Una imagen JPG de al menos 1000 píxeles por lado. También puedes escribir un texto directamente en el sitio, sin subir nada.",
  },
  {
    q: "¿De qué tamaño se imprime mi diseño?",
    a: "La vista previa está a escala: al acomodar tu diseño ves su tamaño real en centímetros. El área máxima es de 30 × 40 cm en camisas, 30 × 22 cm al frente del hoodie (arriba del bolsillo), 34 × 28 cm en su espalda, 10 × 10 cm en la manga y 30 × 30 cm en la tote bag.",
  },
];

export default function PreguntasFrecuentesPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <h1 className="text-3xl font-bold text-ink md:text-4xl">Preguntas frecuentes</h1>
      <p className="mt-2 text-ink-soft">Todo lo que necesitas saber antes de pedir.</p>

      <div className="mt-8 divide-y divide-black/5 rounded-brand border border-black/10 bg-white">
        {FAQS.map((f) => (
          <details key={f.q} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-ink">
              {f.q}
              <span className="ml-4 text-ink-soft transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-ink-soft">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 rounded-brand border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">Descuento por cantidad</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Aplica automáticamente sobre el total de piezas de tu pedido.
        </p>
        <div className="mt-4">
          <VolumeDiscountBar />
        </div>
      </div>

      <div className="mt-10 rounded-brand bg-ink p-6 text-center text-paper">
        <p className="font-semibold">¿No encontraste tu respuesta?</p>
        <WhatsAppLinkButton
          message="Hola, tengo una pregunta antes de hacer mi pedido en Impreza."
          className="mt-3 inline-block rounded-brand bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Escríbenos por WhatsApp
        </WhatsAppLinkButton>
      </div>
    </section>
  );
}
