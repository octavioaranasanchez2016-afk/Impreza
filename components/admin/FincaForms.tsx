"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIAS, INVENTARIO_CATEGORIAS, INVENTARIO_LABEL, TIPO_LABEL, type TipoMovimiento } from "@/lib/finca-const";

interface Opcion {
  id: string;
  nombre: string;
}

const BTN = "rounded-brand bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-80 disabled:opacity-40";

function useSend(onDone?: () => void) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(body: Record<string, unknown>): Promise<boolean> {
    setError(null);
    setBusy(true);
    const res = await fetch("/api/admin/finca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) {
      const data = (await res?.json().catch(() => ({}))) ?? {};
      setError(data.error || "No se pudo guardar. Revisa la conexión.");
      return false;
    }
    onDone?.();
    router.refresh();
    return true;
  }
  return { send, error, busy };
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function Card({ title, children, error }: { title: string; children: React.ReactNode; error: string | null }) {
  return (
    <div className="rounded-brand border border-black/10 bg-white p-5">
      <p className="font-semibold text-ink">{title}</p>
      {children}
      {error && <p className="mt-3 rounded-brand bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Managua" }).format(new Date());

function CultivoSelect({ cultivos, value, onChange }: { cultivos: Opcion[]; value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input mt-1">
      <option value="">General (ningún cultivo)</option>
      {cultivos.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nombre}
        </option>
      ))}
    </select>
  );
}

