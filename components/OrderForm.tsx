"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PRODUCTS, getProductById } from "@/lib/catalog";
import { calculateOrderTotal } from "@/lib/pricing";
import { DesignTransform, DesignZone, OrderItemInput, PaymentMethod, Technique } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { DesignContent } from "@/lib/design";
import { DesignCanvas } from "./DesignCanvas";
import { PricingSummary } from "./PricingSummary";
import { defaultTransform } from "./DesignMockup";
import { getZonesForCategory } from "./GarmentShape";

interface CartLine extends OrderItemInput {
  key: string;
}

const TECHNIQUE_LABEL: Record<Technique, string> = {
  serigrafia: "Serigrafía",
  sublimado: "Sublimado",
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  contra_entrega: "Pago contra entrega",
  transferencia: "Transferencia bancaria",
  whatsapp: "Coordinar por WhatsApp",
  en_linea: "Pago en línea (próximamente)",
};

type ZoneContentMap = Partial<Record<DesignZone, DesignContent>>;
type ZoneTransformMap = Partial<Record<DesignZone, DesignTransform>>;

export function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("producto") ?? PRODUCTS[0].id;

  const [technique, setTechnique] = useState<Technique>("serigrafia");
  const [items, setItems] = useState<CartLine[]>([]);

  const [productId, setProductId] = useState(preselected);
  const [color, setColor] = useState(PRODUCTS.find((p) => p.id === preselected)?.variants[0]?.color ?? "");
  const [size, setSize] = useState(
    PRODUCTS.find((p) => p.id === preselected)?.variants[0]?.sizes[0] ?? ""
  );
  const [quantity, setQuantity] = useState(1);

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("whatsapp");
  const [comprobante, setComprobante] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = getProductById(productId);
  const pricing = useMemo(() => calculateOrderTotal(items, technique), [items, technique]);

  // El diseño se maneja por zona (frente/espalda/manga) para que el cliente
  // pueda poner un logo distinto adelante y atrás, o solo texto en una manga.
  const zones = selectedProduct ? getZonesForCategory(selectedProduct.category) : (["frente"] as DesignZone[]);
  const [activeZone, setActiveZone] = useState<DesignZone>("frente");
  const [zoneContent, setZoneContent] = useState<ZoneContentMap>({});
  const [zoneTransform, setZoneTransform] = useState<ZoneTransformMap>({});

  const currentZone: DesignZone = zones.includes(activeZone) ? activeZone : "frente";
  const currentContent = zoneContent[currentZone] ?? null;
  const currentTransform =
    zoneTransform[currentZone] ??
    (selectedProduct
      ? defaultTransform(selectedProduct.category, currentZone)
      : { x: 50, y: 50, scale: 1, rotation: 0 });

  function handleZoneChange(zone: DesignZone) {
    setActiveZone(zone);
  }

  function handleContentChange(next: DesignContent | null) {
    setZoneContent((prev) => {
      const copy = { ...prev };
      if (next) copy[currentZone] = next;
      else delete copy[currentZone];
      return copy;
    });
    // Diseño nuevo (o quitado) en esta zona: recentrar y volver a escala 1.
    if (selectedProduct) {
      setZoneTransform((prev) => ({
        ...prev,
        [currentZone]: defaultTransform(selectedProduct.category, currentZone),
      }));
    }
  }

  function handleTransformChange(t: DesignTransform) {
    setZoneTransform((prev) => ({ ...prev, [currentZone]: t }));
  }

  function handleProductChange(id: string) {
    setProductId(id);
    const product = getProductById(id);
    setColor(product?.variants[0]?.color ?? "");
    setSize(product?.variants[0]?.sizes[0] ?? "");
    if (product && !getZonesForCategory(product.category).includes(activeZone)) {
      setActiveZone("frente");
    }
  }

  function addItem() {
    if (!selectedProduct || !color || !size || quantity < 1) return;
    setItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), productId, color, size, quantity },
    ]);
    setQuantity(1);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  const hasFrontDesign = Boolean(zoneContent.frente);
  const canSubmit =
    items.length > 0 &&
    hasFrontDesign &&
    clienteNombre.trim().length > 1 &&
    clienteTelefono.trim().length > 5 &&
    !submitting;

  async function handleSubmit() {
    if (!hasFrontDesign) {
      setError("Agrega al menos un diseño o texto en el frente antes de confirmar el pedido.");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos un producto al pedido.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      const disenos = [];
      for (const [zone, content] of Object.entries(zoneContent) as [DesignZone, DesignContent][]) {
        const transform = zoneTransform[zone] ?? { x: 50, y: 50, scale: 1, rotation: 0 };

        if (content.kind === "imagen") {
          const ext = content.file.name.split(".").pop();
          const path = `disenos/${crypto.randomUUID()}-${zone}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("disenos").upload(path, content.file);
          if (uploadError) throw new Error(`No se pudo subir el diseño (${zone}): ${uploadError.message}`);

          disenos.push({
            zona: zone,
            tipo: "imagen" as const,
            path,
            posX: transform.x,
            posY: transform.y,
            escala: transform.scale,
            rotacion: transform.rotation,
          });
        } else {
          disenos.push({
            zona: zone,
            tipo: "texto" as const,
            texto: content.texto,
            color: content.color,
            fuente: content.fontFamily,
            posX: transform.x,
            posY: transform.y,
            escala: transform.scale,
            rotacion: transform.rotation,
          });
        }
      }

      let comprobantePath: string | null = null;
      if (paymentMethod === "transferencia" && comprobante) {
        const cExt = comprobante.name.split(".").pop();
        comprobantePath = `comprobantes/${crypto.randomUUID()}.${cExt}`;
        const { error: compError } = await supabase.storage
          .from("comprobantes")
          .upload(comprobantePath, comprobante);
        if (compError) throw new Error(`No se pudo subir el comprobante: ${compError.message}`);
      }

      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteNombre,
          clienteTelefono,
          clienteEmail: clienteEmail || null,
          tecnica: technique,
          disenos,
          notas: notas || null,
          items: items.map(({ key, ...rest }) => rest),
          paymentMethod,
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
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-ink">1. Diseña tu producto</h2>

          <div className="mt-3 grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* Panel lateral: producto, técnica, variantes — como el panel de Printeez */}
            <div className="order-2 space-y-5 rounded-brand border border-black/10 bg-white p-5 lg:order-1">
              {selectedProduct && (
                <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-brand bg-paper p-2">
                    <img src={selectedProduct.image} alt="" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{selectedProduct.name}</p>
                    <p className="text-xs text-ink-soft">
                      {selectedProduct.variants.length} color{selectedProduct.variants.length !== 1 && "es"} ·{" "}
                      {color}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-ink">Técnica</p>
                <div className="mt-2 flex gap-2">
                  {(["serigrafia", "sublimado"] as Technique[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTechnique(t)}
                      className={`rounded-brand border px-3 py-1.5 text-sm font-medium transition-colors ${
                        technique === t
                          ? "border-ink bg-ink text-paper"
                          : "border-black/15 text-ink hover:border-ink"
                      }`}
                    >
                      {TECHNIQUE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Producto">
                <select
                  value={productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="input"
                >
                  {PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div>
                <p className="mb-2 text-sm font-medium text-ink-soft">Color — {color}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct?.variants.map((v) => (
                    <button
                      key={v.color}
                      type="button"
                      onClick={() => setColor(v.color)}
                      title={v.color}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${
                        color === v.color ? "scale-110 border-ink" : "border-black/10"
                      }`}
                      style={{ backgroundColor: v.colorHex }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Talla">
                  <select value={size} onChange={(e) => setSize(e.target.value)} className="input">
                    {selectedProduct?.variants
                      .find((v) => v.color === color)
                      ?.sizes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                  </select>
                </Field>

                <Field label="Cantidad">
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="input"
                  />
                </Field>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="w-full rounded-brand border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                + Agregar al pedido
              </button>

              {items.length > 0 && (
                <ul className="divide-y divide-black/5 rounded-brand border border-black/10">
                  {items.map((item) => {
                    const product = getProductById(item.productId);
                    return (
                      <li key={item.key} className="flex items-center justify-between px-3 py-2 text-xs">
                        <span>
                          {item.quantity}× {product?.name} — {item.color} — {item.size}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="font-semibold text-ink-soft hover:text-ink hover:underline"
                        >
                          Quitar
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Lienzo: subir/arrastrar/redimensionar el diseño sobre el producto, por zona */}
            <div className="order-1 lg:order-2">
              {selectedProduct && (
                <DesignCanvas
                  category={selectedProduct.category}
                  color={selectedProduct.variants.find((v) => v.color === color)?.colorHex ?? "#111111"}
                  zone={currentZone}
                  onZoneChange={handleZoneChange}
                  content={currentContent}
                  onContentChange={handleContentChange}
                  transform={currentTransform}
                  onTransformChange={handleTransformChange}
                />
              )}
              {!hasFrontDesign && (
                <p className="mt-2 text-xs text-ink-soft">
                  El diseño del frente es obligatorio. Espalda y manga son opcionales.
                </p>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">2. Tus datos</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Nombre completo *">
              <input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="input"
                placeholder="Ej. María Gómez"
              />
            </Field>
            <Field label="Teléfono / WhatsApp *">
              <input
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                className="input"
                placeholder="Ej. 8888 8888"
              />
            </Field>
            <Field label="Correo (opcional)">
              <input
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                className="input"
                placeholder="correo@ejemplo.com"
              />
            </Field>
            <Field label="Notas para el taller (opcional)">
              <input
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="input"
                placeholder="Ej. logo en el pecho, no en la espalda"
              />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">3. Forma de pago</h2>
          <p className="mt-1 text-sm text-ink-soft">
            No se cobra nada todavía. Esto solo nos dice cómo prefieres pagar.
          </p>
          <div className="mt-3 space-y-2">
            {(["contra_entrega", "transferencia", "whatsapp"] as PaymentMethod[]).map((m) => (
              <label
                key={m}
                className={`flex items-center gap-3 rounded-brand border px-4 py-3 text-sm ${
                  paymentMethod === m ? "border-ink" : "border-black/10"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === m}
                  onChange={() => setPaymentMethod(m)}
                />
                {PAYMENT_LABEL[m]}
              </label>
            ))}
          </div>

          {paymentMethod === "transferencia" && (
            <div className="mt-3">
              <Field label="Comprobante de transferencia (opcional ahora, puedes enviarlo luego por WhatsApp)">
                <input
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
                  className="input"
                />
              </Field>
            </div>
          )}
        </section>

        {error && (
          <p className="rounded-brand bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full rounded-brand bg-ink px-6 py-4 text-base font-semibold text-paper transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
        >
          {submitting ? "Enviando pedido..." : "Confirmar pedido"}
        </button>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
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
