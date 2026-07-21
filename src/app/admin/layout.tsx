import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AdminSignOutButton } from "@/features/admin/AdminSignOutButton";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/proyectos", label: "Proyectos" },
  { href: "/admin/galerias", label: "Galerías" },
  { href: "/admin/mensajes", label: "Mensajes" },
  { href: "/admin/videos", label: "Videos" },
  { href: "/admin/newsletter", label: "Newsletter" },
];

/**
 * Shell del panel /admin. Protege TODAS las rutas anidadas (además del
 * middleware, que ya exige sesión para /admin/:path*): acá se valida
 * además el rol (admin/editor), server-side, en un solo lugar en vez de
 * repetirlo en cada página (sección 7.1 — no confiar solo en ocultar
 * botones del cliente).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  let staffLabel: string | null = null;

  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
      redirect("/");
    }

    staffLabel = profile.full_name || user.email || "Staff";
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <nav
        className="flex gap-2 overflow-x-auto border-b border-secondary/20 px-5 py-3 lg:hidden"
        aria-label="Navegación de administración"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-sm border border-secondary/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground/70 hover:border-primary hover:text-primary"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex">
        <aside className="hidden w-60 shrink-0 border-r border-secondary/20 bg-card/20 lg:block">
          <div className="sticky top-20 flex flex-col gap-1 p-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Administración
            </p>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm px-3 py-2 text-sm font-medium uppercase tracking-wide text-foreground/70 transition-colors duration-220 hover:bg-secondary/10 hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-6 border-t border-secondary/20 pt-4">
              {staffLabel && <p className="truncate px-3 text-xs text-foreground/40">{staffLabel}</p>}
              <AdminSignOutButton />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-10">{children}</div>
      </div>
    </div>
  );
}
