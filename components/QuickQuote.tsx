"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PRODUCTS, TECHNIQUE_LABEL, getProductById } from "@/lib/catalog";
import { calculateOrderTotal, getUnitPrice } from "@/lib/pricing";
import { formatCordobas, formatInDollars } from "@/lib/currency";
import { PRODUCTION_BUSINESS_DAYS, estimateReadyDate, formatReadyDate, managuaDayKey, toManagua } from "@/lib/delivery";
import { Technique } from "@/lib/types";
import { WhatsAppLinkButton } from "./WhatsAppButton";

// Al tocar "¿Para qué es?", el cotizador se arma con lo más común para ese tipo de
// pedido (cantidad, prenda, técnica y tela); el cliente lo cambia si quiere.
interface Occasion {
  label: string;
  phrase: string; // para el mensaje: "Hola, quiero hablar con un diseñador (es para una graduación)"
  quantity: number;
  productId: string;
  technique: Technique;
  fabricId?: string;
  typical: string; // lo que se ve debajo de las opciones
}

const OCCASIONS: Occasion[] = [
  {
    label: "Graduación",
    phrase: "para una graduación",
    quantity: 30,
    productId: "camisa-basica",
    technique: "serigrafia",
    fabricId: "algodon",
    typical: "Lo común: 30 a 60 camisas en serigrafía, con el nombre del colegio y el año.",
  },
  {
    label: "Empresa",
    phrase: "para mi empresa",
    quantity: 24,
    productId: "polo-bordada",
    technique: "bordado",
    typical: "Lo común: 12 a 100 polos con el logo bordado al pecho, con factura con RUC.",
  },
  {
    label: "Iglesia o grupo",
    phrase: "para una iglesia o grupo",
    quantity: 40,
    productId: "camisa-basica",
    technique: "serigrafia",
    fabricId: "algodon",
    typical: "Lo común: 20 a 100 camisas en serigrafía para retiros, campamentos y actividades.",
  },
  {
    label: "Equipo",
    phrase: "para un equipo",
    quantity: 20,
    productId: "camisa-basica",
    technique: "sublimado",
    fabricId: "poliester",
    typical: "Lo común: 12 a 30 camisas dry-fit sublimadas, con número y nombre de cada jugador.",
  },
  {
    label: "Marca de ropa",
    phrase: "para mi marca de ropa",
    quantity: 48,
    productId: "camisa-basica",
    technique: "serigrafia",
    fabricId: "algodon-peinado",
    typical: "Lo común: 24 a 200 camisas en algodón peinado, con tu propia etiqueta por dentro.",
  },
  {
    label: "Otro",
    phrase: "un pedido",
    quantity: 12,
    productId: "camisa-basica",
    technique: "dtf",
    fabricId: "algodon",
    typical: "Desde 12 piezas empieza el descuento. Cuéntanos tu idea y la armamos contigo.",
  },
];
const QUICK = [12, 24, 48, 96, 144];

