"use client";

import { useRef, useState } from "react";
import { DesignTransform, DesignZone, ProductCategory } from "@/lib/types";
import {
  ACCEPTED_DESIGN_TYPES,
  DesignContent,
  EMOJI_QUICK_PICKS,
  FONT_OPTIONS,
  FontFamilyKey,
  TEXT_COLOR_OPTIONS,
  fontFamilyCss,
  validateDesignFile,
} from "@/lib/design";
import { GarmentShape, getZonesForCategory, ZONE_LABEL } from "./GarmentShape";
import { DesignMockup } from "./DesignMockup";

export function DesignCanvas({
  category,
  color,
  zone,
  onZoneChange,
  content,
  onContentChange,
  transform,
  onTransformChange,
}: {
  category: ProductCategory;
  color: string;
  zone: DesignZone;
  onZoneChange: (zone: DesignZone) => void;
  content: DesignContent | null;
  onContentChange: (content: DesignContent | null) => void;
  transform: DesignTransform;
  onTransformChange: (t: DesignTransform) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState("");
  const [textColor, setTextColor] = useState(TEXT_COLOR_OPTIONS[0].value);
  const [textFont, setTextFont] = useState<FontFamilyKey>(FONT_OPTIONS[0].value);
  const [editingText, setEditingText] = useState(false);

  const zones = getZonesForCategory(category);

  async function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;

    const { content: validated, error: validationError } = await validateDesignFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    onContentChange(validated);
  }

  function openTextEditor() {
    setError(null);
    setTextDraft(content?.kind === "texto" ? content.texto : "");
    setTextColor(content?.kind === "texto" ? content.color : TEXT_COLOR_OPTIONS[0].value);
    setTextFont(content?.kind === "texto" ? content.fontFamily : FONT_OPTIONS[0].value);
    setEditingText(true);
  }

  function confirmText() {
    const texto = textDraft.trim();
    if (!texto) {
      setEditingText(false);
      return;
    }
    onContentChange({ kind: "texto", texto, color: textColor, fontFamily: textFont });
    setEditingText(false);
  }

  function insertEmoji(emoji: string) {
    const el = textInputRef.current;
    const start = el?.selectionStart ?? textDraft.length;
    const end = el?.selectionEnd ?? textDraft.length;
    const next = textDraft.slice(0, start) + emoji + textDraft.slice(end);
    setTextDraft(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  return (
    <div>
      {zones.length > 1 && (
        <div className="mb-3 flex gap-2">
          {zones.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => onZoneChange(z)}
              className={`rounded-brand border px-3 py-1.5 text-xs font-semibold transition-colors ${
                zone === z
                  ? "border-ink bg-ink text-paper"
                  : "border-black/15 text-ink-soft hover:border-ink hover:text-ink"
              }`}
            >
              {ZONE_LABEL[z]}
            </button>
          ))}
        </div>
      )}

      <div className="relative aspect-square w-full overflow-hidden rounded-brand bg-white ring-1 ring-black/5">
        {content && !editingText ? (
          <DesignMockup
            category={category}
            zone={zone}
            color={color}
            content={content}
            transform={transform}
            onTransformChange={onTransformChange}
          />
        ) : (
          <>
            <GarmentShape category={category} zone={zone} color={color} showGuide />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/10 p-4">
              {editingText ? (
                <div className="w-full max-w-[280px] rounded-brand border border-black/10 bg-white p-3 shadow-lg">
                  <input
                    ref={textInputRef}
                    autoFocus
                    value={textDraft}
                    onChange={(e) => setTextDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmText()}
                    placeholder="Escribe tu texto"
                    className="input text-center"
                  />

                  <div className="mt-2 flex flex-wrap justify-center gap-1">
                    {EMOJI_QUICK_PICKS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="flex h-6 w-6 items-center justify-center rounded text-sm hover:bg-paper"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 flex justify-center gap-1.5">
                    {TEXT_COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setTextColor(c.value)}
                        title={c.label}
                        className={`h-5 w-5 rounded-full border ${
                          textColor === c.value ? "ring-2 ring-ink ring-offset-1" : "border-black/15"
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>

                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setTextFont(f.value)}
                        style={{ fontFamily: fontFamilyCss(f.value) }}
                        className={`rounded-brand border px-2 py-1 text-xs ${
                          textFont === f.value
                            ? "border-ink bg-ink text-paper"
                            : "border-black/15 text-ink-soft hover:border-ink hover:text-ink"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={confirmText}
                      className="flex-1 rounded-brand bg-ink px-3 py-1.5 text-xs font-semibold text-paper transition-opacity hover:opacity-80"
                    >
                      Listo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingText(false)}
                      className="rounded-brand border border-black/15 px-3 py-1.5 text-xs font-semibold text-ink-soft"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex items-center gap-2 rounded-brand bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-lg transition-opacity hover:opacity-80"
                  >
                    <UploadIcon /> Subir diseño
                  </button>
                  <button
                    type="button"
                    onClick={openTextEditor}
                    className="flex items-center gap-2 rounded-brand border border-ink/20 bg-white px-5 py-3 text-sm font-semibold text-ink shadow transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                  >
                    <TextIcon /> Agregar texto
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        {content && !editingText ? (
          <>
            <span className="truncate text-ink-soft">
              {content.kind === "imagen" ? content.file.name : `“${content.texto}”`}
            </span>
            <div className="flex shrink-0 gap-3">
              {content.kind === "texto" ? (
                <button type="button" onClick={openTextEditor} className="font-semibold text-ink hover:underline">
                  Editar texto
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="font-semibold text-ink hover:underline"
                >
                  Cambiar diseño
                </button>
              )}
              <button
                type="button"
                onClick={() => onContentChange(null)}
                className="font-semibold text-ink-soft hover:text-ink hover:underline"
              >
                Quitar
              </button>
            </div>
          </>
        ) : (
          !editingText && <p className="text-ink-soft">PNG, JPG o PDF — máx. 25MB</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_DESIGN_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      {!error && content?.kind === "imagen" && content.warning && (
        <p className="mt-2 text-sm font-medium text-yellow-700">{content.warning}</p>
      )}
    </div>
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
