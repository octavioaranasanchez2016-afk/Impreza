"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PRODUCTS,
  TECHNIQUE_HINT,
  TECHNIQUE_LABEL,
  getFabric,
  getProductById,
} from "@/lib/catalog";
import { buildInvoiceLines, calculateOrderTotal, getUnitPrice, mainTechnique } from "@/lib/pricing";
import { formatBoth, formatCordobas, formatInDollars } from "@/lib/currency";
import { DesignTransform, DesignZone, OrderItemInput, Product, ProductCategory, Technique } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { DesignContent, ExtraText, MAX_PIECES_PER_ZONE } from "@/lib/design";
import { GroupDesign, groupImagePath } from "@/lib/group-design";
import {
  LineDesign,
  LineDesigns,
  ZoneExtras,
  designKey,
  hasAnyDesign,
  imageKey,
  snapshotDesigns,
  zoneDesign,
} from "@/lib/cart-designs";
import { ACCEPTED_RECEIPT_TYPES, validateReceiptFile } from "@/lib/bank";
import { PRODUCTION_BUSINESS_DAYS, estimateReadyDate, formatReadyDate } from "@/lib/delivery";
import { ShippingInfo, deliveryQuote, missingAddressField } from "@/lib/shipping";
import { BillingInfo, missingBillingField } from "@/lib/billing";
import {
  DraftDesign,
  DraftLine,
  clearDraft,
  draftHasProgress,
  fromDraftDesign,
  loadDraft,
  loadDraftImages,
  saveDraft,
  saveDraftImages,
  toDraftDesign,
  toDraftLineDesigns,
} from "@/lib/draft";
import { DesignCanvas, ZonePreviews } from "./DesignCanvas";
import { PricingSummary } from "./PricingSummary";
import { DiscountProgress } from "./DiscountProgress";
import { Invoice } from "./Invoice";
import { BankDetails } from "./BankDetails";
import { ShippingForm } from "./ShippingForm";
import { OrderCodeBox } from "./OrderCodeBox";
import { PaymentMethods } from "./PaymentMethods";
import { ProformaPrint } from "./ProformaPrint";
import { TechniqueGuide } from "./TechniqueGuide";
import { SizeChartButton } from "./SizeChartButton";
import { DesignLayer, PersonalLayer } from "./GroupShirtPreview";
import { ListOrderSummary } from "./ListOrderSummary";
import {
  CAMPOS,
  Campo,
  DEFAULT_ETIQUETA,
  Valores,
  GroupPersonal,
  MAX_EXTRA,
  MAX_NUMERO,
  MAX_TEXTO,
  PersonalField,
  campoLabel,
  fieldHint,
  fieldsEnOrden,
  newFieldId,
  describePersonal,
  fieldContent,
  fieldTransform,
  parsePersonal,
  personalZones,
  zoneTitle,
} from "@/lib/group-names";
import { DesignMockup, defaultTransform } from "./DesignMockup";
import { ZONE_NAME, getPrintArea, getZonesForCategory, isDarkColor } from "./GarmentShape";

interface CartLine extends OrderItemInput {
  key: string;
  // El diseño que había en el diseñador al agregarla ({} = sin diseño propio).
  designs: LineDesigns;
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

// Primera tela que sirve para la técnica (null si el producto no tiene telas).
function defaultFabricFor(product: Product | undefined, technique: Technique): string | null {
  if (!product?.fabrics?.length) return null;
  return (product.fabrics.find((f) => f.techniques.includes(technique)) ?? product.fabrics[0]).id;
}

// Texto del botón que pasa las piezas al pedido: "Agrega tus 30 piezas al pedido".
function addLabel(pieces: number): string {
  if (pieces === 1) return "Agrega tu pieza al pedido";
  return pieces > 1 ? `Agrega tus ${pieces} piezas al pedido` : "Agrega tus piezas al pedido";
}

// Pedido que viene del cotizador: cuántas piezas lleva de las que cotizó. Las que ya
// están en el pedido (inCart) y las que están en las tallas sin agregar (pending)
// se cuentan por separado, para que el botón diga el número correcto.
function QuoteProgress({
  target,
  inCart,
  pending,
  multiSize,
  source = "cotización",
}: {
  target: number;
  inCart: number;
  pending: number;
  multiSize: boolean;
  source?: "cotización" | "lista";
}) {
  const current = inCart + pending;
  const added = inCart >= target;
  const done = current >= target;
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div className={`rounded-brand border p-3 ${done ? "border-ink bg-ink text-paper" : "border-black/10 bg-paper-soft"}`}>
      <p className="text-sm font-semibold">
        {added
          ? `✓ Ya agregaste las ${target} piezas de tu ${source}`
          : done
          ? `✓ Tus ${target} piezas están listas`
          : `Tu ${source}: ${target} piezas · llevas ${current}`}
      </p>
      {done && (
        <p className="mt-1 text-[11px] text-paper/70">
          {added
            ? pending > 0
              ? `Si quieres más, toca «${addLabel(pending)}»; si no, sigue con tus datos.`
              : "Sigue con tus datos aquí abajo."
            : `${multiSize ? (source === "lista" ? "Son las tallas de tu lista: revisa y toca" : "Las repartimos en tallas típicas: cámbialas según tu grupo y toca") : "Toca"} «${addLabel(pending)}».`}
        </p>
      )}
      {!done && (
        <>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-ink-soft">
            {multiSize
              ? "Reparte las piezas por talla aquí abajo; puedes mezclar tallas y colores."
              : "Revisa la cantidad y agrégala al pedido."}
          </p>
        </>
      )}
    </div>
  );
}

// "S:5,M:11,L:9" → { S: 5, M: 11, L: 9 }. Null si no viene o no tiene nada válido.
function parseSizesParam(value: string | null): Record<string, number> | null {
  if (!value) return null;
  const out: Record<string, number> = {};
  for (const part of value.split(",")) {
    const [size, n] = part.split(":");
    const qty = Math.round(Number(n));
    if (size && /^[A-Za-zÁÉÍÓÚáéíóúñÑ]{1,12}$/.test(size) && qty > 0 && qty <= 9999) out[size] = (out[size] ?? 0) + qty;
  }
  return Object.keys(out).length ? out : null;
}

// Reparto típico de tallas para un grupo (más M y L), para que un pedido que viene
// del cotizador arranque con todas sus piezas y el descuento ya se vea. Suma exacto.
const TYPICAL_SIZE_WEIGHT: Record<string, number> = { XS: 5, S: 15, M: 35, L: 30, XL: 15, XXL: 5 };

function typicalSizes(total: number, sizes: string[]): Record<string, number> {
  const weights = sizes.map((s) => TYPICAL_SIZE_WEIGHT[s] ?? 10);
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (total * w) / sum);
  const out = exact.map(Math.floor);
  // Lo que falta por redondear va a las tallas con más decimales.
  const order = exact.map((e, i) => [e - Math.floor(e), i] as const).sort((a, b) => b[0] - a[0]);
  const missing = total - out.reduce((a, b) => a + b, 0);
  for (let k = 0; k < missing; k++) out[order[k % order.length][1]]++;
  return Object.fromEntries(sizes.map((s, i) => [s, out[i]]).filter(([, n]) => (n as number) > 0));
}

// Con una sola talla (gorra, tote) no hay nada que elegir: arranca en 1.
function initialSizeQty(sizes: string[]): Record<string, number> {
  return sizes.length === 1 ? { [sizes[0]]: 1 } : {};
}

// El diseño de una lista de tallas, que el organizador hace antes de compartirla:
// el diseñador sin tallas, carrito ni pago, con un botón para guardarlo en la lista.
export interface ListDesignMode {
  listId: string;
  clave: string;
  nombre: string;
  organizador: string | null;
  personas: number; // cuántos ya se anotaron (sin contar al organizador): con 0 se puede pedir de todo
}

