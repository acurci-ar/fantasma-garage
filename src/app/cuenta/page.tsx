import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Mi cuenta" };

export default function CuentaPage() {
  return (
    <ComingSoon
      eyebrow="Próxima etapa"
      title="Mi cuenta"
      description="Perfil, direcciones y seguimiento de pedidos se habilitan junto con el checkout de la tienda. Podés iniciar sesión o registrarte desde ya."
    />
  );
}
