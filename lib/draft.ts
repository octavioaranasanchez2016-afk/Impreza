// Pedido en curso guardado en el navegador del cliente, para que no se pierda si la
// página se recarga: en el celular pasa mucho al ir a la app del banco a transferir.
// Los datos van en sessionStorage (se borran al cerrar la pestaña). Las imágenes del
// diseño pesan demasiado para eso y van en IndexedDB, que se limpia cuando ya no hay
// pedido en curso.

import { PRODUCTS } from "./catalog";
import { BillingInfo } from "./billing";
import { DesignContent, MockupTextContent } from "./design";
import { ShippingInfo } from "./shipping";
import { LineDesigns, imageKey } from "./cart-designs";
import { DesignTransform, DesignZone, OrderItemInput, Technique } from "./types";

export interface DraftImage {
  kind: "imagen";
  ref: string; // clave de la imagen en IndexedDB
  width: number;
  height: number;
  fill?: boolean;
}

export type DraftDesign = MockupTextContent | DraftImage;

export interface DraftLine extends OrderItemInput {
  key: string;
  designs: Partial<Record<DesignZone, { design: DraftDesign; transform: DesignTransform }>>;
}

export interface OrderDraft {
  v: 2;
  items: DraftLine[];
  technique: Technique;
  productId: string;
  fabric?: string | null;
  color: string;
  size: string;
  activeZone: DesignZone;
  designs: Partial<Record<DesignZone, DraftDesign>>;
  transforms: Partial<Record<DesignZone, DesignTransform>>;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  notas: string;
  wantsRuc: boolean;
  billing: BillingInfo;
  shipping: ShippingInfo | null;
}

const DRAFT_KEY = "impreza-borrador";

export function toDraftDesign(c: DesignContent): DraftDesign {
  return c.kind === "texto" ? c : { kind: "imagen", ref: imageKey(c.file), width: c.width, height: c.height, fill: c.fill };
}

// null si la imagen no se pudo recuperar.
export function fromDraftDesign(d: DraftDesign, files: Record<string, File>): DesignContent | null {
  if (d.kind === "texto") return d;
  const file = files[d.ref];
  if (!file) return null;
  return { kind: "imagen", file, previewUrl: URL.createObjectURL(file), width: d.width, height: d.height, fill: d.fill };
}

export function toDraftLineDesigns(designs: LineDesigns): DraftLine["designs"] {
  const out: DraftLine["designs"] = {};
  for (const [zone, d] of Object.entries(designs) as [DesignZone, LineDesigns[DesignZone]][]) {
    if (d) out[zone] = { design: toDraftDesign(d.content), transform: d.transform };
  }
  return out;
}

export function loadDraft(): OrderDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as OrderDraft;
    // Un borrador con el formato anterior se descarta: dura solo lo que dura la pestaña.
    if (draft?.v !== 2 || !Array.isArray(draft.items)) return null;
    // Un producto que ya no está en el catálogo no se puede volver a pedir.
    draft.items = draft.items.filter((i) => PRODUCTS.some((p) => p.id === i.productId) && i.quantity > 0);
    return draft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: OrderDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Sin almacenamiento (modo privado, lleno...): el pedido vale mientras la página siga abierta.
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nada que limpiar.
  }
  void saveDraftImages({});
}

// ¿Vale la pena avisar que se recuperó? Solo si el cliente ya había avanzado algo.
export function draftHasProgress(draft: OrderDraft): boolean {
  return (
    draft.items.length > 0 ||
    Object.keys(draft.designs).length > 0 ||
    draft.clienteNombre.trim().length > 0 ||
    draft.clienteTelefono.trim().length > 0
  );
}

const DB_NAME = "impreza-borrador";
const STORE = "imagenes";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Reemplaza todas las imágenes guardadas por estas (clave = imageKey del archivo).
export async function saveDraftImages(files: Record<string, File>): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.clear();
      for (const [key, file] of Object.entries(files)) store.put(file, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Sin IndexedDB: si la página se recarga, el cliente vuelve a subir su imagen.
  }
}

export async function loadDraftImages(): Promise<Record<string, File>> {
  try {
    const db = await openDb();
    const result = await new Promise<Record<string, File>>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const out: Record<string, File> = {};
      const cursor = store.openCursor();
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (!c) return resolve(out);
        const value = c.value as Blob;
        const key = String(c.key);
        out[key] = value instanceof File ? value : new File([value], key.split(":")[0] || "diseno.jpg", { type: "image/jpeg" });
        c.continue();
      };
      cursor.onerror = () => reject(cursor.error);
    });
    db.close();
    return result;
  } catch {
    return {};
  }
}
