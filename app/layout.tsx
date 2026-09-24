import type { Metadata } from "next";
import { Inter, Bebas_Neue, Pacifico, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Fuentes disponibles para el texto que el cliente agrega a su diseño
// (ver lib/design.ts FONT_OPTIONS). Cargadas una sola vez aquí y expuestas
// como variables CSS, disponibles en todo el sitio (incluido /admin).
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-script" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Impreza — Serigrafía y sublimado en Managua",
  description:
    "Camisas, hoodies y tote bags con tu diseño. Serigrafía y sublimado, desde 1 pieza hasta pedidos por mayor.",
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
