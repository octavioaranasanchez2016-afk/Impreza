import { getFabric, getProductById } from "@/lib/catalog";
import { FONT_OPTIONS, MockupContent } from "@/lib/design";
import { TECHNIQUE_LABEL } from "@/lib/catalog";
import { StoredDiseno, countPieces, groupDesigns } from "@/lib/design-groups";
import { OrderItemInput, ProductCategory } from "@/lib/types";
import { DesignMockup } from "@/components/DesignMockup";
import { ZONE_LABEL } from "@/components/GarmentShape";

export type SignedDiseno = StoredDiseno & { signedUrl: string | null };

// Hoja de producción: cada diseño con las piezas que lo llevan, y las piezas sin diseño.
// Los pedidos anteriores (sin número de diseño) muestran un solo diseño para todo.
export function OrderDesigns({ disenos, items }: { disenos: SignedDiseno[]; items: OrderItemInput[] }) {
  const { groups, sinDiseno } = groupDesigns(disenos, items);
  const numbered = groups.length > 1 || (groups.length > 0 && sinDiseno.length > 0);

  if (groups.length === 0) {
    return (
      <p className="mt-4 rounded-brand border-2 border-ink px-4 py-3 text-sm font-medium text-ink">
        El cliente hizo el pedido sin diseño. Pídeselo por WhatsApp antes de producir.
      </p>
    );
  }

  return (
    <>
      {groups.map((g) => {
        // La vista previa se dibuja sobre la primera prenda que lleva este diseño.
        const base = g.piezas[0] ?? items[0];
        const product = base ? getProductById(base.productId) : undefined;
        const colorHex = product?.variants.find((v) => v.color === base?.color)?.colorHex ?? "#111111";
        return (
          <div key={g.grupo} className="mt-6 border-t border-black/10 pt-5 print:break-inside-avoid">
            {numbered && (
              <div className="mb-3">
                <p className="text-sm font-bold uppercase tracking-wide text-ink">Diseño {g.grupo}</p>
                <PiecesList items={g.piezas} />
              </div>
            )}
            {product && (
              <>
                <div className="grid gap-8 sm:grid-cols-2">
                  {g.disenos.map((d, i) => {
                    // Varias cosas en la misma parte: cada una con sus medidas, y las demás en tenue.
                    const sameZone = g.disenos.filter((other) => other.zona === d.zona);
                    const at = sameZone.indexOf(d);
                    return (
                      <DesignPreview
                        key={i}
                        d={d}
                        others={sameZone.flatMap((other, j) => (j === at ? [] : [{ d: other, below: j < at }]))}
                        position={sameZone.length > 1 ? `${at + 1} de ${sameZone.length}` : null}
                        category={product.category}
                        colorHex={colorHex}
                        size={base?.size}
                      />
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-ink-muted">
                  Vista previa sobre {product.name}, {base?.color}, talla {base?.size}. Las medidas en cm son las mismas
                  para todas las tallas.
                </p>
              </>
            )}
          </div>
        );
      })}
      {sinDiseno.length > 0 && (
        <div className="mt-6 rounded-brand border-2 border-ink px-4 py-3 text-sm text-ink print:break-inside-avoid">
          <p className="font-bold">
            Sin diseño: {countPieces(sinDiseno)} pieza{countPieces(sinDiseno) === 1 ? "" : "s"}. Pregúntale al cliente
            por WhatsApp.
          </p>
          <PiecesList items={sinDiseno} />
        </div>
      )}
    </>
  );
}

function PiecesList({ items }: { items: OrderItemInput[] }) {
  return (
    <p className="mt-1 text-sm text-ink-soft">
      {items
        .map((i) => {
          const fabric = getFabric(i.productId, i.fabric);
          return `${i.quantity}× ${getProductById(i.productId)?.name ?? i.productId}${fabric ? ` (${fabric.name})` : ""} — ${i.color} — ${i.size}${i.technique ? ` · ${TECHNIQUE_LABEL[i.technique]}` : ""}`;
        })
        .join(" · ")}
    </p>
  );
}

const transformOf = (d: SignedDiseno) => ({ x: d.posX, y: d.posY, scale: d.escala || 1, rotation: d.rotacion ?? 0 });

function contentOf(d: SignedDiseno): MockupContent | null {
  return d.tipo === "imagen"
    ? d.signedUrl
      ? { kind: "imagen", previewUrl: d.signedUrl, width: d.anchoPx ?? 0, height: d.altoPx ?? 0, fill: d.ajuste === "llenar" }
      : null
    : {
        kind: "texto",
        texto: d.texto ?? "",
        color: d.color ?? "#111111",
        fontFamily: d.fuente ?? "sans",
        outline: d.contorno ?? null,
      };
}

function DesignPreview({
  d,
  others,
  position,
  category,
  colorHex,
  size,
}: {
  d: SignedDiseno;
  others: { d: SignedDiseno; below: boolean }[]; // lo demás que va en la misma parte
  position: string | null; // "1 de 2" cuando la parte lleva varias cosas
  category: ProductCategory;
  colorHex: string;
  size?: string;
}) {
  const content = contentOf(d);
  const extras = others.flatMap((o) => {
    const c = contentOf(o.d);
    return c ? [{ content: c, transform: transformOf(o.d), faded: true, below: o.below }] : [];
  });

  return (
    <div className="print:break-inside-avoid">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {ZONE_LABEL[d.zona]}
        {position && ` · ${position}`}
        {d.tipo === "imagen" && d.ajuste === "llenar" && " · llenar área"}
      </p>
      {content ? (
        <DesignMockup
          category={category}
          zone={d.zona}
          color={colorHex}
          size={size}
          content={content}
          transform={transformOf(d)}
          extras={extras}
          interactive={false}
          showPlacement
        />
      ) : (
        <p className="text-sm text-ink-soft">No se pudo generar la vista previa.</p>
      )}
      {d.tipo === "texto" && (
        <p className="mt-2 text-center text-xs text-ink-soft">
          Texto: <span className="font-semibold text-ink">“{d.texto}”</span> · color{" "}
          <span
            className="inline-block h-3 w-3 rounded-full border border-black/20 align-middle"
            style={{ backgroundColor: d.color }}
          />{" "}
          {d.color}
          {d.contorno && (
            <>
              {" "}
              · contorno{" "}
              <span
                className="inline-block h-3 w-3 rounded-full border-2 align-middle"
                style={{ borderColor: d.contorno }}
              />{" "}
              {d.contorno}
            </>
          )}
          {" · letra "}
          {FONT_OPTIONS.find((f) => f.value === d.fuente)?.label ?? "Moderna"}
        </p>
      )}
      {d.tipo === "imagen" && d.signedUrl && (
        <a
          href={d.signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="mt-2 block rounded-brand border border-black/15 px-3 py-1.5 text-center text-xs font-semibold text-ink hover:border-ink print:hidden"
        >
          Descargar imagen original
          {d.anchoPx ? ` (${d.anchoPx} × ${d.altoPx} px)` : ""}
        </a>
      )}
    </div>
  );
}
