import { OccasionLanding, OccasionLandingProps, exampleTotal } from "@/components/OccasionLanding";
import { formatCordobas } from "@/lib/currency";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";
import { getUnitPrice } from "@/lib/pricing";

export const metadata = {
  title: "Uniformes para empresas en Managua",
  alternates: { canonical: "/uniformes-para-empresas" },
  description:
    "Polos bordados, camisas y hoodies con el logo de tu empresa. Factura con RUC, proforma en PDF y hasta 40% de descuento por volumen. Managua, Nicaragua.",
};

const example = { label: "24 polos con tu logo", productId: "polo-bordada", technique: "bordado" as const, quantity: 24 };
const perPiece = exampleTotal(example).perPiece;

const PAGE: OccasionLandingProps = {
  eyebrow: "Empresas",
  title: "Uniformes para empresas",
  intro:
    "Tu logo bordado en polos, o impreso en camisas y hoodies, para tu equipo o tus clientes. Con factura con RUC y una proforma en PDF para que tu empresa la apruebe.",
  start: "Empresa",
  points: [
    "Polos con el logo bordado al pecho",
    "Factura con RUC y proforma en PDF",
    "Tu propia etiqueta por dentro del cuello",
    "Desde 12 piezas empieza el descuento, hasta 40%",
  ],
  ideasTitle: "Ideas para tu empresa",
  ideas: [
    { title: "Logo al pecho", text: "Bordado en polos: el clásico para oficina, ventas y atención al cliente." },
    { title: "Nombre atrás", text: "El nombre de la empresa o del área, grande en la espalda de camisas y hoodies." },
    { title: "Etiqueta propia", text: "Tu marca por dentro del cuello, como la ropa de tienda." },
    { title: "Regalos para clientes", text: "Gorras bordadas y tote bags con tu logo para eventos y ferias." },
  ],
  example,
  steps: [
    ["Cotiza aquí", "Elige polos, camisas o gorras y cuántas piezas; ves el total al instante."],
    ["Pide la proforma", "Arma el pedido en el diseñador y descarga la proforma en PDF para aprobarla."],
    ["Paga con factura", "Transfiere en córdobas o dólares y marca «Necesito factura con RUC»."],
    ["Recibe los uniformes", `En ${PRODUCTION_BUSINESS_DAYS} días hábiles desde el pago, en tu oficina o en el taller.`],
  ],
  faqs: [
    {
      q: "¿Dan factura con RUC?",
      a: "Sí. Al hacer el pedido marca «Necesito factura con RUC» y escribe el nombre de tu empresa y el número RUC. Te entregamos la factura junto con tu pedido.",
    },
    {
      q: "¿Me pueden dar una proforma antes de pagar?",
      a: "Sí. Arma el pedido en el diseñador y, en el paso «Tu factura», toca «Descargar proforma (PDF)». Sale con los productos, el total en córdobas y dólares y las cuentas para transferir.",
    },
    {
      q: "¿Cuánto cuesta cada polo?",
      a: `Desde ${formatCordobas(getUnitPrice("polo-bordada", "bordado"))} por polo con el logo bordado, y baja según la cantidad: con 24 polos, cada uno sale en ${formatCordobas(perPiece)}.`,
    },
    {
      q: "¿Bordado o DTF para nuestro logo?",
      a: "Bordado para un acabado elegante que dura años, ideal en polos y gorras. DTF si el logo tiene muchos colores, degradados o detalles muy finos.",
    },
    {
      q: "¿Pueden entregar en nuestra oficina?",
      a: "Sí: elige entrega a domicilio y escribe la dirección (el delivery se calcula por kilómetro y lo ves en tu factura). También puedes recoger gratis en el taller.",
    },
  ],
  cta: {
    title: "Uniformes con tu marca",
    message: "Hola, quiero hablar con un diseñador sobre uniformes con el logo de mi empresa.",
    orderHref: "/pedido?producto=polo-bordada&tecnica=bordado&cantidad=24&nota=Empresa",
  },
};

export default function UniformesParaEmpresasPage() {
  return <OccasionLanding {...PAGE} />;
}
