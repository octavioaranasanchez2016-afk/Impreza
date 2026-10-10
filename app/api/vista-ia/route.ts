import { NextRequest, NextResponse } from "next/server";
import { HOUR, clientIp, giveBack, takeLimit } from "@/lib/rate-limit";
import { serverError } from "@/lib/bot";
import { AI_SCENES, AiScene, aiPrompt } from "@/lib/vista-ia";
import { DesignZone, ProductCategory } from "@/lib/types";

// "Verla puesta": la IA convierte la foto plana del diseñador en una foto de alguien
// usando la prenda. Cada foto cuesta (unos US$0.04), así que hay tope por persona y
// por día. Necesita GEMINI_API_KEY en Vercel; sin ella, el botón no aparece.

export const maxDuration = 60;

const PER_PERSON_PER_DAY = 3;
const PER_DAY = 80; // para todo el sitio
const DAY = 24 * HOUR;
// Modelos de imagen, en orden: el que se elija en Vercel y, si no responde, los de Google
// que funcionan con las claves nuevas ("AQ."). Se usa el primero que devuelva la foto.
const MODELS = [
  ...new Set([process.env.GEMINI_IMAGE_MODEL, "gemini-3.1-flash-lite-image", "gemini-3.1-flash-image", "gemini-2.5-flash-image"]),
].filter((m): m is string => Boolean(m));
const CATEGORIES: ProductCategory[] = ["camisa", "hoodie", "tote", "polo", "gorra"];
const ZONES: DesignZone[] = ["frente", "espalda", "manga-izq", "manga-der"];
const IMAGE_DATA = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/;
const MAX_IMAGE_CHARS = 3_000_000; // ≈ 2.2 MB

// Solo en la computadora de desarrollo, con VISTA_IA_PRUEBA=1: sin gastar en la IA ni
// tocar la base, devuelve la misma foto plana que llegó (para probar el botón y la ventana).
const TEST_MODE = process.env.NODE_ENV === "development" && process.env.VISTA_IA_PRUEBA === "1";

export function GET() {
  return NextResponse.json({ disponible: TEST_MODE || Boolean(process.env.GEMINI_API_KEY) });
}

// La IA puede devolver la imagen con distintas formas de JSON: se busca la última parte
// que sea una imagen en base64, esté donde esté.
function findImage(value: unknown): { mime: string; data: string } | null {
  let found: { mime: string; data: string } | null = null;
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(visit);
    const o = node as Record<string, unknown>;
    const mime = o.mime_type ?? o.mimeType;
    if (typeof o.data === "string" && o.data.length > 1000 && (o.type === "image" || (typeof mime === "string" && mime.startsWith("image/")))) {
      found = { mime: typeof mime === "string" ? mime : "image/png", data: o.data };
    }
    Object.values(o).forEach(visit);
  };
  visit(value);
  return found;
}

// El motivo que da Google, corto y sin nada que parezca una clave, para saber qué pasó.
function googleMessage(json: unknown): string {
  const error = (json as { error?: { message?: unknown; status?: unknown } } | null)?.error;
  const text = [error?.status, error?.message].filter((v) => typeof v === "string").join(": ") || JSON.stringify(json ?? "");
  return text.replace(/(AIza|AQ.)[0-9A-Za-z_.-]+/g, "[clave]").slice(0, 200) || "sin detalle";
}

