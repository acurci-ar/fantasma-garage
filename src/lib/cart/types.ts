/**
 * Ítem de carrito. Se persiste en localStorage (ver CartContext) y viaja
 * al Server Action de checkout solo como referencia de producto/cantidad:
 * el precio y el stock reales se vuelven a verificar server-side antes de
 * crear el pedido, nunca se confía en unitPrice del cliente para el total.
 */
export interface CartItem {
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: number;
  currency: "ARS" | "USD";
  quantity: number;
  /** Stock disponible al momento de agregar, para acotar el selector de cantidad en la UI. */
  stock: number;
}
