import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { MessageStatusButtons } from "@/features/admin/MessageStatusButtons";
import { formatDate } from "@/lib/utils/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ContactMessage } from "@/types/database";

export const metadata: Metadata = { title: "Mensajes de contacto", robots: { index: false, follow: false } };

async function getMessages(): Promise<ContactMessage[]> {
  if (!isSupabaseConfigured()) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
  return (data ?? []) as ContactMessage[];
}

const statusTone: Record<string, "default" | "primary"> = {
  nuevo: "primary",
  en_proceso: "default",
  resuelto: "default",
};

export default async function AdminMessagesPage() {
  const messages = await getMessages();

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
        Mensajes de contacto
      </h1>
      <p className="mt-2 text-sm text-foreground/60">{messages.length} mensaje(s) recibido(s).</p>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el listado real aparece cuando esté
          conectado.
        </p>
      )}

      {isSupabaseConfigured() && messages.length === 0 && (
        <p className="mt-10 text-sm text-foreground/50">Todavía no llegaron mensajes.</p>
      )}

      {messages.length > 0 && (
        <ul className="mt-8 space-y-4">
          {messages.map((message) => (
            <li key={message.id} className="rounded-sm border border-secondary/30 bg-card/40 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm uppercase tracking-tight text-foreground">{message.subject}</p>
                  <p className="mt-1 text-xs text-foreground/50">
                    {message.name} · {message.email}
                    {message.phone ? ` · ${message.phone}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={statusTone[message.status] ?? "default"}>{message.status}</Badge>
                  <span className="text-xs text-foreground/40">{formatDate(message.created_at)}</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-foreground/70">{message.message}</p>
              <div className="mt-4">
                <MessageStatusButtons id={message.id} current={message.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
