export function FincaMissing() {
  return (
    <p className="mb-6 rounded-brand bg-red-50 p-4 text-sm text-red-700">
      El sistema de la finca todavía no está activado: falta correr <b>supabase/finca.sql</b> en Supabase (SQL Editor).
    </p>
  );
}
