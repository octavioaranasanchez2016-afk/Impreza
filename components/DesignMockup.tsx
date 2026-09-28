"use client";

import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DesignTransform, DesignZone, ProductCategory } from "@/lib/types";
import { fontFamilyCss, FontFamilyKey, MIN_PRINT_DPI, MockupContent } from "@/lib/design";
import { GarmentShape, getCanvasSpanCm, getPrintArea } from "./GarmentShape";

// La escala es relativa al área máxima de impresión: 1 = el diseño la llena.
export const MIN_SCALE = 0.15;
export const MAX_SCALE = 1;
export const DEFAULT_SCALE = 0.8;
const RESIZE_SENSITIVITY = 1.1;

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
}: {
  category: ProductCategory;
  zone: DesignZone;
  color: string;
  size?: string;
  content: MockupContent | null;
  transform: DesignTransform;
  onTransformChange?: (t: DesignTransform) => void;
  interactive?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const dragStart = useRef({ pointerX: 0, pointerY: 0, x: 0, y: 0, scale: 1, rotation: 0, centerX: 0, centerY: 0, startAngle: 0 });

  const area = getPrintArea(category, zone);
  const spanCm = getCanvasSpanCm(category, zone);
  const textWeight = content?.kind === "texto" && content.fontFamily === "script" ? 400 : 700;
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

  const imageWidthPct =
    content?.kind === "imagen" ? computeFitWidthPct(category, zone, content.width, content.height) * transform.scale : 0;

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

  useLayoutEffect(measure, [measure, content, displayText, textFontSize, imageWidthPct]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure]);

  const clampTransform = useCallback(
    (t: DesignTransform): DesignTransform => {
      if (!dims) return t;
      const box = rotatedBox(dims.w, dims.h, t.rotation);
      return {
        ...t,
        x: clampCenter(t.x, box.w, area.x, area.w),
        y: clampCenter(t.y, box.h, area.y, area.h),
      };
    },
    [dims, area.x, area.y, area.w, area.h]
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

  const widthCm = dims ? (dims.w / 100) * spanCm : null;
  const heightCm = dims ? (dims.h / 100) * spanCm : null;
  const dpi =
    content?.kind === "imagen" && content.width > 0 && widthCm ? Math.round(content.width / (widthCm / 2.54)) : null;

  return (
    <div>
      <div
        ref={containerRef}
        className="relative aspect-square w-full select-none overflow-visible rounded-brand bg-paper-soft"
        style={{ containerType: "inline-size" }}
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
                className={`block w-full ${interactive ? "cursor-move" : ""}`}
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
      </div>

      {content && widthCm && heightCm && (
        <p className="mt-2 text-center text-xs text-ink-soft">
          Tamaño real del diseño:{" "}
          <span className="font-semibold text-ink">
            {widthCm.toFixed(1)} × {heightCm.toFixed(1)} cm
          </span>
        </p>
      )}
      {interactive && dpi !== null && dpi < MIN_PRINT_DPI && (
        <p className="mt-1 text-center text-xs font-medium text-yellow-700">
          A este tamaño la imagen quedaría a {dpi} ppp y podría verse borrosa. Achica el diseño o sube una imagen más grande.
        </p>
      )}
    </div>
  );
}

// Un poco arriba del centro del área: así queda un estampado típico de pecho.
export function defaultTransform(category: ProductCategory, zone: DesignZone): DesignTransform {
  const area = getPrintArea(category, zone);
  return { x: area.x + area.w / 2, y: area.y + area.h * 0.42, scale: DEFAULT_SCALE, rotation: 0 };
}
