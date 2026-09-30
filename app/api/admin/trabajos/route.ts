import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { MAX_TITULO, TRABAJOS_BUCKET, isTrabajoPath, trabajoPath } from "@/lib/trabajos";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
const MAX_BYTES = 8 * 1024 * 1024;

async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const { data: admin } = await supabase.from("admins").select("id").eq("id", user.id).single();
  if (!admin) return NextResponse.json({ error: "Sin acceso." }, { status: 403 });
  return null;
}

// Sube una foto de un trabajo terminado a la galería del inicio.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const form = await req.formData().catch(() => null);
  const file = form?.get("foto");
  if (!(file instanceof File)) return NextResponse.json({ error: "Elige una foto." }, { status: 400 });
  const ext = TYPES[file.type as keyof typeof TYPES];
  if (!ext) return NextResponse.json({ error: "Sube una foto JPG, PNG o WebP." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "La foto pesa más de 8 MB." }, { status: 400 });
  const titulo = String(form?.get("titulo") ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TITULO);

  const service = createServiceClient();
  const { error } = await service.storage
    .from(TRABAJOS_BUCKET)
    .upload(trabajoPath(titulo, ext), file, { contentType: file.type, cacheControl: "31536000" });
  if (error) {
    const missing = /bucket not found/i.test(error.message);
    return NextResponse.json(
      { error: missing ? "Falta activar la galería: corre supabase/trabajos.sql en Supabase." : error.message },
      { status: missing ? 400 : 500 }
    );
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

// Quita una foto de la galería.
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path : "";
  if (!isTrabajoPath(path)) return NextResponse.json({ error: "Foto no válida." }, { status: 400 });

  const { error } = await createServiceClient().storage.from(TRABAJOS_BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
