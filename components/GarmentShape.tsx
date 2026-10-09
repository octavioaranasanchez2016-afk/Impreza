import { DesignZone, ProductCategory } from "@/lib/types";

export const ZONES_BY_CATEGORY: Record<ProductCategory, DesignZone[]> = {
  camisa: ["frente", "espalda", "manga-izq", "manga-der", "etiqueta"],
  hoodie: ["frente", "espalda", "etiqueta"],
  tote: ["frente"],
  polo: ["frente", "espalda", "manga-izq", "manga-der", "etiqueta"],
  gorra: ["frente"],
};

// Nombre corto (miniaturas del diseñador y hoja de producción).
export const ZONE_LABEL: Record<DesignZone, string> = {
  frente: "Frente",
  espalda: "Espalda",
  manga: "Manga",
  "manga-izq": "Manga izq.",
  "manga-der": "Manga der.",
  etiqueta: "Etiqueta",
};

// Para frases: "¿Qué quieres poner en la manga izquierda?".
export const ZONE_NAME: Record<DesignZone, string> = {
  frente: "el frente",
  espalda: "la espalda",
  manga: "la manga",
  "manga-izq": "la manga izquierda",
  "manga-der": "la manga derecha",
  etiqueta: "la etiqueta",
};

export const isSleeve = (zone: DesignZone) => zone === "manga" || zone === "manga-izq" || zone === "manga-der";

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
  polo: {
    S: { ancho: 48, largo: 70 },
    M: { ancho: 52, largo: 72 },
    L: { ancho: 56, largo: 74 },
    XL: { ancho: 60, largo: 76 },
    XXL: { ancho: 64, largo: 78 },
  },
  // Frente de la corona, de costura a costura, y alto hasta la visera.
  gorra: {
    Ajustable: { ancho: 21, largo: 12 },
  },
};

const REFERENCE_SIZE: Record<ProductCategory, string> = {
  camisa: "M",
  hoodie: "M",
  tote: "Único",
  polo: "M",
  gorra: "Ajustable",
};

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
// `print.dx` corre el área a un lado del centro (cm, + = derecha vista de frente),
// como el logo al pecho izquierdo de una polo.
interface ViewSpec {
  span: number;
  top: number;
  print: { w: number; h: number; top: number; dx?: number };
}

const VIEWS: Record<string, ViewSpec> = {
  "camisa:frente": { span: 110, top: 14, print: { w: 30, h: 40, top: 12 } },
  // La espalda llega más abajo que el frente: termina a 58 cm del cuello, y aun en la S
  // quedan 13 cm hasta el ruedo.
  "camisa:espalda": { span: 110, top: 14, print: { w: 30, h: 50, top: 8 } },
  "camisa:manga": { span: 40, top: 10, print: { w: 10, h: 10, top: 5 } },
  "camisa:manga-izq": { span: 40, top: 10, print: { w: 10, h: 10, top: 5 } },
  "camisa:manga-der": { span: 40, top: 10, print: { w: 10, h: 10, top: 5 } },
  // Etiqueta: la espalda por dentro, cerca del cuello. (0, 0) es la costura del cuello.
  "camisa:etiqueta": { span: 30, top: 7, print: { w: 8, h: 8, top: 2 } },
  "hoodie:frente": { span: 115, top: 24, print: { w: 30, h: 22, top: 12 } },
  // Empieza debajo de la capucha y termina justo arriba del puño de la S.
  "hoodie:espalda": { span: 115, top: 24, print: { w: 34, h: 30, top: 32 } },
  // Etiqueta del hoodie: por dentro, debajo de la costura donde se une la capucha.
  "hoodie:etiqueta": { span: 30, top: 7, print: { w: 8, h: 8, top: 2 } },
  "tote:frente": { span: 70, top: 26, print: { w: 30, h: 30, top: 5 } },
  "polo:frente": { span: 110, top: 14, print: { w: 10, h: 10, top: 12, dx: 10 } },
  "polo:espalda": { span: 110, top: 14, print: { w: 28, h: 38, top: 10 } },
  "polo:manga": { span: 40, top: 10, print: { w: 8, h: 8, top: 5 } },
  "polo:manga-izq": { span: 40, top: 10, print: { w: 8, h: 8, top: 5 } },
  "polo:manga-der": { span: 40, top: 10, print: { w: 8, h: 8, top: 5 } },
  "polo:etiqueta": { span: 30, top: 7, print: { w: 8, h: 8, top: 2 } },
  "gorra:frente": { span: 30, top: 6, print: { w: 11, h: 5.5, top: 4 } },
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

// cm desde el borde superior del lienzo hasta el punto de referencia (cuello,
// borde superior de la bolsa o de la manga), para medir posiciones desde ahí.
export function getReferenceTopCm(category: ProductCategory, zone: DesignZone): number {
  return getView(category, zone).top;
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
    x: pct(printLeftCm(v)),
    y: pct(v.top + v.print.top),
    w: pct(v.print.w),
    h: pct(v.print.h),
  };
}

