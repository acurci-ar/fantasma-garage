import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { MessageStatusButtons } from "@/features/admin/MessageStatusButtons";
import { ReplyToMessageForm } from "@/features/admin/ReplyToMessageForm";
import { formatDate } from "@/lib/utils/format";
import { isEmailConfigured } from "@/lib/email/resend";
import type { ContactMessage, ContactMessageReply } from "@/types/database";

export const metadata: Metadata = { title: "Mensaje de contacto", robots: { index: false, follow: false } };

const statusTone: Record<string, "default" | "primary"> = {
  nuevo: "primary",
  en_proceso: "default",
  resuelto: "default",
};

export default async function AdminMessageDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [{ data: message }, { data: replies }] = await Promise.all([
    supabase.from("contact_messages").select("*").eq("id", id).single(),
    supabase
      .from("contact_message_replies")
      .select("*")
      .eq("message_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!message) notFound();

  const typedMessage = message as ContactMessage;
  const typedReplies = (replies ?? []) as ContactMessageReply[];

  // Se marca como leído la primera vez que el staff abre el detalle — ver
  // el contador de no leídos por solapa en /admin/mensajes.
  if (!typedMessage.read_at) {
    const readAt = new Date().toISOString();
    await supabase.from("contact_messages").update({ read_at: readAt }).eq("id", id);
    typedMessage.read_at = readAt;
  }

  return (
    <div>
      <Link href="/admin/mensajes" className="text-xs font-semibold uppercase tracking-wide text-foreground/50 hover:text-primary">
        ← Volver a mensajes
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
            {typedMessage.subject}
          </h1>
          <p className="mt-1 text-sm text-foreground/50">
            {typedMessage.name} · {typedMessage.email}
            {typedMessage.phone ? ` · ${typedMessage.phone}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={statusTone[typedMessage.status] ?? "default"}>{typedMessage.status}</Badge>
          <span className="text-xs text-foreground/40">{formatDate(typedMessage.created_at)}</span>
        </div>
      </div>

      <div className="mt-4">
        <MessageStatusButtons id={typedMessage.id} current={typedMessage.status} />
      </div>

      {!isEmailConfigured() && (
        <p className="mt-6 rounded-sm border border-secondary/30 bg-card/40 p-4 text-xs text-foreground/50">
          No hay un proveedor de email configurado todavía (falta RESEND_API_KEY): las respuestas se van a guardar
          y a mostrar en /cuenta, pero no le va a llegar el email al cliente hasta que lo configures.
        </p>
      )}

      <div className="mt-8 max-w-2xl space-y-4">
        <div className="rounded-sm border border-secondary/30 bg-card/40 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/40">
            {typedMessage.name} escribió
          </p>
          <p className="mt-3 whitespace-pre-line text-sm text-foreground/80">{typedMessage.message}</p>
        </div>

        {typedReplies.map((reply) => (
          <div key={reply.id} className="rounded-sm border border-primary/30 bg-primary/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Fantasma Garage respondió</p>
              <span className="text-xs text-foreground/40">{formatDate(reply.created_at)}</span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-foreground/80">{reply.body}</p>
            {!reply.email_sent && (
              <p className="mt-3 text-xs text-red-400">No se pudo enviar por email — avisale al cliente por otro medio.</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 max-w-2xl rounded-sm border border-secondary/30 bg-card/40 p-6">
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Responder</h2>
        <p className="mt-1 text-xs text-foreground/40">
          Se guarda acá y (si hay email configurado) se le manda a {typedMessage.email}.
        </p>
        <div className="mt-4">
          <ReplyToMessageForm messageId={typedMessage.id} />
        </div>
      </div>
    </div>
  );
}
