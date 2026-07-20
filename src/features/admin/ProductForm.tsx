"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { slugify } from "@/lib/utils/format";
import { formatBytes, isImageTooHeavy, exceedsHardLimit, MAX_PRODUCT_IMAGE_BYTES } from "@/lib/utils/image";
import type { Product } from "@/types/database";
import type { ProductActionState } from "@/actions/admin/products";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: ProductActionState = { status: "idle", message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} size="lg">
      {label}
    </Button>
  );
}

export function ProductForm({
  action,
  product,
  submitLabel,
}: {
  action: (prevState: ProductActionState, formData: FormData) => Promise<ProductActionState>;
  product?: Product;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const image = product?.images?.[0];

  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileWarning(null);
    setFileError(null);

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFileError("El archivo tiene que ser una imagen.");
      e.target.value = "";
      return;
    }

    if (exceedsHardLimit(file.size)) {
      setFileError(
        `Pesa ${formatBytes(file.size)}. El máximo permitido es ${formatBytes(MAX_PRODUCT_IMAGE_BYTES)}: elegí una imagen más liviana.`
      );
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
    // Si se elige un archivo, tiene prioridad sobre la URL pegada a mano.
    if (urlInputRef.current) urlInputRef.current.value = "";

    const probe = document.createElement("img");
    probe.onload = () => {
      if (isImageTooHeavy(file.size, probe.naturalWidth, probe.naturalHeight)) {
        setFileWarning(
          `Pesa ${formatBytes(file.size)} (${probe.naturalWidth}×${probe.naturalHeight}px). Para que la web cargue rápido conviene achicarla a menos de ${formatBytes(400 * 1024)} y no más de 2000px de lado. Se puede subir igual.`
        );
      }
    };
    probe.src = objectUrl;
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClasses}>
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.name} />
        </div>
        <div>
          <label htmlFor="slug" className={labelClasses}>
            Slug (URL)
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
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="sku" className={labelClasses}>
            SKU
          </label>
          <input id="sku" name="sku" type="text" required defaultValue={product?.sku} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.sku} />
        </div>
        <div>
          <label htmlFor="status" className={labelClasses}>
            Estado
          </label>
          <select id="status" name="status" defaultValue={product?.status ?? "draft"} className={inputClasses}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="hidden">Oculto</option>
            <option value="discontinued">Discontinuado</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="short_description" className={labelClasses}>
          Descripción corta
        </label>
        <input
          id="short_description"
          name="short_description"
          type="text"
          defaultValue={product?.short_description ?? ""}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.short_description} />
      </div>

      <div>
        <label htmlFor="description" className={labelClasses}>
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={product?.description ?? ""}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.description} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="price" className={labelClasses}>
            Precio
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={product?.price}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.price} />
        </div>
        <div>
          <label htmlFor="sale_price" className={labelClasses}>
            Precio de oferta (opcional)
          </label>
          <input
            id="sale_price"
            name="sale_price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.sale_price ?? ""}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.sale_price} />
        </div>
        <div>
          <label htmlFor="currency" className={labelClasses}>
            Moneda
          </label>
          <select id="currency" name="currency" defaultValue={product?.currency ?? "ARS"} className={inputClasses}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="stock" className={labelClasses}>
            Stock
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.stock}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.stock} />
        </div>
        <div>
          <label htmlFor="low_stock_threshold" className={labelClasses}>
            Umbral de stock bajo
          </label>
          <input
            id="low_stock_threshold"
            name="low_stock_threshold"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.low_stock_threshold ?? 2}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.low_stock_threshold} />
        </div>
      </div>

      <div className="space-y-5 rounded-sm border border-secondary/30 p-5">
        <p className={labelClasses}>Imagen del producto</p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="relative -top-px inline-flex h-32 w-32 items-center justify-center overflow-hidden rounded-sm bg-card">
                {(() => {
                  const previewSrc = filePreview ?? image?.url;
                  if (!previewSrc) {
                    return <span className="text-[11px] text-foreground/30">Sin imagen</span>;
                  }
                  return (
                    <Image
                      src={previewSrc}
                      alt=""
                      fill
                      sizes="128px"
                      className="object-cover"
                      unoptimized={Boolean(filePreview)}
                    />
                  );
                })()}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="image_file" className={labelClasses}>
                Subir un archivo
              </label>
              <input
                id="image_file"
                name="image_file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-sm file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-background hover:file:bg-primary/90"
              />
              {fileError && <p className="mt-2 text-xs text-red-400">{fileError}</p>}
              {fileWarning && !fileError && <p className="mt-2 text-xs text-primary">{fileWarning}</p>}
              <p className="mt-2 text-xs text-foreground/40">Máximo {formatBytes(MAX_PRODUCT_IMAGE_BYTES)}.</p>
            </div>

            <div>
              <label htmlFor="image_url" className={labelClasses}>
                ...o pegar una ruta/URL en su lugar
              </label>
              <input
                ref={urlInputRef}
                id="image_url"
                name="image_url"
                type="text"
                placeholder="/images/productos/ejemplo.webp"
                defaultValue={image?.url ?? ""}
                onFocus={() => {
                  // Si el staff vuelve a tocar la URL, que gane ella sobre el archivo elegido antes.
                  if (filePreview) {
                    URL.revokeObjectURL(filePreview);
                    setFilePreview(null);
                    setFileWarning(null);
                    const fileInput = document.getElementById("image_file") as HTMLInputElement | null;
                    if (fileInput) fileInput.value = "";
                  }
                }}
                className={inputClasses}
              />
              <FieldError errors={state.fieldErrors?.image_url} />
              <p className="mt-2 text-xs text-foreground/40">
                Si subís un archivo, tiene prioridad sobre esta URL.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="image_alt" className={labelClasses}>
            Texto alternativo de la imagen
          </label>
          <input id="image_alt" name="image_alt" type="text" defaultValue={image?.alt ?? ""} className={inputClasses} />
        </div>
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
