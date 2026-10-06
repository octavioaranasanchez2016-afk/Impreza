import { ProductCategory } from "@/lib/types";
import { FONT_OPTIONS } from "@/lib/design";
import { NameStyle, Ubicacion } from "@/lib/group-names";
import { GarmentShape, getZonesForCategory, isDarkColor } from "./GarmentShape";

// Vista previa de una camisa de grupo con el nombre (y número) de una persona.
// Es una guía visual: la medida exacta la acomoda el taller.
const PLACEMENT: Record<Ubicacion, { zone: "espalda" | "frente" | "manga-izq"; x: number; nameY: number; nameSize: number; numberY: number; numberSize: number }> = {
  "espalda-arriba": { zone: "espalda", x: 50, nameY: 27, nameSize: 6.5, numberY: 45, numberSize: 19 },
  "espalda-abajo": { zone: "espalda", x: 50, nameY: 72, nameSize: 6.5, numberY: 54, numberSize: 19 },
  "manga-izq": { zone: "manga-izq", x: 50, nameY: 45, nameSize: 10, numberY: 62, numberSize: 13 },
  pecho: { zone: "frente", x: 64, nameY: 30, nameSize: 4, numberY: 37, numberSize: 5 },
};

export function NamePreview({
  category,
  colorHex,
  texto,
  numero,
  style,
}: {
  category: ProductCategory;
  colorHex: string;
  texto: string;
  numero?: string;
  style?: Partial<NameStyle>;
}) {
  const place = PLACEMENT[style?.ubicacion ?? "espalda-arriba"];
  const zones = getZonesForCategory(category);
  const zone = zones.includes(place.zone) ? place.zone : "frente";
  const ink = style?.color ?? (isDarkColor(colorHex) ? "#FFFFFF" : "#111111");
  const font = FONT_OPTIONS.find((f) => f.value === (style?.fuente ?? "display"));
  const textStyle = { fontFamily: font?.cssVar ?? "var(--font-display)", fontWeight: font?.weight ?? 700 };
  // Un texto largo se achica para que quepa a lo ancho.
  const shown = texto || "TU NOMBRE";
  const nameSize = Math.min(place.nameSize, (place.nameSize * 9) / Math.max(9, shown.length));

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-brand bg-paper-soft">
      <div className="absolute inset-0 p-[4%]">
        <GarmentShape category={category} zone={zone} color={colorHex} />
      </div>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <text
          x={place.x}
          y={place.nameY}
          fontSize={nameSize}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={ink}
          style={textStyle}
          opacity={texto ? 1 : 0.45}
        >
          {shown}
        </text>
        {numero && (
          <text
            x={place.x}
            y={place.numberY}
            fontSize={place.numberSize}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={ink}
            style={textStyle}
          >
            {numero}
          </text>
        )}
      </svg>
    </div>
  );
}
