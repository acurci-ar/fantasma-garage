import { ComingSoon } from "@/components/ui/ComingSoon";

export default function NotFound() {
  return (
    <ComingSoon
      eyebrow="Error 404"
      title="Esta página no existe"
      description="Puede que el enlace esté roto o que la página se haya movido. Volvé al inicio o contactanos si creés que es un error."
    />
  );
}
