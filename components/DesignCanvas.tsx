"use client";

import { useEffect, useRef, useState } from "react";
import { DesignTransform, DesignZone, ProductCategory } from "@/lib/types";
import {
  ACCEPTED_DESIGN_TYPES,
  DesignContent,
  EMOJI_QUICK_PICKS,
  FONT_OPTIONS,
  MAX_DESIGN_SIZE_MB,
  MockupTextContent,
  TEXT_COLOR_OPTIONS,
  fontFamilyCss,
  validateDesignFile,
} from "@/lib/design";
import {
  ZONE_LABEL,
  getMeasure,
  getPrintArea,
  getPrintAreaCm,
  getZonesForCategory,
  isDarkColor,
} from "./GarmentShape";
import { DesignMockup, MAX_SCALE, MIN_SCALE, defaultTransform } from "./DesignMockup";

// Lo que ya lleva cada zona, para dibujar las miniaturas de Frente / Espalda / Manga.
export type ZonePreviews = Partial<Record<DesignZone, { content: DesignContent; transform: DesignTransform }>>;

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
}: {
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
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const focusText = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const zones = getZonesForCategory(category);
  const measure = getMeasure(category, size);
  const printCm = getPrintAreaCm(category, zone);
  const embroidered = category === "polo" || category === "gorra";

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
    if (validationError) {
      setError(validationError);
      return;
    }
    onContentChange(validated, true);
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

  return (
    <div>
      <DesignMockup
        category={category}
        zone={zone}
        color={color}
        size={size}
        content={content}
        transform={transform}
        onTransformChange={onTransformChange}
      />

      {zones.length > 1 && (
        <div className="mt-3 flex justify-center gap-2.5" role="tablist" aria-label="Vistas del producto">
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
                className={`relative w-[4.5rem] rounded-brand border-2 bg-white p-1 transition-colors sm:w-20 ${
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
                    interactive={false}
                    compact
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
          : zone === "manga"
          ? `Manga talla ${size}`
          : `Talla ${size}: ${measure.ancho} cm de ancho × ${measure.largo} cm de largo`}
        {" · "}área máxima de {embroidered ? "bordado" : "impresión"} {printCm.w} × {printCm.h} cm (línea punteada)
      </p>

      <div className="mt-4 rounded-brand border border-black/10 bg-white p-4">
        {!content ? (
          <div>
            <p className="text-sm font-semibold text-ink">¿Qué quieres poner en {ZONE_LABEL[zone].toLowerCase()}?</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
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
                {content.kind === "imagen" ? `Imagen: ${content.file.name}` : "Texto"}
              </p>
              <div className="flex shrink-0 gap-3 text-xs">
                {content.kind === "imagen" && (
                  <button type="button" onClick={() => fileRef.current?.click()} className="font-semibold text-ink hover:underline">
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
                  placeholder="Escribe tu texto"
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
                  <p className="mb-1.5 text-xs font-medium text-ink-soft">Letra</p>
                  <div className="flex flex-wrap gap-1.5">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => updateText({ fontFamily: f.value })}
                        style={{ fontFamily: fontFamilyCss(f.value) }}
                        className={`rounded-brand border px-3 py-1.5 text-sm ${
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
                  <p className="mb-1.5 text-xs font-medium text-ink-soft">Color</p>
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
              </div>
            )}

            {content.kind === "imagen" && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink-soft">Ajuste de la imagen</p>
                <div className="grid grid-cols-2 gap-2">
                  <FitOption
                    active={!content.fill}
                    onClick={() => onContentChange({ ...content, fill: false }, false)}
                    title="Imagen completa"
                    hint="Se ve toda la imagen"
                  />
                  <FitOption
                    active={Boolean(content.fill)}
                    onClick={() => {
                      onContentChange({ ...content, fill: true }, false);
                      onTransformChange({ x: area.x + area.w / 2, y: area.y + area.h / 2, scale: MAX_SCALE, rotation: 0 });
                    }}
                    title="Llenar el área"
                    hint={`Cubre los ${printCm.w} × ${printCm.h} cm; recorta los bordes`}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Slider
                label="Tamaño"
                value={transform.scale}
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={0.01}
                display={`${Math.round(transform.scale * 100)}%`}
                onChange={(scale) => onTransformChange({ ...transform, scale })}
                action={
                  <button
                    type="button"
                    onClick={() => onTransformChange({ ...transform, scale: MAX_SCALE })}
                    disabled={transform.scale >= MAX_SCALE}
                    className="rounded border border-ink bg-ink px-2 py-0.5 text-[11px] font-semibold text-paper transition-opacity hover:opacity-80 disabled:border-black/15 disabled:bg-transparent disabled:text-ink-muted"
                  >
                    Máximo
                  </button>
                }
              />
              <Slider
                label="Girar"
                value={rotationDisplay}
                min={-180}
                max={180}
                step={1}
                display={`${Math.round(rotationDisplay)}°`}
                onChange={setRotation}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <ToolButton onClick={() => onTransformChange({ ...transform, x: area.x + area.w / 2 })}>Centrar</ToolButton>
              <ToolButton onClick={() => setRotation(0)}>Enderezar</ToolButton>
              <ToolButton onClick={() => onTransformChange(defaultTransform(category, zone))}>Restablecer</ToolButton>
            </div>

            <p className="text-xs text-ink-muted">
              También puedes arrastrar el diseño. Punto negro: tamaño · punto blanco: girar.
            </p>
          </div>
        )}
      </div>

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

function ToolButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-brand border border-black/15 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink"
    >
      {children}
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
