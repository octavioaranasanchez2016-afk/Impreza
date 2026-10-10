import { OccasionLanding, OccasionLandingProps, exampleTotal } from "@/components/OccasionLanding";
import { formatCordobas } from "@/lib/currency";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";

export const metadata = {
  title: "Camisas para equipos deportivos en Managua",
  alternates: { canonical: "/camisas-para-equipos" },
  description:
    "Camisas dry-fit sublimadas para tu equipo: escudo, patrocinadores, número y nombre de cada jugador. Desde 12 camisas ahorran 15%. Managua, Nicaragua.",
};

const example = { label: "20 camisas para tu equipo", productId: "camisa-basica", technique: "sublimado" as const, fabric: "poliester", quantity: 20 };
const perPiece = exampleTotal(example).perPiece;

const PAGE: OccasionLandingProps = {
  eyebrow: "Equipos",
  title: "Camisas para equipos",
  intro:
    "Camisas deportivas de poliéster dry-fit, livianas y que secan rápido, sublimadas a todo color. Con el escudo del equipo, los patrocinadores y el número de cada jugador.",
  start: "Equipo",
  points: [
    "Poliéster dry-fit: liviano y seca rápido",
    "Sublimado: colores vivos que no se sienten al tacto",
    "Escudo, patrocinadores, número y nombre",
    "Desde 12 camisas ahorran 15%",
  ],
  ideasTitle: "Ideas para tu equipo",
  ideas: [
    { title: "Escudo al pecho", text: "El escudo del equipo o de la liga al frente." },
    { title: "Número y nombre", text: "Grande en la espalda, distinto para cada jugador." },
    { title: "Patrocinadores", text: "Los logos de quienes apoyan al equipo, al frente o en las mangas." },
    { title: "Todos los colores", text: "Sobre camisa blanca o clara, el diseño lleva los colores y degradados que quieran." },
  ],
  example,
  steps: [
    ["Cotiza aquí", "Elige cuántas camisas y mira el precio por jugador."],
    ["Manda la lista", "Nombre, número y talla de cada jugador, para armar cada camisa."],
    ["Aprueba y paga", "Revisa el diseño, transfiere y adjunta el comprobante."],
    ["A la cancha", `En ${PRODUCTION_BUSINESS_DAYS} días hábiles desde el pago, a domicilio o en el taller.`],
  ],
  faqs: [
    {
      q: "¿Pueden poner un número y un nombre distinto en cada camisa?",
      a: "Sí. Toca «Contactar con diseñador» y mándanos la lista de jugadores con nombre, número y talla; armamos cada camisa contigo.",
    },
    {
      q: "¿Por qué sublimado?",
      a: "Porque la tinta se funde con la tela: los colores quedan vivos, no se siente al tacto y no se agrieta ni se despega. Funciona en poliéster blanco o claro.",
    },
    {
      q: "¿Y si nuestras camisas son de color oscuro?",
      a: "Entonces conviene DTF o serigrafía, que sí se ven sobre telas oscuras. Elige la técnica en el cotizador y el precio se ajusta solo.",
    },
    {
      q: "¿Cuánto cuesta cada camisa?",
      a: `Con 20 camisas dry-fit sublimadas, cada una sale en ${formatCordobas(perPiece)}. Desde 24 camisas el descuento sube a 20%.`,
    },
    {
      q: "¿Cuánto tardan?",
      a: `${PRODUCTION_BUSINESS_DAYS} días hábiles desde que verificamos el pago. Si tienen un torneo con fecha, pónganla en el cotizador y les decimos si llegamos.`,
    },
  ],
  cta: {
    title: "¿Listos para jugar?",
    message: "Hola, quiero hablar con un diseñador sobre camisas para mi equipo.",
    orderHref: "/pedido?producto=camisa-basica&tecnica=sublimado&tela=poliester&cantidad=20&nota=Equipo",
    templateHref: "/pedido?producto=camisa-basica&tecnica=sublimado&tela=poliester&cantidad=20&nota=Equipo&plantilla=equipo-escudo",
  },
};

export default function CamisasParaEquiposPage() {
  return <OccasionLanding {...PAGE} />;
}
