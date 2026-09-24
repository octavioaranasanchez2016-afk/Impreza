"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DesignTransform, DesignZone, ProductCategory } from "@/lib/types";
import { fontFamilyCss, FontFamilyKey, MockupContent } from "@/lib/design";
import { GarmentShape, getPrintArea } from "./GarmentShape";

const FALLBACK_BASE_SIZE_PCT = 34; // usado para texto o cuando no conocemos las dimensiones reales
const MIN_SCALE = 0.3;
// Permite diseños grandes (hasta cubrir casi toda la prenda) — el cliente
// puede necesitar un estampado grande, no solo uno pequeño en el pecho.
const MAX_SCALE = 4.5;
// Sensibilidad del arrastre de la esquina: % de escala por % de ancho del
// contenedor arrastrado. Más bajo = más control fino.
const RESIZE_SENSITIVITY = 1.1;

// Calcula, en % del contenedor, el ancho al que el diseño del cliente cabe
// completo dentro del área de impresión del producto ("contain"), sin
// importar la resolución o proporción del archivo que suba.
export function computeFitWidthPct(
  category: ProductCategory,
  zone: DesignZone,
  imageWidth: number | null,
  imageHeight: number | null
): number {
  const area = getPrintArea(category, zone);
  if (!imageWidth || !imageHeight) return FALLBACK_BASE_SIZE_PCT;

  const imageAspect = imageWidth / imageHeight;
  const areaAspect = area.w / area.h;

  if (imageAspect >= areaAspect) {
    return area.w;
  }
  return area.h * imageAspect;
}

// Ancho aproximado de un caracter como fracción de su propio font-size, por
// fuente — deja calcular un font-size que haga que el texto quepa en el
// área de impresión, igual que computeFitWidthPct hace con imágenes.
const TEXT_CHAR_WIDTH_RATIO: Record<FontFamilyKey, number> = {
  sans: 0.56,
  display: 0.42,
  script: 0.5,
  serif: 0.58,
  mono: 0.62,
};

const MIN_TEXT_FONT_CQW = 3;
const MAX_TEXT_FONT_CQW = 40;

function computeTextFontSizeCqw(
  category: ProductCategory,
  zone: DesignZone,
  scale: number,
  texto: string,
  fontFamily: FontFamilyKey
): number {
  const area = getPrintArea(category, zone);
  const length = Math.max(1, (texto || "Tu texto").trim().length);
  const ratio = TEXT_CHAR_WIDTH_RATIO[fontFamily];
  const raw = (area.w * scale) / (length * ratio);
  return Math.min(MAX_TEXT_FONT_CQW, Math.max(MIN_TEXT_FONT_CQW, raw));
}

type Mode = "idle" | "dragging" | "resizing" | "rotating";

interface DragState {
  pointerX: number;
  pointerY: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  centerX: number;
  centerY: number;
  startAngle: number;
}

