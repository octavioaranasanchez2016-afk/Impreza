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
  Anton,
  Russo_One,
  Racing_Sans_One,
  Alfa_Slab_One,
  Bangers,
  Luckiest_Guy,
  Sedgwick_Ave_Display,
  Kaushan_Script,
  Dancing_Script,
  Great_Vibes,
  Satisfy,
  Yellowtail,
  Rye,
  Cinzel,
  Abril_Fatface,
  Righteous,
  Orbitron,
  Press_Start_2P,
  Creepster,
  Metal_Mania,
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
const condensada = Anton({ subsets: ["latin"], weight: "400", variable: "--font-condensada", preload: false });
const deportiva = Russo_One({ subsets: ["latin"], weight: "400", variable: "--font-deportiva", preload: false });
const carreras = Racing_Sans_One({ subsets: ["latin"], weight: "400", variable: "--font-carreras", preload: false });
const slab = Alfa_Slab_One({ subsets: ["latin"], weight: "400", variable: "--font-slab", preload: false });
const comic = Bangers({ subsets: ["latin"], weight: "400", variable: "--font-comic", preload: false });
const caricatura = Luckiest_Guy({ subsets: ["latin"], weight: "400", variable: "--font-caricatura", preload: false });
const grafiti = Sedgwick_Ave_Display({ subsets: ["latin"], weight: "400", variable: "--font-grafiti", preload: false });
const pincel = Kaushan_Script({ subsets: ["latin"], weight: "400", variable: "--font-pincel", preload: false });
const cursiva = Dancing_Script({ subsets: ["latin"], weight: "700", variable: "--font-cursiva", preload: false });
const caligrafia = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-caligrafia", preload: false });
const firma = Satisfy({ subsets: ["latin"], weight: "400", variable: "--font-firma", preload: false });
const vintage = Yellowtail({ subsets: ["latin"], weight: "400", variable: "--font-vintage", preload: false });
const vaquera = Rye({ subsets: ["latin"], weight: "400", variable: "--font-vaquera", preload: false });
const clasica = Cinzel({ subsets: ["latin"], weight: "700", variable: "--font-clasica", preload: false });
const revista = Abril_Fatface({ subsets: ["latin"], weight: "400", variable: "--font-revista", preload: false });
const setentas = Righteous({ subsets: ["latin"], weight: "400", variable: "--font-setentas", preload: false });
const futurista = Orbitron({ subsets: ["latin"], weight: "700", variable: "--font-futurista", preload: false });
const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-pixel", preload: false });
const terror = Creepster({ subsets: ["latin"], weight: "400", variable: "--font-terror", preload: false });
const metal = Metal_Mania({ subsets: ["latin"], weight: "400", variable: "--font-metal", preload: false });
const designerFonts = [
  colegial,
  gotica,
  marcador,
  manuscrita,
  retro,
  bloque,
  militar,
  redonda,
  condensada,
  deportiva,
  carreras,
  slab,
  comic,
  caricatura,
  grafiti,
  pincel,
  cursiva,
  caligrafia,
  firma,
  vintage,
  vaquera,
  clasica,
  revista,
  setentas,
  futurista,
  pixel,
  terror,
  metal,
]
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
