import { NextRequest, NextResponse } from "next/server";
import { HOUR, clientIp, giveBack, remainingLimit, takeLimit } from "@/lib/rate-limit";
import { serverError } from "@/lib/bot";
import {
  AI_CONNECTION_PREFIX,
  AI_DAY_PREFIX,
  AI_DEVICE_PREFIX,
  AI_PHOTOS_PER_CONNECTION,
  AI_PHOTOS_PER_DAY,
  AI_PHOTOS_PER_DEVICE,
  AI_PEOPLE,
  AI_SCENES,
  AiPerson,
  AiScene,
  aiPrompt,
  cleanContext,
} from "@/lib/vista-ia";
import { DesignZone, ProductCategory } from "@/lib/types";

// "Verla puesta": la IA convierte la foto plana del diseñador en una foto de alguien
// usando la prenda. Cada foto cuesta (unos US$0.04 a 0.07), así que hay topes por
// dispositivo, por conexión y por día (lib/vista-ia.ts). Lo que se crea se ve en el panel,
// en Fotos IA. Necesita GEMINI_API_KEY en Vercel; sin ella, el botón no aparece.

export const maxDuration = 60;

const DAY = 24 * HOUR;
// Modelos de imagen, en orden: el que se elija en Vercel y, si no responde, los de Google
// que funcionan con las claves nuevas ("AQ."). Primero el Pro (la mejor calidad, el costo
// no importa), luego el de buena calidad y al final el "lite", más barato pero con fotos
// más pobres. Se usa el primero que devuelva la foto.
const MODELS = [
  ...new Set([
    process.env.GEMINI_IMAGE_MODEL,
    "gemini-3-pro-image",
    "gemini-3.1-flash-image",
    "gemini-3.1-flash-lite-image",
    "gemini-2.5-flash-image",
  ]),
].filter((m): m is string => Boolean(m));
const CATEGORIES: ProductCategory[] = ["camisa", "hoodie", "tote", "polo", "gorra"];
const ZONES: DesignZone[] = ["frente", "espalda", "manga-izq", "manga-der"];
const IMAGE_DATA = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/;
const MAX_IMAGE_CHARS = 3_000_000; // ≈ 2.2 MB

// Solo en la computadora de desarrollo, con VISTA_IA_PRUEBA=1: sin gastar en la IA ni
// tocar la base, devuelve la misma foto plana que llegó (para probar el botón y la ventana).
const TEST_MODE = process.env.NODE_ENV === "development" && process.env.VISTA_IA_PRUEBA === "1";

// Cada celular o computadora lleva su propio contador, con un número al azar guardado en
// una cookie. Así dos personas de la misma casa (o de la misma compañía de celular, que
// comparte conexión entre muchos) no se gastan las fotos entre ellas.
const DEVICE_COOKIE = "impreza-vista";
const DEVICE_ID = /^[0-9a-f-]{36}$/;
type Device = { id: string; isNew: boolean };

function deviceOf(req: NextRequest): Device {
  const saved = req.cookies.get(DEVICE_COOKIE)?.value;
  return saved && DEVICE_ID.test(saved) ? { id: saved, isNew: false } : { id: crypto.randomUUID(), isNew: true };
}

function withDevice(res: NextResponse, device: Device): NextResponse {
  if (device.isNew) {
    res.cookies.set(DEVICE_COOKIE, device.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
    });
  }
  return res;
}

const deviceLimit = (device: Device) => ({ clave: AI_DEVICE_PREFIX + device.id, max: AI_PHOTOS_PER_DEVICE, windowMs: DAY });
const connectionLimit = (req: NextRequest) => ({
  clave: AI_CONNECTION_PREFIX + clientIp(req.headers),
  max: AI_PHOTOS_PER_CONNECTION,
  windowMs: DAY,
});
// El día, en hora de Managua.
const dayKeyNow = () => AI_DAY_PREFIX + new Intl.DateTimeFormat("en-CA", { timeZone: "America/Managua" }).format(new Date());

// Si está activada y cuántas fotos le quedan hoy a este dispositivo (para el contador).
export async function GET(req: NextRequest) {
  const device = deviceOf(req);
  const disponible = TEST_MODE || Boolean(process.env.GEMINI_API_KEY);
  const restantes =
    disponible && !TEST_MODE && !device.isNew ? await remainingLimit(deviceLimit(device)) : AI_PHOTOS_PER_DEVICE;
  return withDevice(NextResponse.json({ disponible, restantes, total: AI_PHOTOS_PER_DEVICE }), device);
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
  return text.replace(/(AIza|AQ\.)[0-9A-Za-z_.-]+/g, "[clave]").slice(0, 200) || "sin detalle";
}

export async function POST(req: NextRequest) {
  const device = deviceOf(req);
  return withDevice(await createPhoto(req, device), device);
}