export function DesignMockup({
  category,
  zone,
  color,
  content,
  transform,
  onTransformChange,
  interactive = true,
}: {
  category: ProductCategory;
  zone: DesignZone;
  color: string;
  content: MockupContent | null;
  transform: DesignTransform;
  onTransformChange?: (t: DesignTransform) => void;
  interactive?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const dragStart = useRef<DragState>({
    pointerX: 0,
    pointerY: 0,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    centerX: 0,
    centerY: 0,
    startAngle: 0,
  });

  const baseSizePct =
    content?.kind === "imagen"
      ? computeFitWidthPct(category, zone, content.width, content.height)
      : FALLBACK_BASE_SIZE_PCT;

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (mode === "dragging") {
        const deltaXPct = ((e.clientX - dragStart.current.pointerX) / rect.width) * 100;
        const deltaYPct = ((e.clientY - dragStart.current.pointerY) / rect.height) * 100;
        onTransformChange?.({
          ...transform,
          x: clamp(dragStart.current.x + deltaXPct, 5, 95),
          y: clamp(dragStart.current.y + deltaYPct, 5, 95),
        });
      } else if (mode === "resizing") {
        const deltaXPct = ((e.clientX - dragStart.current.pointerX) / rect.width) * 100;
        const newScale = dragStart.current.scale + (deltaXPct / 100) * RESIZE_SENSITIVITY;
        onTransformChange?.({
          ...transform,
          scale: clamp(newScale, MIN_SCALE, MAX_SCALE),
        });
      } else if (mode === "rotating") {
        const currentAngle =
          Math.atan2(e.clientY - dragStart.current.centerY, e.clientX - dragStart.current.centerX) *
          (180 / Math.PI);
        const delta = currentAngle - dragStart.current.startAngle;
        const newRotation = ((dragStart.current.rotation + delta) % 360 + 360) % 360;
        onTransformChange?.({ ...transform, rotation: newRotation });
      }
    },
    [mode, onTransformChange, transform]
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

  function startDrag(e: React.PointerEvent) {
    if (!interactive) return;
    e.preventDefault();
    dragStart.current = {
      ...dragStart.current,
      pointerX: e.clientX,
      pointerY: e.clientY,
      x: transform.x,
      y: transform.y,
      scale: transform.scale,
    };
    setMode("dragging");
  }

  function startResize(e: React.PointerEvent) {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    dragStart.current = {
      ...dragStart.current,
      pointerX: e.clientX,
      pointerY: e.clientY,
      x: transform.x,
      y: transform.y,
      scale: transform.scale,
    };
    setMode("resizing");
  }

  function startRotate(e: React.PointerEvent) {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + (transform.x / 100) * rect.width;
    const centerY = rect.top + (transform.y / 100) * rect.height;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    dragStart.current = { ...dragStart.current, rotation: transform.rotation, centerX, centerY, startAngle };
    setMode("rotating");
  }

  const width = baseSizePct * transform.scale;

  return (
    <div>
      <div
        ref={containerRef}
        className="relative aspect-square w-full select-none overflow-visible rounded-brand bg-paper"
        style={{ containerType: "inline-size" }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-brand">
          <GarmentShape category={category} zone={zone} color={color} showGuide={interactive} />
        </div>

        {content && (
          <div
            className="absolute"
            style={{
              left: `${transform.x}%`,
              top: `${transform.y}%`,
              width: content.kind === "imagen" ? `${width}%` : undefined,
              transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
            }}
          >
            {content.kind === "imagen" ? (
              content.previewUrl ? (
                <img
                  src={content.previewUrl}
                  alt="Diseño sobre el producto"
                  draggable={false}
                  onPointerDown={startDrag}
                  className={`w-full ${interactive ? "cursor-move" : ""}`}
                  style={{ touchAction: "none" }}
                />
              ) : (
                <div
                  onPointerDown={startDrag}
                  className={`flex aspect-square w-full items-center justify-center rounded bg-ink/10 text-xs font-medium text-ink-soft ${
                    interactive ? "cursor-move" : ""
                  }`}
                  style={{ touchAction: "none" }}
                >
                  PDF
                </div>
              )
            ) : (
              <p
                onPointerDown={startDrag}
                className={`whitespace-nowrap leading-none ${interactive ? "cursor-move" : ""}`}
                style={{
                  color: content.color,
                  fontFamily: fontFamilyCss(content.fontFamily),
                  fontWeight: content.fontFamily === "script" ? 400 : 700,
                  fontSize: `${computeTextFontSizeCqw(
                    category,
                    zone,
                    transform.scale,
                    content.texto,
                    content.fontFamily
                  )}cqw`,
                  touchAction: "none",
                }}
              >
                {content.texto || "Tu texto"}
              </p>
            )}

            {interactive && (
              <>
                <div
                  onPointerDown={startResize}
                  style={{ touchAction: "none" }}
                  className="absolute -bottom-2 -right-2 h-5 w-5 cursor-se-resize rounded-full border-2 border-white bg-ink shadow"
                  aria-label="Redimensionar diseño"
                />
                <div
                  onPointerDown={startRotate}
                  style={{ touchAction: "none" }}
                  className="absolute -top-7 left-1/2 h-5 w-5 -translate-x-1/2 cursor-grab rounded-full border-2 border-ink bg-white shadow active:cursor-grabbing"
                  aria-label="Girar diseño"
                />
              </>
            )}
          </div>
        )}
      </div>

      {interactive && content && (
        <p className="mt-2 text-center text-xs text-ink-soft">
          Arrastra para mover · celeste para tamaño · amarillo para girar
        </p>
      )}
    </div>
  );
}

export function defaultTransform(category: ProductCategory, zone: DesignZone): DesignTransform {
  const area = getPrintArea(category, zone);
  return { x: area.x + area.w / 2, y: area.y + area.h / 2, scale: 1, rotation: 0 };
}
