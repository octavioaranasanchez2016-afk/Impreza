import { DesignZone, ProductCategory } from "@/lib/types";

export const ZONES_BY_CATEGORY: Record<ProductCategory, DesignZone[]> = {
  camisa: ["frente", "espalda", "manga"],
  hoodie: ["frente", "espalda"],
  tote: ["frente"],
};

export const ZONE_LABEL: Record<DesignZone, string> = {
  frente: "Frente",
  espalda: "Espalda",
  manga: "Manga",
};

export interface GarmentMeasure {
  ancho: number; // cm, prenda plana de costura a costura
  largo: number; // cm, desde el hombro junto al cuello hasta el ruedo
}

// Medidas aproximadas de prenda plana por talla.
export const SIZE_MEASUREMENTS: Record<ProductCategory, Record<string, GarmentMeasure>> = {
  camisa: {
    S: { ancho: 46, largo: 71 },
    M: { ancho: 51, largo: 74 },
    L: { ancho: 56, largo: 76 },
    XL: { ancho: 61, largo: 79 },
    XXL: { ancho: 66, largo: 81 },
  },
  hoodie: {
    S: { ancho: 53, largo: 68 },
    M: { ancho: 58, largo: 71 },
    L: { ancho: 63, largo: 74 },
    XL: { ancho: 68, largo: 76 },
    XXL: { ancho: 73, largo: 79 },
  },
  tote: {
    Único: { ancho: 38, largo: 42 },
  },
};

const REFERENCE_SIZE: Record<ProductCategory, string> = { camisa: "M", hoodie: "M", tote: "Único" };

export function getMeasure(category: ProductCategory, size?: string): GarmentMeasure {
  const table = SIZE_MEASUREMENTS[category];
  return (size && table[size]) || table[REFERENCE_SIZE[category]];
}

// Cada vista es un lienzo cuadrado de `span` cm reales por lado. La prenda se
// dibuja con el cuello (o el borde superior) centrado en x y a `top` cm del
// borde, y el área máxima de impresión va a `print.top` cm debajo de ese punto
// — igual que en el taller, donde la posición se mide desde el cuello. Como
// ese punto no se mueve entre tallas, el área y el diseño conservan su tamaño
// real y lo que cambia es la prenda a su alrededor.
interface ViewSpec {
  span: number;
  top: number;
  print: { w: number; h: number; top: number };
}

const VIEWS: Record<string, ViewSpec> = {
  "camisa:frente": { span: 110, top: 14, print: { w: 30, h: 40, top: 12 } },
  "camisa:espalda": { span: 110, top: 14, print: { w: 30, h: 40, top: 8 } },
  "camisa:manga": { span: 40, top: 10, print: { w: 10, h: 10, top: 5 } },
  "hoodie:frente": { span: 115, top: 24, print: { w: 30, h: 22, top: 12 } },
  "hoodie:espalda": { span: 115, top: 24, print: { w: 34, h: 28, top: 32 } },
  "tote:frente": { span: 70, top: 26, print: { w: 30, h: 30, top: 5 } },
};

function getView(category: ProductCategory, zone: DesignZone): ViewSpec {
  return VIEWS[`${category}:${zone}`] ?? VIEWS[`${category}:frente`];
}

export function getZonesForCategory(category: ProductCategory): DesignZone[] {
  return ZONES_BY_CATEGORY[category];
}

export function getCanvasSpanCm(category: ProductCategory, zone: DesignZone): number {
  return getView(category, zone).span;
}

export function getPrintAreaCm(category: ProductCategory, zone: DesignZone): { w: number; h: number } {
  const { w, h } = getView(category, zone).print;
  return { w, h };
}

// Área máxima de impresión en % del lienzo (el lienzo es cuadrado).
export function getPrintArea(category: ProductCategory, zone: DesignZone) {
  const v = getView(category, zone);
  const pct = (cm: number) => (cm / v.span) * 100;
  return {
    x: pct(v.span / 2 - v.print.w / 2),
    y: pct(v.top + v.print.top),
    w: pct(v.print.w),
    h: pct(v.print.h),
  };
}

export function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.6;
}

