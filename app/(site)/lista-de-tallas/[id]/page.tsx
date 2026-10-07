import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/catalog";
import { exampleEntryId, listPersonal, listSizes, loadGroupDesign, loadSizeList, sizesParam } from "@/lib/size-lists";
import { groupDesignPreview } from "@/lib/group-design";
import { GroupDesignCard } from "@/components/GroupDesignCard";
import { siteUrl } from "@/lib/site";
import { SizeListSignup } from "@/components/SizeListSignup";
import { SizeListOrganizer } from "@/components/SizeListOrganizer";
import { describePersonal, describeValores, valoresDePersona } from "@/lib/group-names";

export const dynamic = "force-dynamic";

// Las listas son de cada grupo: no salen en Google.
export const metadata = {
  title: "Lista de tallas",
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ListaPage({
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
  if (!result) notFound();
  if ("missing" in result) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center md:px-6">
        <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-ink">Lista de tallas</h1>
        <p className="mt-4 text-ink-soft">Las listas de tallas todavía no están activadas. Vuelve a intentarlo en un rato.</p>
      </section>
    );
  }

  const { list, entries } = result;
  const product = getProductById(list.product_id);
  if (!product) notFound();
  const sizes = listSizes(list.product_id, list.color);
  const isOrganizer = Boolean(clave) && clave === result.clave;
  const total = entries.reduce((sum, e) => sum + e.cantidad, 0);
  // La camisa de ejemplo: el diseño de todos y lo que pone cada quien (si el
  // organizador ya la hizo). Todos la ven antes de anotarse.
  const personal = listPersonal(list);
  const colorHex = product.variants.find((v) => v.color === list.color)?.colorHex ?? "#FFFFFF";
  const design = await loadGroupDesign(list);
  const designs = groupDesignPreview(design);
  const ejemploId = exampleEntryId(list);
  const designHref = `/lista-de-tallas/${list.id}/diseno?clave=${encodeURIComponent(clave ?? "")}`;

  const order = new URLSearchParams({ producto: product.id, tallas: sizesParam(entries), nota: `Lista: ${list.nombre}` });
  if (list.color) order.set("color", list.color);
  order.set("lista", list.id);
  // Con la clave, el pedido puede volver a la lista del organizador y abrir el diseño.
  if (isOrganizer) order.set("clave", clave!);
  // Con el diseño del grupo, el diseñador abre ya con su técnica y tela (y lo carga).
  if (design) {
    order.set("tecnica", design.tecnica);
    if (design.tela) order.set("tela", design.tela);
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
        {isOrganizer ? "Tu lista de tallas" : "Lista de tallas"}
      </p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-6xl">{list.nombre}</h1>
      <p className="mt-3 text-ink-soft">
        {product.name}
        {list.color ? ` · ${list.color}` : ""}
        {list.organizador ? ` · Organiza ${list.organizador}` : ""}
      </p>
      {personal && (
        <p className="mt-2 inline-block rounded-brand bg-paper-soft px-3 py-1 text-xs text-ink">
          <span className="font-semibold">Cada quien pone lo suyo</span> · {describePersonal(personal)}
        </p>
      )}

      {list.order_id && (
        <div className="mt-6 rounded-brand border-2 border-ink bg-white p-5">
          <p className="font-semibold text-ink">
            {isOrganizer ? "Ya hiciste el pedido con esta lista" : "Esta lista ya se convirtió en pedido"} · #
            {list.order_id.slice(0, 8).toUpperCase()}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Las tallas y los nombres de todos llegaron con el pedido, para que cada quien reciba la suya.
          </p>
          {isOrganizer && (
            <Link
              href={`/pedido/${list.order_id}/confirmacion`}
              className="mt-3 inline-block rounded-brand bg-ink px-4 py-2 text-sm font-semibold text-paper hover:opacity-80"
            >
              Ver cómo va el pedido →
            </Link>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        {isOrganizer ? (
          <div className="space-y-4">
            <GroupDesignCard
              designHref={designHref}
              designs={designs}
              category={product.category}
              colorHex={colorHex}
              personal={personal}
              listName={list.nombre}
              shareUrl={`${siteUrl()}/lista-de-tallas/${list.id}`}
              ordered={Boolean(list.order_id)}
            />
            <SizeListOrganizer
              listId={list.id}
              clave={clave!}
              listName={list.nombre}
              sizes={sizes}
              entries={entries}
              closed={list.cerrada}
              orderHref={list.order_id ? "" : `/pedido?${order.toString()}`}
              baseUrl={siteUrl()}
              personal={personal}
              ejemploId={ejemploId}
            />
          </div>
        ) : (
          <div className="rounded-brand border border-black/10 bg-white p-5">
            <p className="font-semibold text-ink">
              Ya se anotaron {entries.length} persona{entries.length === 1 ? "" : "s"}
              {total !== entries.length ? ` (${total} piezas)` : ""}
            </p>
            {entries.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Sé el primero en anotarte.</p>
            ) : (
              <ul className="mt-3 divide-y divide-black/5">
                {entries.map((e) => (
                  <li key={e.id} className="flex justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-ink">
                      {e.nombre}
                      {e.id === ejemploId ? <span className="text-ink-soft"> · organiza</span> : null}
                      {describeValores(personal, valoresDePersona(personal, e)) ? (
                        <span className="text-ink-soft"> · {describeValores(personal, valoresDePersona(personal, e))}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 font-semibold text-ink">
                      {e.talla}
                      {e.cantidad > 1 ? ` × ${e.cantidad}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* En el celular, quien llega por el enlace ve primero su camisa y cómo anotarse. */}
        <div className={`lg:sticky lg:top-24 ${isOrganizer ? "" : "order-first lg:order-none"}`}>
          <SizeListSignup
            listId={list.id}
            sizes={sizes}
            closed={list.cerrada}
            category={product.category}
            productName={product.name}
            title={isOrganizer ? "Anotar a alguien" : "Anótate"}
            forOthers={isOrganizer}
            colorHex={colorHex}
            designs={designs}
            personal={personal}
          />
          <p className="mt-3 text-center text-xs text-ink-soft">
            Las camisas las hace{" "}
            <Link href="/" className="font-semibold text-ink underline">
              Impreza
            </Link>
            . ¿También quieres organizar tu grupo?{" "}
            <Link href="/lista-de-tallas" className="font-semibold text-ink underline">
              Crea tu lista
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
