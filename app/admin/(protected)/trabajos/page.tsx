import { listTrabajos } from "@/lib/trabajos";
import { requireAdminPage } from "@/lib/admin-auth";
import { TrabajosManager } from "@/components/admin/TrabajosManager";

export const dynamic = "force-dynamic";

export default async function AdminTrabajosPage() {
  await requireAdminPage();
  const { trabajos, missing } = await listTrabajos(100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Trabajos</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Fotos de pedidos terminados: camisas puestas, sobre la mesa, el taller trabajando. Las 8 más recientes salen en la página
        de inicio, en «Trabajos recientes». Las fotos reales venden más que cualquier foto de internet.
      </p>

      {missing && (
        <p className="mt-6 rounded-brand bg-red-50 p-4 text-sm text-red-700">
          La galería todavía no está activada: falta correr supabase/trabajos.sql en Supabase (SQL Editor).
        </p>
      )}

      <div className="mt-6">
        <TrabajosManager trabajos={trabajos} />
      </div>
    </div>
  );
}
