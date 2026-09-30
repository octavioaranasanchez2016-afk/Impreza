import { TECHNIQUE_COMPARISON, TECHNIQUE_INFO, TECHNIQUE_LABEL, TECHNIQUE_ORDER } from "@/lib/catalog";
import { Technique } from "@/lib/types";

// Qué es cada técnica y en qué se diferencian. techniques: solo esas (p. ej. las de un
// producto); comparison: agrega la tabla para comparar fila por fila.
export function TechniqueGuide({
  techniques = TECHNIQUE_ORDER,
  comparison = false,
  compact = false,
}: {
  techniques?: Technique[];
  comparison?: boolean;
  compact?: boolean;
}) {
  const list = TECHNIQUE_ORDER.filter((t) => techniques.includes(t));
  const cols = list.length >= 4 ? "lg:grid-cols-4" : list.length === 3 ? "lg:grid-cols-3" : "";

  return (
    <div>
      <div className={`grid gap-3 sm:grid-cols-2 ${compact ? "" : cols}`}>
        {list.map((t) => (
          <div key={t} className="rounded-brand border border-black/10 bg-white p-5">
            <p className={`font-display uppercase leading-none tracking-wide text-ink ${compact ? "text-2xl" : "text-3xl"}`}>
              {TECHNIQUE_LABEL[t]}
            </p>
            <p className="mt-2 text-sm text-ink-soft">{TECHNIQUE_INFO[t].what}</p>
            <ul className="mt-3 space-y-1 text-sm text-ink">
              {TECHNIQUE_INFO[t].points.map((p) => (
                <li key={p}>✦ {p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {comparison && list.length > 1 && (
        <div className="mt-4 overflow-x-auto rounded-brand border border-black/10 bg-white">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="p-3" />
                {list.map((t) => (
                  <th key={t} className="p-3 font-semibold text-ink">
                    {TECHNIQUE_LABEL[t]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TECHNIQUE_COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-black/5 last:border-0">
                  <th className="p-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">{row.label}</th>
                  {list.map((t) => (
                    <td key={t} className="p-3 text-ink-soft">
                      {row.values[t]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
