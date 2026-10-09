import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminPage } from "@/lib/admin-auth";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { AddReviewForm } from "@/components/admin/AddReviewForm";
import { Stars } from "@/components/ReviewCards";
import { formatShortDate, toManagua } from "@/lib/delivery";

export const dynamic = "force-dynamic";

interface ReviewRow {
  id: string;
  order_id: string | null;
  nombre: string;
  calificacion: number;
  comentario: string;
  aprobada: boolean;
  created_at: string;
}

export default async function AdminResenasPage() {
  await requireAdminPage();
  const supabase = await createClient();
  const { data, error } = await supabase.from("resenas").select("*").order("created_at", { ascending: false });
  const reviews = (data ?? []) as ReviewRow[];
  const pending = reviews.filter((r) => !r.aprobada);
  const published = reviews.filter((r) => r.aprobada);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Reseñas</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Tú decides qué reseñas salen en el sitio. Agrega las que te dan tus clientes por WhatsApp o en persona; las que
        dejan los clientes desde la página de su pedido llegan aquí y solo se publican si las apruebas.
      </p>

      {error && (
        <p className="mt-6 rounded-brand bg-red-50 p-4 text-sm text-red-700">
          Las reseñas todavía no están activadas: falta correr supabase/resenas.sql en Supabase.
        </p>
      )}

      {!error && (
        <>
          <div className="mt-6">
            <AddReviewForm />
          </div>
          <ReviewList title="Por revisar" empty="No hay reseñas nuevas." reviews={pending} />
          <ReviewList title="Publicadas" empty="Todavía no has publicado ninguna reseña." reviews={published} />
        </>
      )}
    </div>
  );
}

function ReviewList({ title, empty, reviews }: { title: string; empty: string; reviews: ReviewRow[] }) {
  return (
    <section className="mt-8">
      <h2 className="font-semibold text-ink">
        {title} <span className="text-ink-muted">{reviews.length}</span>
      </h2>
      {reviews.length === 0 ? (
        <p className="mt-3 rounded-brand border border-dashed border-black/15 bg-white p-6 text-center text-sm text-ink-soft">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-brand border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-ink">
                  {r.nombre} <Stars value={r.calificacion} className="ml-1 text-base" />
                </p>
                <p className="text-xs text-ink-muted">
                  {formatShortDate(toManagua(new Date(r.created_at)))}
                  {r.order_id && (
                    <>
                      {" · "}
                      <Link href={`/admin/pedidos/${r.order_id}`} className="font-semibold text-ink hover:underline">
                        Pedido #{r.order_id.slice(0, 8).toUpperCase()}
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <p className="mt-2 text-sm text-ink">{r.comentario}</p>
              <div className="mt-3">
                <ReviewActions review={r} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
