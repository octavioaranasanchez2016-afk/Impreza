"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PRODUCTS, TECHNIQUE_LABEL, getProductById, sharedTechniques } from "@/lib/catalog";
import { buildInvoiceLines, calculateOrderTotal } from "@/lib/pricing";
import { formatBoth, formatCordobas, formatInDollars } from "@/lib/currency";
import { DesignTransform, DesignZone, OrderItemInput, Technique } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { DesignContent } from "@/lib/design";
import { ACCEPTED_RECEIPT_TYPES, validateReceiptFile } from "@/lib/bank";
import { PRODUCTION_BUSINESS_DAYS, estimateReadyDate, formatReadyDate } from "@/lib/delivery";
import { ShippingInfo, missingAddressField } from "@/lib/shipping";
import { BillingInfo, missingBillingField } from "@/lib/billing";
import {
  DraftDesign,
  clearDraft,
  draftHasProgress,
  loadDraft,
  loadDraftImages,
  saveDraft,
  saveDraftImages,
} from "@/lib/draft";
import { DesignCanvas, ZonePreviews } from "./DesignCanvas";
import { PricingSummary } from "./PricingSummary";
import { Invoice } from "./Invoice";
import { BankDetails } from "./BankDetails";
import { ShippingForm } from "./ShippingForm";
import { OrderCodeBox } from "./OrderCodeBox";
import { PaymentMethods } from "./PaymentMethods";
import { ProformaPrint } from "./ProformaPrint";
import { defaultTransform } from "./DesignMockup";
import { getZonesForCategory, isDarkColor } from "./GarmentShape";

interface CartLine extends OrderItemInput {
  key: string;
}

type ZoneContentMap = Partial<Record<DesignZone, DesignContent>>;
type ZoneTransformMap = Partial<Record<DesignZone, DesignTransform>>;

// Talla M cuando existe, para que la vista previa arranque en una talla típica.
// El pedido recibe su código antes de pagar, para que el cliente lo escriba en el
// concepto de la transferencia. Se guarda en la pestaña: si recarga, no cambia.
const PENDING_ORDER_KEY = "impreza-pedido-en-curso";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function newPendingOrderId(): string {
  const id = crypto.randomUUID();
  try {
    sessionStorage.setItem(PENDING_ORDER_KEY, id);
  } catch {
    // Sin almacenamiento: el código vale mientras la página siga abierta.
  }
  return id;
}

function defaultSize(sizes: string[]): string {
  return sizes.includes("M") ? "M" : sizes[0] ?? "";
}

// Con una sola talla (gorra, tote) no hay nada que elegir: arranca en 1.
function initialSizeQty(sizes: string[]): Record<string, number> {
  return sizes.length === 1 ? { [sizes[0]]: 1 } : {};
}

// Un texto vacío no cuenta como diseño.
function hasDesign(content: DesignContent | undefined): content is DesignContent {
  return Boolean(content && (content.kind === "imagen" || content.texto.trim()));
}

