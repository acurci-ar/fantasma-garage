"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { updateProfile, type ProfileActionState } from "@/actions/account";
import type { Profile } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: ProfileActionState = { status: "idle", message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Guardar cambios
    </Button>
  );
}

export function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [state, formAction] = useFormState(updateProfile, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className={labelClasses}>Email</label>
        <input type="email" value={email} disabled className={`${inputClasses} cursor-not-allowed opacity-60`} />
        <p className="mt-1 text-xs text-foreground/40">El email no se puede cambiar desde acá.</p>
      </div>

      <div>
        <label htmlFor="full_name" className={labelClasses}>
          Nombre completo
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={profile?.full_name ?? ""}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.full_name} />
      </div>

      <div>
        <label htmlFor="phone" className={labelClasses}>
          Teléfono
        </label>
        <input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ""} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.phone} />
      </div>

      <div>
        <label htmlFor="document_number" className={labelClasses}>
          Documento (opcional)
        </label>
        <input
          id="document_number"
          name="document_number"
          type="text"
          defaultValue={profile?.document_number ?? ""}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.document_number} />
      </div>

      <div className="border-t border-secondary/20 pt-5">
        <p className="mb-4 text-xs uppercase tracking-wide text-foreground/50">
          Dirección de envío (opcional, para no volver a escribirla en cada pedido)
        </p>

        <div className="space-y-5">
          <div>
            <label htmlFor="shipping_street" className={labelClasses}>
              Calle y número
            </label>
            <input
              id="shipping_street"
              name="shipping_street"
              type="text"
              defaultValue={profile?.shipping_street ?? ""}
              className={inputClasses}
            />
            <FieldError errors={state.fieldErrors?.shipping_street} />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="shipping_city" className={labelClasses}>
                Localidad
              </label>
              <input
                id="shipping_city"
                name="shipping_city"
                type="text"
                defaultValue={profile?.shipping_city ?? ""}
                className={inputClasses}
              />
              <FieldError errors={state.fieldErrors?.shipping_city} />
            </div>
            <div>
              <label htmlFor="shipping_province" className={labelClasses}>
                Provincia
              </label>
              <input
                id="shipping_province"
                name="shipping_province"
                type="text"
                defaultValue={profile?.shipping_province ?? ""}
                className={inputClasses}
              />
              <FieldError errors={state.fieldErrors?.shipping_province} />
            </div>
            <div>
              <label htmlFor="shipping_postal_code" className={labelClasses}>
                Código postal
              </label>
              <input
                id="shipping_postal_code"
                name="shipping_postal_code"
                type="text"
                defaultValue={profile?.shipping_postal_code ?? ""}
                className={inputClasses}
              />
              <FieldError errors={state.fieldErrors?.shipping_postal_code} />
            </div>
          </div>
        </div>
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
