"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { slugify } from "@/lib/utils/format";
import type { CategoryActionState } from "@/actions/admin/categories";
import type { Category } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: CategoryActionState = { status: "idle", message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

export function CategoryForm({
  action,
  category,
  submitLabel = "Guardar",
}: {
  action: (state: CategoryActionState, formData: FormData) => Promise<CategoryActionState>;
  category?: Category;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div>
        <label htmlFor="name" className={labelClasses}>
          Nombre
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Suspensión"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.name} />
      </div>

      <div>
        <label htmlFor="slug" className={labelClasses}>
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.slug} />
      </div>

      <div>
        <label htmlFor="description" className={labelClasses}>
          Descripción (opcional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={category?.description ?? ""}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.description} />
      </div>

      <div>
        <label htmlFor="status" className={labelClasses}>
          Estado
        </label>
        <select id="status" name="status" defaultValue={category?.status ?? "published"} className={inputClasses}>
          <option value="published">Publicada (aparece en el filtro de la tienda)</option>
          <option value="draft">Borrador</option>
          <option value="hidden">Oculta</option>
        </select>
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
