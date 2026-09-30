import { OccasionLanding, OccasionLandingProps, exampleTotal } from "@/components/OccasionLanding";
import { formatCordobas } from "@/lib/currency";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";
import { getUnitPrice } from "@/lib/pricing";

export const metadata = {
  title: "Camisas de graduación en Managua",
  alternates: { canonical: "/camisas-de-graduacion" },
  description:
    "Camisas de promoción con el nombre del colegio y el año. Cada quien elige su talla y desde 24 camisas ahorran 20%. Diseño en línea y entrega en Managua.",
};

const example = { label: "30 camisas de graduación", productId: "camisa-basica", technique: "serigrafia" as const, fabric: "algodon", quantity: 30 };
const perPiece = exampleTotal(example).perPiece;

const PAGE: OccasionLandingProps = {
  eyebrow: "Graduaciones",
  title: "Camisas de graduación",
  intro:
    "La camisa de tu promoción con el nombre del colegio, el año y todo lo que se les ocurra. Cada quien elige su talla, y entre más sean, menos paga cada uno.",
  start: "Graduación",
  points: [
    "Cada quien elige su talla, de S a XXL",
    "Desde 24 camisas ahorran 20%; desde 48, 25%",
    "Un diseño distinto en el frente, la espalda y cada manga",
    `Listas en ${PRODUCTION_BUSINESS_DAYS} días hábiles desde el pago`,
  ],
  ideasTitle: "Ideas para tu promoción",
  ideas: [
    { title: "Escudo al frente", text: "El escudo o logo del colegio en el pecho, con el nombre de la promoción debajo." },
    { title: "Nombres atrás", text: "La lista con los nombres de toda la promoción en la espalda." },
    { title: "El año en la manga", text: "«Promoción 2026» o el lema del grupo en una de las mangas." },
    { title: "Etiqueta propia", text: "El nombre de la promoción por dentro del cuello, como recuerdo." },
  ],
  example,
  steps: [
    ["Cotiza aquí", "Elige cuántas camisas y mira el precio por persona al instante."],
    ["Reúnan las tallas", "Cada quien dice su talla; en el diseñador las repartes y hasta mezclas colores."],
    ["Diseña y paga", "Sube su diseño o escribe el texto, transfiere y adjunta el comprobante."],
    ["Recíbanlas juntas", `En ${PRODUCTION_BUSINESS_DAYS} días hábiles desde el pago, a domicilio o en el taller.`],
  ],
  faqs: [
    {
      q: "¿Con cuánto tiempo debemos pedir las camisas?",
      a: `Tardamos ${PRODUCTION_BUSINESS_DAYS} días hábiles desde que verificamos el pago. Para ir con calma, pidan unas tres semanas antes: así hay tiempo de reunir las tallas y afinar el diseño.`,
    },
    {
      q: "¿Cada quien puede elegir su talla?",
      a: "Sí. En un mismo pedido pueden ir tallas de S a XXL, y el descuento cuenta el total de camisas, no cada talla por separado.",
    },
    {
      q: "¿Cuánto cuesta cada camisa?",
      a: `Desde ${formatCordobas(getUnitPrice("camisa-basica", "serigrafia"))} por camisa, y baja según la cantidad: con 30 camisas en serigrafía, cada una sale en ${formatCordobas(perPiece)}.`,
    },
    {
      q: "¿Qué técnica nos conviene?",
      a: "Serigrafía si el diseño es de 1 a 3 colores: es la más duradera y la más económica en cantidad. Si lleva fotos o muchos colores, DTF.",
    },
    {
      q: "¿Nos las pueden llevar al colegio?",
      a: "Sí: elige entrega a domicilio y escribe la dirección del colegio (el delivery se calcula por kilómetro y lo ves en tu factura). También pueden recogerlas gratis en el taller.",
    },
  ],
  cta: {
    title: "¿Lista tu promoción?",
    message: "Hola, quiero hablar con un diseñador para las camisas de graduación de mi promoción.",
    orderHref: "/pedido?producto=camisa-basica&tecnica=serigrafia&tela=algodon&cantidad=30&nota=Graduaci%C3%B3n",
  },
};

export default function CamisasDeGraduacionPage() {
  return <OccasionLanding {...PAGE} />;
}
