"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { updateSiteSettings, type SiteSettingsActionState } from "@/actions/admin/settings";
import type { SiteSettings } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: SiteSettingsActionState = { status: "idle", message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Guardar configuración
    </Button>
  );
}

function Field({
  id,
  label,
  defaultValue,
  errors,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  defaultValue: string;
  errors?: string[];
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputClasses}
      />
      <FieldError errors={errors} />
    </div>
  );
}

export function SiteSettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction] = useFormState(updateSiteSettings, initialState);
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-12">
      <section>
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Contacto</h2>
        <p className="mt-1 text-xs text-foreground/40">Se muestra en el pie de página y en /contacto.</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field id="whatsapp_number" label="WhatsApp" defaultValue={settings.whatsapp_number} errors={errors?.whatsapp_number} />
          <Field id="contact_email" label="Email" type="email" defaultValue={settings.contact_email} errors={errors?.contact_email} />
          <Field id="address" label="Dirección (texto libre)" defaultValue={settings.address} errors={errors?.address} />
          <Field id="business_hours" label="Horario de atención" defaultValue={settings.business_hours} errors={errors?.business_hours} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Redes</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field id="instagram_url" label="Instagram (URL)" defaultValue={settings.instagram_url} errors={errors?.instagram_url} />
          <Field id="youtube_channel_url" label="Canal de YouTube (URL)" defaultValue={settings.youtube_channel_url} errors={errors?.youtube_channel_url} />
          <Field
            id="youtube_playlist_url"
            label="Playlist de YouTube (URL)"
            defaultValue={settings.youtube_playlist_url}
            errors={errors?.youtube_playlist_url}
          />
        </div>
      </section>

      <section>
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Métricas</h2>
        <p className="mt-1 text-xs text-foreground/40">Se muestran como cifras destacadas en la home.</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field
            id="years_experience"
            label="Años de experiencia"
            type="number"
            defaultValue={String(settings.years_experience)}
            errors={errors?.years_experience}
          />
          <Field
            id="projects_completed"
            label="Proyectos completados"
            type="number"
            defaultValue={String(settings.projects_completed)}
            errors={errors?.projects_completed}
          />
        </div>
      </section>

      <section className="border-t border-secondary/20 pt-8">
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">
          Datos estructurados (SEO / IA)
        </h2>
        <p className="mt-1 max-w-2xl text-xs text-foreground/40">
          Estos campos alimentan el JSON-LD (schema.org) del sitio, que es lo que Google y las IAs (ChatGPT,
          Perplexity, etc.) leen para saber quién sos, dónde estás y cómo contactarte. Si un campo queda vacío,
          simplemente se omite del JSON-LD — mejor eso que publicar un dato inventado.
        </p>
        <div className="mt-4 space-y-5">
          <Field
            id="address_street"
            label="Calle y número"
            defaultValue={settings.address_street}
            errors={errors?.address_street}
            placeholder="Ej: Av. Siempre Viva 1234"
          />
          <div className="grid gap-5 sm:grid-cols-4">
            <Field id="address_locality" label="Localidad" defaultValue={settings.address_locality} errors={errors?.address_locality} />
            <Field id="address_region" label="Provincia" defaultValue={settings.address_region} errors={errors?.address_region} />
            <Field
              id="address_postal_code"
              label="Código postal"
              defaultValue={settings.address_postal_code}
              errors={errors?.address_postal_code}
            />
            <Field
              id="address_country"
              label="País (ISO-2)"
              defaultValue={settings.address_country}
              errors={errors?.address_country}
              placeholder="AR"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field
              id="phone_e164"
              label="Teléfono (formato +54911...)"
              defaultValue={settings.phone_e164}
              errors={errors?.phone_e164}
              placeholder="+5491122334455"
            />
            <Field
              id="price_range"
              label="Rango de precio"
              defaultValue={settings.price_range}
              errors={errors?.price_range}
              placeholder="$$$"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="geo_lat" label="Latitud" defaultValue={settings.geo_lat} errors={errors?.geo_lat} placeholder="-34.6037" />
            <Field id="geo_lng" label="Longitud" defaultValue={settings.geo_lng} errors={errors?.geo_lng} placeholder="-58.3816" />
          </div>
          <p className="text-xs text-foreground/40">
            Tip: buscá tu dirección en Google Maps, click derecho sobre el pin y copiá las coordenadas que aparecen
            arriba del menú.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-secondary/20 pt-8">
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
