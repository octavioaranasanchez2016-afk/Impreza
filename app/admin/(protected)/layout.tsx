import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/admin/SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: admin } = await supabase.from("admins").select("nombre").eq("id", user!.id).single();

  if (!admin) {
    redirect("/admin/login?error=sin_acceso");
  }

  return (
    <div className="min-h-screen bg-paper-soft">
      <header className="sticky top-0 z-30 bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-5">
            <Link href="/admin/pedidos" className="font-bold tracking-tight">
              impreza <span className="font-normal text-paper/60">admin</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin/pedidos" className="text-paper/80 hover:text-paper">
                Pedidos
              </Link>
              <a href="/" target="_blank" rel="noopener noreferrer" className="text-paper/80 hover:text-paper">
                Ver sitio ↗
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-paper/70 sm:inline">Hola, {admin.nombre}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
