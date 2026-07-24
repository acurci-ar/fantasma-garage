import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { MessageStatusButtons } from "@/features/admin/MessageStatusButtons";
import { MessageTabs } from "@/features/admin/MessageTabs";
import { formatDate } from "@/lib/utils/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ContactMessage, ContactMessageStatus } from "@/types/database";

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

const STATUS_TABS: { key: ContactMessageStatus; label: string }[] = [
  { key: "nuevo", label: "Nuevos" },
  { key: "en_proceso", label: "En curso" },
  { key: "resuelto", label: "Resueltos" },
];

function MessageList({ messages }: { messages: ContactMessage[] }): ReactNode {
  if (messages.length === 0) {
    return <p className="mt-6 text-sm text-foreground/50">No hay mensajes en esta solapa.</p>;
  }

  return (
    <ul className="space-y-4">
      {messages.map((message) => (
        <li
          key={message.id}
          className={`rounded-sm border p-6 ${
            message.read_at ? "border-secondary/30 bg-card/40" : "border-primary/40 bg-primary/5"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-sm uppercase tracking-tight text-foreground">
                {!message.read_at && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" />}
                {message.subject}
              </p>
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
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <MessageStatusButtons id={message.id} current={message.status} />
            <Link
              href={`/admin/mensajes/${message.id}`}
              className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
            >
              Responder →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

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
        <div className="mt-8">
          <MessageTabs
            tabs={STATUS_TABS.map(({ key, label }) => {
              const inStatus = messages.filter((message) => message.status === key);
              return {
                key,
                label,
                unreadCount: inStatus.filter((message) => !message.read_at).length,
                content: <MessageList messages={inStatus} />,
              };
            })}
          />
        </div>
      )}
    </div>
  );
}
