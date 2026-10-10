import { requireAdminPage } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AI_DAY_PREFIX, AI_PERSON_PREFIX, AI_PHOTOS_PER_DAY, AI_PHOTOS_PER_PERSON } from "@/lib/vista-ia";

export const dynamic = "force-dynamic";

// Cuántas fotos "Verla puesta" se crean. Sale de los mismos conteos que ponen el tope
// (tabla cuenta_limites): solo cuentan las fotos que sí salieron.

interface LimitRow {
  clave: string;
  enviados: number;
  ventana_at: string;
  ultimo_at: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
// Lo que puede costar cada foto en Google (el monto exacto está en AI Studio → Billing).
const COST_LOW = 0.04;
const COST_HIGH = 0.07;

const managuaDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Managua" }).format(d);
const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-NI", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleString("es-NI", { timeZone: "America/Managua", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// La conexión a medias: suficiente para distinguir personas sin guardar la dirección completa a la vista.
function maskIp(ip: string): string {
  if (ip.includes(".")) return ip.split(".").slice(0, 2).join(".") + ".x.x";
  if (ip.includes(":")) return ip.split(":").slice(0, 2).join(":") + ":…";
  return ip;
}

const usd = (n: number) => `US$${n.toFixed(2)}`;

export default async function AdminFotosIaPage() {
  await requireAdminPage();
  const service = createServiceClient();
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const [daysRes, peopleRes] = await Promise.all([
    service.from("cuenta_limites").select("*").like("clave", `${AI_DAY_PREFIX}%`).order("clave", { ascending: false }).limit(90),
    service
      .from("cuenta_limites")
      .select("*")
      .like("clave", `${AI_PERSON_PREFIX}%`)
      .gte("ultimo_at", since)
      .order("ultimo_at", { ascending: false })
      .limit(100),
  ]);

  const days = ((daysRes.data ?? []) as LimitRow[])
    .map((r) => ({ day: r.clave.slice(AI_DAY_PREFIX.length), count: r.enviados }))
    .filter((d) => d.count > 0);
  const people = ((peopleRes.data ?? []) as LimitRow[])
    .map((r) => ({ ip: maskIp(r.clave.slice(AI_PERSON_PREFIX.length)), count: r.enviados, last: r.ultimo_at }))
    .filter((p) => p.count > 0);

  const today = managuaDay(new Date());
  const weekAgo = managuaDay(new Date(Date.now() - 6 * DAY_MS));
  const month = today.slice(0, 7);
  const countToday = days.find((d) => d.day === today)?.count ?? 0;
  const countWeek = days.filter((d) => d.day >= weekAgo).reduce((sum, d) => sum + d.count, 0);
  const countMonth = days.filter((d) => d.day.startsWith(month)).reduce((sum, d) => sum + d.count, 0);
  const recent = days.slice(0, 14);
  const maxDay = Math.max(1, ...recent.map((d) => d.count));

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Fotos con IA</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Cuántas fotos «Verla puesta» crean tus clientes. Solo cuentan las que sí salieron. Cada persona puede crear{" "}
        {AI_PHOTOS_PER_PERSON} al día y todo el sitio {AI_PHOTOS_PER_DAY} al día.
      </p>

      {daysRes.error && (
        <p className="mt-6 rounded-brand bg-red-50 p-4 text-sm text-red-700">No se pudieron leer los conteos. Intenta de nuevo.</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Hoy" value={countToday} hint={`de ${AI_PHOTOS_PER_DAY} posibles`} />
        <Stat label="Últimos 7 días" value={countWeek} />
        <Stat label="Este mes" value={countMonth} hint={`≈ ${usd(countMonth * COST_LOW)} a ${usd(countMonth * COST_HIGH)}`} />
        <Stat label="Personas (24 h)" value={people.length} />
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        El costo es aproximado. El monto exacto lo ves en{" "}
        <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
          Google AI Studio
        </a>{" "}
        → Billing.
      </p>

      <section className="mt-8 rounded-brand border border-black/10 bg-white p-5">
        <h2 className="text-sm font-bold text-ink">Fotos por día</h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Todavía nadie ha creado fotos.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {recent.map((d) => (
              <li key={d.day} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-ink-soft">{dayLabel(d.day)}</span>
                <span className="h-3 rounded-full bg-ink" style={{ width: `${Math.max(2, (d.count / maxDay) * 100)}%` }} />
                <span className="shrink-0 font-semibold text-ink">{d.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-brand border border-black/10 bg-white p-5">
        <h2 className="text-sm font-bold text-ink">Quién las creó (últimas 24 horas)</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Cada fila es una conexión distinta (la dirección va a medias). Si alguien llega a {AI_PHOTOS_PER_PERSON}, ya no puede
          crear más hasta el día siguiente.
        </p>
        {people.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Nadie en las últimas 24 horas.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-ink-muted">
                <th className="py-1 font-semibold">Conexión</th>
                <th className="py-1 font-semibold">Fotos</th>
                <th className="py-1 font-semibold">Última</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-1.5 font-mono text-xs text-ink-soft">{p.ip}</td>
                  <td className={`py-1.5 font-semibold ${p.count >= AI_PHOTOS_PER_PERSON ? "text-red-600" : "text-ink"}`}>
                    {p.count} / {AI_PHOTOS_PER_PERSON}
                  </td>
                  <td className="py-1.5 text-ink-soft">{timeLabel(p.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-brand border border-black/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
