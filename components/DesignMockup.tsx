"use client";

import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DesignTransform, DesignZone, ProductCategory } from "@/lib/types";
import { fontFamilyCss, FontFamilyKey, fontWeight, MIN_PRINT_DPI, MockupContent, TEXT_OUTLINE_WIDTH } from "@/lib/design";
import { GarmentShape, getCanvasSpanCm, getPrintArea, getReferenceTopCm, isSleeve } from "./GarmentShape";

// La escala es relativa al área máxima de impresión: 1 = el diseño la llena.
export const MIN_SCALE = 0.15;
export const MAX_SCALE = 1;
export const DEFAULT_SCALE = 0.8;
const RESIZE_SENSITIVITY = 1.1;
const ZOOM_LEVELS = [1, 1.5, 2];

// Ancho "contain" del diseño dentro del área de impresión, en % del lienzo.
function computeFitWidthPct(category: ProductCategory, zone: DesignZone, width: number, height: number): number {
  const area = getPrintArea(category, zone);
  if (!width || !height) return area.w;
  const imageAspect = width / height;
  return imageAspect >= area.w / area.h ? area.w : area.h * imageAspect;
}

// Respaldo mientras se mide el texto real con la fuente cargada.
const TEXT_CHAR_WIDTH_RATIO: Record<FontFamilyKey, number> = {
  sans: 0.56,
  display: 0.42,
  script: 0.5,
  serif: 0.58,
  mono: 0.62,
  colegial: 0.62,
  gotica: 0.5,
  marcador: 0.56,
  manuscrita: 0.42,
  retro: 0.5,
  bloque: 0.75,
  militar: 0.62,
  redonda: 0.55,
};

// Ancho del texto por cada unidad de font-size, medido con la fuente real.
function useTextWidthRatio(ref: RefObject<HTMLElement | null>, texto: string, font: FontFamilyKey, weight: number) {
  const [ratio, setRatio] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const measure = () => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx || cancelled) return;
      ctx.font = `${weight} 100px ${getComputedStyle(el).fontFamily}`;
      const w = ctx.measureText(texto).width / 100;
      if (w > 0) setRatio(w);
    };
    measure();
    document.fonts?.ready.then(measure);
    return () => {
      cancelled = true;
    };
  }, [ref, texto, font, weight]);
  return ratio;
}

// Mantiene el centro del diseño (con su caja ya rotada) dentro del área.
function clampCenter(value: number, size: number, start: number, extent: number) {
  if (size >= extent) return start + extent / 2;
  return Math.min(start + extent - size / 2, Math.max(start + size / 2, value));
}

function rotatedBox(w: number, h: number, degrees: number) {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return { w: w * cos + h * sin, h: w * sin + h * cos };
}

type Mode = "idle" | "dragging" | "resizing" | "rotating";

