import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/catalog";
import { loadGroupDesign, loadSizeList } from "@/lib/size-lists";
import { examplesParam, lugaresDeLista, lugaresParam, parsePersonalizado } from "@/lib/group-names";
import { OrderForm } from "@/components/OrderForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Diseño de la lista",
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El organizador hace (o cambia) el diseño del grupo antes de compartir la lista:
// el mismo diseñador del pedido, sin tallas ni pago. Lo guarda en la lista y todos
// lo ven en su camisa antes de anotarse.
export default async function DisenoListaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ clave?: string }>;
}) {
  const { id } = await params;
  const { clave } = await searchParams;
  if (!UUID.test(id)) notFound();
  const result = await loadSizeList(id);
  if (!result || "missing" in result) notFound();
  const { list, entries } = result;
  const product = getProductById(list.product_id);
  if (!product) notFound();

  const listUrl = `/lista-de-tallas/${id}${clave ? `?clave=${encodeURIComponent(clave)}` : ""}`;
  if (!clave || clave !== result.clave || list.order_id) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center md:px-6">
        <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-ink">Diseño de la lista</h1>
        <p className="mt-4 text-ink-soft">
          {list.order_id
            ? "Esta lista ya se convirtió en pedido: el diseño quedó guardado con él."
            : "Solo el organizador puede hacer el diseño. Ábrelo desde tu enlace de organizador."}
        </p>
        <Link href={listUrl} className="mt-6 inline-block rounded-brand bg-ink px-5 py-3 text-sm font-semibold text-paper hover:opacity-80">
          Volver a la lista
        </Link>
      </section>
    );
  }

  // Lo que el diseñador necesita: prenda, color, técnica y tela del diseño guardado, y
  // cómo van los nombres con ejemplos del grupo.
  const design = await loadGroupDesign(list);
  const personalizado = parsePersonalizado(list.personalizado);
  const query = new URLSearchParams({ producto: product.id, lista: id });
  const color = design?.color ?? list.color;
  if (color) query.set("color", color);
  if (design) {
    query.set("tecnica", design.tecnica);
    if (design.tela) query.set("tela", design.tela);
  }
  if (personalizado !== "ninguno") {
    query.set("personal", personalizado);
    query.set("lugares", lugaresParam(lugaresDeLista(personalizado, list.estilo, product.category)));
    query.set("ejemplos", examplesParam(entries));
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <Link href={listUrl} className="text-sm font-semibold text-ink-soft hover:text-ink">
        ← Volver a la lista
      </Link>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Diseño de la lista</p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-6xl">{list.nombre}</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Hazlo una sola vez: cada quien lo ve en su camisa antes de anotarse, y cuando hagas el pedido ya va a estar listo,
        con las tallas{personalizado !== "ninguno" ? " y los nombres" : ""} de todos.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-ink-muted">Cargando el diseñador…</p>}>
          <OrderForm
            listDesign={{ listId: id, clave, nombre: list.nombre, personas: entries.length }}
            query={query.toString()}
          />
        </Suspense>
      </div>
    </section>
  );
}
