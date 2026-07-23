import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { ProfileForm } from "@/features/account/ProfileForm";
import { ChangePasswordForm } from "@/features/account/ChangePasswordForm";
import { AccountSignOutButton } from "@/features/account/AccountSignOutButton";
import { ContactForm } from "@/features/home/ContactForm";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ContactMessage, ContactMessageReply, Order, Profile, Project } from "@/types/database";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false, follow: false } };

const orderStatusLabel: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  preparando: "Preparando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

const messageStatusLabel: Record<string, string> = {
  nuevo: "Enviado",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
};

/**
 * Panel de cliente. Si el usuario logueado es staff (admin/editor), se
 * redirige a /admin — esta pantalla es solo para clientes. La protección
 * real (sesión + estos redirects) es server-side; el middleware además
 * exige sesión para /cuenta/:path*.
 */
export default async function CuentaPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (profile && (profile.role === "admin" || profile.role === "editor")) {
    redirect("/admin");
  }

  const [{ data: orders }, { data: messages }, { data: sharedProjects }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
    // Proyectos privados a los que este usuario tiene acceso otorgado (ver
    // project_access / has_project_access en 0011_project_expansion.sql).
    // No hace falta filtrar por email acá: la RLS de `projects` ya solo
    // devuelve los privados donde el usuario logueado tiene acceso (o es
    // staff, pero a un staff ya lo redirigimos a /admin más arriba).
    supabase.from("projects").select("*").eq("visibility", "private").order("created_at", { ascending: false }),
  ]);

  const typedOrders = (orders ?? []) as Order[];
  const typedMessages = (messages ?? []) as ContactMessage[];
  const typedSharedProjects = (sharedProjects ?? []) as Project[];

  // RLS (contact_message_replies_select_own) ya limita esto a respuestas de
  // mensajes propios, pero igual filtramos por los ids que ya tenemos.
  const messageIds = typedMessages.map((message) => message.id);
  const { data: replies } =
    messageIds.length > 0
      ? await supabase
          .from("contact_message_replies")
          .select("*")
          .in("message_id", messageIds)
          .order("created_at", { ascending: true })
      : { data: [] as ContactMessageReply[] };

  const repliesByMessage = new Map<string, ContactMessageReply[]>();
  for (const reply of (replies ?? []) as ContactMessageReply[]) {
    const list = repliesByMessage.get(reply.message_id) ?? [];
    list.push(reply);
    repliesByMessage.set(reply.message_id, list);
  }

  return (
    <Section className="pt-32">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeading eyebrow="Mi cuenta" title={profile?.full_name || user.email || "Tu cuenta"} />
        <AccountSignOutButton />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[320px_1fr]">
        <div className="h-fit rounded-sm border border-secondary/30 bg-card/40 p-6">
          <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Mis datos</h2>
          <div className="mt-4">
            <ProfileForm profile={profile as Profile | null} email={user.email ?? ""} />
          </div>

          <div className="mt-10 border-t border-secondary/20 pt-6">
            <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Cambiar contraseña</h2>
            <div className="mt-4">
              <ChangePasswordForm />
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {typedSharedProjects.length > 0 && (
            <div>
              <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Mis proyectos</h2>
              <p className="mt-1 text-xs text-foreground/40">
                Proyectos privados a los que te dieron acceso.
              </p>
              <ul className="mt-4 space-y-3">
                {typedSharedProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/proyectos/${project.slug}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-secondary/30 bg-card/40 p-4 transition-colors duration-220 hover:border-primary/60"
                    >
                      <div>
                        <p className="font-display text-sm uppercase tracking-tight text-foreground">
                          {project.make} {project.model} · {project.year}
                        </p>
                        <p className="mt-1 text-xs text-foreground/40">{project.summary}</p>
                      </div>
                      <Badge tone="default">Privado</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Mis pedidos</h2>
            {typedOrders.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/50">
                Todavía no hiciste ningún pedido con esta cuenta.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {typedOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/cuenta/pedidos/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-secondary/30 bg-card/40 p-4 transition-colors duration-220 hover:border-primary/60"
                    >
                      <div>
                        <p className="font-display text-sm uppercase tracking-tight text-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="mt-1 text-xs text-foreground/40">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-foreground/70">
                          {formatCurrency(order.total, order.currency)}
                        </span>
                        <Badge tone="primary">{orderStatusLabel[order.status] ?? order.status}</Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Mis mensajes</h2>
            {typedMessages.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/50">Todavía no enviaste ningún mensaje.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {typedMessages.map((message) => (
                  <li key={message.id} className="rounded-sm border border-secondary/30 bg-card/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-display text-sm uppercase tracking-tight text-foreground">
                        {message.subject}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-foreground/40">{formatDate(message.created_at)}</span>
                        <Badge>{messageStatusLabel[message.status] ?? message.status}</Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-foreground/70">{message.message}</p>

                    {(repliesByMessage.get(message.id) ?? []).length > 0 && (
                      <div className="mt-4 space-y-3 border-t border-secondary/20 pt-4">
                        {(repliesByMessage.get(message.id) ?? []).map((reply) => (
                          <div key={reply.id} className="rounded-sm border border-primary/30 bg-primary/5 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                Fantasma Garage respondió
                              </p>
                              <span className="text-xs text-foreground/40">{formatDate(reply.created_at)}</span>
                            </div>
                            <p className="mt-2 whitespace-pre-line text-sm text-foreground/70">{reply.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 rounded-sm border border-secondary/30 bg-card/40 p-6">
              <p className="mb-4 text-xs uppercase tracking-wide text-foreground/50">Enviar un nuevo mensaje</p>
              <ContactForm
                initialValues={{
                  name: profile?.full_name ?? "",
                  email: user.email ?? "",
                  phone: profile?.phone ?? "",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
