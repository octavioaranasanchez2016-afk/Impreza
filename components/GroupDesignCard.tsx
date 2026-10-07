import Link from "next/link";
import { ProductCategory } from "@/lib/types";
import { GroupDesignPreview } from "@/lib/group-design";
import { Lugares, NameStyle } from "@/lib/group-names";
import { NamePreview } from "./NamePreview";
import { WhatsAppLinkButton } from "./WhatsAppButton";

// En la lista del organizador: el diseño del grupo. Si todavía no lo hizo, lo invita
// a hacerlo antes de compartir (así cada quien ve su camisa antes de anotarse); si ya
// lo hizo, lo muestra como lo ve el grupo, con un nombre de ejemplo.
export function GroupDesignCard({
  designHref,
  designs,
  category,
  colorHex,
  lugares,
  nameStyle,
  sample,
  listName,
  shareUrl,
  ordered,
}: {
  designHref: string;
  designs: GroupDesignPreview;
  category: ProductCategory;
  colorHex: string;
  lugares: Lugares;
  nameStyle?: Pick<NameStyle, "fuente" | "color">;
  sample: { texto: string; numero: string };
  listName: string;
  shareUrl: string;
  ordered: boolean; // ya se hizo el pedido: el diseño quedó con él
}) {
  const hasDesign = Object.keys(designs).length > 0;

  if (!hasDesign) {
    if (ordered) return null;
    return (
      <div className="rounded-brand border-2 border-ink bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Primer paso</p>
        <p className="mt-1 font-display text-3xl uppercase leading-none tracking-wide text-ink">Haz el diseño del grupo</p>
        <p className="mt-2 text-sm text-ink-soft">
          Hazlo antes de compartir la lista: cada quien ve su camisa con el diseño y su nombre antes de anotarse, y cuando
          hagas el pedido ya va a estar listo. No hay que diseñar dos veces.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={designHref} className="rounded-brand bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-80">
            Hacer el diseño →
          </Link>
          <WhatsAppLinkButton
            message={`Hola, quiero que me ayuden con el diseño de las camisas de «${listName}». Esta es la lista del grupo: ${shareUrl}`}
            className="rounded-brand border border-black/15 px-5 py-2.5 text-sm font-semibold text-ink hover:border-ink"
          >
            Contactar con diseñador
          </WhatsAppLinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-brand border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-ink">Diseño del grupo</p>
        {!ordered && (
          <Link href={designHref} className="text-sm font-semibold text-ink underline">
            Cambiar el diseño
          </Link>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-soft">Así lo ve cada quien al abrir la lista, con su propio nombre.</p>
      <div className="mt-3">
        <NamePreview
          category={category}
          colorHex={colorHex}
          texto={sample.texto}
          numero={sample.numero || undefined}
          style={{ lugares, ...nameStyle }}
          designs={designs}
        />
      </div>
    </div>
  );
}