// Cotizador de la página por mayor: el cliente ve el total estimado al instante
// y manda la cotización ya escrita por WhatsApp.
export function QuickQuote() {
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [productId, setProductId] = useState(OCCASIONS[0].productId);
  const product = getProductById(productId) ?? PRODUCTS[0];
  const [technique, setTechnique] = useState<Technique>(OCCASIONS[0].technique);
  const [fabricId, setFabricId] = useState<string | null>(OCCASIONS[0].fabricId ?? null);
  const [quantity, setQuantity] = useState(OCCASIONS[0].quantity);

  function chooseOccasion(o: Occasion) {
    setOccasion(o);
    setQuantity(o.quantity);
    setProductId(o.productId);
    setTechnique(o.technique);
    setFabricId(o.fabricId ?? null);
  }
  const [date, setDate] = useState("");

  const lineTechnique = product.techniques.includes(technique) ? technique : product.techniques[0];
  // Telas que sirven con la técnica elegida (el sublimado solo agarra en poliéster).
  // Si la tela elegida no sirve con la técnica nueva, se toma la primera que sí.
  const fabricOptions = product.fabrics?.filter((f) => f.techniques.includes(lineTechnique)) ?? [];
  const fabric = fabricOptions.find((f) => f.id === fabricId) ?? fabricOptions[0];
  // "serigrafía", "sublimado"... pero DTF va siempre en mayúsculas.
  const techniqueText = lineTechnique === "dtf" ? "DTF" : TECHNIQUE_LABEL[lineTechnique].toLowerCase();
  const pricing = calculateOrderTotal(
    [{ productId, color: product.variants[0].color, size: product.variants[0].sizes[0], quantity, technique: lineTechnique, fabric: fabric?.id }],
    lineTechnique
  );
  const perPiece = quantity > 0 ? pricing.total / quantity : 0;
  const basePiece = getUnitPrice(productId, lineTechnique, fabric?.id);

  // Fecha más temprana normal: 7 días hábiles desde hoy (si pagan hoy). Se calcula en
  // el navegador: la página se arma una sola vez al publicar y "hoy" cambia cada día.
  const [ready, setReady] = useState<Date | null>(null);
  const [today, setToday] = useState("");
  useEffect(() => {
    setReady(estimateReadyDate());
    setToday(managuaDayKey(toManagua(new Date())));
  }, []);
  const tooSoon = ready !== null && date !== "" && date < managuaDayKey(ready);

  const set = (n: number) => setQuantity(Math.max(1, Math.min(9999, Math.round(n) || 1)));

  const dateText = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("es-NI", { day: "numeric", month: "long" })
    : "";

  // "Armarlo yo mismo" abre el diseñador con todo lo elegido aquí ya puesto.
  const orderParams = new URLSearchParams({ producto: productId, tecnica: lineTechnique, cantidad: String(quantity) });
  if (fabric) orderParams.set("tela", fabric.id);
  orderParams.set("nota", [occasion.label !== "Otro" ? occasion.label : "", dateText ? `Lo necesito para el ${dateText}` : ""].filter(Boolean).join(" · "));

  const message = [
    `Hola, quiero hablar con un diseñador${occasion.phrase.startsWith("para") ? ` (es ${occasion.phrase})` : ""}:`,
    `• ${quantity} × ${product.name}${fabric ? ` (${fabric.name})` : ""} en ${techniqueText}`,
    dateText ? `• Lo necesito para el ${dateText}` : null,
    `• Estimado en el sitio: ${formatCordobas(pricing.total)} (${formatCordobas(Math.round(perPiece * 100) / 100)} por pieza${
      pricing.discountPct ? `, ${Math.round(pricing.discountPct * 100)}% de descuento` : ""
    })`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="rounded-brand border border-black/10 bg-white p-5 shadow-sm md:p-6">
      <p className="font-display text-3xl uppercase leading-none tracking-wide text-ink">Cotiza en 30 segundos</p>

      <fieldset className="mt-5">
        <legend className="text-xs font-semibold text-ink-soft">¿Para qué es?</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {OCCASIONS.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => chooseOccasion(o)}
              aria-pressed={occasion === o}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                occasion === o ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-muted">{occasion.typical}</p>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">Producto</span>
          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              const next = getProductById(e.target.value);
              if (next && !next.techniques.includes(technique)) setTechnique(next.techniques[0]);
            }}
            className="input mt-1"
          >
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="text-xs font-semibold text-ink-soft">Técnica</legend>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {product.techniques.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTechnique(t)}
                aria-pressed={lineTechnique === t}
                className={`rounded-brand border px-3 py-2 text-sm font-medium transition-colors ${
                  lineTechnique === t ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                }`}
              >
                {TECHNIQUE_LABEL[t]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {product.fabrics && fabric && (
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-ink-soft">Tela</span>
          <select value={fabric.id} onChange={(e) => setFabricId(e.target.value)} className="input mt-1">
            {fabricOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <span className="mt-1.5 block text-[11px] text-ink-muted">
            {fabric.description}
            {fabricOptions.length < product.fabrics.length &&
              ` Con ${techniqueText}, ${
                fabricOptions.length === 1 ? "solo esta tela" : `solo estas ${fabricOptions.length} telas`
              }.`}
          </span>
        </label>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cotiza-piezas" className="text-xs font-semibold text-ink-soft">
            Piezas
          </label>
          <div className="mt-1 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => set(quantity - 1)}
              aria-label="Una pieza menos"
              className="h-10 w-10 shrink-0 rounded-brand border border-black/15 text-lg text-ink hover:border-ink"
            >
              −
            </button>
            <input
              id="cotiza-piezas"
              type="number"
              min={1}
              inputMode="numeric"
              value={quantity}
              onChange={(e) => set(Number(e.target.value))}
              className="input h-10 text-center text-base font-bold"
            />
            <button
              type="button"
              onClick={() => set(quantity + 1)}
              aria-label="Una pieza más"
              className="h-10 w-10 shrink-0 rounded-brand border border-black/15 text-lg text-ink hover:border-ink"
            >
              +
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {QUICK.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set(n)}
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  quantity === n ? "bg-ink text-paper" : "bg-paper-soft text-ink-soft hover:text-ink"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">¿Para cuándo? (opcional)</span>
          <input type="date" min={today || undefined} value={date} onChange={(e) => setDate(e.target.value)} className="input mt-1 h-10" />
          <span className={`mt-1.5 block text-[11px] ${tooSoon ? "font-semibold text-red-700" : "text-ink-muted"}`}>
            {tooSoon
              ? `Es antes de nuestros ${PRODUCTION_BUSINESS_DAYS} días hábiles: escríbenos y vemos si se puede.`
              : ready
                ? `Si pagas hoy, estaría listo el ${formatReadyDate(ready)}.`
                : " "}
          </span>
        </label>
      </div>

      <div className="mt-5 rounded-brand bg-ink p-4 text-paper">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-paper/60">Total estimado</p>
            <p className="font-display text-4xl leading-none tracking-wide">{formatCordobas(pricing.total)}</p>
            <p className="mt-0.5 text-xs text-paper/60">{formatInDollars(pricing.total)}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{formatCordobas(Math.round(perPiece * 100) / 100)} por pieza</p>
            <p className="text-xs text-paper/60">
              {pricing.discountPct
                ? `${Math.round(pricing.discountPct * 100)}% de descuento (antes ${formatCordobas(basePiece)})`
                : "Desde 12 piezas empieza el descuento"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link
          href={`/pedido?${orderParams.toString()}`}
          className="rounded-brand bg-ink px-5 py-3 text-center text-sm font-semibold text-paper hover:opacity-80"
        >
          Armarlo yo mismo →
        </Link>
        <WhatsAppLinkButton
          message={message}
          className="rounded-brand bg-[#25D366] px-5 py-3 text-center text-sm font-semibold text-white hover:opacity-90"
        >
          Contactar con diseñador
        </WhatsAppLinkButton>
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-muted">
        «Armarlo yo mismo» abre el diseñador con todo esto ya puesto, las {quantity} piezas incluidas: solo subes tu diseño
        y ajustas las tallas.
        Precio estimado, sin delivery.
      </p>
    </div>
  );
}
