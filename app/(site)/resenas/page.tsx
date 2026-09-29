import Link from "next/link";
import { getApprovedReviews } from "@/lib/reviews";
import { ReviewGrid, ReviewSummary } from "@/components/ReviewCards";

export const metadata = {
  title: "Reseñas",
  description: "Lo que dicen los clientes de Impreza. Solo publicamos reseñas de pedidos reales ya entregados.",
};

export const revalidate = 300;

export default async function ResenasPage() {
  const { reviews, stats } = await getApprovedReviews();

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Clientes</p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-7xl">Reseñas</h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        Solo publicamos reseñas de pedidos reales ya entregados. Cada cliente la deja desde la página de su pedido.
      </p>

      {reviews.length > 0 ? (
        <>
          <div className="mt-8">
            <ReviewSummary stats={stats} />
          </div>
          <div className="mt-8">
            <ReviewGrid reviews={reviews} />
          </div>
        </>
      ) : (
        <div className="mt-10 rounded-brand border border-dashed border-black/15 bg-white p-8 text-center">
          <p className="font-semibold text-ink">Todavía no hay reseñas publicadas.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
            ¿Ya recibiste tu pedido? Entra a{" "}
            <Link href="/seguimiento" className="font-semibold text-ink underline">
              Rastrear pedido
            </Link>{" "}
            con tu código y deja la tuya.
          </p>
        </div>
      )}
    </section>
  );
}