export function MovimientoForm({ cultivos }: { cultivos: Opcion[] }) {
  const [tipo, setTipo] = useState<TipoMovimiento>("ingreso");
  const [fecha, setFecha] = useState(today());
  const [categoria, setCategoria] = useState<string>(CATEGORIAS.ingreso[0]);
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cultivo, setCultivo] = useState("");
  const { send, error, busy } = useSend(() => {
    setMonto("");
    setDescripcion("");
  });

  function cambiarTipo(t: TipoMovimiento) {
    setTipo(t);
    setCategoria(CATEGORIAS[t][0]);
  }

  return (
    <Card title="Anotar un movimiento" error={error}>
      <div className="mt-3 flex gap-2">
        {(Object.keys(CATEGORIAS) as TipoMovimiento[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => cambiarTipo(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              tipo === t ? "bg-ink text-paper" : "border border-black/15 text-ink-soft hover:bg-paper-soft"
            }`}
          >
            {TIPO_LABEL[t]}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Fecha">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input mt-1" />
        </Field>
        <Field label="Categoría">
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input mt-1">
            {CATEGORIAS[tipo].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Monto (C$)">
          <input type="number" inputMode="decimal" min="0" step="any" value={monto} onChange={(e) => setMonto(e.target.value)} className="input mt-1" />
        </Field>
        <Field label="Cultivo">
          <CultivoSelect cultivos={cultivos} value={cultivo} onChange={setCultivo} />
        </Field>
        <Field label="Detalle (opcional)" className="sm:col-span-2 lg:col-span-3">
          <input
            value={descripcion}
            maxLength={200}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={tipo === "ingreso" ? "Ej. 20 quintales de frijol a Don Pedro" : "Ej. 3 sacos de urea"}
            className="input mt-1"
          />
        </Field>
        <div className="flex items-end">
          <button
            type="button"
            disabled={busy || !monto}
            onClick={() => send({ accion: "movimiento", tipo, fecha, categoria, monto, descripcion, cultivo_id: cultivo })}
            className={`${BTN} w-full`}
          >
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </Card>
  );
}

export function CultivoForm() {
  const [nombre, setNombre] = useState("");
  const [area, setArea] = useState("");
  const [fecha, setFecha] = useState("");
  const [notas, setNotas] = useState("");
  const { send, error, busy } = useSend(() => {
    setNombre("");
    setArea("");
    setFecha("");
    setNotas("");
  });
  return (
    <Card title="Agregar un cultivo" error={error}>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Cultivo">
          <input value={nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Frijol, lote norte" className="input mt-1" />
        </Field>
        <Field label="Manzanas">
          <input type="number" inputMode="decimal" min="0" step="any" value={area} onChange={(e) => setArea(e.target.value)} className="input mt-1" />
        </Field>
        <Field label="Fecha de siembra">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input mt-1" />
        </Field>
        <Field label="Notas (opcional)">
          <input value={notas} maxLength={500} onChange={(e) => setNotas(e.target.value)} className="input mt-1" />
        </Field>
      </div>
      <button
        type="button"
        disabled={busy || !nombre.trim()}
        onClick={() => send({ accion: "cultivo", nombre, area_mz: area, fecha_siembra: fecha, notas })}
        className={`${BTN} mt-3`}
      >
        {busy ? "Guardando…" : "Agregar cultivo"}
      </button>
    </Card>
  );
}

export function TrabajadorForm() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [jornal, setJornal] = useState("");
  const { send, error, busy } = useSend(() => {
    setNombre("");
    setTelefono("");
    setJornal("");
  });
  return (
    <Card title="Agregar un trabajador" error={error}>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <Field label="Nombre">
          <input value={nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} className="input mt-1" />
        </Field>
        <Field label="Teléfono (opcional)">
          <input value={telefono} maxLength={30} onChange={(e) => setTelefono(e.target.value)} className="input mt-1" />
        </Field>
        <Field label="Jornal por día (C$)">
          <input type="number" inputMode="decimal" min="0" step="any" value={jornal} onChange={(e) => setJornal(e.target.value)} className="input mt-1" />
        </Field>
        <button
          type="button"
          disabled={busy || !nombre.trim()}
          onClick={() => send({ accion: "trabajador", nombre, telefono, pago_dia: jornal })}
          className={BTN}
        >
          {busy ? "Guardando…" : "Agregar"}
        </button>
      </div>
    </Card>
  );
}

export function PagoForm({ trabajadores, cultivos }: { trabajadores: (Opcion & { pago_dia: number })[]; cultivos: Opcion[] }) {
  const [trabajador, setTrabajador] = useState("");
  const [fecha, setFecha] = useState(today());
  const [dias, setDias] = useState("");
  const [monto, setMonto] = useState("");
  const [cultivo, setCultivo] = useState("");
  const [nota, setNota] = useState("");
  const { send, error, busy } = useSend(() => {
    setDias("");
    setMonto("");
    setNota("");
  });

  // Al elegir trabajador y días, el monto se calcula solo con su jornal (se puede cambiar a mano).
  function recalc(t: string, d: string) {
    const jornal = trabajadores.find((x) => x.id === t)?.pago_dia ?? 0;
    if (jornal > 0 && Number(d) > 0) setMonto(String(Math.round(jornal * Number(d) * 100) / 100));
  }

  return (
    <Card title="Registrar un pago" error={error}>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Trabajador">
          <select
            value={trabajador}
            onChange={(e) => {
              setTrabajador(e.target.value);
              recalc(e.target.value, dias);
            }}
            className="input mt-1"
          >
            <option value="">Elige…</option>
            {trabajadores.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input mt-1" />
        </Field>
        <Field label="Días trabajados">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={dias}
            onChange={(e) => {
              setDias(e.target.value);
              recalc(trabajador, e.target.value);
            }}
            className="input mt-1"
          />
        </Field>
        <Field label="Monto pagado (C$)">
          <input type="number" inputMode="decimal" min="0" step="any" value={monto} onChange={(e) => setMonto(e.target.value)} className="input mt-1" />
        </Field>
        <Field label="Cultivo donde trabajó">
          <CultivoSelect cultivos={cultivos} value={cultivo} onChange={setCultivo} />
        </Field>
        <Field label="Nota (opcional)" className="sm:col-span-2">
          <input value={nota} maxLength={200} onChange={(e) => setNota(e.target.value)} placeholder="Ej. limpia de maleza" className="input mt-1" />
        </Field>
        <div className="flex items-end">
          <button
            type="button"
            disabled={busy || !trabajador || !monto}
            onClick={() => send({ accion: "pago", trabajador_id: trabajador, fecha, dias, monto, cultivo_id: cultivo, nota })}
            className={`${BTN} w-full`}
          >
            {busy ? "Guardando…" : "Registrar pago"}
          </button>
        </div>
      </div>
    </Card>
  );
}

export function ItemForm() {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<string>("insumo");
  const [unidad, setUnidad] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [minimo, setMinimo] = useState("");
  const [costo, setCosto] = useState("");
  const { send, error, busy } = useSend(() => {
    setNombre("");
    setUnidad("");
    setCantidad("");
    setMinimo("");
    setCosto("");
  });
  return (
    <Card title="Agregar al inventario" error={error}>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Nombre">
          <input value={nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Urea, Semilla de frijol" className="input mt-1" />
        </Field>
        <Field label="Tipo">
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input mt-1">
            {INVENTARIO_CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {INVENTARIO_LABEL[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Se mide en">
          <input value={unidad} maxLength={20} onChange={(e) => setUnidad(e.target.value)} placeholder="quintal, libra, litro, saco…" className="input mt-1" />
        </Field>
        <Field label="Cantidad que hay">
          <input type="number" inputMode="decimal" min="0" step="any" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="input mt-1" />
        </Field>
        <Field label="Avisar si baja de">
          <input type="number" inputMode="decimal" min="0" step="any" value={minimo} onChange={(e) => setMinimo(e.target.value)} className="input mt-1" />
        </Field>
        <Field label="Costo por unidad (C$)">
          <input type="number" inputMode="decimal" min="0" step="any" value={costo} onChange={(e) => setCosto(e.target.value)} className="input mt-1" />
        </Field>
      </div>
      <button
        type="button"
        disabled={busy || !nombre.trim()}
        onClick={() => send({ accion: "item", nombre, categoria, unidad, cantidad, minimo, costo_unit: costo })}
        className={`${BTN} mt-3`}
      >
        {busy ? "Guardando…" : "Agregar"}
      </button>
    </Card>
  );
}

// Entrada / salida / merma de un artículo del inventario, en una sola fila.
export function ItemMovForm({ item }: { item: { id: string; unidad: string } }) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<"entrada" | "salida" | "merma">("salida");
  const [cantidad, setCantidad] = useState("");
  const [costo, setCosto] = useState("");
  const { send, error, busy } = useSend(() => {
    setCantidad("");
    setCosto("");
    setAbierto(false);
  });

  if (!abierto)
    return (
      <button type="button" onClick={() => setAbierto(true)} className="text-xs font-semibold text-ink underline">
        Movimiento
      </button>
    );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className="input !w-auto !py-1 text-xs">
        <option value="salida">Usé / saqué</option>
        <option value="entrada">Entró / compré</option>
        <option value="merma">Se dañó / perdió</option>
      </select>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
        placeholder={item.unidad}
        className="input !w-20 !py-1 text-xs"
      />
      {tipo === "entrada" && (
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
          placeholder="Costo total C$"
          className="input !w-28 !py-1 text-xs"
        />
      )}
      <button
        type="button"
        disabled={busy || !cantidad}
        onClick={() => send({ accion: "item_mov", item_id: item.id, tipo, cantidad, costo_total: costo })}
        className="rounded bg-ink px-2.5 py-1 text-xs font-semibold text-paper disabled:opacity-40"
      >
        OK
      </button>
      <button type="button" onClick={() => setAbierto(false)} className="text-xs text-ink-soft">
        Cancelar
      </button>
      {error && <span className="basis-full text-xs text-red-700">{error}</span>}
    </div>
  );
}

// Activar/desactivar un trabajador o marcar un cultivo como cosechado.
export function ToggleButton({ body, label }: { body: Record<string, unknown>; label: string }) {
  const { send, busy } = useSend();
  return (
    <button type="button" disabled={busy} onClick={() => send(body)} className="text-xs font-semibold text-ink underline disabled:opacity-40">
      {label}
    </button>
  );
}

export function BorrarButton({ tabla, id, aviso }: { tabla: "movimientos" | "pagos" | "cultivos" | "inventario"; id: string; aviso?: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function borrar() {
    const res = await fetch("/api/admin/finca", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabla, id }),
    }).catch(() => null);
    setConfirm(false);
    if (!res || !res.ok) {
      setError("No se pudo borrar.");
      return;
    }
    router.refresh();
  }

  if (confirm)
    return (
      <span className="inline-flex items-center gap-1">
        {aviso && <span className="text-[11px] text-ink-soft">{aviso}</span>}
        <button type="button" onClick={borrar} className="rounded bg-red-600 px-2 py-1 text-[11px] font-semibold text-white">
          Sí, borrar
        </button>
        <button type="button" onClick={() => setConfirm(false)} className="rounded border border-black/15 px-2 py-1 text-[11px]">
          No
        </button>
      </span>
    );
  return (
    <button type="button" onClick={() => setConfirm(true)} title={error ?? undefined} className="text-[11px] font-semibold text-red-700 hover:underline">
      {error ?? "Borrar"}
    </button>
  );
}
