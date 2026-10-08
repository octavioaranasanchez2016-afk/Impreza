"use client";

import { DesignTransform, DesignZone, ProductCategory } from "@/lib/types";
import { ExtraPiece, MockupContent } from "@/lib/design";
import { GroupDesignPreview } from "@/lib/group-design";
import { GroupPersonal, PersonExtra, Valores, fieldContent, fieldTransform, zoneTitle } from "@/lib/group-names";
import { getZonesForCategory } from "./GarmentShape";
import { DesignMockup, defaultTransform } from "./DesignMockup";

// Un diseño o un texto como capa sobre la vista de una zona (sin dibujar la prenda).
export function DesignLayer({
  category,
  zone,
  content,
  transform,
  extras,
  faded = false,
}: {
  category: ProductCategory;
  zone: DesignZone;
  content: MockupContent;
  transform: DesignTransform;
  extras?: ExtraPiece<MockupContent>[]; // lo demás de esa parte
  faded?: boolean;
}) {
  return (
    <div className={`absolute inset-0 ${faded ? "opacity-40" : ""}`}>
      <DesignMockup
        category={category}
        zone={zone}
        color="#FFFFFF"
        content={content}
        transform={transform}
        extras={extras}
        interactive={false}
        compact
        bare
      />
    </div>
  );
}

// Los textos de cada persona en una zona: lo que escribió (o, si todavía no, el ejemplo
// en tenue) con la letra y el color que eligió, si se puede.
export function PersonalLayer({
  category,
  zone,
  personal,
  valores,
  propio,
  skip,
  faded = false,
}: {
  category: ProductCategory;
  zone: DesignZone;
  personal: GroupPersonal;
  valores?: Valores; // sin valores: la camisa de ejemplo
  propio?: PersonExtra;
  skip?: number; // el campo que se está editando (no se dibuja dos veces)
  faded?: boolean;
}) {
  return (
    <>
      {personal.campos.map((field, i) => {
        if (field.zona !== zone || i === skip) return null;
        const own = valores?.[field.id];
        return (
          <DesignLayer
            key={field.id}
            category={category}
            zone={zone}
            content={fieldContent(field, own || field.ejemplo, propio, personal.eligen)}
            transform={fieldTransform(field)}
            faded={faded || (Boolean(valores) && !own)}
          />
        );
      })}
    </>
  );
}

// La camisa de una persona del grupo, una vista por cada lado que lleva algo: el
// diseño de todos y, encima, lo suyo. Es una guía: la medida exacta la acomoda el taller.
export function GroupShirtPreview({
  category,
  colorHex,
  designs = {},
  personal,
  valores,
  propio,
}: {
  category: ProductCategory;
  colorHex: string;
  designs?: GroupDesignPreview;
  personal: GroupPersonal | null;
  valores?: Valores;
  propio?: PersonExtra;
}) {
  const zones = getZonesForCategory(category).filter(
    (z) => z !== "etiqueta" && (designs[z] || personal?.campos.some((f) => f.zona === z))
  );
  if (zones.length === 0) return null;

  return (
    <div
      className="mx-auto grid gap-2"
      style={{ gridTemplateColumns: `repeat(${zones.length}, minmax(0, 1fr))`, maxWidth: `${zones.length * 11}rem` }}
    >
      {zones.map((zone) => (
        <figure key={zone}>
          <DesignMockup
            category={category}
            zone={zone}
            color={colorHex}
            content={designs[zone]?.content ?? null}
            transform={designs[zone]?.transform ?? defaultTransform(category, zone)}
            extras={designs[zone]?.extras}
            interactive={false}
            compact
            overlay={
              personal && <PersonalLayer category={category} zone={zone} personal={personal} valores={valores} propio={propio} />
            }
          />
          <figcaption className="mt-1 text-center text-[10px] font-semibold text-ink-soft">
            {category === "tote" || category === "gorra" ? "Frente" : zoneTitle(zone)}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
