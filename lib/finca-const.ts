// Constantes del sistema de la finca (seguras para el navegador).

export const CATEGORIAS = {
  ingreso: ["Venta de cosecha", "Otros ingresos"],
  gasto: ["Insumos", "Semillas", "Fertilizantes", "Agroquímicos", "Combustible", "Transporte", "Maquinaria / alquiler", "Reparaciones", "Servicios", "Otros"],
  perdida: ["Plaga o enfermedad", "Sequía o lluvia", "Robo", "Cosecha dañada", "Animales", "Otros"],
} as const;

export type TipoMovimiento = keyof typeof CATEGORIAS;
export const TIPO_LABEL: Record<TipoMovimiento, string> = { ingreso: "Ingreso", gasto: "Gasto", perdida: "Pérdida" };
export const INVENTARIO_CATEGORIAS = ["insumo", "herramienta", "cosecha", "otro"] as const;
export const INVENTARIO_LABEL: Record<(typeof INVENTARIO_CATEGORIAS)[number], string> = {
  insumo: "Insumo",
  herramienta: "Herramienta",
  cosecha: "Cosecha guardada",
  otro: "Otro",
};
export const MANO_DE_OBRA = "Mano de obra";
