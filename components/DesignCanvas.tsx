"use client";

import { useEffect, useRef, useState } from "react";
import { DesignTransform, DesignZone, ProductCategory, Technique } from "@/lib/types";
import {
  ACCEPTED_DESIGN_TYPES,
  CropRect,
  DesignContent,
  ExtraPiece,
  ImageDesignContent,
  MockupContent,
  centeredCrop,
  cropAspect,
  cropImageFile,
  EMOJI_QUICK_PICKS,
  FONT_OPTIONS,
  MAX_DESIGN_SIZE_MB,
  MAX_PIECES_PER_ZONE,
  MockupTextContent,
  TEXT_COLOR_OPTIONS,
  fontFamilyCss,
  validateDesignFile,
} from "@/lib/design";
import {
  ZONE_LABEL,
  ZONE_NAME,
  isSleeve,
  getCanvasSpanCm,
  getMeasure,
  getPrintArea,
  getPrintAreaCm,
  getZonesForCategory,
  isDarkColor,
} from "./GarmentShape";
import { DesignMockup, MAX_SCALE, MIN_SCALE, defaultTransform } from "./DesignMockup";
import { ImageCropper } from "./ImageCropper";

// Posiciones rápidas, como las del taller. Sin ancho ni "max" es la posición estándar.
// topCm se mide desde el borde de arriba del área de impresión; dxCm, desde su centro
// (+ = derecha vista de frente, que es el lado izquierdo de quien la lleva puesta).
interface PlacementPreset {
  label: string;
  widthCm?: number;
  dxCm?: number;
  topCm?: number;
  max?: boolean;
}

const CHEST_PRESETS: PlacementPreset[] = [
  { label: "Estándar" },
  { label: "Pecho izquierdo", widthCm: 9, dxCm: 9.5 },
  { label: "Centro del pecho", widthCm: 10 },
  { label: "Grande", max: true },
];
const BASIC_PRESETS: PlacementPreset[] = [{ label: "Estándar" }, { label: "Grande", max: true }];

const PLACEMENT_PRESETS: Record<string, PlacementPreset[]> = {
  "camisa:frente": CHEST_PRESETS,
  "camisa:espalda": [{ label: "Estándar" }, { label: "Nuca", widthCm: 8 }, { label: "Grande", max: true }],
  "hoodie:frente": CHEST_PRESETS,
  "hoodie:espalda": BASIC_PRESETS,
  "polo:espalda": BASIC_PRESETS,
  "tote:frente": BASIC_PRESETS,
};

type SizeCm = { w: number; h: number };

const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

// El tamaño del diseño crece en línea recta con la escala, así que para llegar a un
// ancho en cm basta una regla de tres con el tamaño actual.
function presetTransform(
  p: PlacementPreset,
  category: ProductCategory,
  zone: DesignZone,
  transform: DesignTransform,
  sizeCm: SizeCm
): DesignTransform {
  if (!p.widthCm && !p.max) return defaultTransform(category, zone);
  const span = getCanvasSpanCm(category, zone);
  const area = getPrintArea(category, zone);
  const scale = p.widthCm ? clampScale((transform.scale * p.widthCm) / sizeCm.w) : MAX_SCALE;
  const heightCm = (sizeCm.h * scale) / transform.scale;
  return {
    x: area.x + area.w / 2 + ((p.dxCm ?? 0) / span) * 100,
    y: area.y + (((p.topCm ?? 0) + heightCm / 2) / span) * 100,
    scale,
    rotation: 0,
  };
}

function sameTransform(a: DesignTransform, b: DesignTransform) {
  return (
    Math.abs(a.x - b.x) < 0.6 &&
    Math.abs(a.y - b.y) < 0.6 &&
    Math.abs(a.scale - b.scale) < 0.02 &&
    Math.abs(a.rotation - b.rotation) < 1
  );
}

// Lo que ya lleva cada zona, para dibujar las miniaturas de Frente / Espalda / Manga.
export type ZonePreviews = Partial<Record<DesignZone, { content: DesignContent; transform: DesignTransform; extras?: ExtraPiece[] }>>;

