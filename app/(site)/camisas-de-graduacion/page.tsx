import { OccasionLanding, OccasionLandingProps, exampleTotal } from "@/components/OccasionLanding";
import { formatCordobas } from "@/lib/currency";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";
import { getUnitPrice } from "@/lib/pricing";

export const metadata = {
  title: "Camisas de graduación en Managua",
  alternates: { canonical: "/camisas-de-graduacion" },
  description:
    "Camisas de promoción con el nombre de cada quien en su camisa, el escudo del colegio y el año. Cada quien elige su talla y desde 24 camisas ahorran 20%.",
};

const example = { label: "30 camisas de graduación", productId: "camisa-basica", technique: "serigrafia" as const, fabric: "algodon", quantity: 30 };
const perPiece = exampleTotal(example).perPiece;

const PAGE: OccasionLandingProps = {
  eyebrow: "Graduaciones",
  title: "Camisas de graduación",
  intro:
    "Cada camisa con el nombre o el número de cada quien, donde ustedes decidan: en la espalda, la manga o el pecho. El escudo del colegio y el año van igual en todas, cada quien elige su talla, y entre más sean, menos paga cada uno.",
  start: "Graduación",
  points: [
    "Cada camisa con el nombre o número de cada quien",
    "Cada quien se anota desde su teléfono con su nombre y su talla",
    "Desde 24 camisas ahorran 20%; desde 48, 25%",
    `Listas en ${PRODUCTION_BUSINESS_DAYS} días hábiles desde el pago`,
  ],
  ideasTitle: "Ideas para tu promoción",
  ideas: [
    { title: "Tu nombre en tu camisa", text: "El nombre o apodo de cada quien en la espalda o la manga. Cada uno lo escribe al anotarse y ve su camisa antes de confirmar." },
    { title: "Escudo al frente", text: "El escudo o logo del colegio en el pecho, con el nombre de la promoción debajo." },
    { title: "El año en la manga", text: "«Promoción 2026» o el lema del grupo en una de las mangas." },
    { title: "Etiqueta propia", text: "El nombre de la promoción por dentro del cuello, como recuerdo." },
  ],
  example,
  steps: [
    ["Cotiza aquí", "Elige cuántas camisas y mira el precio por persona al instante."],
    ["Creen la lista", "Cada quien se anota desde su teléfono con su nombre y su talla, y ve su camisa con su nombre."],
    ["Diseña y paga", "Sube su diseño o escribe el texto, transfiere y adjunta el comprobante."],
    ["Recíbanlas juntas", `En ${PRODUCTION_BUSINESS_DAYS} días hábiles desde el pago, a domicilio o en el taller.`],
  ],
  faqs: [
    {
      q: "¿Cada camisa puede llevar el nombre de cada quien?",
      a: "Sí. Con la Lista de tallas, el organizador hace el diseño de todos y decide dónde va el nombre, apodo o número de cada quien: en la espalda, las mangas o el pecho. Cada persona lo escribe al anotarse y ve su camisa antes de confirmar.",
    },
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
    templateHref: "/pedido?producto=camisa-basica&tecnica=serigrafia&tela=algodon&cantidad=30&nota=Graduaci%C3%B3n&plantilla=promo-clasica",
  },
};

export default function CamisasDeGraduacionPage() {
  return <OccasionLanding {...PAGE} />;
}