export async function POST(req: NextRequest) {
  // Sin espacios, saltos de línea ni comillas que se cuelan al copiar y pegar la clave.
  const key = process.env.GEMINI_API_KEY?.trim().replace(/^["']+|["']+$/g, "").trim();
  if (!key && !TEST_MODE) return NextResponse.json({ error: "La vista con IA todavía no está activada." }, { status: 503 });

  const body = await req.json().catch(() => null);
  const category = CATEGORIES.find((c) => c === body?.prenda);
  const zone = ZONES.find((z) => z === body?.zona);
  const scene = AI_SCENES.find((s) => s.value === body?.escena)?.value as AiScene | undefined;
  const colorName = typeof body?.color === "string" ? body.color.slice(0, 40).replace(/[^\p{L}\p{N} ]/gu, "") : "";
  const image = typeof body?.imagen === "string" && body.imagen.length <= MAX_IMAGE_CHARS ? IMAGE_DATA.exec(body.imagen) : null;
  if (!category || !zone || !scene || !image) {
    return NextResponse.json({ error: "No pudimos leer tu diseño. Recarga la página e intenta de nuevo." }, { status: 400 });
  }
  if (TEST_MODE && !key) {
    await new Promise((r) => setTimeout(r, 1500));
    return NextResponse.json({ imagen: body.imagen, prompt: aiPrompt(category, zone, colorName, scene) });
  }
  if (!key) return NextResponse.json({ error: "La vista con IA todavía no está activada." }, { status: 503 });

  // Topes: por persona al día y para todo el sitio al día, para que el gasto no se dispare.
  const personKey = `vista-ia-ip:${clientIp(req.headers)}`;
  const dayKey = `vista-ia-dia:${new Date().toISOString().slice(0, 10)}`;
  try {
    const mine = await takeLimit({ clave: personKey, max: PER_PERSON_PER_DAY, windowMs: DAY, gapMs: 10 * 1000 });
    if (mine === "espera") return NextResponse.json({ error: "Espera unos segundos antes de pedir otra foto." }, { status: 429 });
    if (mine === "muchos") {
      return NextResponse.json(
        { error: `Ya pediste ${PER_PERSON_PER_DAY} fotos hoy. Vuelve mañana para ver más.` },
        { status: 429 }
      );
    }
    const today = await takeLimit({ clave: dayKey, max: PER_DAY, windowMs: DAY });
    if (today !== "ok") {
      return NextResponse.json({ error: "Hoy ya se crearon muchas fotos. Intenta de nuevo mañana." }, { status: 429 });
    }
  } catch (err) {
    return serverError(err, "La vista con IA no está disponible ahora mismo.");
  }

  const prompt = aiPrompt(category, zone, colorName, scene);
  const mime = `image/${image[1]}`;
  const base = "https://generativelanguage.googleapis.com/v1beta";
  const contents = [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: image[2] } }] }];
  // Google tiene dos formas de pedir imágenes. Las claves nuevas ("AQ.") solo sirven con
  // la nueva (interactions); las viejas ("AIza") también con la clásica (generateContent).
  // Se prueba en orden y se usa la primera respuesta con foto. Lo que falla no se cobra.
  const interactions = MODELS.map((model) => ({
    name: `interactions ${model}`,
    url: `${base}/interactions`,
    body: {
      model,
      input: [
        { type: "text", text: prompt },
        { type: "image", mime_type: mime, data: image[2] },
      ],
    },
  }));
  const classic = MODELS.map((model) => ({
    name: `generateContent ${model}`,
    url: `${base}/models/${model}:generateContent`,
    body: { contents, generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "4:5" } } },
  }));
  const attempts: { name: string; url: string; body: unknown }[] = key.startsWith("AQ.")
    ? interactions
    : [...classic, ...interactions];

  const started = Date.now();
  let lastStatus = 0;
  const details: string[] = [];
  for (const attempt of attempts) {
    // Si ya pasó mucho rato, no se alcanza otro intento antes del límite de la función.
    if (Date.now() - started > 25 * 1000) break;
    try {
      const res = await fetch(attempt.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(attempt.body),
        signal: AbortSignal.timeout(50 * 1000 - (Date.now() - started)),
      });
      const json = await res.json().catch(() => null);
      const result = res.ok ? findImage(json) : null;
      if (result) return NextResponse.json({ imagen: `data:${result.mime};base64,${result.data}` });
      lastStatus = res.status;
      details.push(`${res.status} ${googleMessage(json)}`);
      console.error(`Vista con IA sin imagen (${attempt.name}):`, res.status, JSON.stringify(json).slice(0, 600));
    } catch (err) {
      lastStatus = -1;
      details.push(err instanceof Error ? err.name : "sin respuesta");
      console.error(`Vista con IA falló (${attempt.name}):`, err);
    }
  }
  // Sin foto no hubo gasto: se le devuelve el intento a la persona y al día.
  await Promise.all([giveBack(personKey), giveBack(dayKey)]);
  // El código entre paréntesis no dice nada privado y ayuda a saber qué pasó.
  return NextResponse.json(
    {
      error: `No pudimos crear la foto ahora. Intenta de nuevo en un momento. (código ${lastStatus})`,
      detalle: details.join(" · ").slice(0, 500),
    },
    { status: 502 }
  );
}