export function DesignCanvas({
  category,
  color,
  size,
  zone,
  zonesWithContent,
  zonePreviews,
  onZoneChange,
  content,
  onContentChange,
  transform,
  onTransformChange,
  technique,
  layers,
  emptyPanel,
  panelTop,
  contentTitle,
  textPlaceholder = "Escribe tu texto",
  others,
  pieces,
  onAddText,
  onAddImage,
  pieceKey,
  children,
}: {
  technique?: Technique;
  category: ProductCategory;
  color: string;
  size: string;
  zone: DesignZone;
  zonesWithContent: DesignZone[];
  zonePreviews: ZonePreviews;
  onZoneChange: (zone: DesignZone) => void;
  content: DesignContent | null;
  // resetTransform: true cuando es un diseño nuevo en la zona (se recoloca).
  onContentChange: (content: DesignContent | null, resetTransform: boolean) => void;
  transform: DesignTransform;
  onTransformChange: (t: DesignTransform) => void;
  // Camisas de grupo: lo que va debajo o encima de lo que se edita en cada zona (el
  // diseño de todos y los textos de cada persona). main: la vista grande.
  layers?: (zone: DesignZone, main: boolean) => { underlay?: React.ReactNode; overlay?: React.ReactNode };
  // En vez de "¿Qué quieres poner…?" cuando la zona no tiene nada que editar.
  emptyPanel?: React.ReactNode;
  // Arriba de las opciones de la zona (para elegir qué texto se edita).
  panelTop?: React.ReactNode;
  // En vez de "Texto" sobre las opciones de un texto.
  contentTitle?: string;
  textPlaceholder?: string;
  // Lo demás que va en esta parte (otros textos): se ve en la vista grande y tocarlo lo elige.
  others?: { content: MockupContent; transform: DesignTransform; onPick: () => void }[];
  // Todo lo que lleva esta parte, para elegir cuál se edita.
  pieces?: { label: string; active: boolean; onSelect: () => void }[];
  // Agrega otro texto en esta parte (sin él no se ofrece).
  onAddText?: () => void;
  // Agrega otra imagen en esta parte (ya revisada).
  onAddImage?: (content: ImageDesignContent) => void;
  // Cuál de las cosas de la zona se edita: al cambiar, la vista grande empieza de cero
  // (si no, mediría el texto nuevo con el tamaño del anterior y lo correría).
  pieceKey?: string;
  children?: React.ReactNode; // debajo de las opciones de la zona
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const focusText = useRef(false);
  // La imagen que se elija: cambia la que se edita, o se agrega como otra cosa en la parte.
  const fileAdds = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [sizeCm, setSizeCm] = useState<SizeCm | null>(null);
  const [cropping, setCropping] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);

  const zones = getZonesForCategory(category);
  const measure = getMeasure(category, size);
  const printCm = getPrintAreaCm(category, zone);
  const embroidered = technique ? technique === "bordado" : category === "polo" || category === "gorra";

  useEffect(() => {
    if (focusText.current && content?.kind === "texto") {
      textRef.current?.focus();
      focusText.current = false;
    }
  }, [content]);

  async function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    const { content: validated, error: validationError } = await validateDesignFile(file);
    if (validationError || !validated) {
      setError(validationError);
      return;
    }
    if (fileAdds.current && onAddImage) onAddImage(validated);
    else onContentChange(validated, true);
  }

  function pickFile(add: boolean) {
    setError(null);
    fileAdds.current = add;
    fileRef.current?.click();
  }

  function addText() {
    setError(null);
    focusText.current = true;
    onContentChange(
      { kind: "texto", texto: "", color: isDarkColor(color) ? "#FFFFFF" : "#111111", fontFamily: "sans" },
      true
    );
  }

  function updateText(patch: Partial<MockupTextContent>) {
    if (content?.kind !== "texto") return;
    onContentChange({ ...content, ...patch }, false);
  }

  function insertEmoji(emoji: string) {
    if (content?.kind !== "texto") return;
    const el = textRef.current;
    const start = el?.selectionStart ?? content.texto.length;
    const end = el?.selectionEnd ?? content.texto.length;
    updateText({ texto: content.texto.slice(0, start) + emoji + content.texto.slice(end) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  const rotationDisplay = transform.rotation > 180 ? transform.rotation - 360 : transform.rotation;
  const setRotation = (deg: number) => onTransformChange({ ...transform, rotation: ((deg % 360) + 360) % 360 });
  const area = getPrintArea(category, zone);
  const presets = PLACEMENT_PRESETS[`${category}:${zone}`];
  const maxCm = sizeCm && transform.scale > 0 ? { w: (sizeCm.w / transform.scale) * MAX_SCALE, h: (sizeCm.h / transform.scale) * MAX_SCALE } : null;

  // La imagen completa que subió el cliente (si ya la recortó, la original).
  const sourceImage =
    content?.kind === "imagen"
      ? content.source
        ? {
            file: content.source.file,
            previewUrl: content.source.previewUrl,
            width: content.source.width,
            height: content.source.height,
          }
        : { file: content.file, previewUrl: content.previewUrl, width: content.width, height: content.height }
      : null;
  const fillTransform = { x: area.x + area.w / 2, y: area.y + area.h / 2, scale: MAX_SCALE, rotation: 0 };

  function showWholeImage() {
    if (content?.kind !== "imagen" || !sourceImage) return;
    setCropError(null);
    if (content.source) {
      onContentChange({ kind: "imagen", ...sourceImage, fill: false }, false);
      onTransformChange(defaultTransform(category, zone));
    } else {
      onContentChange({ ...content, fill: false }, false);
    }
  }

  // Qué encuadre tiene la imagen: completa, llenando el área (con la forma del área,
  // en cualquier posición) o con otro recorte.
  const areaAspect = printCm.w / printCm.h;
  const framing: "completa" | "llenar" | "recorte" =
    content?.kind !== "imagen"
      ? "completa"
      : content.source
      ? Math.abs(cropAspect(content.source.crop, content.source.width, content.source.height) - areaAspect) < 0.01
        ? "llenar"
        : "recorte"
      : content.fill
      ? "llenar"
      : "completa";

  function fillArea() {
    if (!sourceImage) return;
    void applyCrop(centeredCrop(areaAspect, sourceImage.width, sourceImage.height), true);
  }

  async function applyCrop(crop: CropRect, fillsArea: boolean) {
    if (!sourceImage) return;
    try {
      const cropped = await cropImageFile(sourceImage, crop);
      onContentChange({ kind: "imagen", ...cropped, fill: false, source: { ...sourceImage, crop } }, false);
      onTransformChange(fillsArea ? fillTransform : defaultTransform(category, zone));
      setCropError(null);
    } catch (err) {
      setCropError(err instanceof Error ? err.message : "No se pudo recortar la imagen.");
    }
    setCropping(false);
  }

  function resizeTo(target: number, current: number) {
    if (!(target > 0) || !(current > 0)) return;
    onTransformChange({ ...transform, scale: clampScale((transform.scale * target) / current) });
  }

  return (
    <div>
      <DesignMockup
        key={`${zone}:${pieceKey ?? ""}`}
        category={category}
        zone={zone}
        color={color}
        size={size}
        content={content}
        transform={transform}
        onTransformChange={onTransformChange}
        onSizeCm={setSizeCm}
        extras={others}
        {...layers?.(zone, true)}
      />

      {zones.length > 1 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Vistas del producto">
          {zones.map((z) => {
            const preview = zonePreviews[z];
            const active = zone === z;
            return (
              <button
                key={z}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onZoneChange(z)}
                className={`relative rounded-brand border-2 bg-white p-1 transition-colors ${
                  zones.length > 3 ? "w-[3.75rem] sm:w-[4.5rem]" : "w-[4.5rem] sm:w-20"
                } ${
                  active ? "border-ink" : "border-black/10 hover:border-ink/40"
                }`}
              >
                <div className="pointer-events-none">
                  <DesignMockup
                    category={category}
                    zone={z}
                    color={color}
                    size={size}
                    content={preview?.content ?? null}
                    transform={preview?.transform ?? defaultTransform(category, z)}
                    extras={preview?.extras}
                    interactive={false}
                    compact
                    {...layers?.(z, false)}
                  />
                </div>
                <span className={`mt-1 block text-[11px] ${active ? "font-bold text-ink" : "font-medium text-ink-soft"}`}>
                  {ZONE_LABEL[z]}
                </span>
                {zonesWithContent.includes(z) && (
                  <span
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-paper"
                    aria-label="con diseño"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-center text-[11px] text-ink-muted">
        {category === "tote"
          ? `Tote bag de ${measure.ancho} × ${measure.largo} cm`
          : category === "gorra"
          ? "Gorra de talla ajustable"
          : zone === "etiqueta"
          ? "Etiqueta por dentro, debajo del cuello"
          : zone === "manga-izq"
          ? `Manga izquierda (de quien la lleva puesta), talla ${size}`
          : zone === "manga-der"
          ? `Manga derecha (de quien la lleva puesta), talla ${size}`
          : isSleeve(zone)
          ? `Manga talla ${size}`
          : `Talla ${size}: ${measure.ancho} cm de ancho × ${measure.largo} cm de largo`}
        {" · "}área máxima de {embroidered ? "bordado" : "impresión"} {printCm.w} × {printCm.h} cm (línea punteada)
      </p>

      <div className="mt-4 rounded-brand border border-black/10 bg-white p-4">
        {panelTop}
        {content && pieces && onAddText && (
          <div className="mb-4 border-b border-black/10 pb-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
              {pieces.length > 1 ? `Lo que va en ${ZONE_NAME[zone]} · toca uno para editarlo` : `Lo que va en ${ZONE_NAME[zone]}`}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {pieces.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={p.active}
                  onClick={p.onSelect}
                  className={`max-w-[11rem] truncate rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    p.active ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              {pieces.length < MAX_PIECES_PER_ZONE && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    focusText.current = true;
                    onAddText();
                  }}
                  className="flex items-center gap-1 rounded-full border border-dashed border-ink/40 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-paper-soft"
                >
                  + Agregar texto
                </button>
              )}
              {pieces.length < MAX_PIECES_PER_ZONE && onAddImage && (
                <button
                  type="button"
                  onClick={() => pickFile(true)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-ink/40 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-paper-soft"
                >
                  + Agregar imagen
                </button>
              )}
            </div>
          </div>
        )}
        {!content && emptyPanel ? (
          emptyPanel
        ) : !content ? (
          <div>
            <p className="text-sm font-semibold text-ink">¿Qué quieres poner en {ZONE_NAME[zone]}?</p>
            {zone === "etiqueta" && (
              <p className="mt-1 text-xs text-ink-soft">
                Tu propia etiqueta: el logo de tu marca, la talla o las instrucciones de lavado.
              </p>
            )}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => pickFile(false)}
                className="flex items-center justify-center gap-2 rounded-brand bg-ink px-4 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-80"
              >
                <UploadIcon /> Subir imagen JPG
              </button>
              <button
                type="button"
                onClick={addText}
                className="flex items-center justify-center gap-2 rounded-brand border border-ink/20 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                <TextIcon /> Agregar texto
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              Solo JPG · máximo {MAX_DESIGN_SIZE_MB} MB · mínimo 1000 px por lado
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-ink">
                {content.kind === "imagen" ? `Imagen: ${content.file.name}` : contentTitle ?? "Texto"}
              </p>
              <div className="flex shrink-0 gap-3 text-xs">
                {content.kind === "imagen" && (
                  <button type="button" onClick={() => pickFile(false)} className="font-semibold text-ink hover:underline">
                    Cambiar imagen
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onContentChange(null, true)}
                  className="font-semibold text-ink-soft hover:text-ink hover:underline"
                >
                  Quitar
                </button>
              </div>
            </div>

            {content.kind === "texto" && (
              <div className="space-y-3">
                <input
                  ref={textRef}
                  value={content.texto}
                  onChange={(e) => updateText({ texto: e.target.value })}
                  placeholder={textPlaceholder}
                  maxLength={40}
                  className="input"
                />

                <div className="flex flex-wrap gap-1">
                  {EMOJI_QUICK_PICKS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-black/10 text-sm hover:border-ink"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">Letra</p>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => updateText({ fontFamily: f.value })}
                        style={{ fontFamily: fontFamilyCss(f.value), fontWeight: f.weight }}
                        className={`truncate rounded-brand border px-2 py-1.5 text-sm ${
                          content.fontFamily === f.value
                            ? "border-ink bg-ink text-paper"
                            : "border-black/15 text-ink-soft hover:border-ink hover:text-ink"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">Color</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {TEXT_COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => updateText({ color: c.value })}
                        title={c.label}
                        aria-label={c.label}
                        className={`h-7 w-7 rounded-full border ${
                          content.color.toLowerCase() === c.value.toLowerCase()
                            ? "ring-2 ring-ink ring-offset-2"
                            : "border-black/15"
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                    <label
                      title="Otro color"
                      className="relative flex h-7 cursor-pointer items-center gap-1 rounded-full border border-black/15 px-2 text-xs text-ink-soft hover:border-ink"
                    >
                      Otro
                      <input
                        type="color"
                        value={content.color}
                        onChange={(e) => updateText({ color: e.target.value })}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">Contorno de las letras</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateText({ outline: null })}
                      className={`h-7 rounded-full border px-2.5 text-xs font-semibold ${
                        !content.outline ? "border-ink bg-ink text-paper" : "border-black/15 text-ink-soft hover:border-ink"
                      }`}
                    >
                      Sin contorno
                    </button>
                    {TEXT_COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => updateText({ outline: c.value })}
                        title={`Contorno ${c.label.toLowerCase()}`}
                        aria-label={`Contorno ${c.label.toLowerCase()}`}
                        className={`h-7 w-7 rounded-full border-[3px] bg-transparent ${
                          content.outline?.toLowerCase() === c.value.toLowerCase() ? "ring-2 ring-ink ring-offset-2" : ""
                        }`}
                        style={{ borderColor: c.value, boxShadow: c.value === "#FFFFFF" ? "inset 0 0 0 1px rgba(0,0,0,0.2)" : undefined }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {content.kind === "imagen" && (
              <Section title="Encuadre">
                <div className="grid grid-cols-3 gap-1.5">
                  <FitOption active={framing === "completa"} onClick={showWholeImage} title="Completa" hint="La imagen entera" />
                  <FitOption
                    active={framing === "llenar"}
                    onClick={fillArea}
                    title="Llenar área"
                    hint={`Cubre ${printCm.w} × ${printCm.h} cm`}
                  />
                  <FitOption
                    active={framing === "recorte"}
                    onClick={() => setCropping(true)}
                    title="Recortar"
                    hint="Encuadre a tu medida"
                  />
                </div>
                {content.source && (
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-muted">
                    <span>
                      Recorte aplicado · {content.width} × {content.height} px
                    </span>
                    <button type="button" onClick={() => setCropping(true)} className="font-semibold text-ink underline">
                      Ajustar recorte
                    </button>
                  </p>
                )}
                {cropError && <p className="mt-1.5 text-xs font-medium text-red-600">{cropError}</p>}
              </Section>
            )}
            {cropping && sourceImage && content?.kind === "imagen" && (
              <ImageCropper
                src={sourceImage.previewUrl}
                width={sourceImage.width}
                height={sourceImage.height}
                areaAspect={printCm.w / printCm.h}
                areaLabel={`${printCm.w} × ${printCm.h} cm`}
                initialCrop={content.source?.crop}
                onCancel={() => setCropping(false)}
                onApply={applyCrop}
              />
            )}

            <Section title="Posición">
              <div className="flex flex-wrap gap-1.5">
                {presets &&
                  sizeCm &&
                  presets.map((p) => {
                    const target = presetTransform(p, category, zone, transform, sizeCm);
                    const active = sameTransform(target, transform);
                    return (
                      <Chip key={p.label} active={active} onClick={() => onTransformChange(target)}>
                        {p.label}
                      </Chip>
                    );
                  })}
                <Chip onClick={() => onTransformChange({ ...transform, x: area.x + area.w / 2 })}>Centrar</Chip>
                {!presets && <Chip onClick={() => onTransformChange(defaultTransform(category, zone))}>Restablecer</Chip>}
              </div>
            </Section>

            <Section
              title="Tamaño"
              aside={
                <button
                  type="button"
                  onClick={() => onTransformChange({ ...transform, scale: MAX_SCALE })}
                  disabled={transform.scale >= MAX_SCALE}
                  className="text-[11px] font-semibold text-ink underline disabled:text-ink-muted disabled:no-underline"
                >
                  Máximo
                </button>
              }
            >
              {sizeCm && maxCm && (
                <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <CmInput label="Ancho" value={sizeCm.w} onCommit={(cm) => resizeTo(cm, sizeCm.w)} />
                  <CmInput label="Alto" value={sizeCm.h} onCommit={(cm) => resizeTo(cm, sizeCm.h)} />
                  <span className="text-[11px] text-ink-muted">
                    máx. {maxCm.w.toFixed(1)} × {maxCm.h.toFixed(1)} cm
                  </span>
                </div>
              )}
              <Slider
                label="Escala"
                value={transform.scale}
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={0.01}
                display={`${Math.round(transform.scale * 100)}%`}
                onChange={(scale) => onTransformChange({ ...transform, scale })}
              />
            </Section>

            <Section title="Rotación">
              <Slider
                label="Ángulo"
                value={rotationDisplay}
                min={-180}
                max={180}
                step={1}
                display={`${Math.round(rotationDisplay)}°`}
                onChange={setRotation}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[-90, 0, 90].map((deg) => (
                  <Chip key={deg} active={Math.round(rotationDisplay) === deg} onClick={() => setRotation(deg)}>
                    {deg === 0 ? "0° · Enderezar" : `${deg > 0 ? "+" : "−"}${Math.abs(deg)}°`}
                  </Chip>
                ))}
              </div>
            </Section>

            <p className="border-t border-black/10 pt-3 text-[11px] text-ink-muted">
              Arrastra el diseño sobre la prenda para moverlo · esquina negra: tamaño · círculo blanco: rotación.
            </p>
          </div>
        )}
      </div>

      {children}

      <input
        ref={fileRef}
        type="file"
        accept={[...ACCEPTED_DESIGN_TYPES, ".jpg", ".jpeg"].join(",")}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border-t border-black/10 pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">{title}</p>
        {aside}
      </div>
      {children}
    </div>
  );
}

function Chip({ active = false, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-brand border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  action,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-ink-soft">
        <span>
          {label} <span className="text-ink">{display}</span>
        </span>
        {action}
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-ink"
      />
    </div>
  );
}

// Campo en cm: se aplica al salir del campo o con Enter, para no brincar mientras se escribe.
function CmInput({ label, value, onCommit }: { label: string; value: number; onCommit: (cm: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft === null) return;
    const cm = parseFloat(draft.replace(",", "."));
    setDraft(null);
    if (cm > 0 && Math.abs(cm - value) >= 0.05) onCommit(cm);
  }

  return (
    <label className="flex items-center gap-1.5 text-xs text-ink-soft">
      {label}
      <input
        type="text"
        inputMode="decimal"
        value={draft ?? value.toFixed(1)}
        onFocus={(e) => {
          setDraft(value.toFixed(1));
          e.target.select();
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-16 rounded-brand border border-black/15 bg-white px-2 py-1 text-center text-sm font-semibold text-ink outline-none focus:border-ink"
      />
      cm
    </label>
  );
}

function FitOption({ active, onClick, title, hint }: { active: boolean; onClick: () => void; title: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-brand border px-3 py-2 text-left transition-colors ${
        active ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
      }`}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className={`block text-[11px] ${active ? "text-paper/70" : "text-ink-muted"}`}>{hint}</span>
    </button>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M10 13V3M10 3 6 7M10 3l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 13v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M4 5h12M10 5v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
