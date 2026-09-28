import type { Metadata } from "next";
import { Inter, Bebas_Neue, Pacifico, Playfair_Display, JetBrains_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Impreza — Serigrafía y sublimado en Managua", template: "%s — Impreza" },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "es_NI",
    siteName: SITE_NAME,
    title: "Impreza — Serigrafía y sublimado en Managua",
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
        className={`${inter.variable} ${bebas.variable} ${pacifico.variable} ${playfair.variable} ${jetbrains.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