export function DesignMockup({
  category,
  zone,
  color,
  size,
  content,
  transform,
  onTransformChange,
  interactive = true,
  showPlacement = false,
  compact = false,
  onSizeCm,
  overlay,
}: {
  category: ProductCategory;
  zone: DesignZone;
  color: string;
  size?: string;
  content: MockupContent | null;
  transform: DesignTransform;
  onTransformChange?: (t: DesignTransform) => void;
  interactive?: boolean;
  // Medidas para el taller: posición del diseño en cm desde el cuello y el centro.
  showPlacement?: boolean;
  // Miniatura: sin textos de medidas debajo.
  compact?: boolean;
  // Avisa el tamaño real del diseño (sin girar), para escribir las medidas en cm.
  onSizeCm?: (size: { w: number; h: number } | null) => void;
  // Algo que va encima de todo y no se toca (el nombre de cada persona en camisas de grupo).
  overlay?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const dragStart = useRef({ pointerX: 0, pointerY: 0, x: 0, y: 0, scale: 1, rotation: 0, centerX: 0, centerY: 0, startAngle: 0 });

  const area = getPrintArea(category, zone);
  const spanCm = getCanvasSpanCm(category, zone);
  const textWeight = content?.kind === "texto" ? fontWeight(content.fontFamily) : 700;
  const displayText = content?.kind === "texto" ? content.texto || "Tu texto" : "";
  const measuredRatio = useTextWidthRatio(
    textRef,
    displayText,
    content?.kind === "texto" ? content.fontFamily : "sans",
    textWeight
  );

  let textFontSize = 0;
  if (content?.kind === "texto") {
    const ratio = measuredRatio ?? TEXT_CHAR_WIDTH_RATIO[content.fontFamily] * displayText.length;
    textFontSize = Math.min((area.w * transform.scale) / ratio, area.h * transform.scale);
  }

  const imageFill = content?.kind === "imagen" && Boolean(content.fill);
  const imageWidthPct =
    content?.kind === "imagen"
      ? (imageFill ? area.w : computeFitWidthPct(category, zone, content.width, content.height)) * transform.scale
      : 0;

  // Tamaño real del diseño (sin rotar), en % del lienzo.
  const measure = useCallback(() => {
    const el = overlayRef.current;
    const container = containerRef.current;
    if (!el || !container || !container.offsetWidth) {
      setDims(null);
      return;
    }
    const w = (el.offsetWidth / container.offsetWidth) * 100;
    const h = (el.offsetHeight / container.offsetWidth) * 100;
    setDims((prev) => (prev && Math.abs(prev.w - w) < 0.01 && Math.abs(prev.h - h) < 0.01 ? prev : { w, h }));
  }, []);

  useLayoutEffect(measure, [measure, content, displayText, textFontSize, imageWidthPct, imageFill]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure]);

  // Tamaño del diseño calculado desde la escala actual, en % del lienzo. Medirlo en
  // pantalla llega un render tarde, y reacomodar con el tamaño viejo corría el diseño
  // de lugar al achicarlo o agrandarlo. La medida en pantalla queda de respaldo.
  const exactDims =
    content?.kind === "imagen"
      ? imageFill
        ? { w: area.w * transform.scale, h: area.h * transform.scale }
        : content.width > 0
        ? { w: imageWidthPct, h: (imageWidthPct * content.height) / content.width }
        : null
      : content?.kind === "texto" && measuredRatio
      ? { w: textFontSize * measuredRatio, h: textFontSize }
      : null;
  const liveDims = exactDims ?? dims;
  const liveW = liveDims?.w ?? 0;
  const liveH = liveDims?.h ?? 0;

  const clampTransform = useCallback(
    (t: DesignTransform): DesignTransform => {
      if (!liveW || !liveH) return t;
      const box = rotatedBox(liveW, liveH, t.rotation);
      return {
        ...t,
        x: clampCenter(t.x, box.w, area.x, area.w),
        y: clampCenter(t.y, box.h, area.y, area.h),
      };
    },
    [liveW, liveH, area.x, area.y, area.w, area.h]
  );

  // Si un cambio de tamaño, giro o texto saca el diseño del área, se reacomoda.
  useEffect(() => {
    if (!interactive || !content || mode !== "idle" || !onTransformChange) return;
    const clamped = clampTransform(transform);
    if (Math.abs(clamped.x - transform.x) > 0.05 || Math.abs(clamped.y - transform.y) > 0.05) {
      onTransformChange(clamped);
    }
  }, [interactive, content, mode, transform, clampTransform, onTransformChange]);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const start = dragStart.current;

      if (mode === "dragging") {
        onTransformChange?.(
          clampTransform({
            ...transform,
            x: start.x + ((e.clientX - start.pointerX) / rect.width) * 100,
            y: start.y + ((e.clientY - start.pointerY) / rect.height) * 100,
          })
        );
      } else if (mode === "resizing") {
        const deltaXPct = ((e.clientX - start.pointerX) / rect.width) * 100;
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, start.scale + (deltaXPct / 100) * RESIZE_SENSITIVITY * 2));
        onTransformChange?.({ ...transform, scale });
      } else if (mode === "rotating") {
        const angle = Math.atan2(e.clientY - start.centerY, e.clientX - start.centerX) * (180 / Math.PI);
        const rotation = (((start.rotation + angle - start.startAngle) % 360) + 360) % 360;
        onTransformChange?.({ ...transform, rotation });
      }
    },
    [mode, onTransformChange, transform, clampTransform]
  );

  const stopInteraction = useCallback(() => setMode("idle"), []);

  useEffect(() => {
    if (mode === "idle") return;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopInteraction);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopInteraction);
    };
  }, [mode, handlePointerMove, stopInteraction]);

  function begin(e: React.PointerEvent, next: Mode) {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    const base = { ...dragStart.current, pointerX: e.clientX, pointerY: e.clientY, x: transform.x, y: transform.y, scale: transform.scale, rotation: transform.rotation };
    if (next === "rotating") {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      base.centerX = rect.left + (transform.x / 100) * rect.width;
      base.centerY = rect.top + (transform.y / 100) * rect.height;
      base.startAngle = Math.atan2(e.clientY - base.centerY, e.clientX - base.centerX) * (180 / Math.PI);
    }
    dragStart.current = base;
    setMode(next);
  }

  const widthCm = liveDims ? (liveDims.w / 100) * spanCm : null;
  const heightCm = liveDims ? (liveDims.h / 100) * spanCm : null;
  // En "llenar" la imagen se estira hasta cubrir ambos lados: manda el lado con menos píxeles por cm.
  const dpi =
    content?.kind === "imagen" && content.width > 0 && widthCm && heightCm
      ? Math.round(Math.min(content.width / (widthCm / 2.54), content.height / (heightCm / 2.54)))
      : null;

  useEffect(() => {
    onSizeCm?.(widthCm && heightCm ? { w: widthCm, h: heightCm } : null);
  }, [onSizeCm, widthCm, heightCm]);

  // Distancia del borde de arriba del diseño al cuello (o al borde de la bolsa), como la mide el taller.
  const fromReferenceCm =
    widthCm && heightCm && !isSleeve(zone) && category !== "gorra"
      ? Math.max(0, topEdgeCm(category, zone, transform, spanCm, widthCm, heightCm))
      : null;

  const zoomIndex = ZOOM_LEVELS.indexOf(zoom);

  return (
    <div>
      <div className={`relative rounded-brand ${zoom > 1 ? "overflow-hidden bg-paper-soft" : ""}`}>
        {/* El zoom escala el lienzo completo hacia el centro del área de impresión.
            getBoundingClientRect ya incluye la escala, así que arrastrar sigue funcionando. */}
        <div
          ref={containerRef}
          className="relative aspect-square w-full select-none overflow-visible rounded-brand bg-paper-soft"
          style={{
            containerType: "inline-size",
            transform: zoom > 1 ? `scale(${zoom})` : undefined,
            transformOrigin: `${area.x + area.w / 2}% ${area.y + area.h / 2}%`,
            transition: "transform 200ms ease",
          }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-brand">
            <GarmentShape category={category} zone={zone} color={color} size={size} showGuide={interactive} />
          </div>

          {content && (
            <div
              ref={overlayRef}
              className="absolute"
              style={{
                left: `${transform.x}%`,
                top: `${transform.y}%`,
                width: content.kind === "imagen" ? `${imageWidthPct}%` : undefined,
                aspectRatio: imageFill ? `${area.w} / ${area.h}` : undefined,
                transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
              }}
            >
              {content.kind === "imagen" ? (
                <img
                  src={content.previewUrl}
                  alt="Diseño sobre el producto"
                  draggable={false}
                  onLoad={measure}
                  onPointerDown={(e) => begin(e, "dragging")}
                  className={`block w-full ${imageFill ? "h-full object-cover" : ""} ${interactive ? "cursor-move" : ""}`}
                  style={{ touchAction: "none" }}
                />
              ) : (
                <p
                  ref={textRef}
                  onPointerDown={(e) => begin(e, "dragging")}
                  className={`whitespace-nowrap leading-none ${interactive ? "cursor-move" : ""} ${
                    content.texto ? "" : "opacity-40"
                  }`}
                  style={{
                    color: content.color,
                    fontFamily: fontFamilyCss(content.fontFamily),
                    ...(content.outline
                      ? { WebkitTextStroke: `${TEXT_OUTLINE_WIDTH} ${content.outline}`, paintOrder: "stroke fill" }
                      : {}),
                    fontWeight: textWeight,
                    fontSize: `${textFontSize}cqw`,
                    touchAction: "none",
                  }}
                >
                  {displayText}
                </p>
              )}

              {interactive && (
                <>
                  <div
                    onPointerDown={(e) => begin(e, "resizing")}
                    style={{ touchAction: "none" }}
                    className="absolute -bottom-2.5 -right-2.5 h-5 w-5 cursor-se-resize rounded-full border-2 border-white bg-ink shadow"
                    aria-label="Cambiar tamaño"
                  />
                  <div
                    onPointerDown={(e) => begin(e, "rotating")}
                    style={{ touchAction: "none" }}
                    className="absolute -top-7 left-1/2 h-5 w-5 -translate-x-1/2 cursor-grab rounded-full border-2 border-ink bg-white shadow active:cursor-grabbing"
                    aria-label="Girar"
                  />
                </>
              )}
            </div>
          )}

          {overlay && <div className="pointer-events-none absolute inset-0">{overlay}</div>}
        </div>

        {interactive && (
          <div className="absolute right-2 top-2 flex items-center overflow-hidden rounded-full border border-black/10 bg-white/90 text-xs font-semibold text-ink shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={() => setZoom(ZOOM_LEVELS[Math.max(0, zoomIndex - 1)])}
              disabled={zoomIndex <= 0}
              aria-label="Alejar"
              className="h-8 w-8 hover:bg-paper-soft disabled:opacity-30"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              aria-label="Tamaño normal"
              className="h-8 min-w-[3rem] border-x border-black/10 px-1 tabular-nums hover:bg-paper-soft"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom(ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, zoomIndex + 1)])}
              disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
              aria-label="Acercar"
              className="h-8 w-8 hover:bg-paper-soft disabled:opacity-30"
            >
              +
            </button>
          </div>
        )}
      </div>

      {!compact && content && widthCm && heightCm && (
        <p className="mt-2 text-center text-xs text-ink-soft">
          Tamaño real del diseño:{" "}
          <span className="font-semibold text-ink">
            {widthCm.toFixed(1)} × {heightCm.toFixed(1)} cm
          </span>
          {!showPlacement && fromReferenceCm !== null && (
            <>
              {" · "}a <span className="font-semibold text-ink">{fromReferenceCm.toFixed(1)} cm</span>{" "}
              {zone === "etiqueta" ? "de la costura del cuello" : REFERENCE_LABEL[category]}
            </>
          )}
        </p>
      )}
      {showPlacement && content && widthCm && heightCm && (
        <Placement
          category={category}
          zone={zone}
          transform={transform}
          spanCm={spanCm}
          widthCm={widthCm}
          heightCm={heightCm}
          dpi={dpi}
        />
      )}
      {interactive && dpi !== null && dpi < MIN_PRINT_DPI && (
        <p className="mt-1 text-center text-xs font-medium text-yellow-700">
          A este tamaño la imagen quedaría a {dpi} ppp y podría verse borrosa. Achica el diseño o sube una imagen más grande.
        </p>
      )}
    </div>
  );
}

