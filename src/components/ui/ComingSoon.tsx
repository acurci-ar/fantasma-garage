import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

/**
 * Estado "en construcción" coherente con la identidad visual, usado en
 * rutas cuya funcionalidad completa llega en una próxima etapa (carrito,
 * checkout, mi cuenta, admin). Nunca un 404: la ruta existe y comunica
 * claramente el estado, según el criterio de aceptación de navegación
 * completa (sección 11).
 */
export function ComingSoon({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Section className="flex min-h-[70vh] items-center pt-32">
      <div className="mx-auto max-w-lg text-center">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} align="center" />
        <div className="mt-8 flex justify-center gap-4">
          <Button href="/">Volver al inicio</Button>
          <Button href="/contacto" variant="secondary">
            Contactar
          </Button>
        </div>
      </div>
    </Section>
  );
}
