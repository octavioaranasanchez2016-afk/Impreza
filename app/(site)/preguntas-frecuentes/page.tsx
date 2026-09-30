import { VolumeDiscountBar } from "@/components/VolumeDiscountBar";
import { FaqList } from "@/components/FaqList";
import { TechniqueGuide } from "@/components/TechniqueGuide";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";

export const metadata = {
  title: "Preguntas frecuentes",
  alternates: { canonical: "/preguntas-frecuentes" },
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
        q: "¿Cómo sé qué talla pedir?",
        a: "Cada producto tiene su guía de tallas con el ancho de pecho y el largo en centímetros. El truco: extiende una camisa que te quede bien, mídela y compárala con la guía. En pedidos de grupo cada persona elige su talla, y puedes mezclar tallas en un mismo pedido sin perder el descuento.",
      },
      {
        q: "¿Hacen entrega a domicilio?",
        a: "Sí, puerta a puerta. Al hacer tu pedido elige «Entrega a domicilio» y escribe tu dirección con señas; si estás en el lugar de entrega, también puedes compartir tu ubicación GPS para que el repartidor llegue directo. El delivery sale del Taller Impreza y se cobra por kilómetro: lo ves calculado en tu factura antes de pagar (con tu ubicación GPS, el cálculo es exacto).",
      },
      {
        q: "¿Puedo recoger mi pedido?",
        a: "Sí, y es gratis. Elige «Recoger en el taller» al hacer tu pedido. Estamos en el Taller Impreza, en Managua: lunes a viernes de 8am a 5pm y sábados de 8am a 12pm. Te avisamos por WhatsApp cuando esté listo.",
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
    id: "tecnicas",
    title: "Técnicas de impresión",
    faqs: [
      {
        q: "¿Qué es la serigrafía?",
        a: "Es la técnica clásica: la tinta pasa a través de una malla directo sobre la tela, un color a la vez. Da colores sólidos, intensos y muy resistentes al lavado. Es ideal para logos de 1 a 3 colores y para pedidos grandes, como uniformes, eventos o graduaciones.",
      },
      {
        q: "¿Qué es el sublimado?",
        a: "Con calor, la tinta se convierte en gas y se funde con las fibras de poliéster: queda dentro de la tela, así que no se siente al tacto y no se agrieta ni se despega. Reproduce fotos y diseños a todo color. Solo funciona en poliéster blanco o de color claro, porque la tinta es transparente.",
      },
      {
        q: "¿Qué es el DTF?",
        a: "DTF significa «Direct To Film»: el diseño se imprime a todo color en una película especial y se pega a la prenda con calor. Sirve en cualquier tela y color (incluso prendas oscuras o de algodón), reproduce fotos y degradados, y conviene desde 1 pieza. Se siente como una capa fina y flexible sobre la tela.",
      },
      {
        q: "¿Qué es el bordado?",
        a: "Tu logo se cose con hilo directo en la prenda. Es el acabado más elegante y dura años: no se despinta ni se agrieta. Lo usamos en polos y gorras, ideal para uniformes de empresa. Los detalles muy finos y los degradados no se pueden bordar.",
      },
      {
        q: "¿Qué técnica me conviene?",
        a: "Para muchas piezas con un logo de pocos colores, serigrafía. Para fotos o diseños a todo color en pocas piezas, o en prendas oscuras, DTF. Para diseños a todo color que no se sientan, en camisas de poliéster claras, sublimado. Para un logo elegante en polos o gorras, bordado. Puedes mezclar técnicas en un mismo pedido.",
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
        a: "La vista previa está a escala: al acomodar tu diseño ves su tamaño real en centímetros. El área máxima es de 30 × 40 cm en camisas, 30 × 22 cm al frente del hoodie (arriba del bolsillo), 34 × 28 cm en su espalda, 10 × 10 cm en cada manga, 8 × 8 cm en la etiqueta y 30 × 30 cm en la tote bag. En bordado: 10 × 10 cm al pecho de la polo, 25 × 20 cm en su espalda y 11 × 5.5 cm al frente de la gorra.",
      },
      {
        q: "¿Puedo poner mi propia etiqueta en la camisa o el hoodie?",
        a: "Sí. En camisas, polos y hoodies elige la zona «Etiqueta» en el diseñador: va por dentro, debajo del cuello. Ideal para el logo de tu marca, la talla o las instrucciones de lavado.",
      },
      {
        q: "¿Puedo hacer que mi imagen ocupe todo el espacio?",
        a: "Sí. En «Encuadre» elige «Llenar área» para que tu imagen cubra toda el área de impresión, o «Recortar» para elegir exactamente qué parte de tu imagen se imprime. También puedes usar «Máximo» en el tamaño.",
      },
      {
        q: "¿Puedo poner diseños en la espalda o la manga?",
        a: "Sí. Ninguna zona es obligatoria: puedes poner un diseño distinto en el frente, la espalda, cada manga (izquierda y derecha) y la etiqueta por dentro del cuello.",
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

// Las preguntas en el formato que Google entiende (pueden salir en los resultados).
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SECTIONS.flatMap((s) =>
    s.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))
  ),
};

export default function PreguntasFrecuentesPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
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

      <FaqList
        sections={SECTIONS}
        extras={{
          tecnicas: (
            <div className="mt-4">
              <TechniqueGuide comparison compact />
            </div>
          ),
          pagos: (
            <div className="mt-4 rounded-brand border border-black/10 bg-white p-5">
              <p className="text-sm font-semibold text-ink">Descuento por cantidad</p>
              <p className="mt-1 text-xs text-ink-soft">Aplica automáticamente sobre el total de piezas de tu pedido.</p>
              <div className="mt-4">
                <VolumeDiscountBar />
              </div>
            </div>
          ),
        }}
      />

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