export function GarmentShape({
  category,
  zone,
  color,
  size,
  showGuide,
}: {
  category: ProductCategory;
  zone: DesignZone;
  color: string;
  size?: string;
  showGuide?: boolean;
}) {
  const v = getView(category, zone);
  const m = getMeasure(category, size);
  const dark = isDarkColor(color);
  const style: Style = {
    fill: color,
    outline: dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)",
    detail: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.18)",
    shade: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
  };
  const at = pointMapper(v.span / 2, v.top);

  return (
    <svg viewBox={`0 0 ${v.span} ${v.span}`} className="h-full w-full">
      {renderGarment(category, zone, m, at, style)}
      {showGuide && (
        <rect
          x={v.span / 2 - v.print.w / 2}
          y={v.top + v.print.top}
          width={v.print.w}
          height={v.print.h}
          fill="none"
          stroke={dark ? "#FFFFFF" : "#111111"}
          strokeDasharray="6 5"
          strokeWidth={1.5}
          opacity={0.45}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Siluetas en cm. (0, 0) es el punto del hombro junto al cuello (o el centro
// del borde superior en tote y manga); y crece hacia abajo.

type Pt = readonly [number, number];
type At = (p: Pt) => string;
interface Seg {
  to: Pt;
  c?: Pt;
}
interface Style {
  fill: string;
  outline: string;
  detail: string;
  shade: string;
}

function r2(n: number) {
  return Math.round(n * 100) / 100;
}

function pointMapper(cx: number, cy: number): At {
  return ([x, y]) => `${r2(cx + x)} ${r2(cy + y)}`;
}

const mirror = ([x, y]: Pt): Pt => [-x, y];

// Recorre el lado derecho del cuello al ruedo, cruza el ruedo y vuelve por el
// lado izquierdo en espejo; `neck` cierra la figura de izquierda a derecha.
function symmetricContour(at: At, start: Pt, segs: Seg[], neck: string): string {
  let d = `M ${at(start)}`;
  for (const s of segs) d += s.c ? ` Q ${at(s.c)} ${at(s.to)}` : ` L ${at(s.to)}`;
  const pts = [start, ...segs.map((s) => s.to)];
  d += ` L ${at(mirror(pts[pts.length - 1]))}`;
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    const target = mirror(pts[i]);
    d += s.c ? ` Q ${at(mirror(s.c))} ${at(target)}` : ` L ${at(target)}`;
  }
  return `${d} ${neck} Z`;
}

function line(at: At, a: Pt, b: Pt) {
  return `M ${at(a)} L ${at(b)}`;
}

function bothSides(at: At, a: Pt, b: Pt) {
  return `${line(at, a, b)} ${line(at, mirror(a), mirror(b))}`;
}

const outlineProps = (s: Style) => ({
  stroke: s.outline,
  strokeWidth: 1.4,
  strokeLinejoin: "round" as const,
  vectorEffect: "non-scaling-stroke" as const,
});

const detailProps = (s: Style) => ({
  fill: "none",
  stroke: s.detail,
  strokeWidth: 1.2,
  vectorEffect: "non-scaling-stroke" as const,
});

function renderGarment(category: ProductCategory, zone: DesignZone, m: GarmentMeasure, at: At, s: Style) {
  if (category === "camisa" && zone === "manga") return tshirtSleeve(m, at, s);
  if (category === "camisa") return tshirt(m, at, s, zone === "espalda");
  if (category === "hoodie") return hoodie(m, at, s, zone === "espalda");
  return tote(at, s);
}

const TEE_NECK = 9;

function tshirt(m: GarmentMeasure, at: At, s: Style, back: boolean) {
  const hw = m.ancho / 2;
  const k = hw - 25.5; // diferencia contra la talla M
  const sh = hw * 0.88;
  const sleeveLen = 20 + k * 0.2;
  const cuff = 17 + k * 0.3;
  const armpit = 23 + k * 0.3;
  const [dx, dy] = [0.819, 0.574]; // manga a ~35°
  const sleeveTop: Pt = [sh + dx * sleeveLen, 4 + dy * sleeveLen];
  const sleeveBottom: Pt = [sleeveTop[0] - dy * cuff, sleeveTop[1] + dx * cuff];

  const neckDrop = back ? 2.5 : 11;
  const neck = `C ${at([-TEE_NECK, neckDrop])} ${at([TEE_NECK, neckDrop])} ${at([TEE_NECK, 0])}`;
  const body = symmetricContour(
    at,
    [TEE_NECK, 0],
    [{ to: [sh, 4] }, { to: sleeveTop }, { to: sleeveBottom }, { to: [hw, armpit] }, { to: [hw, m.largo] }],
    neck
  );

  const inset = 2.5;
  const hemA: Pt = [sleeveTop[0] - dx * inset, sleeveTop[1] - dy * inset];
  const hemB: Pt = [sleeveBottom[0] - dx * inset, sleeveBottom[1] - dy * inset];

  return (
    <>
      <path d={body} fill={s.fill} {...outlineProps(s)} />
      {!back && (
        <path
          d={`M ${at([-TEE_NECK, 0])} C ${at([-TEE_NECK, 2.5])} ${at([TEE_NECK, 2.5])} ${at([TEE_NECK, 0])} C ${at([TEE_NECK, 11])} ${at([-TEE_NECK, 11])} ${at([-TEE_NECK, 0])} Z`}
          fill={s.shade}
        />
      )}
      <path
        d={`M ${at([-TEE_NECK, 0])} C ${at([-TEE_NECK, neckDrop])} ${at([TEE_NECK, neckDrop])} ${at([TEE_NECK, 0])}`}
        fill="none"
        stroke={s.shade}
        strokeWidth={1.8}
      />
      <path d={bothSides(at, hemA, hemB)} {...detailProps(s)} />
      <path d={line(at, [-hw, m.largo - 2.5], [hw, m.largo - 2.5])} {...detailProps(s)} />
    </>
  );
}

function tshirtSleeve(m: GarmentMeasure, at: At, s: Style) {
  const k = m.ancho / 2 - 25.5;
  const cap = 10.5 + k * 0.2;
  const opening = 9 + k * 0.15;
  const len = 20 + k * 0.2;
  const d = `M ${at([-cap, 4])} C ${at([-cap + 4, -0.5])} ${at([cap - 4, -0.5])} ${at([cap, 4])} L ${at([opening, len])} L ${at([-opening, len])} Z`;
  return (
    <>
      <path d={d} fill={s.fill} {...outlineProps(s)} />
      <path d={line(at, [-opening + 0.1, len - 2.5], [opening - 0.1, len - 2.5])} {...detailProps(s)} />
    </>
  );
}

const HOODIE_NECK = 10;

function hoodie(m: GarmentMeasure, at: At, s: Style, back: boolean) {
  const hw = m.ancho / 2;
  const k = hw - 29;
  const sh = hw * 0.86;
  const armpit = 27 + k * 0.3;
  const cuffY = 58 + (m.largo - 71) * 0.8;

  const neck = back
    ? `C ${at([-HOODIE_NECK, 2.5])} ${at([HOODIE_NECK, 2.5])} ${at([HOODIE_NECK, 0])}`
    : `C ${at([-HOODIE_NECK, 6])} ${at([-3, 9])} ${at([0, 9])} C ${at([3, 9])} ${at([HOODIE_NECK, 6])} ${at([HOODIE_NECK, 0])}`;

  const body = symmetricContour(
    at,
    [HOODIE_NECK, 0],
    [
      { to: [sh, 5] },
      { c: [hw + 13, 6], to: [hw + 15, 25] },
      { to: [hw + 11, cuffY] },
      { to: [hw + 3, cuffY + 1] },
      { to: [hw, armpit] },
      { to: [hw, m.largo] },
    ],
    neck
  );

  const details = [
    bothSides(at, [hw + 11.6, cuffY - 6], [hw + 2.5, cuffY - 5.5]),
    line(at, [-hw, m.largo - 6], [hw, m.largo - 6]),
  ].join(" ");

  if (back) {
    const hood = `M ${at([-HOODIE_NECK - 2, 0])} C ${at([-19, 5])} ${at([-14, 27])} ${at([0, 30])} C ${at([14, 27])} ${at([19, 5])} ${at([HOODIE_NECK + 2, 0])} C ${at([6, -3])} ${at([-6, -3])} ${at([-HOODIE_NECK - 2, 0])} Z`;
    return (
      <>
        <path d={body} fill={s.fill} {...outlineProps(s)} />
        <path d={details} {...detailProps(s)} />
        <path d={hood} fill={s.fill} {...outlineProps(s)} />
        <path d={line(at, [0, -1.5], [0, 29.5])} {...detailProps(s)} />
      </>
    );
  }

  // Baja hasta detrás del escote en V para que no quede un hueco bajo la capucha.
  const hoodOuter = `M ${at([-13, 3])} C ${at([-18, -22])} ${at([18, -22])} ${at([13, 3])} L ${at([7, 12])} L ${at([-7, 12])} Z`;
  const hoodOpening = `M ${at([-HOODIE_NECK + 0.5, 0.5])} C ${at([-11, -11])} ${at([11, -11])} ${at([HOODIE_NECK - 0.5, 0.5])} C ${at([HOODIE_NECK - 1, 6])} ${at([3, 9])} ${at([0, 9])} C ${at([-3, 9])} ${at([-HOODIE_NECK + 1, 6])} ${at([-HOODIE_NECK + 0.5, 0.5])} Z`;
  const pocket = `M ${at([-13, m.largo - 30])} L ${at([13, m.largo - 30])} L ${at([17, m.largo - 9])} L ${at([-17, m.largo - 9])} Z`;

  return (
    <>
      <path d={hoodOuter} fill={s.fill} {...outlineProps(s)} />
      <path d={hoodOpening} fill={s.shade} />
      <path d={body} fill={s.fill} {...outlineProps(s)} />
      <path d={details} {...detailProps(s)} />
      <path d={pocket} {...detailProps(s)} fill={s.shade} />
      <path
        d={`${line(at, [-3.5, 8], [-4, 22])} ${line(at, [3.5, 8], [4, 22])}`}
        stroke={s.detail}
        strokeWidth={0.6}
        strokeLinecap="round"
      />
    </>
  );
}

function tote(at: At, s: Style) {
  const handle = `M ${at([-9, 0])} L ${at([-9, -12])} C ${at([-9, -24])} ${at([9, -24])} ${at([9, -12])} L ${at([9, 0])}`;
  return (
    <>
      <path d={handle} fill="none" stroke={s.outline} strokeWidth={3} />
      <path d={handle} fill="none" stroke={s.fill} strokeWidth={2.5} />
      <path d={`M ${at([-19, 0])} L ${at([19, 0])} L ${at([19, 42])} L ${at([-19, 42])} Z`} fill={s.fill} {...outlineProps(s)} />
      <path d={line(at, [-19, 2.5], [19, 2.5])} {...detailProps(s)} strokeDasharray="3 3" />
    </>
  );
}
