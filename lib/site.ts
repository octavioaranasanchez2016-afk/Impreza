import { WORKSHOP } from "./shipping";

export const SITE_NAME = "Impreza";
export const SITE_DESCRIPTION =
  "Camisas, polos, hoodies, gorras y tote bags con tu diseño. Serigrafía, DTF, sublimado y bordado en Managua, desde 1 pieza hasta pedidos por mayor. Diseña en línea a escala real y recibe en 7 días hábiles.";

// Dominio principal. imprezani.com (sin www) redirige aquí, y el viejo
// impreza-pink.vercel.app sigue funcionando.
const PRODUCTION_URL = "https://www.imprezani.com";

// Dominio público del sitio: el que se configure, el principal en Vercel, o localhost.
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL ? PRODUCTION_URL : "http://localhost:3000");
}

// Datos del negocio para Google (schema.org), en la página de inicio.
export function businessJsonLd() {
  const url = siteUrl();
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url,
    logo: `${url}/logo/impreza.png`,
    image: `${url}/opengraph-image`,
    ...(phone ? { telephone: `+${phone}` } : {}),
    priceRange: "C$",
    currenciesAccepted: "NIO, USD",
    paymentAccepted: "Transferencia bancaria",
    hasMap: WORKSHOP.mapsUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Managua",
      addressCountry: "NI",
    },
    areaServed: { "@type": "Country", name: "Nicaragua" },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "17:00",
      },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "08:00", closes: "12:00" },
    ],
  };
}
