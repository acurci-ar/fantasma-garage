import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Carrito" };

export default function CarritoPage() {
  return (
    <ComingSoon
      eyebrow="Próxima etapa"
      title="Carrito"
      description="El carrito persistente (drawer lateral, edición de cantidades y checkout con Mercado Pago) se incorpora en la etapa de Tienda. Mientras tanto, consultanos por WhatsApp o el formulario de contacto."
    />
  );
}
