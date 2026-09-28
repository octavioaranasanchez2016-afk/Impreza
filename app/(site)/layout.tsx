import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFloatingButton } from "@/components/WhatsAppButton";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-paper/90">
        Listo en {PRODUCTION_BUSINESS_DAYS} días hábiles · Desde 1 pieza · Paga por transferencia BAC en C$ o US$
      </div>
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloatingButton />
    </>
  );
}
