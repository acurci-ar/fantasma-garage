"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { replyToContactMessage, type ContactReplyActionState } from "@/actions/admin/messages";

const initialState: ContactReplyActionState = { status: "idle", message: "" };

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Enviar respuesta
    </Button>
  );
}

export function ReplyToMessageForm({ messageId }: { messageId: string }) {
  const replyAction = replyToContactMessage.bind(null, messageId);
  const [state, formAction] = useFormState(replyAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="body" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
          Tu respuesta
        </label>
        <textarea
          id="body"
          name="body"
          rows={5}
          required
          placeholder="Escribí la respuesta que le va a llegar por email al cliente..."
          className={inputClasses}
        />
        {state.fieldErrors?.body?.length ? (
          <p className="mt-1 text-xs text-primary">{state.fieldErrors.body[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton />
        {state.status !== "idle" && (
          <p
            role="status"
            aria-live="polite"
            className={state.status === "success" ? "text-sm text-primary" : "text-sm text-red-400"}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
