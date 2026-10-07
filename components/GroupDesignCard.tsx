import Link from "next/link";
import { ProductCategory } from "@/lib/types";
import { GroupDesignPreview } from "@/lib/group-design";
import { GroupPersonal } from "@/lib/group-names";
import { GroupShirtPreview } from "./GroupShirtPreview";
import { WhatsAppLinkButton } from "./WhatsAppButton";

// En la lista del organizador: la camisa de ejemplo. Si todavía no la hizo, lo invita
// a hacerla antes de compartir (así cada quien ve su camisa antes de anotarse); si ya
// la hizo, la muestra como la ve el grupo.
export function GroupDesignCard({
  designHref,
  designs,
  category,
  colorHex,
  personal,
  listName,
  shareUrl,
  ordered,
}: {
  designHref: string;
  designs: GroupDesignPreview;
  category: ProductCategory;
  colorHex: string;
  personal: GroupPersonal | null;
  listName: string;
  shareUrl: string;
  ordered: boolean; // ya se hizo el pedido: el diseño quedó con él
}) {
  const hasDesign = Object.keys(designs).length > 0 || Boolean(personal);

  if (!hasDesign) {
    if (ordered) return null;
    return (
      <div className="rounded-brand border-2 border-ink bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Primer paso</p>
        <p className="mt-1 font-display text-3xl uppercase leading-none tracking-wide text-ink">Haz tu camisa de ejemplo</p>
        <p className="mt-2 text-sm text-ink-soft">
          Hazla antes de compartir la lista: primero lo que sale igual en todas y después lo que pone cada quien (su nombre,
          su número…). Todos la ven antes de anotarse, y al hacer el pedido entra sola. No hay que diseñar dos veces.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={designHref} className="rounded-brand bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-80">
            Hacer la camisa de ejemplo →
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
        <p className="font-semibold text-ink">Tu camisa de ejemplo</p>
        {!ordered && (
          <Link href={designHref} className="text-sm font-semibold text-ink underline">
            Cambiar el diseño
          </Link>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        Así la ve el grupo al abrir la lista{personal ? "; cada quien cambia lo suyo por lo que escriba" : ""}.
      </p>
      <div className="mt-3">
        <GroupShirtPreview category={category} colorHex={colorHex} designs={designs} personal={personal} />
      </div>
    </div>
  );
}
