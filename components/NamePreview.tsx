import { ProductCategory } from "@/lib/types";
import { FONT_OPTIONS } from "@/lib/design";
import { Lleva, Lugar, Lugares, NameStyle, lugarLabel, lugarZone, lugaresEnOrden, lugaresFor } from "@/lib/group-names";
import { GarmentShape, getPrintArea, isDarkColor } from "./GarmentShape";

// Vista previa de una camisa de grupo con el nombre y/o número de una persona en
// cada lugar que eligió el organizador (una vista por lugar). Es una guía visual:
// la medida exacta la acomoda el taller.

// La prenda se dibuja con 4% de margen: pasa un % de la prenda a % del cuadro.
const inset = (pct: number) => 4 + pct * 0.92;

// El cuadro donde va lo de la persona en cada lugar, en % del cuadro, y cuánto se
// acerca la vista para que se lea (el pecho es chico).
function boxFor(category: ProductCategory, lugar: Lugar) {
  const a = getPrintArea(category, lugarZone(lugar));
  let box = { x: a.x, y: a.y, w: a.w, h: a.h };
  // Camisa y hoodie: el pecho izquierdo de quien la lleva (a la derecha, vista de frente).
  if (lugar === "pecho" && (category === "camisa" || category === "hoodie")) {
    const w = a.w * 0.36;
    box = { x: a.x + a.w * 0.82 - w / 2, y: a.y + a.h * 0.06, w, h: a.h * 0.24 };
  }
  const out = { x: inset(box.x), y: inset(box.y), w: box.w * 0.92, h: box.h * 0.92 };
  const zoom = lugar === "pecho" && category !== "tote" && category !== "gorra" ? Math.min(1.7, 30 / out.w) : 1;
  return { ...out, zoom };
}

function textLayout(lugar: Lugar, lleva: Lleva, box: { y: number; w: number; h: number }, nameLen: number, numLen: number) {
  const back = lugar === "espalda";
  const nameFit = box.w / (0.45 * Math.max(nameLen, 4));
  const numFit = box.w / (0.62 * Math.max(numLen, 1));
  if (lleva === "nombre") return { nameY: box.y + box.h * (back ? 0.15 : 0.5), nameSize: Math.min(box.h * (back ? 0.2 : 0.45), nameFit) };
  if (lleva === "numero") return { numberY: box.y + box.h * (back ? 0.42 : 0.5), numberSize: Math.min(box.h * (back ? 0.6 : 0.8), numFit) };
  return {
    nameY: box.y + box.h * (back ? 0.15 : 0.27),
    nameSize: Math.min(box.h * (back ? 0.2 : 0.3), nameFit),
    numberY: box.y + box.h * (back ? 0.55 : 0.68),
    numberSize: Math.min(box.h * (back ? 0.55 : 0.5), numFit),
  };
}

export function NamePreview({
  category,
  colorHex,
  texto,
  numero,
  style,
  sampleNumber = "10",
}: {
  category: ProductCategory;
  colorHex: string;
  texto: string;
  numero?: string;
  style: Partial<NameStyle> & { lugares: Lugares };
  sampleNumber?: string; // lo que se ve mientras la persona no escribe su número
}) {
  const views = lugaresEnOrden(style.lugares).filter(([lugar]) => lugaresFor(category).includes(lugar));
  if (views.length === 0) return null;
  const ink = style.color ?? (isDarkColor(colorHex) ? "#FFFFFF" : "#111111");
  const font = FONT_OPTIONS.find((f) => f.value === (style.fuente ?? "display"));
  const textStyle = { fontFamily: font?.cssVar ?? "var(--font-display)", fontWeight: font?.weight ?? 700 };
  const name = texto || "TU NOMBRE";
  const num = numero || sampleNumber;
  const cols = views.length; // una fila: hasta 4 vistas

  return (
    <div
      className="mx-auto grid gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: `${cols * 11}rem` }}
    >
      {views.map(([lugar, lleva]) => {
        const box = boxFor(category, lugar);
        const t = textLayout(lugar, lleva, box, name.length, num.length);
        const originX = box.x + box.w / 2;
        const originY = box.y + box.h / 2;
        return (
          <figure key={lugar}>
            <div className="relative aspect-square w-full overflow-hidden rounded-brand bg-paper-soft">
              <div
                className="absolute inset-0"
                style={box.zoom > 1 ? { transform: `scale(${box.zoom})`, transformOrigin: `${originX}% ${originY}%` } : undefined}
              >
                <div className="absolute inset-0 p-[4%]">
                  <GarmentShape category={category} zone={lugarZone(lugar)} color={colorHex} />
                </div>
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
                  {t.nameY !== undefined && (
                    <text
                      x={originX}
                      y={t.nameY}
                      fontSize={t.nameSize}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={ink}
                      style={textStyle}
                      opacity={texto ? 1 : 0.45}
                    >
                      {name}
                    </text>
                  )}
                  {t.numberY !== undefined && (
                    <text
                      x={originX}
                      y={t.numberY}
                      fontSize={t.numberSize}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={ink}
                      style={textStyle}
                      opacity={numero ? 1 : 0.45}
                    >
                      {num}
                    </text>
                  )}
                </svg>
              </div>
            </div>
            <figcaption className="mt-1 text-center text-[10px] font-semibold text-ink-soft">{lugarLabel(lugar, category)}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}
