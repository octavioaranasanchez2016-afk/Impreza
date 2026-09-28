"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PRODUCTS, getProductById } from "@/lib/catalog";
import { buildInvoiceLines, calculateOrderTotal } from "@/lib/pricing";
import { formatBoth } from "@/lib/currency";
import { DesignTransform, DesignZone, OrderItemInput, Technique } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { DesignContent } from "@/lib/design";
import { ACCEPTED_RECEIPT_TYPES, validateReceiptFile } from "@/lib/bank";
import { DesignCanvas } from "./DesignCanvas";
import { PricingSummary } from "./PricingSummary";
import { Invoice } from "./Invoice";
import { BankDetails } from "./BankDetails";
import { defaultTransform } from "./DesignMockup";
import { getZonesForCategory } from "./GarmentShape";

interface CartLine extends OrderItemInput {
  key: string;
}

const TECHNIQUE_LABEL: Record<Technique, string> = {
  serigrafia: "Serigrafía",
  sublimado: "Sublimado",
};

type ZoneContentMap = Partial<Record<DesignZone, DesignContent>>;
type ZoneTransformMap = Partial<Record<DesignZone, DesignTransform>>;

// Talla M cuando existe, para que la vista previa arranque en una talla típica.
function defaultSize(sizes: string[]): string {
  return sizes.includes("M") ? "M" : sizes[0] ?? "";
}

// Un texto vacío no cuenta como diseño.
function hasDesign(content: DesignContent | undefined): content is DesignContent {
  return Boolean(content && (content.kind === "imagen" || content.texto.trim()));
}

