import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFloatingButton } from "@/components/WhatsAppButton";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { getApprovedReviews } from "@/lib/reviews";

// Las páginas se rehacen cada 5 minutos: así el enlace de Reseñas aparece solo con la
// primera reseña aprobada, sin publicar de nuevo.
export const revalidate = 300;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { stats } = await getApprovedReviews(1).catch(() => ({ stats: { count: 0 } }));
  const showReviews = stats.count > 0;
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
        Listo en {PRODUCTION_BUSINESS_DAYS} días hábiles · Desde 1 pieza · Garantía de reposición
        <span className="hidden md:inline"> · Paga por transferencia BAC en C$ o US$</span>
      </div>
      <Header showReviews={showReviews} />
      <main id="contenido">{children}</main>
      <Footer showReviews={showReviews} />
      <WhatsAppFloatingButton />
      <SiteAnalytics />
    </>
  );
}