export function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("producto") ?? PRODUCTS[0].id;

  const [technique, setTechnique] = useState<Technique>(getProductById(preselected)?.techniques[0] ?? "serigrafia");
  const [items, setItems] = useState<CartLine[]>([]);

  const [productId, setProductId] = useState(preselected);
  const [color, setColor] = useState(PRODUCTS.find((p) => p.id === preselected)?.variants[0]?.color ?? "");
  const [size, setSize] = useState(defaultSize(PRODUCTS.find((p) => p.id === preselected)?.variants[0]?.sizes ?? []));
  // Cuántas piezas de cada talla se van a agregar, como en una hoja de pedido.
  const [sizeQty, setSizeQty] = useState<Record<string, number>>(() =>
    initialSizeQty(PRODUCTS.find((p) => p.id === preselected)?.variants[0]?.sizes ?? [])
  );

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [wantsRuc, setWantsRuc] = useState(false);
  const [billing, setBilling] = useState<BillingInfo>({ razonSocial: "", ruc: "" });
  const [shipping, setShipping] = useState<ShippingInfo | null>(null);

  const [comprobante, setComprobante] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [comprobanteError, setComprobanteError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = getProductById(productId);
  const selectedVariant = selectedProduct?.variants.find((v) => v.color === color);
  // Un pedido lleva una sola técnica, así que solo se mezclan productos que la compartan.
  const cartProductIds = [...new Set(items.map((i) => i.productId))];
  const orderTechniques = sharedTechniques([...cartProductIds, productId]);
  const fitsOrder = orderTechniques.length > 0;
  // La tinta de sublimación es transparente: sobre telas oscuras no se ve.
  const darkColorsInOrder = [
    ...new Set(
      [...items.map((i) => ({ productId: i.productId, color: i.color })), { productId, color }]
        .filter((c) => {
          const hex = getProductById(c.productId)?.variants.find((v) => v.color === c.color)?.colorHex;
          return hex ? isDarkColor(hex) : false;
        })
        .map((c) => c.color.toLowerCase())
    ),
  ];
  const sublimationOnDark = technique === "sublimado" && darkColorsInOrder.length > 0;
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
  const zonePreviews: ZonePreviews = {};
  for (const z of zonesWithContent) {
    zonePreviews[z] = {
      content: zoneContent[z]!,
      transform: zoneTransform[z] ?? (selectedProduct ? defaultTransform(selectedProduct.category, z) : currentTransform),
    };
  }

  // Se crea en el navegador (no en el servidor) para que no cambie al cargar la página.
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(PENDING_ORDER_KEY);
    } catch {
      // Sin almacenamiento: se crea uno nuevo.
    }
    setPendingOrderId(saved && UUID_RE.test(saved) ? saved : newPendingOrderId());
  }, []);
  const orderCode = pendingOrderId ? pendingOrderId.slice(0, 8).toUpperCase() : null;

  // Recupera el pedido en curso si la página se recargó (p. ej. al volver de la app del banco).
  // Hasta que termine no se guarda nada, para no pisar el borrador con el formulario vacío.
  const [draftReady, setDraftReady] = useState(false);
  const [restored, setRestored] = useState<{ imagesLost: boolean } | null>(null);
  // Remonta las partes con estado propio (dirección escrita) al empezar de nuevo.
  const [formKey, setFormKey] = useState(0);
  const savedFiles = useRef<Partial<Record<DesignZone, File>>>({});
  const urlProduct = searchParams.get("producto");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const draft = loadDraft();
      if (!draft) {
        void saveDraftImages({});
        if (!cancelled) setDraftReady(true);
        return;
      }
      const files = await loadDraftImages();
      if (cancelled) return;

      const content: ZoneContentMap = {};
      let imagesLost = false;
      for (const [zone, d] of Object.entries(draft.designs) as [DesignZone, DraftDesign][]) {
        if (d.kind === "texto") {
          content[zone] = d;
        } else if (files[zone]) {
          const file = files[zone]!;
          content[zone] = { ...d, file, previewUrl: URL.createObjectURL(file) };
        } else {
          imagesLost = true;
        }
      }
      savedFiles.current = files;

      setItems(draft.items);
      // Si llegó desde la página de otro producto, ese queda elegido para agregarlo.
      const keepProduct = (!urlProduct || urlProduct === draft.productId) && getProductById(draft.productId);
      if (keepProduct) {
        setProductId(draft.productId);
        setColor(draft.color);
        setSize(draft.size);
        setTechnique(draft.technique);
      } else {
        const shared = sharedTechniques([...new Set([...draft.items.map((i) => i.productId), productId])]);
        setTechnique(shared.length === 0 || shared.includes(draft.technique) ? draft.technique : shared[0]);
      }
      setActiveZone(draft.activeZone);
      setZoneContent(content);
      setZoneTransform(draft.transforms);
      setClienteNombre(draft.clienteNombre);
      setClienteTelefono(draft.clienteTelefono);
      setClienteEmail(draft.clienteEmail);
      setNotas(draft.notas);
      setWantsRuc(draft.wantsRuc);
      setBilling(draft.billing);
      setShipping(draft.shipping);
      if (draftHasProgress(draft)) setRestored({ imagesLost });
      setDraftReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // Solo al abrir la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const designs: Partial<Record<DesignZone, DraftDesign>> = {};
    for (const [zone, c] of Object.entries(zoneContent) as [DesignZone, DesignContent][]) {
      designs[zone] =
        c.kind === "texto" ? c : { kind: "imagen", width: c.width, height: c.height, fill: c.fill };
    }
    saveDraft({
      v: 1,
      items,
      technique,
      productId,
      color,
      size,
      activeZone,
      designs,
      transforms: zoneTransform,
      clienteNombre,
      clienteTelefono,
      clienteEmail,
      notas,
      wantsRuc,
      billing,
      shipping,
    });
  }, [
    draftReady,
    items,
    technique,
    productId,
    color,
    size,
    activeZone,
    zoneContent,
    zoneTransform,
    clienteNombre,
    clienteTelefono,
    clienteEmail,
    notas,
    wantsRuc,
    billing,
    shipping,
  ]);

  // Las imágenes solo se vuelven a guardar cuando cambia algún archivo, no al moverlas.
  useEffect(() => {
    if (!draftReady) return;
    const files: Partial<Record<DesignZone, File>> = {};
    for (const [zone, c] of Object.entries(zoneContent) as [DesignZone, DesignContent][]) {
      if (c.kind === "imagen") files[zone] = c.file;
    }
    const prev = savedFiles.current;
    const zonesNow = Object.keys(files) as DesignZone[];
    const same = zonesNow.length === Object.keys(prev).length && zonesNow.every((z) => prev[z] === files[z]);
    if (same) return;
    savedFiles.current = files;
    void saveDraftImages(files);
  }, [draftReady, zoneContent]);

  function startOver() {
    clearDraft();
    savedFiles.current = {};
    const product = getProductById(urlProduct ?? "") ?? PRODUCTS[0];
    setItems([]);
    setTechnique(product.techniques[0]);
    setProductId(product.id);
    setColor(product.variants[0]?.color ?? "");
    setSize(defaultSize(product.variants[0]?.sizes ?? []));
    setSizeQty(initialSizeQty(product.variants[0]?.sizes ?? []));
    setActiveZone("frente");
    setZoneContent({});
    setZoneTransform({});
    setClienteNombre("");
    setClienteTelefono("");
    setClienteEmail("");
    setNotas("");
    setWantsRuc(false);
    setBilling({ razonSocial: "", ruc: "" });
    setShipping(null);
    setComprobante(null);
    setRestored(null);
    setFormKey((k) => k + 1);
  }

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
    // Si la técnica actual no sirve para este producto, pasa a una que sirva
    // para él y para lo que ya está en el pedido.
    const shared = sharedTechniques([...cartProductIds, id]);
    if (!shared.includes(technique) && shared.length > 0) setTechnique(shared[0]);
    const sizes = product?.variants[0]?.sizes ?? [];
    setColor(product?.variants[0]?.color ?? "");
    setSize(sizes.includes(size) ? size : defaultSize(sizes));
    setSizeQty(initialSizeQty(sizes));
    if (product && !getZonesForCategory(product.category).includes(activeZone)) {
      setActiveZone("frente");
    }
  }

  function handleColorChange(next: string) {
    setColor(next);
    const sizes = selectedProduct?.variants.find((v) => v.color === next)?.sizes ?? [];
    if (!sizes.includes(size)) setSize(defaultSize(sizes));
  }

  const availableSizes = selectedVariant?.sizes ?? [];
  const pendingLines = availableSizes
    .filter((s) => (sizeQty[s] ?? 0) > 0)
    .map((s) => ({ size: s, quantity: sizeQty[s] }));
  const pendingTotal = pendingLines.reduce((sum, l) => sum + l.quantity, 0);

  function addItem() {
    if (!selectedProduct || !color || pendingTotal === 0 || !fitsOrder) return;
    setItems((prev) => {
      let next = prev;
      for (const line of pendingLines) {
        const existing = next.find((i) => i.productId === productId && i.color === color && i.size === line.size);
        next = existing
          ? next.map((i) => (i === existing ? { ...i, quantity: i.quantity + line.quantity } : i))
          : [...next, { key: crypto.randomUUID(), productId, color, size: line.size, quantity: line.quantity }];
      }
      return next;
    });
    setSizeQty(initialSizeQty(availableSizes));
  }

  function setQtyFor(s: string, value: number) {
    setSizeQty((prev) => ({ ...prev, [s]: Math.max(0, Math.min(9999, Math.floor(value) || 0)) }));
  }

  // Tocar una talla la muestra en el diseño y, si estaba en 0, le pone 1.
  function pickSize(s: string) {
    setSize(s);
    if (!(sizeQty[s] > 0)) setQtyFor(s, 1);
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

  // Lo que falta para confirmar, con la sección del formulario donde se completa.
  const addressGap = shipping ? missingAddressField(shipping) : null;
  const missingSteps = [
    items.length === 0 && {
      label: pendingTotal > 0 ? "tocar «Agregar al pedido» en el paso 1" : "al menos un producto",
      section: "diseno",
    },
    clienteNombre.trim().length < 2 && { label: "tu nombre", section: "datos" },
    clienteTelefono.trim().length < 6 && { label: "tu teléfono", section: "datos" },
    wantsRuc && missingBillingField(billing) && { label: missingBillingField(billing)!, section: "datos" },
    !shipping && { label: "cómo quieres recibir tu pedido", section: "entrega" },
    addressGap && { label: addressGap, section: "entrega" },
    !comprobante && { label: "el comprobante de transferencia", section: "pago" },
  ].filter((m): m is { label: string; section: string } => Boolean(m));
  const missing = missingSteps.map((m) => m.label);
  const showMobileBar = items.length > 0;

  // Deja espacio al final de la página para la barra fija del celular.
  useEffect(() => {
    document.body.classList.toggle("has-order-bar", showMobileBar);
    return () => document.body.classList.remove("has-order-bar");
  }, [showMobileBar]);
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
          disenos.push({
            zona: zone,
            tipo: "imagen" as const,
            path,
            ajuste: content.fill ? ("llenar" as const) : ("completa" as const),
            anchoPx: content.width,
            altoPx: content.height,
            ...placement,
          });
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
          entrega: shipping,
          factura: wantsRuc ? billing : null,
          items: items.map(({ key, ...rest }) => rest),
          paymentMethod: "transferencia",
          comprobantePath,
          orderId: pendingOrderId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.codigoRepetido) {
          const fresh = newPendingOrderId();
          setPendingOrderId(fresh);
          throw new Error(
            `Tuvimos que darle un código nuevo a tu pedido: ${fresh.slice(0, 8).toUpperCase()}. Vuelve a confirmar; si ya transferiste, no pasa nada.`
          );
        }
        throw new Error(body.error || "No se pudo crear el pedido. Intenta de nuevo.");
      }

      const { orderId } = await res.json();
      try {
        sessionStorage.removeItem(PENDING_ORDER_KEY);
      } catch {
        // Nada que limpiar.
      }
      clearDraft();
      router.push(`/pedido/${orderId}/confirmacion`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-10">
        {restored && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-brand border-2 border-ink bg-white px-4 py-3 text-sm">
            <p className="text-ink">
              <span className="font-semibold">Recuperamos tu pedido en curso.</span>{" "}
              <span className="text-ink-soft">
                {restored.imagesLost
                  ? "Tu imagen no se pudo recuperar: vuelve a subirla en el paso 1."
                  : "Sigue donde lo dejaste."}
              </span>
            </p>
            <div className="flex shrink-0 gap-3">
              <button type="button" onClick={startOver} className="text-xs font-semibold text-ink-soft hover:text-ink hover:underline">
                Empezar de nuevo
              </button>
              <button
                type="button"
                onClick={() => setRestored(null)}
                className="text-xs font-semibold text-ink hover:underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <section id="diseno" className="scroll-mt-28">
          <h2 className="font-display text-3xl uppercase tracking-wide text-ink">1. Diseña tu producto</h2>

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
                  {(selectedProduct?.techniques ?? []).map((t) => (
                    <button
                      key={t}
                      type="button"
                      disabled={!orderTechniques.includes(t)}
                      onClick={() => setTechnique(t)}
                      className={`flex-1 rounded-brand border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        technique === t ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                      }`}
                    >
                      {TECHNIQUE_LABEL[t]}
                    </button>
                  ))}
                </div>
                {sublimationOnDark && (
                  <div className="mt-2 rounded-brand bg-yellow-50 p-3 text-xs text-yellow-900">
                    <p>
                      La sublimación no se ve en prendas oscuras ({darkColorsInOrder.join(", ")}). Para esos colores usa
                      serigrafía, o elige una prenda clara.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTechnique("serigrafia")}
                      className="mt-2 font-semibold underline"
                    >
                      Cambiar a serigrafía
                    </button>
                  </div>
                )}
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

              {availableSizes.length > 1 ? (
                <div>
                  <p className="text-sm font-medium text-ink-soft">Cantidad por talla</p>
                  <p className="mb-2 text-[11px] text-ink-muted">Toca tu talla o escribe cuántas quieres de cada una.</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {availableSizes.map((s) => (
                      <div key={s} className="min-w-0">
                        <button
                          type="button"
                          onClick={() => pickSize(s)}
                          aria-pressed={size === s}
                          className={`w-full rounded-t-brand border px-1 py-1 text-xs font-semibold transition-colors ${
                            size === s ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                          }`}
                        >
                          {s}
                        </button>
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          aria-label={`Cantidad talla ${s}`}
                          value={sizeQty[s] ? sizeQty[s] : ""}
                          placeholder="0"
                          onFocus={() => setSize(s)}
                          onChange={(e) => setQtyFor(s, Number(e.target.value))}
                          className="w-full rounded-b-brand border border-t-0 border-black/15 bg-white px-1 py-1.5 text-center text-sm font-semibold text-ink outline-none [appearance:textfield] placeholder:font-normal placeholder:text-ink-muted focus:border-ink [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Field label={`Cantidad${availableSizes[0] ? ` (talla ${availableSizes[0].toLowerCase()})` : ""}`}>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={sizeQty[availableSizes[0]] || ""}
                    onChange={(e) => setQtyFor(availableSizes[0], Number(e.target.value))}
                    className="input"
                  />
                </Field>
              )}

              <button
                type="button"
                onClick={addItem}
                disabled={!fitsOrder || pendingTotal === 0}
                className="w-full rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pendingTotal > 0
                  ? `+ Agregar ${pendingTotal} pieza${pendingTotal === 1 ? "" : "s"} al pedido`
                  : "+ Agregar al pedido"}
              </button>
              {!fitsOrder && selectedProduct && (
                <p className="rounded-brand bg-paper-soft p-3 text-xs text-ink-soft">
                  {selectedProduct.name} se hace con{" "}
                  {selectedProduct.techniques.map((t) => TECHNIQUE_LABEL[t].toLowerCase()).join(" o ")}, y lo que ya
                  agregaste no. Haz un pedido aparte para este producto, o quita lo que tienes en la lista.
                </p>
              )}

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
                  zonePreviews={zonePreviews}
                  onZoneChange={setActiveZone}
                  content={currentContent}
                  onContentChange={handleContentChange}
                  transform={currentTransform}
                  onTransformChange={handleTransformChange}
                />
              )}
            </div>
          </div>
        </section>

        <section id="datos" className="scroll-mt-28">
          <h2 className="font-display text-3xl uppercase tracking-wide text-ink">2. Tus datos</h2>
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
              <input value={notas} onChange={(e) => setNotas(e.target.value)} className="input" placeholder="Ej. es un regalo, empacar aparte" />
            </Field>
          </div>

          <div className="mt-4 rounded-brand border border-black/10 bg-white p-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
              <input
                id="factura-ruc"
                type="checkbox"
                checked={wantsRuc}
                onChange={(e) => setWantsRuc(e.target.checked)}
                className="h-4 w-4 accent-ink"
              />
              Necesito factura con RUC (empresas y negocios)
            </label>
            {wantsRuc && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Nombre o razón social *">
                  <input
                    id="factura-razon-social"
                    value={billing.razonSocial}
                    onChange={(e) => setBilling({ ...billing, razonSocial: e.target.value })}
                    className="input"
                    placeholder="Ej. Distribuidora Ejemplo, S.A."
                    maxLength={120}
                  />
                </Field>
                <Field label="Número RUC *">
                  <input
                    id="factura-ruc-numero"
                    value={billing.ruc}
                    onChange={(e) => setBilling({ ...billing, ruc: e.target.value })}
                    className="input font-mono uppercase"
                    placeholder="Ej. J0310000000000"
                    maxLength={24}
                  />
                </Field>
                <p className="text-xs text-ink-soft sm:col-span-2">Te entregamos la factura con RUC junto con tu pedido.</p>
              </div>
            )}
          </div>
        </section>

        <section id="entrega" className="scroll-mt-28">
          <h2 className="font-display text-3xl uppercase tracking-wide text-ink">3. Entrega</h2>
          <p className="mt-1 text-sm text-ink-soft">¿Cómo quieres recibir tu pedido?</p>
          <div className="mt-3">
            <ShippingForm key={formKey} value={shipping} onChange={setShipping} />
          </div>
        </section>

        <section id="factura" className="scroll-mt-28">
          <h2 className="font-display text-3xl uppercase tracking-wide text-ink">4. Tu factura</h2>
          <div className="mt-3">
            {items.length > 0 ? (
              <>
                <Invoice
                  lines={invoiceLines}
                  pricing={pricing}
                  technique={technique}
                  clienteNombre={clienteNombre}
                  shipping={shipping}
                  billing={wantsRuc ? billing : null}
                />
                <ProformaPrint>
                  <Invoice
                    title="Proforma"
                    lines={invoiceLines}
                    pricing={pricing}
                    technique={technique}
                    clienteNombre={clienteNombre}
                    shipping={shipping}
                    billing={wantsRuc ? billing : null}
                  />
                </ProformaPrint>
              </>
            ) : (
              <p className="rounded-brand border border-dashed border-black/15 p-5 text-sm text-ink-soft">
                Agrega al menos un producto (paso 1) para ver tu factura.
              </p>
            )}
          </div>
        </section>

        <section id="pago" className="scroll-mt-28">
          <h2 className="font-display text-3xl uppercase tracking-wide text-ink">5. Pago</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Por ahora el pago es por transferencia: tu pedido queda confirmado cuando adjuntas el comprobante. Muy pronto
            también podrás pagar con tarjeta.
          </p>
          <div className="mt-3">
            <PaymentMethods />
          </div>

          <div className="mt-3 space-y-4 rounded-brand border border-black/10 bg-white p-5">
            <OrderCodeBox code={orderCode} />
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

        <div id="confirmar" className="scroll-mt-28 space-y-3">
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
          <p className="text-center text-[11px] text-ink-muted">
            Tus datos solo se usan para hacer y entregar tu pedido.{" "}
            <a href="/privacidad" target="_blank" className="underline hover:text-ink">
              Privacidad
            </a>
          </p>
          <p className="rounded-brand bg-paper-soft px-4 py-3 text-center text-sm text-ink">
            Pide hoy y tu pedido estará listo aproximadamente el{" "}
            <span className="font-semibold">{formatReadyDate(estimateReadyDate())}</span>
            <span className="block text-xs text-ink-soft">
              {PRODUCTION_BUSINESS_DAYS} días hábiles, contados desde que verificamos tu pago.
            </span>
          </p>
        </div>
      </div>

      <div className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <PricingSummary pricing={pricing} />
      </div>

      {showMobileBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-paper/95 px-4 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-ink-soft">
                Total · {pricing.totalQuantity} pieza{pricing.totalQuantity === 1 ? "" : "s"}
              </p>
              <p className="truncate text-lg font-bold leading-tight text-ink">
                {formatCordobas(pricing.total)}{" "}
                <span className="text-xs font-medium text-ink-soft">{formatInDollars(pricing.total)}</span>
              </p>
            </div>
            <a
              href={`#${missingSteps[0]?.section ?? "confirmar"}`}
              className="shrink-0 rounded-brand bg-ink px-5 py-2.5 text-sm font-semibold text-paper"
            >
              {missingSteps.length ? "Continuar →" : "Confirmar →"}
            </a>
          </div>
        </div>
      )}
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
