"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/features/admin/ImageUploadField";
import type { ProductImageActionState } from "@/actions/admin/products";
import type { ProductImage } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: ProductImageActionState = { status: "idle", message: "" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

/**
 * Form de foto de producto, reutilizado para "agregar" (sin `image`, se
 * resetea solo tras un alta exitosa) y para editar una existente (con
 * `image`, ver ProductImageRow). El orden no se edita acá: se arrastra en la
 * lista (ver ProductImageManager).
 */
export function ProductImageForm({
  action,
  image,
  submitLabel = "Agregar",
}: {
  action: (state: ProductImageActionState, formData: FormData) => Promise<ProductImageActionState>;
  image?: ProductImage;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
    if (!image) formRef.current?.reset();
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-sm border border-secondary/30 bg-card/40 p-4">
      <ImageUploadField
        fileFieldName="file"
        urlFieldName="url"
        initialUrl={image?.url}
        urlFieldErrors={state.fieldErrors?.url}
      />

      <div>
        <label className={labelClasses}>Texto alternativo</label>
        <input name="alt" type="text" defaultValue={image?.alt ?? ""} className={inputClasses} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton label={submitLabel} />
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
