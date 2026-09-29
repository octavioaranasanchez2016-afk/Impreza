import { VolumeDiscountBar } from "@/components/VolumeDiscountBar";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";

export const metadata = {
  title: "Preguntas frecuentes",
  description: "Tiempos de entrega, formas de pago, envío a domicilio, archivos de diseño y más sobre tus pedidos en Impreza.",
};

const QUICK_FACTS = [
  { value: `${PRODUCTION_BUSINESS_DAYS} días hábiles`, label: "Tiempo de entrega" },
  { value: "Desde 1 pieza", label: "Sin pedido mínimo" },
  { value: "C$ o US$", label: "Transferencia BAC" },
];

const SECTIONS = [
  {
    id: "pedidos",
    title: "Pedidos y entregas",
    faqs: [
      {
        q: "¿Cuánto tarda mi pedido?",
        a: `${PRODUCTION_BUSINESS_DAYS} días hábiles (lunes a viernes), contados desde que verificamos tu pago. Al hacer tu pedido ves la fecha estimada, y te avisamos por WhatsApp cuando esté listo.`,
      },
      {
        q: "¿Hay una cantidad mínima de pedido?",
        a: "No. Aceptamos desde 1 sola pieza. Entre más pidas, menos pagas por unidad (ver la tabla de descuentos más abajo). Para graduaciones, empresas y equipos mira «Pedidos por mayor» en el pie de página.",
      },
      {
        q: "¿Hacen entrega a domicilio?",
        a: "Sí, puerta a puerta. Al hacer tu pedido elige «Entrega a domicilio» y escribe tu dirección con señas; si estás en el lugar de entrega, también puedes compartir tu ubicación GPS para que el repartidor llegue directo. El costo del envío depende de tu zona y te lo confirmamos por WhatsApp.",
      },
      {
        q: "¿Puedo recoger mi pedido?",
        a: "Sí, y es gratis. Elige «Recoger en el taller» al hacer tu pedido. Estamos en Arango Textil, Managua: lunes a viernes de 8am a 5pm y sábados de 8am a 12pm. Te avisamos por WhatsApp cuando esté listo.",
      },
      {
        q: "¿Cómo sé en qué va mi pedido?",
        a: "Entra a «Rastrear pedido» (en el menú) y escribe el código de 8 caracteres que aparece en tu factura. Ahí ves si ya verificamos tu pago, si está en producción o si ya está listo. También te avisamos por WhatsApp en cada paso.",
      },
      {
        q: "¿Cómo dejo una reseña?",
        a: "Cuando tu pedido esté listo, entra a «Rastrear pedido» con tu código: ahí aparece un formulario para calificarnos. Solo publicamos reseñas de pedidos reales.",
      },
      {
        q: "¿Qué pasa después de hacer mi pedido?",
        a: "Revisamos tu diseño y verificamos tu transferencia. Si algo no está claro te escribimos por WhatsApp; si todo está bien, tu pedido pasa a producción.",
      },
    ],
  },
  {
    id: "pagos",
    title: "Precios y pagos",
    faqs: [
      {
        q: "¿Qué formas de pago aceptan?",
        a: "Por ahora, transferencia bancaria a nuestra cuenta BAC: al armar tu pedido ves la factura con el total, transfieres y adjuntas la foto o captura del comprobante. Muy pronto también podrás pagar con tarjeta de crédito o débito.",
      },
      {
        q: "¿Dan factura con RUC?",
        a: "Sí. Al hacer tu pedido marca «Necesito factura con RUC» y escribe el nombre de tu empresa y tu número RUC. Te entregamos la factura junto con tu pedido.",
      },
      {
        q: "¿Me pueden dar una proforma para que mi empresa la apruebe?",
        a: "Sí. Arma tu pedido en el diseñador y, en el paso «Tu factura», toca «Descargar proforma (PDF)». Sale con los productos, el total en córdobas y dólares y las cuentas para transferir, lista para enviarla a quien aprueba el pago.",
      },
      {
        q: "¿Qué escribo en el concepto de la transferencia?",
        a: "El código de tu pedido, que aparece en el paso de pago antes de transferir (por ejemplo CB07F9DB). Así identificamos tu pago más rápido.",
      },
      {
        q: "¿Puedo pagar en dólares?",
        a: "Sí. Tenemos una cuenta en córdobas y otra en dólares. El monto en dólares se calcula con el tipo de cambio oficial del Banco Central y lo ves junto a cada cuenta.",
      },
      {
        q: "¿Cómo se calcula el precio?",
        a: "Depende del producto, la técnica de impresión y la cantidad total del pedido. Entre más piezas, aplica un descuento automático que ves en tiempo real al armar tu pedido.",
      },
    ],
  },
  {
    id: "diseno",
    title: "Diseño y archivos",
    faqs: [
      {
        q: "¿Qué archivo necesito para mi diseño?",
        a: "Una imagen JPG de al menos 1000 píxeles por lado. También puedes escribir un texto directamente en el sitio, sin subir nada.",
      },
      {
        q: "¿De qué tamaño se imprime mi diseño?",
        a: "La vista previa está a escala: al acomodar tu diseño ves su tamaño real en centímetros. El área máxima es de 30 × 40 cm en camisas, 30 × 22 cm al frente del hoodie (arriba del bolsillo), 34 × 28 cm en su espalda, 10 × 10 cm en la manga y 30 × 30 cm en la tote bag. En bordado: 10 × 10 cm al pecho de la polo, 25 × 20 cm en su espalda y 11 × 5.5 cm al frente de la gorra.",
      },
      {
        q: "¿Hacen bordado?",
        a: "Sí. Las polos y las gorras llevan tu logo bordado. Sube tu logo en JPG o escribe tu texto en el diseñador, y ves el tamaño real del bordado en centímetros.",
      },
      {
        q: "¿Puedo hacer que mi imagen ocupe todo el espacio?",
        a: "Sí. Usa el botón «Máximo» junto al tamaño, o elige «Llenar el área» para que la imagen cubra toda el área de impresión (se recortan un poco los bordes).",
      },
      {
        q: "¿Puedo poner diseños en la espalda o la manga?",
        a: "Sí. Ninguna zona es obligatoria: puedes poner un diseño distinto en frente, espalda y manga.",
      },
      {
        q: "¿Puedo pedir productos con diseños distintos en un mismo pedido?",
        a: "Sí. Cada producto se guarda con el diseño que tiene el diseñador cuando tocas «Agregar al pedido». Para otro diseño, cámbialo y vuelve a agregar: en tu pedido verás «Diseño 1», «Diseño 2», etc., con las piezas de cada uno.",
      },
    ],
  },
  {
    id: "cambios",
    title: "Cambios y devoluciones",
    faqs: [
      {
        q: "¿Puedo pedir cambios o devoluciones?",
        a: "Sí, siempre que el error sea nuestro (por ejemplo, un defecto de impresión o producción). Si el error es del diseño que el cliente subió, lo coordinamos caso por caso.",
      },
    ],
  },
];

