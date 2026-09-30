import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFloatingButton } from "@/components/WhatsAppButton";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Para quien navega con el teclado: salta el menú y va directo al contenido. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-brand focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper"
      >
        Saltar al contenido
      </a>
      <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-paper/90">
        Listo en {PRODUCTION_BUSINESS_DAYS} días hábiles · Desde 1 pieza · Paga por transferencia BAC en C$ o US$
      </div>
      <Header />
      <main id="contenido">{children}</main>
      <Footer />
      <WhatsAppFloatingButton />
    </>
  );
}