function printLeftCm(v: ViewSpec) {
  return v.span / 2 + (v.print.dx ?? 0) - v.print.w / 2;
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
          x={printLeftCm(v)}
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

// Coordenadas numéricas del lienzo, para círculos.
function coords(at: At, p: Pt): [number, number] {
  const [x, y] = at(p).split(" ").map(Number);
  return [x, y];
}

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
  if ((category === "camisa" || category === "polo") && isSleeve(zone)) {
    return tshirtSleeve(m, at, s, zone === "manga-der" ? "der" : zone === "manga-izq" ? "izq" : null);
  }
  if ((category === "camisa" || category === "polo") && zone === "etiqueta") return neckLabel(at, s, category === "polo");
  if (category === "camisa") return tshirt(m, at, s, zone === "espalda");
  if (category === "polo") return polo(m, at, s, zone === "espalda");
  if (category === "hoodie" && zone === "etiqueta") return hoodieNeckLabel(at, s);
  if (category === "hoodie") return hoodie(m, at, s, zone === "espalda");
  if (category === "gorra") return cap(at, s);
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

// Manga vista de lado. side marca cuál es (izquierda o derecha de quien la lleva
// puesta) con un pedacito del cuerpo de la camisa del lado donde se une.
function tshirtSleeve(m: GarmentMeasure, at: At, s: Style, side: "izq" | "der" | null) {
  const k = m.ancho / 2 - 25.5;
  const cap = 10.5 + k * 0.2;
  const opening = 9 + k * 0.15;
  const len = 20 + k * 0.2;
  const d = `M ${at([-cap, 4])} C ${at([-cap + 4, -0.5])} ${at([cap - 4, -0.5])} ${at([cap, 4])} L ${at([opening, len])} L ${at([-opening, len])} Z`;
  // Vista desde afuera: la manga izquierda se une al cuerpo por su derecha, y al revés.
  const x = side === "izq" ? 1 : -1;
  const body = side
    ? `M ${at([cap * x, 4])} L ${at([(cap + 9) * x, 2])} L ${at([(cap + 9) * x, 30])} L ${at([opening * x, 30])} L ${at([opening * x, len])} Z`
    : null;
  return (
    <>
      {body && <path d={body} fill={s.fill} opacity={0.55} {...outlineProps(s)} />}
      <path d={d} fill={s.fill} {...outlineProps(s)} />
      <path d={line(at, [-opening + 0.1, len - 2.5], [opening - 0.1, len - 2.5])} {...detailProps(s)} />
    </>
  );
}

// Espalda por dentro, alrededor del cuello, donde va la etiqueta. (0, 0) es la
// costura del cuello al centro de la espalda.
function neckLabel(at: At, s: Style, polo: boolean) {
  const back = `M ${at([-15, 3])} L ${at([-8.5, -1.5])} C ${at([-6, 0.6])} ${at([6, 0.6])} ${at([8.5, -1.5])} L ${at([15, 3])} L ${at([15, 24])} L ${at([-15, 24])} Z`;
  const bandTop = polo ? -4.2 : -3.2;
  const band = `M ${at([-8.5, -1.5])} C ${at([-6, 0.6])} ${at([6, 0.6])} ${at([8.5, -1.5])} L ${at([8.2, bandTop])} C ${at([5.8, bandTop + 1.9])} ${at([-5.8, bandTop + 1.9])} ${at([-8.2, bandTop])} Z`;
  return (
    <>
      <path d={back} fill={s.fill} {...outlineProps(s)} />
      <path d={band} fill={s.fill} {...outlineProps(s)} />
      <path d={band} fill={s.shade} />
      <path d={`M ${at([-8.3, -0.9])} C ${at([-6, 1.2])} ${at([6, 1.2])} ${at([8.3, -0.9])}`} {...detailProps(s)} strokeDasharray="2 2" />
      {bothSidesShoulder(at, s)}
    </>
  );
}

// Hoodie por dentro: la espalda debajo de la costura del cuello y, arriba, el forro
// de la capucha que sale de esa costura. (0, 0) es la costura al centro de la espalda.
function hoodieNeckLabel(at: At, s: Style) {
  const n = HOODIE_NECK;
  const seam = `C ${at([-6, 1])} ${at([6, 1])} ${at([n, -1.5])}`;
  const back = `M ${at([-16, 3.5])} L ${at([-n, -1.5])} ${seam} L ${at([16, 3.5])} L ${at([16, 24])} L ${at([-16, 24])} Z`;
  const hood = `M ${at([-n, -1.5])} ${seam} L ${at([n + 1.5, -8])} L ${at([-n - 1.5, -8])} Z`;
  return (
    <>
      <path d={back} fill={s.fill} {...outlineProps(s)} />
      <path d={hood} fill={s.fill} {...outlineProps(s)} />
      {/* Doble sombra: el forro de la capucha se ve más oscuro que la espalda. */}
      <path d={hood} fill={s.shade} />
      <path d={hood} fill={s.shade} />
      <path d={line(at, [0, 0.3], [0, -8])} {...detailProps(s)} />
      <path d={`M ${at([-n + 0.2, -0.8])} C ${at([-6, 1.7])} ${at([6, 1.7])} ${at([n - 0.2, -0.8])}`} {...detailProps(s)} strokeDasharray="2 2" />
      <path d={bothSides(at, [n, -1.5], [16, 3.5])} {...detailProps(s)} />
    </>
  );
}

function bothSidesShoulder(at: At, s: Style) {
  return <path d={bothSides(at, [8.5, -1.5], [15, 3])} {...detailProps(s)} />;
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

// Polo: el cuerpo de la camisa con escote alto, más cuello y tapeta con botones.
function polo(m: GarmentMeasure, at: At, s: Style, back: boolean) {
  const band = `M ${at([-9, 0.3])} C ${at([-9, -3.2])} ${at([9, -3.2])} ${at([9, 0.3])} C ${at([9, -1])} ${at([-9, -1])} ${at([-9, 0.3])} Z`;
  if (back) {
    return (
      <>
        {tshirt(m, at, s, true)}
        <path d={band} fill={s.fill} {...outlineProps(s)} />
      </>
    );
  }
  const flap = (x: number) =>
    `M ${at([9 * x, 0.2])} Q ${at([8.6 * x, 5])} ${at([5.6 * x, 8.4])} L ${at([0.5 * x, 4.2])} Q ${at([3.5 * x, 1.4])} ${at([9 * x, 0.2])} Z`;
  return (
    <>
      {tshirt(m, at, s, true)}
      <path d={band} fill={s.fill} {...outlineProps(s)} />
      <path d={`M ${at([-1.7, 3.4])} L ${at([1.7, 3.4])} L ${at([1.7, 15.5])} L ${at([-1.7, 15.5])} Z`} {...detailProps(s)} fill={s.fill} />
      {[6.5, 9.8, 13].map((y) => {
        const [cx, cy] = coords(at, [0, y]);
        return <circle key={y} cx={cx} cy={cy} r={0.5} fill={s.detail} />;
      })}
      <path d={flap(1)} fill={s.fill} {...outlineProps(s)} />
      <path d={flap(-1)} fill={s.fill} {...outlineProps(s)} />
    </>
  );
}

// Gorra vista de frente. (0, 0) es el botón de arriba de la corona.
function cap(at: At, s: Style) {
  const crown = `M ${at([-10.5, 12])} C ${at([-10.8, 3.5])} ${at([-6, 0])} ${at([0, 0])} C ${at([6, 0])} ${at([10.8, 3.5])} ${at([10.5, 12])} Q ${at([0, 14.2])} ${at([-10.5, 12])} Z`;
  const visor = `M ${at([-10.5, 12])} Q ${at([0, 14.2])} ${at([10.5, 12])} Q ${at([0, 20])} ${at([-10.5, 12])} Z`;
  const seams = `M ${at([0, 0.4])} Q ${at([5.8, 3])} ${at([7.2, 12.6])} M ${at([0, 0.4])} Q ${at([-5.8, 3])} ${at([-7.2, 12.6])}`;
  const stitching = `M ${at([-9, 13.1])} Q ${at([0, 16.1])} ${at([9, 13.1])} M ${at([-8, 13.3])} Q ${at([0, 17.5])} ${at([8, 13.3])}`;
  const [bx, by] = coords(at, [0, 0.2]);
  return (
    <>
      <path d={crown} fill={s.fill} {...outlineProps(s)} />
      <path d={seams} {...detailProps(s)} />
      {[-1, 1].map((x) => {
        const [ex, ey] = coords(at, [5.2 * x, 4]);
        return <circle key={x} cx={ex} cy={ey} r={0.35} fill={s.detail} />;
      })}
      <path d={visor} fill={s.fill} {...outlineProps(s)} />
      <path d={visor} fill={s.shade} />
      <path d={stitching} {...detailProps(s)} />
      <circle cx={bx} cy={by} r={0.8} fill={s.fill} {...outlineProps(s)} />
    </>
  );
}
