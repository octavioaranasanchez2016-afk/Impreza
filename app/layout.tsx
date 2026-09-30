import type { Metadata } from "next";
import {
  Inter,
  Bebas_Neue,
  Pacifico,
  Playfair_Display,
  JetBrains_Mono,
  Graduate,
  UnifrakturMaguntia,
  Permanent_Marker,
  Caveat,
  Lobster,
  Bungee,
  Black_Ops_One,
  Fredoka,
} from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

// Fuentes disponibles para el texto que el cliente agrega a su diseño
// (ver lib/design.ts FONT_OPTIONS). Cargadas una sola vez aquí y expuestas
// como variables CSS, disponibles en todo el sitio (incluido /admin).
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-script" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
// Fuentes extra del diseñador: sin precarga, así solo se descargan cuando alguien las usa.
const colegial = Graduate({ subsets: ["latin"], weight: "400", variable: "--font-colegial", preload: false });
const gotica = UnifrakturMaguntia({ subsets: ["latin"], weight: "400", variable: "--font-gotica", preload: false });
const marcador = Permanent_Marker({ subsets: ["latin"], weight: "400", variable: "--font-marcador", preload: false });
const manuscrita = Caveat({ subsets: ["latin"], weight: "700", variable: "--font-manuscrita", preload: false });
const retro = Lobster({ subsets: ["latin"], weight: "400", variable: "--font-retro", preload: false });
const bloque = Bungee({ subsets: ["latin"], weight: "400", variable: "--font-bloque", preload: false });
const militar = Black_Ops_One({ subsets: ["latin"], weight: "400", variable: "--font-militar", preload: false });
const redonda = Fredoka({ subsets: ["latin"], weight: "600", variable: "--font-redonda", preload: false });
const designerFonts = [colegial, gotica, marcador, manuscrita, retro, bloque, militar, redonda]
  .map((f) => f.variable)
  .join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Impreza — Serigrafía, DTF, sublimado y bordado en Managua", template: "%s — Impreza" },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "es_NI",
    siteName: SITE_NAME,
    title: "Impreza — Serigrafía, DTF, sublimado y bordado en Managua",
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

// Layout raíz: solo html/body/fuentes. El "chrome" (header/footer/WhatsApp)
// vive en app/(site)/layout.tsx para que /admin no lo herede.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${bebas.variable} ${pacifico.variable} ${playfair.variable} ${jetbrains.variable} ${designerFonts} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
