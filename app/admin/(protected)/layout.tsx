import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("nombre")
    .eq("id", user!.id)
    .single();

  if (!admin) {
    redirect("/admin/login?error=sin_acceso");
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-black/5 bg-ink text-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/admin/pedidos" className="font-semibold">
            impreza · admin
          </Link>
          <span className="text-sm text-paper/70">Hola, {admin.nombre}</span>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">{children}</div>
    </div>
  );
}