export function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("producto") ?? PRODUCTS[0].id;

  const [technique, setTechnique] = useState<Technique>("serigrafia");
  const [items, setItems] = useState<CartLine[]>([]);

  const [productId, setProductId] = useState(preselected);
  const [color, setColor] = useState(PRODUCTS.find((p) => p.id === preselected)?.variants[0]?.color ?? "");
  const [size, setSize] = useState(defaultSize(PRODUCTS.find((p) => p.id === preselected)?.variants[0]?.sizes ?? []));
  const [quantity, setQuantity] = useState(1);

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [notas, setNotas] = useState("");

  const [comprobante, setComprobante] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [comprobanteError, setComprobanteError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = getProductById(productId);
  const selectedVariant = selectedProduct?.variants.find((v) => v.color === color);
  const pricing = useMemo(() => calculateOrderTotal(items, technique), [items, technique]);
  const invoiceLines = useMemo(() => buildInvoiceLines(items, technique), [items, technique]);

  const zones = selectedProduct ? getZonesForCategory(selectedProduct.category) : (["frente"] as DesignZone[]);
  const [activeZone, setActiveZone] = useState<DesignZone>("frente");
  const [zoneContent, setZoneContent] = useState<ZoneContentMap>({});
  const [zoneTransform, setZoneTransform] = useState<ZoneTransformMap>({});

  const currentZone: DesignZone = zones.includes(activeZone) ? activeZone : "frente";
  const currentContent = zoneContent[currentZone] ?? null;
  const currentTransform =
    zoneTransform[currentZone] ??
    (selectedProduct ? defaultTransform(selectedProduct.category, currentZone) : { x: 50, y: 50, scale: 1, rotation: 0 });
  const zonesWithContent = zones.filter((z) => hasDesign(zoneContent[z]));

  useEffect(() => {
    if (!comprobante) {
      setComprobantePreview(null);
      return;
    }
    const url = URL.createObjectURL(comprobante);
    setComprobantePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [comprobante]);

  function handleContentChange(next: DesignContent | null, resetTransform: boolean) {
    setZoneContent((prev) => {
      const copy = { ...prev };
      if (next) copy[currentZone] = next;
      else delete copy[currentZone];
      return copy;
    });
    if (resetTransform && selectedProduct) {
      setZoneTransform((prev) => ({ ...prev, [currentZone]: defaultTransform(selectedProduct.category, currentZone) }));
    }
  }

  function handleTransformChange(t: DesignTransform) {
    setZoneTransform((prev) => ({ ...prev, [currentZone]: t }));
  }

  function handleProductChange(id: string) {
    setProductId(id);
    const product = getProductById(id);
    const sizes = product?.variants[0]?.sizes ?? [];
    setColor(product?.variants[0]?.color ?? "");
    setSize(sizes.includes(size) ? size : defaultSize(sizes));
    if (product && !getZonesForCategory(product.category).includes(activeZone)) {
      setActiveZone("frente");
    }
  }

  function handleColorChange(next: string) {
    setColor(next);
    const sizes = selectedProduct?.variants.find((v) => v.color === next)?.sizes ?? [];
    if (!sizes.includes(size)) setSize(defaultSize(sizes));
  }

  function addItem() {
    if (!selectedProduct || !color || !size || quantity < 1) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId && i.color === color && i.size === size);
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { key: crypto.randomUUID(), productId, color, size, quantity }];
    });
    setQuantity(1);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function handleComprobante(file: File | undefined) {
    setComprobanteError(null);
    if (!file) return;
    const validationError = validateReceiptFile(file);
    if (validationError) {
      setComprobante(null);
      setComprobanteError(validationError);
      return;
    }
    setComprobante(file);
  }

  const missing = [
    !hasDesign(zoneContent.frente) && "un diseño en el frente",
    items.length === 0 && "al menos un producto",
    clienteNombre.trim().length < 2 && "tu nombre",
    clienteTelefono.trim().length < 6 && "tu teléfono",
    !comprobante && "el comprobante de transferencia",
  ].filter(Boolean) as string[];
  const canSubmit = missing.length === 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !comprobante) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      const disenos = [];
      for (const [zone, content] of Object.entries(zoneContent) as [DesignZone, DesignContent][]) {
        if (!hasDesign(content)) continue;
        const transform = zoneTransform[zone] ?? defaultTransform(selectedProduct!.category, zone);
        const placement = { posX: transform.x, posY: transform.y, escala: transform.scale, rotacion: transform.rotation };

        if (content.kind === "imagen") {
          const path = `disenos/${crypto.randomUUID()}-${zone}.jpg`;
          const { error: uploadError } = await supabase.storage.from("disenos").upload(path, content.file, {
            contentType: "image/jpeg",
          });
          if (uploadError) throw new Error(`No se pudo subir el diseño (${zone}): ${uploadError.message}`);
          disenos.push({ zona: zone, tipo: "imagen" as const, path, ...placement });
        } else {
          disenos.push({
            zona: zone,
            tipo: "texto" as const,
            texto: content.texto.trim(),
            color: content.color,
            fuente: content.fontFamily,
            ...placement,
          });
        }
      }

      const ext = comprobante.type === "image/png" ? "png" : "jpg";
      const comprobantePath = `comprobantes/${crypto.randomUUID()}.${ext}`;
      const { error: compError } = await supabase.storage
        .from("comprobantes")
        .upload(comprobantePath, comprobante, { contentType: comprobante.type });
      if (compError) throw new Error(`No se pudo subir el comprobante: ${compError.message}`);

      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteNombre,
          clienteTelefono,
          clienteEmail: clienteEmail.trim() || null,
          tecnica: technique,
          disenos,
          notas: notas.trim() || null,
          items: items.map(({ key, ...rest }) => rest),
          paymentMethod: "transferencia",
          comprobantePath,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo crear el pedido. Intenta de nuevo.");
      }

      const { orderId } = await res.json();
      router.push(`/pedido/${orderId}/confirmacion`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-10">
        <section>
          <h2 className="text-lg font-semibold text-ink">1. Diseña tu producto</h2>

          <div className="mt-3 grid gap-6 lg:grid-cols-[260px_1fr]">
            <div className="order-2 space-y-5 self-start rounded-brand border border-black/10 bg-white p-5 lg:order-1">
              <Field label="Producto">
                <select value={productId} onChange={(e) => handleProductChange(e.target.value)} className="input">
                  {PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div>
                <p className="text-sm font-medium text-ink-soft">Técnica</p>
                <div className="mt-1.5 flex gap-2">
                  {(["serigrafia", "sublimado"] as Technique[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTechnique(t)}
                      className={`flex-1 rounded-brand border px-3 py-1.5 text-sm font-medium transition-colors ${
                        technique === t ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                      }`}
                    >
                      {TECHNIQUE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink-soft">Color — {color}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct?.variants.map((v) => (
                    <button
                      key={v.color}
                      type="button"
                      onClick={() => handleColorChange(v.color)}
                      title={v.color}
                      aria-label={v.color}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${
                        color === v.color ? "scale-110 border-ink" : "border-black/10"
                      }`}
                      style={{ backgroundColor: v.colorHex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink-soft">Talla</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVariant?.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`min-w-[2.5rem] rounded-brand border px-2.5 py-1.5 text-sm font-medium transition-colors ${
                        size === s ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Cantidad">
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="input"
                />
              </Field>

              <button
                type="button"
                onClick={addItem}
                className="w-full rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-80"
              >
                + Agregar al pedido
              </button>

              {items.length > 0 && (
                <ul className="divide-y divide-black/5 rounded-brand border border-black/10">
                  {items.map((item) => (
                    <li key={item.key} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                      <span>
                        {item.quantity}× {getProductById(item.productId)?.name} — {item.color} — {item.size}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="font-semibold text-ink-soft hover:text-ink hover:underline"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="order-1 min-w-0 lg:order-2">
              {selectedProduct && (
                <DesignCanvas
                  category={selectedProduct.category}
                  color={selectedVariant?.colorHex ?? "#111111"}
                  size={size}
                  zone={currentZone}
                  zonesWithContent={zonesWithContent}
                  onZoneChange={setActiveZone}
                  content={currentContent}
                  onContentChange={handleContentChange}
                  transform={currentTransform}
                  onTransformChange={handleTransformChange}
                />
              )}
              {!hasDesign(zoneContent.frente) && (
                <p className="mt-2 text-xs text-ink-soft">El diseño del frente es obligatorio. Espalda y manga son opcionales.</p>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">2. Tus datos</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Nombre completo *">
              <input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} className="input" placeholder="Ej. María Gómez" />
            </Field>
            <Field label="Teléfono / WhatsApp *">
              <input
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                className="input"
                placeholder="Ej. 8888 8888"
                inputMode="tel"
              />
            </Field>
            <Field label="Correo (opcional)">
              <input
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                className="input"
                placeholder="correo@ejemplo.com"
                inputMode="email"
              />
            </Field>
            <Field label="Notas para el taller (opcional)">
              <input value={notas} onChange={(e) => setNotas(e.target.value)} className="input" placeholder="Ej. entregar el viernes" />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">3. Tu factura</h2>
          <div className="mt-3">
            {items.length > 0 ? (
              <Invoice lines={invoiceLines} pricing={pricing} technique={technique} clienteNombre={clienteNombre} />
            ) : (
              <p className="rounded-brand border border-dashed border-black/15 p-5 text-sm text-ink-soft">
                Agrega al menos un producto (paso 1) para ver tu factura.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">4. Pago por transferencia</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Es la única forma de pago. Tu pedido queda confirmado cuando adjuntas el comprobante.
          </p>

          <div className="mt-3 space-y-4 rounded-brand border border-black/10 bg-white p-5">
            <BankDetails totalCordobas={pricing.total} />

            <div>
              <p className="text-sm font-medium text-ink">Comprobante de transferencia *</p>
              <p className="text-xs text-ink-muted">Foto o captura de pantalla (JPG o PNG)</p>
              <label className="mt-2 flex cursor-pointer items-center gap-4 rounded-brand border-2 border-dashed border-black/15 p-4 transition-colors hover:border-ink">
                {comprobantePreview ? (
                  <img src={comprobantePreview} alt="Comprobante" className="h-20 w-20 rounded object-cover" />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded bg-paper-soft text-2xl text-ink-muted">+</span>
                )}
                <span className="text-sm">
                  <span className="font-semibold text-ink">{comprobante ? comprobante.name : "Adjuntar comprobante"}</span>
                  <span className="block text-xs text-ink-soft">{comprobante ? "Toca para cambiarlo" : "Toca para elegir el archivo"}</span>
                </span>
                <input
                  type="file"
                  accept={ACCEPTED_RECEIPT_TYPES.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    handleComprobante(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {comprobanteError && <p className="mt-2 text-sm font-medium text-red-600">{comprobanteError}</p>}
            </div>
          </div>
        </section>

        <div className="space-y-3">
          {error && <p className="rounded-brand bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="w-full rounded-brand bg-ink px-6 py-4 text-base font-semibold text-paper transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Enviando pedido..." : `Confirmar pedido${items.length ? ` · ${formatBoth(pricing.total)}` : ""}`}
          </button>
          {missing.length > 0 && !submitting && (
            <p className="text-center text-xs text-ink-soft">Para confirmar falta: {missing.join(", ")}.</p>
          )}
        </div>
      </div>

      <div className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <PricingSummary pricing={pricing} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