export default function PreguntasFrecuentesPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-7xl">Preguntas frecuentes</h1>
      <p className="mt-2 text-ink-soft">Todo lo que necesitas saber antes de pedir.</p>

      <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
        {QUICK_FACTS.map((f) => (
          <div key={f.label} className="rounded-brand bg-ink px-3 py-4 text-center text-paper">
            <p className="text-sm font-bold sm:text-lg">{f.value}</p>
            <p className="mt-0.5 text-[11px] text-paper/70 sm:text-xs">{f.label}</p>
          </div>
        ))}
      </div>

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Temas">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-black/15 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((s) => (
          <div key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="font-display text-3xl uppercase tracking-wide text-ink">{s.title}</h2>
            <div className="mt-3 divide-y divide-black/5 rounded-brand border border-black/10 bg-white">
              {s.faqs.map((f) => (
                <details key={f.q} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
                    {f.q}
                    <span className="shrink-0 text-xl leading-none text-ink-soft transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</p>
                </details>
              ))}
            </div>

            {s.id === "pagos" && (
              <div className="mt-4 rounded-brand border border-black/10 bg-white p-5">
                <p className="text-sm font-semibold text-ink">Descuento por cantidad</p>
                <p className="mt-1 text-xs text-ink-soft">Aplica automáticamente sobre el total de piezas de tu pedido.</p>
                <div className="mt-4">
                  <VolumeDiscountBar />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-brand bg-ink p-6 text-center text-paper">
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