const REFERENCE_LABEL: Record<ProductCategory, string> = {
  camisa: "del cuello",
  hoodie: "del cuello",
  tote: "del borde superior de la bolsa",
  polo: "del cuello",
  gorra: "del botón de arriba de la gorra",
};

function Placement({
  category,
  zone,
  transform,
  spanCm,
  widthCm,
  heightCm,
  dpi,
}: {
  category: ProductCategory;
  zone: DesignZone;
  transform: DesignTransform;
  spanCm: number;
  widthCm: number;
  heightCm: number;
  dpi: number | null;
}) {
  const offsetX = ((transform.x - 50) / 100) * spanCm;
  const topEdge = topEdgeCm(category, zone, transform, spanCm, widthCm, heightCm);
  const reference = isSleeve(zone)
    ? "del borde superior de la manga"
    : zone === "etiqueta"
    ? "de la costura del cuello (por dentro)"
    : REFERENCE_LABEL[category];
  const rotation = Math.round(transform.rotation > 180 ? transform.rotation - 360 : transform.rotation);

  return (
    <ul className="mt-1 space-y-0.5 text-center text-xs text-ink-soft">
      <li>
        Borde superior a <span className="font-semibold text-ink">{Math.max(0, topEdge).toFixed(1)} cm</span> {reference}
      </li>
      <li>
        {Math.abs(offsetX) < 0.5 ? (
          <span className="font-semibold text-ink">Centrado</span>
        ) : (
          <>
            <span className="font-semibold text-ink">{Math.abs(offsetX).toFixed(1)} cm</span> a la{" "}
            {offsetX < 0 ? "izquierda" : "derecha"} del centro (vista de frente)
          </>
        )}
      </li>
      {rotation !== 0 && <li>Girado {rotation}°</li>}
      {dpi !== null && (
        <li className={dpi < MIN_PRINT_DPI ? "font-medium text-yellow-700" : ""}>
          Resolución a este tamaño: {dpi} ppp{dpi < MIN_PRINT_DPI ? " (baja)" : ""}
        </li>
      )}
    </ul>
  );
}

// cm desde el cuello (o el borde de arriba de la bolsa/manga) hasta el borde de arriba del diseño ya girado.
function topEdgeCm(
  category: ProductCategory,
  zone: DesignZone,
  transform: DesignTransform,
  spanCm: number,
  widthCm: number,
  heightCm: number
) {
  const box = rotatedBox(widthCm, heightCm, transform.rotation);
  return (transform.y / 100) * spanCm - box.h / 2 - getReferenceTopCm(category, zone);
}

// Un poco arriba del centro del área: así queda un estampado típico de pecho.
export function defaultTransform(category: ProductCategory, zone: DesignZone): DesignTransform {
  const area = getPrintArea(category, zone);
  return { x: area.x + area.w / 2, y: area.y + area.h * 0.42, scale: DEFAULT_SCALE, rotation: 0 };
}