export function OrderForm({ listDesign, query }: { listDesign?: ListDesignMode; query?: string } = {}) {
  const router = useRouter();
  const urlParams = useSearchParams();
  // En la página de diseño de una lista, los datos llegan del servidor en vez de la URL.
  const searchParams = useMemo(() => (query !== undefined ? new URLSearchParams(query) : urlParams), [query, urlParams]);
  const designMode = Boolean(listDesign);
  const preselected = searchParams.get("producto") ?? PRODUCTS[0].id;
  // Desde el cotizador de "Por mayor" llegan también la técnica, la tela, cuántas
  // piezas y una nota (?tecnica=&tela=&cantidad=&nota=), y el pedido arranca armado.
  const preProduct = getProductById(preselected);
  const urlTechniqueParam = searchParams.get("tecnica") as Technique | null;
  const urlTechnique = urlTechniqueParam && preProduct?.techniques.includes(urlTechniqueParam) ? urlTechniqueParam : null;
  const urlFabricOption = preProduct?.fabrics?.find(
    (f) => f.id === searchParams.get("tela") && (!urlTechnique || f.techniques.includes(urlTechnique))
  );
  // Desde una lista de tallas llegan las cantidades exactas por talla (?tallas=S:5,M:11).
  const listSizesParam = parseSizesParam(searchParams.get("tallas"));
  const listTotal = listSizesParam ? Object.values(listSizesParam).reduce((a, b) => a + b, 0) : 0;
  const quoteSource: "cotización" | "lista" = listSizesParam ? "lista" : "cotización";
  const quoteQuantity =
    (listTotal || Math.min(9999, Math.max(0, Math.round(Number(searchParams.get("cantidad")) || 0)))) || null;
  const urlNota = (searchParams.get("nota") ?? "").slice(0, 200);
  // La lista de tallas de donde viene el pedido: al confirmarlo, queda unida a él.
  const urlListaId = UUID_RE.test(searchParams.get("lista") ?? "") ? searchParams.get("lista") : null;
  // La clave del organizador (viene de su lista): para volver a ella y cambiar el diseño.
  const urlClave = searchParams.get("clave");
  const startTechnique = urlTechnique ?? preProduct?.techniques[0] ?? "serigrafia";
  const startFabric = urlFabricOption?.id ?? defaultFabricFor(preProduct, startTechnique);

  const [technique, setTechnique] = useState<Technique>(startTechnique);
  const [items, setItems] = useState<CartLine[]>([]);

  const [productId, setProductId] = useState(preselected);
  const [fabric, setFabric] = useState<string | null>(startFabric);
  // Aviso cuando cambiar la técnica obligó a cambiar la tela (o al revés).
  const [fabricNote, setFabricNote] = useState<string | null>(null);
  // Ventana con la explicación y comparación de técnicas.
  const [showTechniques, setShowTechniques] = useState(false);
  // El color elegido en la página del producto (?color=) llega ya seleccionado.
  const urlVariant = getProductById(preselected)?.variants.find((v) => v.color === searchParams.get("color"));
  const preVariant = urlVariant ?? getProductById(preselected)?.variants[0];
  const [color, setColor] = useState(preVariant?.color ?? "");
  const [size, setSize] = useState(defaultSize(preVariant?.sizes ?? []));
  // Cuántas piezas de cada talla se van a agregar, como en una hoja de pedido.
  const [sizeQty, setSizeQty] = useState<Record<string, number>>(() => {
    const sizes = preVariant?.sizes ?? [];
    if (!quoteQuantity) return initialSizeQty(sizes);
    if (listSizesParam) return listSizesParam;
    return sizes.length === 1 ? { [sizes[0]]: quoteQuantity } : typicalSizes(quoteQuantity, sizes);
  });

  // Camisas de grupo: la camisa de ejemplo tiene el diseño de todos (paso 1) y lo que
  // pone cada quien (paso 2): sus textos, cada uno en su lugar, que cada persona cambia
  // por lo suyo al anotarse. Se carga de la lista y solo se edita al diseñarla.
  const [personal, setPersonal] = useState<GroupPersonal>({ campos: [], eligen: { color: false, fuente: false } });
  const [step, setStep] = useState<"comun" | "personal">("comun");
  // El texto de cada quien que se está editando ("nuevo": se va a agregar otro).
  const [editingField, setEditingField] = useState<number | "nuevo" | null>(null);
  // Pedido de una lista: con quién del grupo se ve la camisa (-1: la de ejemplo).
  const [groupExamples, setGroupExamples] = useState<{ nombre: string; valores: Valores }[]>([]);
  const [shownExample, setShownExample] = useState(-1);
  // Al diseñar: la camisa de ejemplo es la del organizador y se manda a hacer con las demás.
  const [mia, setMia] = useState({ incluir: true, nombre: listDesign?.organizador ?? "", talla: "" });
  // Con gente ya anotada no se pueden agregar textos: ellos no los escribieron.
  const lockedFields = Boolean(listDesign && listDesign.personas > 0);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [notas, setNotas] = useState(urlNota);
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
  // Cada línea lleva su propia técnica (se pueden mezclar en un pedido). La técnica
  // elegida aquí es la del producto que se está armando; depende también de la tela:
  // el sublimado solo agarra en poliéster.
  const selectedFabric = getFabric(productId, fabric);
  // La tinta de sublimación es transparente: sobre telas oscuras no se ve.
  const sublimationOnDark = technique === "sublimado" && isDarkColor(selectedVariant?.colorHex ?? "#FFFFFF");
  // El delivery se cobra aparte del descuento por cantidad y se suma al total.
  const delivery = deliveryQuote(shipping);
  const productPricing = useMemo(() => calculateOrderTotal(items, technique), [items, technique]);
  const pricing = {
    ...productPricing,
    shipping: delivery?.costo ?? 0,
    shippingKm: delivery?.km,
    total: productPricing.total + (items.length ? delivery?.costo ?? 0 : 0),
  };

  const zones = selectedProduct ? getZonesForCategory(selectedProduct.category) : (["frente"] as DesignZone[]);
  const [activeZone, setActiveZone] = useState<DesignZone>("frente");
  const [zoneContent, setZoneContent] = useState<ZoneContentMap>({});
  const [zoneTransform, setZoneTransform] = useState<ZoneTransformMap>({});
  // Otros textos en cada parte, además del diseño principal (uno debajo de otro, por
  // ejemplo), y cuál se está editando: 0 el principal, 1 en adelante los otros textos.
  const [zoneExtras, setZoneExtras] = useState<ZoneExtras>({});
  const [activePiece, setActivePiece] = useState<{ zone: DesignZone; index: number }>({ zone: "frente", index: 0 });

  const currentZone: DesignZone = zones.includes(activeZone) ? activeZone : "frente";
  const transformFor = (z: DesignZone) =>
    zoneTransform[z] ?? (selectedProduct ? defaultTransform(selectedProduct.category, z) : { x: 50, y: 50, scale: 1, rotation: 0 });
  const currentExtras = zoneExtras[currentZone] ?? [];
  const pieceIndex = activePiece.zone === currentZone && activePiece.index <= currentExtras.length ? activePiece.index : 0;
  const editingExtra = pieceIndex > 0 ? currentExtras[pieceIndex - 1] : null;
  const currentContent = editingExtra ? editingExtra.content : zoneContent[currentZone] ?? null;
  const currentTransform = editingExtra ? editingExtra.transform : transformFor(currentZone);
  const zonePreviews: ZonePreviews = {};
  for (const z of zones) {
    const design = zoneDesign(zoneContent[z], transformFor(z), zoneExtras[z]);
    if (design) zonePreviews[z] = design;
  }
  const zonesWithContent = zones.filter((z) => zonePreviews[z]);
  // Todo lo que lleva la parte que se ve (el principal y sus otros textos).
  const mainContent = zoneContent[currentZone];
  const currentPieces: { content: DesignContent; transform: DesignTransform }[] = mainContent
    ? [{ content: mainContent, transform: transformFor(currentZone) }, ...currentExtras]
    : [];

  // Lo de cada quien en el lado que se está viendo, y cuál de esos textos se edita.
  const hasPersonal = personal.campos.length > 0;
  const personalStep = designMode && step === "personal";
  const zoneFields = personal.campos.flatMap((f, i) => (f.zona === currentZone ? [{ field: f, index: i }] : []));
  const activeField =
    editingField === "nuevo"
      ? null
      : editingField !== null && personal.campos[editingField]?.zona === currentZone
        ? editingField
        : zoneFields[0]?.index ?? null;
  const editing = activeField !== null ? personal.campos[activeField] : null;
  const contrastInk = isDarkColor(selectedVariant?.colorHex ?? "#FFFFFF") ? "#FFFFFF" : "#111111";

  // Otro texto en esta parte, debajo de lo último que hay, con la letra y el color del
  // último texto (para que combinen). El diseñador lo acomoda dentro del área.
  function addExtraText() {
    if (!selectedProduct || !mainContent || currentPieces.length >= MAX_PIECES_PER_ZONE) return;
    const area = getPrintArea(selectedProduct.category, currentZone);
    const last = currentPieces[currentPieces.length - 1];
    const style = [...currentPieces].reverse().find((piece) => piece.content.kind === "texto")?.content;
    const extra: ExtraText = {
      content: {
        kind: "texto",
        texto: "",
        color: style?.kind === "texto" ? style.color : contrastInk,
        fontFamily: style?.kind === "texto" ? style.fontFamily : "sans",
        outline: style?.kind === "texto" ? style.outline ?? null : null,
      },
      transform: {
        x: area.x + area.w / 2,
        y: Math.min(area.y + area.h * 0.92, last.transform.y + area.h * 0.22),
        scale: 0.5,
        rotation: 0,
      },
    };
    setZoneExtras((prev) => ({ ...prev, [currentZone]: [...(prev[currentZone] ?? []), extra] }));
    setActivePiece({ zone: currentZone, index: currentPieces.length });
  }

  // Lo que va debajo o encima de lo que se edita: en el paso 2 se mueve un texto de
  // cada quien sobre el diseño de todos; en el paso 1, los textos de cada quien se ven
  // tenues para saber dónde van.
  function groupLayers(zone: DesignZone, main: boolean) {
    if (!selectedProduct) return {};
    const category = selectedProduct.category;
    const valores = !designMode && shownExample >= 0 ? groupExamples[shownExample]?.valores : undefined;
    const fields = hasPersonal && (
      <PersonalLayer
        category={category}
        zone={zone}
        personal={personal}
        valores={valores}
        skip={main && personalStep && zone === currentZone ? activeField ?? undefined : undefined}
        faded={designMode && !personalStep}
      />
    );
    const common = zonePreviews[zone];
    if (main && personalStep && common) {
      return {
        underlay: (
          <DesignLayer category={category} zone={zone} content={common.content} transform={common.transform} extras={common.extras} />
        ),
        overlay: fields,
      };
    }
    return { overlay: fields };
  }

  function changeZone(zone: DesignZone) {
    setActiveZone(zone);
    setEditingField(null);
  }

  function addField(campo: Campo) {
    if (!selectedProduct) return;
    const t = defaultTransform(selectedProduct.category, currentZone);
    const field: PersonalField = {
      id: newFieldId(),
      zona: currentZone,
      campo,
      ejemplo: campo === "nombre" ? (mia.nombre.trim().split(" ")[0] || "JUAN").toUpperCase().slice(0, MAX_TEXTO) : campo === "numero" ? "10" : "TEXTO",
      ...(campo === "texto" ? { etiqueta: DEFAULT_ETIQUETA } : {}),
      color: contrastInk,
      fuente: campo === "numero" ? "display" : "colegial",
      posX: t.x,
      posY: t.y,
      escala: campo === "numero" ? 0.35 : 0.6,
      rotacion: 0,
    };
    setPersonal((p) => ({ ...p, campos: [...p.campos, field] }));
    setEditingField(personal.campos.length);
  }

  // El diseñador edita el texto de cada quien como cualquier texto: lo que se escribe es
  // lo que dice ahí la camisa de ejemplo (la del organizador).
  function handleFieldContent(next: DesignContent | null) {
    if (activeField === null || !editing) return;
    if (!next) {
      setPersonal((p) => ({ ...p, campos: p.campos.filter((_, i) => i !== activeField) }));
      setEditingField(null);
      return;
    }
    if (next.kind !== "texto") return;
    const value =
      editing.campo === "numero"
        ? next.texto.replace(/\D/g, "").slice(0, MAX_NUMERO)
        : next.texto.slice(0, editing.campo === "texto" ? MAX_EXTRA : MAX_TEXTO);
    setPersonal((p) => ({
      ...p,
      campos: p.campos.map((f, i) =>
        i === activeField
          ? { ...f, ejemplo: value, color: next.color, fuente: next.fontFamily, contorno: next.outline ?? undefined }
          : f
      ),
    }));
  }

  function handleFieldTransform(t: DesignTransform) {
    if (activeField === null) return;
    setPersonal((p) => ({
      ...p,
      campos: p.campos.map((f, i) =>
        i === activeField ? { ...f, posX: t.x, posY: t.y, escala: t.scale, rotacion: t.rotation } : f
      ),
    }));
  }

  // El diseño de cada línea: el suyo, o si no tiene, el que está en el diseñador
  // (siempre que ese no lo lleve ya otra línea). Así el carrito muestra lo que se imprimirá.
  const currentKeyFor = (category: ProductCategory) =>
    designKey(snapshotDesigns(zoneContent, zoneTransform, category, zoneExtras));
  const explicitKeys = new Set(items.filter((i) => hasAnyDesign(i.designs)).map((i) => designKey(i.designs)));
  function effectiveDesigns(line: CartLine): LineDesigns {
    if (hasAnyDesign(line.designs)) return line.designs;
    const category = getProductById(line.productId)?.category;
    if (!category) return {};
    const floating = snapshotDesigns(zoneContent, zoneTransform, category, zoneExtras);
    return explicitKeys.has(designKey(floating)) ? {} : floating;
  }
  const lineDesigns = items.map(effectiveDesigns);
  const lineKeys = lineDesigns.map(designKey);
  const groupKeys = [...new Set(lineKeys.filter(Boolean))];
  // Los diseños se numeran solo cuando hay que distinguirlos.
  const labelDesigns = groupKeys.length > 1 || (groupKeys.length === 1 && lineKeys.some((k) => !k));
  const designLabel = (i: number) => (lineKeys[i] ? `Diseño ${groupKeys.indexOf(lineKeys[i]) + 1}` : "Sin diseño");
  const invoiceLines = buildInvoiceLines(items, technique).map((l, i) =>
    labelDesigns ? { ...l, description: `${l.description} · ${designLabel(i)}` } : l
  );

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
  const savedImageKeys = useRef("");
  const urlProduct = searchParams.get("producto");

  useEffect(() => {
    // El diseño de una lista no es un pedido: no se recupera ni se guarda como borrador.
    if (designMode) {
      setDraftReady(true);
      return;
    }
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

      let imagesLost = false;
      const content: ZoneContentMap = {};
      for (const [zone, d] of Object.entries(draft.designs) as [DesignZone, DraftDesign][]) {
        const restoredContent = fromDraftDesign(d, files);
        if (restoredContent) content[zone] = restoredContent;
        else imagesLost = true;
      }
      type DraftLineDesign = NonNullable<DraftLine["designs"][DesignZone]>;
      const restoredItems: CartLine[] = draft.items.map((line) => {
        const designs: LineDesigns = {};
        for (const [zone, d] of Object.entries(line.designs ?? {}) as [DesignZone, DraftLineDesign][]) {
          const c = fromDraftDesign(d.design, files);
          if (c) designs[zone] = { content: c, transform: d.transform, ...(d.extras?.length ? { extras: d.extras } : {}) };
          else imagesLost = true;
        }
        const { key, productId: id, color: lineColor, size: lineSize, quantity, fabric: lineFabric } = line;
        const lineTechnique = line.technique ?? draft.technique;
        return {
          key,
          productId: id,
          color: lineColor,
          size: lineSize,
          quantity,
          fabric: lineFabric ?? null,
          technique: lineTechnique,
          designs,
        };
      });
      savedImageKeys.current = Object.keys(files).sort().join("|");

      setItems(restoredItems);
      if (quoteQuantity && restoredItems.reduce((sum, i) => sum + i.quantity, 0) >= quoteQuantity) setSizeQty({});
      // Si llegó desde la página de otro producto, ese queda elegido para agregarlo.
      const keepProduct = (!urlProduct || urlProduct === draft.productId) && getProductById(draft.productId);
      if (keepProduct) {
        setProductId(draft.productId);
        setFabric(draft.fabric ?? defaultFabricFor(getProductById(draft.productId), draft.technique));
        if (urlVariant) {
          setColor(urlVariant.color);
          setSize(urlVariant.sizes.includes(draft.size) ? draft.size : defaultSize(urlVariant.sizes));
        } else {
          setColor(draft.color);
          setSize(draft.size);
        }
        setTechnique(draft.technique);
      } else {
        const product = getProductById(productId);
        const nextTechnique =
          !product || product.techniques.includes(draft.technique) ? draft.technique : product.techniques[0];
        setTechnique(nextTechnique);
        setFabric(defaultFabricFor(getProductById(productId), nextTechnique));
      }
      setActiveZone(draft.activeZone);
      setZoneContent(content);
      setZoneTransform(draft.transforms);
      setZoneExtras(draft.extras ?? {});
      setClienteNombre(draft.clienteNombre);
      setClienteTelefono(draft.clienteTelefono);
      setClienteEmail(draft.clienteEmail);
      setNotas(draft.notas || urlNota);
      setWantsRuc(draft.wantsRuc);
      setBilling(draft.billing);
      setShipping(draft.shipping);
      // Solo si el producto que queda elegido es el de la cotización.
      if (urlTechnique && (keepProduct ? draft.productId : productId) === preselected) {
        setTechnique(urlTechnique);
        setFabric(startFabric);
      }
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
    if (!draftReady || designMode) return;
    const designs: Partial<Record<DesignZone, DraftDesign>> = {};
    for (const [zone, c] of Object.entries(zoneContent) as [DesignZone, DesignContent][]) {
      designs[zone] = toDraftDesign(c);
    }
    saveDraft({
      v: 2,
      items: items.map(({ designs: lineDesignsToSave, ...rest }) => ({
        ...rest,
        designs: toDraftLineDesigns(lineDesignsToSave),
      })),
      technique,
      productId,
      fabric,
      color,
      size,
      activeZone,
      designs,
      transforms: zoneTransform,
      extras: zoneExtras,
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
    fabric,
    color,
    size,
    activeZone,
    zoneContent,
    zoneTransform,
    zoneExtras,
    clienteNombre,
    clienteTelefono,
    clienteEmail,
    notas,
    wantsRuc,
    billing,
    shipping,
  ]);

  // Las imágenes (del diseñador y de cada línea) solo se vuelven a guardar cuando
  // cambia algún archivo, no al moverlas.
  useEffect(() => {
    if (!draftReady || designMode) return;
    const files: Record<string, File> = {};
    const collect = (c: DesignContent | undefined) => {
      if (c?.kind === "imagen") files[imageKey(c.file)] = c.file;
    };
    Object.values(zoneContent).forEach(collect);
    for (const line of items) Object.values(line.designs).forEach((d) => collect(d?.content));
    const keys = Object.keys(files).sort().join("|");
    if (keys === savedImageKeys.current) return;
    savedImageKeys.current = keys;
    void saveDraftImages(files);
  }, [draftReady, zoneContent, items]);

  // El diseño que el organizador guardó en la lista: se carga en el diseñador para
  // cambiarlo (página de diseño de la lista) o para hacer el pedido sin volver a
  // diseñar. En el pedido se carga una sola vez por pestaña, para no pisar lo que ya cambiaron.
  const listImagePaths = useRef(new Map<string, string>()); // imagen → dónde está guardada
  const [listDesignState, setListDesignState] = useState<"cargando" | "listo" | "error" | null>(null);
  const [listInfo, setListInfo] = useState<{ nombre: string; conDiseno: boolean } | null>(null);
  // Pedido de una lista con camisa de ejemplo: se ve la camisa terminada, no el diseñador
  // (a menos que quiera agregar otras prendas).
  const [showDesigner, setShowDesigner] = useState(false);
  useEffect(() => {
    if (!draftReady || !urlListaId) return;
    // Lo de cada quien siempre se carga (solo se muestra). El diseño de todos y las piezas,
    // una vez por pestaña, o de nuevo si el organizador cambió el diseño o las tallas.
    const loadedKey = `impreza-lista-diseno-${urlListaId}`;
    let cancelled = false;
    (async () => {
      setListDesignState("cargando");
      try {
        const res = await fetch(`/api/listas/${urlListaId}/diseno`);
        if (!res.ok) throw new Error();
        const data: {
          nombre: string;
          version: string | null;
          diseno: GroupDesign | null;
          personal: unknown;
          ejemplosGrupo: { nombre: string; valores: Valores }[];
          mia: { nombre: string; talla: string } | null;
        } = await res.json();
        const loadedValue = `${data.version ?? ""}|${searchParams.get("tallas") ?? ""}`;
        let loadedBefore = false;
        if (!designMode) {
          try {
            loadedBefore = sessionStorage.getItem(loadedKey) === loadedValue;
          } catch {
            // Sin almacenamiento: se carga cada vez.
          }
        }
        const category = getProductById(preselected)?.category ?? "camisa";
        const loadedPersonal = parsePersonal(data.personal, category);
        if (cancelled) return;
        if (loadedPersonal) setPersonal(loadedPersonal);
        setGroupExamples(data.ejemplosGrupo ?? []);
        setListInfo({ nombre: data.nombre, conDiseno: Boolean(data.diseno || loadedPersonal) });
        if (designMode) {
          // Ya guardado sin la camisa del organizador: sigue sin ella hasta que la marque.
          if (data.mia) setMia({ incluir: true, nombre: data.mia.nombre, talla: data.mia.talla });
          else if (data.diseno || loadedPersonal) setMia((m) => ({ ...m, incluir: false }));
        }
        if (loadedBefore) {
          setListDesignState(null);
          return;
        }

        const content: ZoneContentMap = {};
        const transforms: ZoneTransformMap = {};
        const extras: ZoneExtras = {};
        for (const z of data.diseno?.zonas ?? []) {
          const placed = { x: z.posX, y: z.posY, scale: z.escala, rotation: z.rotacion };
          // Después del principal, los otros textos de esa parte.
          if (content[z.zona]) {
            if (z.tipo === "texto") {
              const text = { kind: "texto" as const, texto: z.texto, color: z.color, fontFamily: z.fuente, outline: z.contorno ?? null };
              extras[z.zona] = [...(extras[z.zona] ?? []), { content: text, transform: placed }];
            }
            continue;
          }
          transforms[z.zona] = placed;
          if (z.tipo === "texto") {
            content[z.zona] = { kind: "texto", texto: z.texto, color: z.color, fontFamily: z.fuente, outline: z.contorno ?? null };
          } else if (z.url) {
            const imageRes = await fetch(z.url);
            if (!imageRes.ok) throw new Error();
            const file = new File([await imageRes.blob()], `diseno-${z.zona}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
            listImagePaths.current.set(imageKey(file), z.path);
            content[z.zona] = {
              kind: "imagen",
              file,
              previewUrl: URL.createObjectURL(file),
              width: z.anchoPx,
              height: z.altoPx,
              fill: z.ajuste === "llenar",
            };
          }
        }
        if (cancelled) return;
        if (data.diseno) {
          setZoneContent(content);
          setZoneTransform(transforms);
          setZoneExtras(extras);
          setActiveZone((Object.keys(content) as DesignZone[])[0] ?? "frente");
          setTechnique(data.diseno.tecnica);
          setFabric(data.diseno.tela ?? defaultFabricFor(getProductById(preselected), data.diseno.tecnica));
        }
        // Las piezas de antes (de otro diseño o de otras tallas) se cambian por las de ahora.
        if (!designMode) setItems([]);
        try {
          sessionStorage.setItem(loadedKey, loadedValue);
        } catch {
          // Sin almacenamiento: se vuelve a cargar al recargar la página.
        }
        setListDesignState(data.diseno || loadedPersonal ? "listo" : null);
      } catch {
        if (!cancelled) setListDesignState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // Solo cuando termina de recuperar el borrador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftReady]);

  // Para empezar rápido: el nombre de la lista y sus partes ("Promoción 2026 — Colegio
  // La Salle" da también "Promoción 2026" y "Colegio La Salle"), listos como texto.
  const textIdeas = listDesign
    ? [...new Set([listDesign.nombre, ...listDesign.nombre.split(/\s+[—–-]\s+|\s*[|·,]\s*/)].map((t) => t.trim()))]
        .filter((t) => t.length >= 3 && t.length <= 40)
        .slice(0, 4)
    : [];

  // Guarda en la lista lo que está en el diseñador (y cómo van los nombres) y vuelve a ella.
  const [savingDesign, setSavingDesign] = useState(false);
  async function saveListDesign() {
    if (!listDesign || !selectedProduct) return;
    setSavingDesign(true);
    setError(null);
    try {
      const supabase = createClient();
      const zonas = [];
      for (const zone of zonesWithContent) {
        const { content, transform, extras = [] } = zonePreviews[zone]!;
        const placement = { posX: transform.x, posY: transform.y, escala: transform.scale, rotacion: transform.rotation };
        const extraTexts = extras.map((e) => ({
          zona: zone,
          tipo: "texto",
          texto: e.content.texto.trim(),
          color: e.content.color,
          fuente: e.content.fontFamily,
          ...(e.content.outline ? { contorno: e.content.outline } : {}),
          posX: e.transform.x,
          posY: e.transform.y,
          escala: e.transform.scale,
          rotacion: e.transform.rotation,
        }));
        if (content.kind === "imagen") {
          let path = listImagePaths.current.get(imageKey(content.file));
          if (!path) {
            path = groupImagePath(listDesign.listId, zone);
            const { error: uploadError } = await supabase.storage.from("disenos").upload(path, content.file, {
              contentType: "image/jpeg",
            });
            if (uploadError) throw new Error(`No se pudo subir la imagen (${zone}): ${uploadError.message}`);
            listImagePaths.current.set(imageKey(content.file), path);
          }
          zonas.push({
            zona: zone,
            tipo: "imagen",
            path,
            ajuste: content.fill ? "llenar" : "completa",
            anchoPx: content.width,
            altoPx: content.height,
            ...placement,
          });
        } else {
          zonas.push({
            zona: zone,
            tipo: "texto",
            texto: content.texto.trim(),
            color: content.color,
            fuente: content.fontFamily,
            ...(content.outline ? { contorno: content.outline } : {}),
            ...placement,
          });
        }
        zonas.push(...extraTexts);
      }
      const res = await fetch(`/api/listas/${listDesign.listId}/diseno`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clave: listDesign.clave,
          diseno: { tecnica: technique, tela: fabric, color, zonas },
          personal: hasPersonal ? personal : null,
          mia: mia.incluir ? { nombre: mia.nombre, talla: mia.talla } : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo guardar el diseño. Intenta de nuevo.");
      }
      router.push(`/lista-de-tallas/${listDesign.listId}?clave=${encodeURIComponent(listDesign.clave)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setSavingDesign(false);
    }
  }

  function startOver() {
    clearDraft();
    savedImageKeys.current = "";
    const product = getProductById(urlProduct ?? "") ?? PRODUCTS[0];
    setItems([]);
    setTechnique(product.techniques[0]);
    setProductId(product.id);
    setFabric(defaultFabricFor(product, product.techniques[0]));
    setFabricNote(null);
    setColor(product.variants[0]?.color ?? "");
    setSize(defaultSize(product.variants[0]?.sizes ?? []));
    setSizeQty(initialSizeQty(product.variants[0]?.sizes ?? []));
    setActiveZone("frente");
    setZoneContent({});
    setZoneTransform({});
    setZoneExtras({});
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
    // Uno de los otros textos: se cambia o se quita.
    if (pieceIndex > 0) {
      if (next && next.kind !== "texto") return;
      const i = pieceIndex - 1;
      setZoneExtras((prev) => {
        const list = [...(prev[currentZone] ?? [])];
        if (next) list[i] = { ...list[i], content: next };
        else list.splice(i, 1);
        return { ...prev, [currentZone]: list };
      });
      if (!next) setActivePiece({ zone: currentZone, index: pieceIndex - 1 });
      return;
    }
    // Se quita el principal y hay otros textos: el primero pasa a ser el principal.
    if (!next && currentExtras.length > 0) {
      const [first, ...rest] = currentExtras;
      setZoneContent((prev) => ({ ...prev, [currentZone]: first.content }));
      setZoneTransform((prev) => ({ ...prev, [currentZone]: first.transform }));
      setZoneExtras((prev) => ({ ...prev, [currentZone]: rest }));
      return;
    }
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
    if (pieceIndex > 0) {
      const i = pieceIndex - 1;
      setZoneExtras((prev) => {
        const list = [...(prev[currentZone] ?? [])];
        if (!list[i]) return prev;
        list[i] = { ...list[i], transform: t };
        return { ...prev, [currentZone]: list };
      });
      return;
    }
    setZoneTransform((prev) => ({ ...prev, [currentZone]: t }));
  }

  function handleProductChange(id: string) {
    setProductId(id);
    const product = getProductById(id);
    // Si la técnica actual no sirve para este producto, pasa a la primera que sí.
    const nextTechnique = product && !product.techniques.includes(technique) ? product.techniques[0] : technique;
    setTechnique(nextTechnique);
    setFabric(defaultFabricFor(product, nextTechnique));
    setFabricNote(null);
    const sizes = product?.variants[0]?.sizes ?? [];
    setColor(product?.variants[0]?.color ?? "");
    setSize(sizes.includes(size) ? size : defaultSize(sizes));
    setSizeQty(initialSizeQty(sizes));
    if (product && !getZonesForCategory(product.category).includes(activeZone)) {
      setActiveZone("frente");
    }
  }

  // ¿Hay alguna tela de este producto que sirva para la técnica?
  function techniqueAvailable(t: Technique) {
    if (!selectedProduct?.techniques.includes(t)) return false;
    return !selectedProduct.fabrics || selectedProduct.fabrics.some((f) => f.techniques.includes(t));
  }

  function chooseTechnique(t: Technique) {
    setTechnique(t);
    setFabricNote(null);
    if (selectedProduct?.fabrics && selectedFabric && !selectedFabric.techniques.includes(t)) {
      const next = selectedProduct.fabrics.find((f) => f.techniques.includes(t));
      if (next) {
        setFabric(next.id);
        setFabricNote(`Cambiamos la tela a ${next.name}: es la que sirve para ${TECHNIQUE_LABEL[t].toLowerCase()}.`);
      }
    }
  }

  function chooseFabric(id: string) {
    const f = selectedProduct?.fabrics?.find((x) => x.id === id);
    if (!f) return;
    setFabric(id);
    setFabricNote(null);
    if (!f.techniques.includes(technique)) {
      const next = f.techniques.find((t) => selectedProduct?.techniques.includes(t));
      if (next) {
        setTechnique(next);
        setFabricNote(`${f.name} se imprime con ${TECHNIQUE_LABEL[next].toLowerCase()}: cambiamos la técnica.`);
      }
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
  // Precio promedio por pieza sin descuento, para decir en la barra cuánto baja cada una.
  const unitPriceForBar =
    pricing.totalQuantity > 0 ? pricing.subtotal / pricing.totalQuantity : getUnitPrice(productId, technique, fabric);

  // Cada línea guarda el diseño que hay en el diseñador en este momento. Solo se
  // juntan líneas de la misma prenda, color, talla y diseño.
  function addItem() {
    if (!selectedProduct || !color || pendingTotal === 0) return;
    const designs = snapshotDesigns(zoneContent, zoneTransform, selectedProduct.category, zoneExtras);
    const key = designKey(designs);
    // Las líneas sin diseño propio que ya mostraban este mismo diseño se quedan con él.
    let next = items.map((i) =>
      key && !hasAnyDesign(i.designs) && designKey(effectiveDesigns(i)) === key ? { ...i, designs } : i
    );
    for (const line of pendingLines) {
      const existing = next.find(
        (i) =>
          i.productId === productId &&
          i.technique === technique &&
          (i.fabric ?? null) === fabric &&
          i.color === color &&
          i.size === line.size &&
          designKey(i.designs) === key
      );
      next = existing
        ? next.map((i) => (i === existing ? { ...i, quantity: i.quantity + line.quantity } : i))
        : [
            ...next,
            {
              key: crypto.randomUUID(),
              productId,
              technique,
              fabric,
              color,
              size: line.size,
              quantity: line.quantity,
              designs,
            },
          ];
    }
    setItems(next);
    setSizeQty(initialSizeQty(availableSizes));
  }

  // Pedido de una lista con camisa de ejemplo, y sus piezas por talla para el resumen.
  const listOrder = !designMode && Boolean(listInfo?.conDiseno);
  const listSizesInCart: [string, number][] = [];
  for (const line of items) {
    if (line.productId !== productId) continue;
    const found = listSizesInCart.find(([t]) => t === line.size);
    if (found) found[1] += line.quantity;
    else listSizesInCart.push([line.size, line.quantity]);
  }
  listSizesInCart.sort(([a], [b]) => availableSizes.indexOf(a) - availableSizes.indexOf(b));

  // Pedido de una lista con su diseño: las piezas de la lista entran solas con el diseño
  // cargado (una vez); solo faltan los datos y el pago.
  const autoAdded = useRef(false);
  useEffect(() => {
    if (designMode || listDesignState !== "listo" || autoAdded.current) return;
    autoAdded.current = true;
    if (items.length === 0 && pendingTotal > 0) addItem();
    // Solo cuando termina de cargar el diseño de la lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listDesignState]);

  // Le pone a esta línea lo que hay ahora en el diseñador.
  function applyCurrentDesign(lineKey: string) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.key !== lineKey) return i;
        const category = getProductById(i.productId)?.category;
        return category ? { ...i, designs: snapshotDesigns(zoneContent, zoneTransform, category, zoneExtras) } : i;
      })
    );
  }

  // Abre el diseño de esta línea en el diseñador (con su prenda y color) para verlo,
  // cambiarlo o pedir más tallas con el mismo diseño.
  function showLineDesign(line: CartLine) {
    const product = getProductById(line.productId);
    if (!product) return;
    const content: ZoneContentMap = {};
    const transforms: ZoneTransformMap = {};
    const extras: ZoneExtras = {};
    for (const [zone, d] of Object.entries(line.designs) as [DesignZone, LineDesign][]) {
      content[zone] = d.content;
      transforms[zone] = d.transform;
      if (d.extras?.length) extras[zone] = d.extras;
    }
    setProductId(product.id);
    if (line.technique) setTechnique(line.technique);
    setFabric(line.fabric ?? defaultFabricFor(product, line.technique ?? technique));
    setColor(line.color);
    setSize(line.size);
    setSizeQty(initialSizeQty(product.variants.find((v) => v.color === line.color)?.sizes ?? []));
    setZoneContent(content);
    setZoneTransform(transforms);
    setZoneExtras(extras);
    setActiveZone((Object.keys(content)[0] as DesignZone | undefined) ?? "frente");
    document.getElementById("diseno")?.scrollIntoView({ behavior: "smooth" });
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
  // Misma regla que el servidor: un correo mal escrito haría fallar el pedido al final.
  const emailInvalid = clienteEmail.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail.trim());
  const missingSteps = [
    items.length === 0 && {
      label: pendingTotal > 0 ? `tocar «${addLabel(pendingTotal)}» en el paso 1` : "al menos un producto",
      section: "diseno",
    },
    clienteNombre.trim().length < 2 && { label: "tu nombre", section: "datos" },
    clienteTelefono.trim().length < 6 && { label: "tu teléfono", section: "datos" },
    emailInvalid && { label: "revisar tu correo", section: "datos" },
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

      // Cada diseño distinto es un grupo (1, 2, 3...) y cada línea dice cuál lleva.
      const groups: LineDesigns[] = [];
      const itemsPayload = items.map((line, i) => {
        const { productId: id, color: lineColor, size: lineSize, quantity, fabric: lineFabric } = line;
        const key = lineKeys[i];
        let diseno: number | null = null;
        if (key) {
          diseno = groupKeys.indexOf(key) + 1;
          groups[diseno - 1] ??= lineDesigns[i];
        }
        return {
          productId: id,
          technique: line.technique ?? technique,
          fabric: lineFabric ?? null,
          color: lineColor,
          size: lineSize,
          quantity,
          diseno,
        };
      });

      // La misma imagen se sube una sola vez aunque la lleven varios diseños.
      const uploaded = new Map<string, string>();
      const disenos = [];
      for (const [index, designs] of groups.entries()) {
        for (const [zone, { content, transform, extras = [] }] of Object.entries(designs) as [DesignZone, LineDesign][]) {
          const placement = { posX: transform.x, posY: transform.y, escala: transform.scale, rotacion: transform.rotation };
          const grupo = index + 1;
          const extraTexts = extras.map((e) => ({
            zona: zone,
            tipo: "texto" as const,
            texto: e.content.texto.trim(),
            color: e.content.color,
            fuente: e.content.fontFamily,
            ...(e.content.outline ? { contorno: e.content.outline } : {}),
            grupo,
            posX: e.transform.x,
            posY: e.transform.y,
            escala: e.transform.scale,
            rotacion: e.transform.rotation,
          }));
          if (content.kind === "imagen") {
            let path = uploaded.get(imageKey(content.file));
            if (!path) {
              path = `disenos/${crypto.randomUUID()}-${zone}.jpg`;
              const { error: uploadError } = await supabase.storage.from("disenos").upload(path, content.file, {
                contentType: "image/jpeg",
              });
              if (uploadError) throw new Error(`No se pudo subir el diseño (${zone}): ${uploadError.message}`);
              uploaded.set(imageKey(content.file), path);
            }
            disenos.push({
              zona: zone,
              tipo: "imagen" as const,
              path,
              ajuste: content.fill ? ("llenar" as const) : ("completa" as const),
              anchoPx: content.width,
              altoPx: content.height,
              grupo,
              ...placement,
            });
          } else {
            disenos.push({
              zona: zone,
              tipo: "texto" as const,
              texto: content.texto.trim(),
              color: content.color,
              fuente: content.fontFamily,
              ...(content.outline ? { contorno: content.outline } : {}),
              grupo,
              ...placement,
            });
          }
          disenos.push(...extraTexts);
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
          tecnica: mainTechnique(items, technique),
          disenos,
          notas: notas.trim() || null,
          entrega: shipping,
          factura: wantsRuc ? billing : null,
          items: itemsPayload,
          paymentMethod: "transferencia",
          comprobantePath,
          orderId: pendingOrderId,
          listaId: urlListaId,
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
    <div className={designMode ? "" : "grid gap-10 lg:grid-cols-[1fr_320px]"}>
      <div className="min-w-0 space-y-10">
        {listDesignState === "cargando" && (
          <p className="rounded-brand bg-paper-soft px-4 py-3 text-sm text-ink-soft" aria-live="polite">
            Cargando el diseño de la lista…
          </p>
        )}
        {listDesignState === "listo" && !designMode && !listInfo?.conDiseno && (
          <div className="flex items-center justify-between gap-3 rounded-brand border-2 border-ink bg-white px-4 py-3 text-sm">
            <p className="text-ink">
              <span className="font-semibold">Ya pusimos el diseño y las piezas de tu lista.</span>{" "}
              <span className="text-ink-soft">
                Revísalo; solo faltan{" "}
                <a href="#datos" className="font-semibold text-ink underline">
                  tus datos y el pago
                </a>
                .
              </span>
            </p>
            <button type="button" onClick={() => setListDesignState(null)} className="shrink-0 text-xs font-semibold text-ink hover:underline">
              Cerrar
            </button>
          </div>
        )}
        {listDesignState === "error" && (
          <p className="rounded-brand bg-red-50 px-4 py-3 text-sm text-red-700">
            No se pudo cargar el diseño de la lista. Recarga la página para intentarlo de nuevo.
          </p>
        )}
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
          <h2 className="font-display text-3xl uppercase tracking-wide text-ink">
            {designMode ? "Diseño del grupo" : listOrder && !showDesigner ? "1. Tu pedido de la lista" : "1. Diseña tu producto"}
          </h2>

          {listOrder && !showDesigner && selectedProduct && (
            <ListOrderSummary
              listName={listInfo!.nombre}
              category={selectedProduct.category}
              colorHex={selectedVariant?.colorHex ?? "#FFFFFF"}
              details={[
                selectedProduct.name,
                color,
                TECHNIQUE_LABEL[technique],
                getFabric(productId, fabric)?.name,
              ]
                .filter(Boolean)
                .join(" · ")}
              sizes={listSizesInCart}
              designs={zonePreviews}
              personal={hasPersonal ? personal : null}
              examples={groupExamples}
              changeHref={urlClave ? `/lista-de-tallas/${urlListaId}/diseno?clave=${encodeURIComponent(urlClave)}` : null}
              backHref={`/lista-de-tallas/${urlListaId}${urlClave ? `?clave=${encodeURIComponent(urlClave)}` : ""}`}
              missingPieces={pendingTotal}
              onAddPieces={addItem}
              onCustomize={() => setShowDesigner(true)}
            />
          )}

          {designMode && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2" role="tablist" aria-label="Pasos del diseño">
              {(
                [
                  ["comun", "1. El diseño de todos", "Lo que sale igual en todas las camisas, como el logo del frente."],
                  ["personal", "2. Lo que pone cada quien", "Su nombre, su número u otro texto, donde tú digas: mangas, espalda o pecho."],
                ] as const
              ).map(([value, title, hint]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={step === value}
                  onClick={() => {
                    setStep(value);
                    setEditingField(null);
                  }}
                  className={`rounded-brand border-2 px-4 py-3 text-left transition-colors ${
                    step === value ? "border-ink bg-ink text-paper" : "border-black/10 bg-white text-ink hover:border-ink"
                  }`}
                >
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className={`block text-xs ${step === value ? "text-paper/70" : "text-ink-soft"}`}>{hint}</span>
                </button>
              ))}
            </div>
          )}

          {listOrder && showDesigner && (
            <button
              type="button"
              onClick={() => setShowDesigner(false)}
              className="mt-2 text-sm font-semibold text-ink-soft hover:text-ink hover:underline"
            >
              ← Volver al resumen de tu lista
            </button>
          )}

          <div className={`mt-3 grid gap-6 lg:grid-cols-[260px_1fr] ${listOrder && !showDesigner ? "hidden" : ""}`}>
            <div className="order-2 space-y-5 self-start rounded-brand border border-black/10 bg-white p-5 lg:order-1">
              <Field label="Producto">
                <select
                  value={productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  disabled={designMode}
                  title={designMode ? "La prenda se eligió al crear la lista" : undefined}
                  className="input disabled:opacity-60"
                >
                  {PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedProduct?.fabrics && (
                <div>
                  <p className="text-sm font-medium text-ink-soft">Tela</p>
                  <div className="mt-1.5 grid gap-1.5" role="radiogroup" aria-label="Tela">
                    {selectedProduct.fabrics.map((f) => {
                      const active = fabric === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => chooseFabric(f.id)}
                          className={`rounded-brand border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            active ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                          }`}
                        >
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-semibold">{f.name}</span>
                            {f.extra > 0 && (
                              <span className={`text-[11px] font-semibold ${active ? "text-paper/80" : "text-ink-soft"}`}>
                                +{formatCordobas(f.extra)}
                              </span>
                            )}
                          </span>
                          <span className={`block text-[11px] leading-snug ${active ? "text-paper/75" : "text-ink-muted"}`}>
                            {f.description}{" "}
                            {f.techniques.length === 1 ? `Solo ${TECHNIQUE_LABEL[f.techniques[0]].toLowerCase()}.` : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {fabricNote && <p className="mt-1.5 text-[11px] font-medium text-ink">{fabricNote}</p>}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-ink-soft">Técnica</p>
                {/* Tarjetas como las de tela: caben en el panel angosto y explican cada técnica. */}
                <div className="mt-1.5 grid gap-1.5" role="radiogroup" aria-label="Técnica">
                  {(selectedProduct?.techniques ?? []).map((t) => {
                    const active = technique === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={!techniqueAvailable(t)}
                        onClick={() => chooseTechnique(t)}
                        className={`rounded-brand border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          active ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{TECHNIQUE_LABEL[t]}</span>
                        <span className={`block text-[11px] leading-snug ${active ? "text-paper/75" : "text-ink-muted"}`}>
                          {TECHNIQUE_HINT[t]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setShowTechniques(true)}
                  className="mt-1.5 text-[11px] font-semibold text-ink underline"
                >
                  ¿Cuál me conviene? Ver diferencias
                </button>
                {showTechniques && (
                  <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-3"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Diferencias entre técnicas"
                    onClick={(e) => e.target === e.currentTarget && setShowTechniques(false)}
                  >
                    <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-brand bg-paper-soft p-4 shadow-xl sm:p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-3xl uppercase leading-none tracking-wide text-ink">Técnicas</p>
                          <p className="mt-1 text-xs text-ink-soft">
                            Las de {selectedProduct?.name.toLowerCase()}. Puedes mezclar técnicas en un mismo pedido.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTechniques(false)}
                          className="rounded-brand border border-black/15 bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:border-ink"
                        >
                          Cerrar
                        </button>
                      </div>
                      <TechniqueGuide techniques={selectedProduct?.techniques} comparison compact />
                    </div>
                  </div>
                )}
                {sublimationOnDark && (
                  <div className="mt-2 rounded-brand bg-yellow-50 p-3 text-xs text-yellow-900">
                    <p>
                      La sublimación no se ve en prendas oscuras ({color.toLowerCase()}). Para este color usa
                      serigrafía o DTF, o elige un color claro.
                    </p>
                    <button
                      type="button"
                      onClick={() => chooseTechnique("serigrafia")}
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

              {quoteQuantity && (
                <QuoteProgress
                  target={quoteQuantity}
                  inCart={items.reduce((sum, i) => sum + i.quantity, 0)}
                  pending={pendingTotal}
                  multiSize={availableSizes.length > 1}
                  source={quoteSource}
                />
              )}

              {!designMode && (
                <>
                  {availableSizes.length > 1 ? (
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-ink-soft">Cantidad por talla</p>
                        {selectedProduct && <SizeChartButton category={selectedProduct.category} productName={selectedProduct.name} />}
                      </div>
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
                    disabled={pendingTotal === 0}
                    className="w-full rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + {addLabel(pendingTotal)}
                  </button>
                  <p className="text-[11px] text-ink-muted">
                    Cada producto se guarda con el diseño, la técnica y la tela que ves en ese momento. Para pedir el mismo
                    diseño en otra técnica, cámbiala y vuelve a agregar.
                  </p>

                  {items.length > 0 && (
                    <ul className="divide-y divide-black/5 rounded-brand border border-black/10">
                      {items.map((item, i) => {
                        const product = getProductById(item.productId);
                        const designs = lineDesigns[i];
                        const thumbZone = (Object.keys(designs) as DesignZone[])[0] ?? "frente";
                        const thumb = designs[thumbZone];
                        const colorHex = product?.variants.find((v) => v.color === item.color)?.colorHex ?? "#FFFFFF";
                        const currentKey = product ? currentKeyFor(product.category) : "";
                        const canApply = Boolean(currentKey) && currentKey !== lineKeys[i];
                        const canShow = hasAnyDesign(item.designs) && currentKey !== designKey(item.designs);
                        return (
                          <li key={item.key} className="flex gap-2.5 px-3 py-2 text-xs">
                            {product && (
                              <div className="pointer-events-none w-12 shrink-0 overflow-hidden rounded border border-black/10">
                                <DesignMockup
                                  category={product.category}
                                  zone={thumbZone}
                                  color={colorHex}
                                  size={item.size}
                                  content={thumb?.content ?? null}
                                  transform={thumb?.transform ?? defaultTransform(product.category, thumbZone)}
                                  interactive={false}
                                  compact
                                />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-ink">
                                <span className="font-semibold">{item.quantity}×</span> {product?.name} — {item.color} —{" "}
                                {item.size}
                                {getFabric(item.productId, item.fabric) && ` · ${getFabric(item.productId, item.fabric)!.name}`}
                                {` · ${TECHNIQUE_LABEL[item.technique ?? technique]}`}
                              </p>
                              <p className={lineKeys[i] ? "text-ink-soft" : "font-medium text-yellow-700"}>
                                {lineKeys[i]
                                  ? `${labelDesigns ? designLabel(i) : "Con diseño"}${
                                      hasAnyDesign(item.designs) ? "" : " (el que estás diseñando)"
                                    }`
                                  : "Sin diseño"}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                {canApply && (
                                  <button
                                    type="button"
                                    onClick={() => applyCurrentDesign(item.key)}
                                    className="font-semibold text-ink underline"
                                  >
                                    Ponerle el diseño actual
                                  </button>
                                )}
                                {canShow && (
                                  <button
                                    type="button"
                                    onClick={() => showLineDesign(item)}
                                    className="font-semibold text-ink-soft hover:text-ink hover:underline"
                                  >
                                    Ver su diseño
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.key)}
                                  className="font-semibold text-ink-soft hover:text-ink hover:underline"
                                >
                                  Quitar
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>

            <div className="order-1 min-w-0 lg:order-2">
              {designMode && !personalStep && !currentContent && textIdeas.length > 0 && (
                <div className="mb-3 rounded-brand bg-paper-soft p-3">
                  <p className="text-xs font-semibold text-ink-soft">
                    Para empezar rápido, toca un texto y se pone en {ZONE_NAME[currentZone]}:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {textIdeas.map((idea) => (
                      <button
                        key={idea}
                        type="button"
                        onClick={() =>
                          handleContentChange(
                            {
                              kind: "texto",
                              texto: idea,
                              color: isDarkColor(selectedVariant?.colorHex ?? "#FFFFFF") ? "#FFFFFF" : "#111111",
                              fontFamily: "colegial",
                              outline: null,
                            },
                            true
                          )
                        }
                        className="rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedProduct && (
                <DesignCanvas
                  category={selectedProduct.category}
                  color={selectedVariant?.colorHex ?? "#111111"}
                  size={size}
                  zone={currentZone}
                  zonesWithContent={zonesWithContent}
                  zonePreviews={zonePreviews}
                  onZoneChange={changeZone}
                  content={
                    personalStep
                      ? editing && fieldContent(editing, editing.ejemplo)
                      : currentContent
                  }
                  onContentChange={personalStep ? handleFieldContent : handleContentChange}
                  transform={personalStep && editing ? fieldTransform(editing) : currentTransform}
                  onTransformChange={personalStep ? handleFieldTransform : handleTransformChange}
                  technique={technique}
                  layers={hasPersonal || personalStep ? groupLayers : undefined}
                  pieceKey={personalStep ? `p${activeField}` : String(pieceIndex)}
                  others={
                    personalStep
                      ? undefined
                      : currentPieces.flatMap((piece, i) =>
                          i === pieceIndex
                            ? []
                            : [{ ...piece, onPick: () => setActivePiece({ zone: currentZone, index: i }) }]
                        )
                  }
                  pieces={
                    personalStep
                      ? undefined
                      : currentPieces.map((piece, i) => ({
                          label: piece.content.kind === "imagen" ? "Imagen" : piece.content.texto.trim() || "Texto nuevo",
                          active: i === pieceIndex,
                          onSelect: () => setActivePiece({ zone: currentZone, index: i }),
                        }))
                  }
                  onAddText={personalStep ? undefined : addExtraText}
                  contentTitle={editing ? `${campoLabel(editing.campo)} de cada quien` : undefined}
                  textPlaceholder={personalStep ? "Lo que dice tu camisa de ejemplo" : undefined}
                  panelTop={
                    personalStep &&
                    zoneFields.length > 0 && (
                      <div className="mb-4 border-b border-black/10 pb-3">
                        <p className="text-xs font-semibold text-ink-soft">En {ZONE_NAME[currentZone]} cada quien pone:</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {zoneFields.map(({ field, index }) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setEditingField(index)}
                              aria-pressed={index === activeField}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                index === activeField ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                              }`}
                            >
                              {field.campo === "texto" ? field.etiqueta || campoLabel(field.campo) : campoLabel(field.campo)}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setEditingField("nuevo")}
                            disabled={lockedFields}
                            className="rounded-full border border-dashed border-black/25 px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-ink hover:text-ink disabled:opacity-40"
                          >
                            + Agregar otro
                          </button>
                        </div>
                        {editing?.campo === "texto" && (
                          <label className="mt-3 block">
                            <span className="text-xs font-semibold text-ink-soft">¿Qué le pides a cada quien aquí?</span>
                            <input
                              value={editing.etiqueta ?? ""}
                              maxLength={MAX_EXTRA}
                              onChange={(e) =>
                                setPersonal((p) => ({
                                  ...p,
                                  campos: p.campos.map((f, i) => (i === activeField ? { ...f, etiqueta: e.target.value } : f)),
                                }))
                              }
                              placeholder="Ej. Tu frase, tu carrera, tu signo"
                              className="input mt-1"
                            />
                          </label>
                        )}
                      </div>
                    )
                  }
                  emptyPanel={
                    personalStep && (
                      <div>
                        <p className="text-sm font-semibold text-ink">¿Qué pone cada quien en {ZONE_NAME[currentZone]}?</p>
                        {personalZones(selectedProduct.category).includes(currentZone) ? (
                          <>
                            <p className="mt-1 text-xs text-ink-soft">
                              Lo pones en tu camisa de ejemplo con lo tuyo, y cada quien lo cambia por lo suyo al anotarse. Lo
                              mueves y le cambias tamaño, letra y color igual que a un texto.
                            </p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              {CAMPOS.map((c) => (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() => addField(c.value)}
                                  disabled={lockedFields}
                                  className="rounded-brand border border-ink/20 px-3 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
                                >
                                  + {c.add}
                                </button>
                              ))}
                            </div>
                            {lockedFields && (
                              <p className="mt-2 text-[11px] text-ink-muted">
                                Ya hay gente anotada: no puedes agregar textos que ellos no escribieron. Sí puedes mover,
                                cambiar o quitar los que ya están.
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="mt-1 text-xs text-ink-soft">Aquí no va nada de cada persona: elige otro lado de la prenda.</p>
                        )}
                      </div>
                    )
                  }
                >
                  {personalStep && (
                    <div className="mt-4 rounded-brand border-2 border-ink bg-white p-4">
                      <p className="text-sm font-semibold text-ink">Lo que pone cada quien, en toda la camisa</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {personalZones(selectedProduct.category).map((z) => {
                          const here = personal.campos.filter((f) => f.zona === z);
                          return (
                            <button
                              key={z}
                              type="button"
                              onClick={() => changeZone(z)}
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                z === currentZone ? "bg-ink text-paper" : here.length ? "bg-paper-soft text-ink" : "bg-paper-soft text-ink-muted"
                              }`}
                            >
                              {zoneTitle(z)}: {here.length ? here.map((f) => fieldHint(f)).join(" + ") : "nada"}
                            </button>
                          );
                        })}
                      </div>
                      {!hasPersonal && (
                        <p className="mt-2 text-xs text-ink-soft">
                          Si no agregas nada, todas las camisas salen iguales (solo cambia la talla).
                        </p>
                      )}
                      {hasPersonal && (
                        <div className="mt-3 rounded-brand bg-paper-soft p-3">
                          <p className="text-xs font-semibold text-ink">¿Dejas que cada quien elija para sus textos?</p>
                          <p className="text-[11px] text-ink-soft">Lo de tu camisa queda como lo normal; cada quien lo puede cambiar al anotarse.</p>
                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
                            {(["color", "fuente"] as const).map((k) => (
                              <label key={k} className="flex items-center gap-2 text-sm text-ink">
                                <input
                                  type="checkbox"
                                  checked={personal.eligen[k]}
                                  onChange={(e) => setPersonal((p) => ({ ...p, eligen: { ...p.eligen, [k]: e.target.checked } }))}
                                  className="h-4 w-4 accent-ink"
                                />
                                {k === "color" ? "El color" : "La letra"}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {!designMode && hasPersonal && (
                    <div className="mt-4 rounded-brand border-2 border-ink bg-white p-4">
                      <p className="text-sm font-semibold text-ink">Cada camisa lleva lo suyo</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {describePersonal(personal)}. Lo escribió cada quien en la lista y el taller lo pone camisa por camisa.
                      </p>
                      {groupExamples.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          <span className="text-[11px] text-ink-muted">Ver la camisa de:</span>
                          {[{ nombre: "La de ejemplo" }, ...groupExamples].map((e, i) => (
                            <button
                              key={`${e.nombre}-${i}`}
                              type="button"
                              onClick={() => setShownExample(i - 1)}
                              className={`max-w-[8rem] truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                shownExample === i - 1 ? "bg-ink text-paper" : "bg-paper-soft text-ink-soft hover:text-ink"
                              }`}
                            >
                              {e.nombre}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </DesignCanvas>
              )}
            </div>
          </div>


          {designMode && (
            <div className="mt-6 rounded-brand bg-ink p-5 text-paper">
              <p className="font-display text-3xl uppercase leading-none tracking-wide">
                {step === "comun" ? "¿Listo el diseño de todos?" : "¿Listo?"}
              </p>
              <p className="mt-2 text-sm text-paper/75">
                Al guardarlo, cada persona de la lista ve su camisa así{hasPersonal ? ", con lo suyo," : ""} antes de
                anotarse. Lo puedes cambiar cuando quieras, y al hacer el pedido entra solo: no hay que volver a diseñar.
              </p>

              {/* La camisa de ejemplo es la del organizador: va con las demás al pedido. */}
              <div className="mt-4 rounded-brand bg-paper/10 p-3">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={mia.incluir}
                    onChange={(e) => setMia((m) => ({ ...m, incluir: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 accent-paper"
                  />
                  <span>
                    La camisa de ejemplo es la mía: mándala a hacer con las demás
                    {hasPersonal && (
                      <span className="block text-[11px] text-paper/60">
                        Con lo que escribiste en ella:{" "}
                        {fieldsEnOrden(personal)
                          .map((f) => `${zoneTitle(f.zona)}: ${f.ejemplo || "—"}`)
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                </label>
                {mia.incluir && (
                  <div className="mt-3 space-y-2">
                    <input
                      value={mia.nombre}
                      maxLength={60}
                      onChange={(e) => setMia((m) => ({ ...m, nombre: e.target.value }))}
                      placeholder="Tu nombre y apellido, para la lista"
                      className="input text-ink"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {availableSizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setMia((m) => ({ ...m, talla: s }))}
                          aria-pressed={mia.talla === s}
                          className={`min-w-[2.75rem] rounded-brand border px-2 py-2 text-sm font-semibold ${
                            mia.talla === s ? "border-paper bg-paper text-ink" : "border-paper/30 text-paper hover:border-paper"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {!mia.talla && <p className="text-[11px] text-paper/60">Elige tu talla.</p>}
                  </div>
                )}
              </div>

              {error && <p className="mt-3 rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {step === "comun" && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("personal");
                      document.getElementById("diseno")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded-brand border border-paper/40 px-5 py-3 text-sm font-semibold text-paper hover:border-paper"
                  >
                    Siguiente: lo que pone cada quien →
                  </button>
                )}
                <button
                  type="button"
                  onClick={saveListDesign}
                  disabled={
                    savingDesign ||
                    (zonesWithContent.length === 0 && !hasPersonal) ||
                    (mia.incluir && (!mia.talla || mia.nombre.trim().length < 2))
                  }
                  className={`rounded-brand bg-paper px-5 py-3 text-sm font-semibold text-ink hover:opacity-90 disabled:opacity-40 ${
                    step === "comun" ? "" : "sm:col-span-2"
                  }`}
                >
                  {savingDesign ? "Guardando…" : "Guardar el diseño de la lista"}
                </button>
              </div>
              {zonesWithContent.length === 0 && !hasPersonal && (
                <p className="mt-2 text-center text-[11px] text-paper/60">
                  Sube una imagen o escribe un texto en el diseñador de arriba.
                </p>
              )}
            </div>
          )}
        </section>

        {!designMode && (
          <>
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
                <Field label="Correo (opcional, recomendado)">
                  <input
                    type="email"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    className="input"
                    placeholder="correo@ejemplo.com"
                    inputMode="email"
                    autoComplete="email"
                  />
                  {emailInvalid ? (
                    <span className="mt-1 block text-xs font-medium text-red-600">
                      Revisa tu correo: parece incompleto. Si prefieres, déjalo vacío.
                    </span>
                  ) : (
                    <span className="mt-1 block text-xs text-ink-muted">
                      Para seguir de cerca tu orden: te avisamos por correo cuando verifiquemos tu pago, cuando entre a
                      producción y cuando esté lista.
                    </span>
                  )}
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
              {/* Piezas escritas en las tallas pero sin agregar: no entran al pedido si confirma así. */}
              {items.length > 0 && pendingTotal > 0 && !submitting && (
                <div className="flex flex-wrap items-center justify-center gap-2 rounded-brand border border-amber-300 bg-amber-50 px-4 py-3 text-center text-xs text-ink">
                  <span>
                    Tienes {pendingTotal} pieza{pendingTotal === 1 ? "" : "s"} en las tallas del paso 1 que todavía no están en tu pedido.
                  </span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="rounded-full bg-ink px-3 py-1.5 font-semibold text-paper hover:opacity-80"
                  >
                    + {addLabel(pendingTotal)}
                  </button>
                </div>
              )}
              {missing.length > 0 && !submitting && (
                <div className="text-center text-xs text-ink-soft">
                  <p>Para confirmar falta:</p>
                  {/* Cada cosa lleva a su sección; las piezas sin agregar se agregan desde aquí mismo. */}
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {missingSteps.map((m) =>
                      m.section === "diseno" && items.length === 0 && pendingTotal > 0 ? (
                        <button
                          key={m.label}
                          type="button"
                          onClick={addItem}
                          className="rounded-full bg-ink px-3 py-1.5 font-semibold text-paper hover:opacity-80"
                        >
                          + {addLabel(pendingTotal)}
                        </button>
                      ) : (
                        <a
                          key={m.label}
                          href={`#${m.section}`}
                          className="rounded-full border border-black/15 bg-white px-3 py-1.5 font-medium text-ink hover:border-ink"
                        >
                          {m.label}
                        </a>
                      )
                    )}
                  </div>
                </div>
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
          </>
        )}
      </div>

      {!designMode && (
        <div className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <PricingSummary
            pricing={pricing}
            pending={pendingTotal}
            unitPrice={unitPriceForBar}
            onQuickAdd={(n) => setQtyFor(size, (sizeQty[size] ?? 0) + n)}
            quickAddLabel={`en talla ${size}`}
          />
        </div>
      )}

      {showMobileBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-paper/95 px-4 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
          <div className="mx-auto mb-2 max-w-6xl">
            <DiscountProgress quantity={pricing.totalQuantity} compact />
          </div>
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
