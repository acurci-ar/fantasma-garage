import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Panel } from "@/components/ui/Card";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Panel de administración", robots: { index: false, follow: false } };

/**
 * Shell del panel /admin (sección 7). El CRUD completo (productos, pedidos,
 * contenido) es la Etapa 3 de este proyecto (ver docs/ARQUITECTURA.md y
 * README). Esta página deja preparada la protección de ruta real: si
 * Supabase está configurado, valida sesión + rol admin/editor server-side
 * y redirige a /login si no corresponde, en vez de ocultar botones en el
 * cliente (sección 7.1).
 */
export default async function AdminPage() {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
      redirect("/");
    }
  }

  return (
    <Section className="min-h-[70vh] pt-32">
      <SectionHeading
        eyebrow="Administración"
        title="Panel de Fantasma Garage"
        description="El CRUD completo de productos, pedidos, proyectos, galerías y contenido llega en la Etapa 3 de este proyecto."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          "Dashboard y KPIs",
          "Productos e inventario",
          "Pedidos y pagos",
          "Proyectos y galerías",
          "Videos y testimonios",
          "Mensajes de contacto",
        ].map((item) => (
          <Panel key={item}>
            <p className="font-display text-sm uppercase tracking-wide text-foreground/80">{item}</p>
            <p className="mt-2 text-xs text-foreground/45">Disponible en la próxima etapa.</p>
          </Panel>
        ))}
      </div>
      <p className="mt-8 text-xs text-foreground/40">
        Esta ruta ya valida sesión y rol contra Supabase cuando está configurado (RLS + verificación
        server-side), según el criterio de seguridad de la sección 7.1.
      </p>
    </Section>
  );
}
