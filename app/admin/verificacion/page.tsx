import { redirect } from "next/navigation";
import { adminWithoutCode } from "@/lib/admin-auth";
import { AdminTwoFactor } from "@/components/admin/AdminTwoFactor";

export const dynamic = "force-dynamic";

// Después de la contraseña: el código del celular. La primera vez, se configura la app.
export default async function AdminVerificacionPage() {
  const check = await adminWithoutCode();
  if (!check.problem) redirect("/admin/pedidos");
  const { data: factors } = await check.supabase.auth.mfa.listFactors();
  const configured = (factors?.totp ?? []).length > 0;
  return <AdminTwoFactor mode={configured ? "entrar" : "configurar"} nombre={check.admin?.nombre ?? ""} />;
}