async function createPhoto(req: NextRequest, device: Device): Promise<NextResponse> {
  // Sin espacios, saltos de línea ni comillas que se cuelan al copiar y pegar la clave.
  const key = process.env.GEMINI_API_KEY?.trim().replace(/^["']+|["']+$/g, "").trim();
  if (!key && !TEST_MODE) return NextResponse.json({ error: "La vista con IA todavía no está activada." }, { status: 503 });

  const body = await req.json().catch(() => null);
  const category = CATEGORIES.find((c) => c === body?.prenda);
  const zone = ZONES.find((z) => z === body?.zona);
  const scene = AI_SCENES.find((s) => s.value === body?.escena)?.value as AiScene | undefined;
  const person = (AI_PEOPLE.find((p) => p.value === body?.persona)?.value ?? "mujer") as AiPerson;
  const context = cleanContext(body?.contexto);
  const colorName = typeof body?.color === "string" ? body.color.slice(0, 40).replace(/[^\p{L}\p{N} ]/gu, "") : "";
  const image = typeof body?.imagen === "string" && body.imagen.length <= MAX_IMAGE_CHARS ? IMAGE_DATA.exec(body.imagen) : null;
  if (!category || !zone || !scene || !image) {
    return NextResponse.json({ error: "No pudimos leer tu diseño. Recarga la página e intenta de nuevo." }, { status: 400 });
  }
  if (TEST_MODE && !key) {
    await new Promise((r) => setTimeout(r, 1500));
    return NextResponse.json({ imagen: body.imagen, prompt: aiPrompt(category, zone, colorName, scene, person, context) });
  }
  if (!key) return NextResponse.json({ error: "La vista con IA todavía no está activada." }, { status: 503 });

  // Topes: por dispositivo, por conexión (para quien borra la cookie y vuelve a empezar)
  // y para todo el sitio en el día, para que el gasto no se dispare.
  const deviceKey = deviceLimit(device).clave;
  const connectionKey = connectionLimit(req).clave;
  const dayKey = dayKeyNow();
  try {
    const mine = await takeLimit({ ...deviceLimit(device), gapMs: 10 * 1000 });
    if (mine === "espera") return NextResponse.json({ error: "Espera unos segundos antes de pedir otra foto." }, { status: 429 });
    if (mine === "muchos") {
      return NextResponse.json(
        { error: `Ya creaste tus ${AI_PHOTOS_PER_DEVICE} fotos de hoy. Vuelve mañana para ver más.`, restantes: 0 },
        { status: 429 }
      );
    }
    const connection = await takeLimit(connectionLimit(req));
    if (connection !== "ok") {
      await giveBack(deviceKey);
      return NextResponse.json(
        { error: "Desde esta conexión a internet ya se crearon muchas fotos hoy. Intenta de nuevo mañana." },
        { status: 429 }
      );
    }
    const today = await takeLimit({ clave: dayKey, max: AI_PHOTOS_PER_DAY, windowMs: DAY });
    if (today !== "ok") {
      await Promise.all([giveBack(deviceKey), giveBack(connectionKey)]);
      return NextResponse.json({ error: "Hoy ya se crearon muchas fotos. Intenta de nuevo mañana." }, { status: 429 });
    }
  } catch (err) {
    return serverError(err, "La vista con IA no está disponible ahora mismo.");
  }

  const prompt = aiPrompt(category, zone, colorName, scene, person, context);
  const mime = `image/${image[1]}`;
  const base = "https://generativelanguage.googleapis.com/v1beta";
  const contents = [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: image[2] } }] }];
  // Google tiene dos formas de pedir imágenes. Las claves nuevas ("AQ.") solo sirven con
  // la nueva (interactions); las viejas ("AIza") también con la clásica (generateContent).
  // Se prueba en orden y se usa la primera respuesta con foto. Lo que falla no se cobra.
  // Cada modelo se pide primero en vertical (4:5, como foto de catálogo) y, si no acepta
  // ese ajuste, sin él.
  const input = [
    { type: "text", text: prompt },
    { type: "image", mime_type: mime, data: image[2] },
  ];
  const interactions = MODELS.flatMap((model) => [
    {
      name: `interactions ${model} 4:5`,
      url: `${base}/interactions`,
      body: { model, input, response_format: { type: "image", aspect_ratio: "4:5" } },
    },
    { name: `interactions ${model}`, url: `${base}/interactions`, body: { model, input } },
  ]);
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
      if (result) {
        const restantes = await remainingLimit(deviceLimit(device));
        return NextResponse.json({ imagen: `data:${result.mime};base64,${result.data}`, restantes });
      }
      lastStatus = res.status;
      details.push(`${res.status} ${googleMessage(json)}`);
      console.error(`Vista con IA sin imagen (${attempt.name}):`, res.status, JSON.stringify(json).slice(0, 600));
    } catch (err) {
      lastStatus = -1;
      details.push(err instanceof Error ? err.name : "sin respuesta");
      console.error(`Vista con IA falló (${attempt.name}):`, err);
    }
  }
  // Sin foto no hubo gasto: se le devuelve el intento al dispositivo, a la conexión y al día.
  await Promise.all([giveBack(deviceKey), giveBack(connectionKey), giveBack(dayKey)]);
  // El código entre paréntesis no dice nada privado y ayuda a saber qué pasó.
  return NextResponse.json(
    {
      error: `No pudimos crear la foto ahora. Intenta de nuevo en un momento. (código ${lastStatus})`,
      detalle: details.join(" · ").slice(0, 500),
      restantes: await remainingLimit(deviceLimit(device)),
    },
    { status: 502 }
  );
}
