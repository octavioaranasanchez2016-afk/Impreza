// Pedido en curso guardado en el navegador del cliente, para que no se pierda si la
// página se recarga: en el celular pasa mucho al ir a la app del banco a transferir.
// Los datos van en sessionStorage (se borran al cerrar la pestaña). Las imágenes del
// diseño pesan demasiado para eso y van en IndexedDB, que se limpia cuando ya no hay
// pedido en curso.

import { PRODUCTS } from "./catalog";
import { BillingInfo } from "./billing";
import { MockupTextContent } from "./design";
import { ShippingInfo } from "./shipping";
import { DesignTransform, DesignZone, OrderItemInput, Technique } from "./types";

export interface DraftImage {
  kind: "imagen";
  width: number;
  height: number;
  fill?: boolean;
}

export type DraftDesign = MockupTextContent | DraftImage;

export interface OrderDraft {
  v: 1;
  items: (OrderItemInput & { key: string })[];
  technique: Technique;
  productId: string;
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

export function loadDraft(): OrderDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as OrderDraft;
    if (draft?.v !== 1 || !Array.isArray(draft.items)) return null;
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

// Reemplaza todas las imágenes guardadas por estas (una por zona).
export async function saveDraftImages(files: Partial<Record<DesignZone, File>>): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.clear();
      for (const [zone, file] of Object.entries(files)) store.put(file, zone);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Sin IndexedDB: si la página se recarga, el cliente vuelve a subir su imagen.
  }
}

export async function loadDraftImages(): Promise<Partial<Record<DesignZone, File>>> {
  try {
    const db = await openDb();
    const result = await new Promise<Partial<Record<DesignZone, File>>>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const out: Partial<Record<DesignZone, File>> = {};
      const cursor = store.openCursor();
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (!c) return resolve(out);
        const value = c.value as Blob;
        out[c.key as DesignZone] =
          value instanceof File ? value : new File([value], `diseno-${String(c.key)}.jpg`, { type: "image/jpeg" });
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
