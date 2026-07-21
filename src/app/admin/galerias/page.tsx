import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Gallery } from "@/types/database";

export const metadata: Metadata = { title: "Galerías", robots: { index: false, follow: false } };

async function getGalleries(): Promise<Gallery[]> {
  if (!isSupabaseConfigured()) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("galleries")
    .select("*, images:gallery_images(*)")
    .order("gallery_type", { ascending: true });
  return (data ?? []) as Gallery[];
}

export default async function AdminGalleriesPage() {
  const galleries = await getGalleries();

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Galerías</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/60">
        SEMA, Amigos y Trabajos son fijas (no se crean ni se borran galerías nuevas): acá se edita el título,
        descripción, portada, estado y las fotos de cada una.
      </p>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el listado real aparece cuando esté conectado.
        </p>
      )}

      {galleries.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-sm border border-secondary/30">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-secondary/30 bg-card/40 text-xs uppercase tracking-wide text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Galería</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Fotos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/15">
              {galleries.map((gallery) => (
                <tr key={gallery.id} className="hover:bg-card/30">
                  <td className="px-4 py-3 text-foreground">{gallery.title}</td>
                  <td className="px-4 py-3">
                    <Badge tone={gallery.status === "published" ? "primary" : "default"}>{gallery.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{gallery.images?.length ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/galerias/${gallery.id}`}
                      className="text-xs font-semibold uppercase text-primary hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
