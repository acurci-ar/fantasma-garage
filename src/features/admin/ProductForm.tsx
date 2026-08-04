"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { slugify } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Category, Product } from "@/types/database";
import type { ProductActionState } from "@/actions/admin/products";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const inputErrorClasses = "border-red-500 focus:border-red-500 focus-visible:ring-red-500";

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

function parseNum(v: string): number | null {
  const n = Number(v);
  return v.trim() === "" || Number.isNaN(n) ? null : n;
}

function formatUsd(n: number): string {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ProductForm({
  action,
  product,
  categories,
  /** Solo admin ve/edita la sección de información interna (costos, proveedor) — is_admin() en RLS, más estricto que el is_staff() del resto del form. */
  canSeeInternal,
  submitLabel,
}: {
  action: (prevState: ProductActionState, formData: FormData) => Promise<ProductActionState>;
  product?: Product;
  categories: Category[];
  canSeeInternal: boolean;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // --- Info interna + cálculo de costo/precio sugerido (solo admin) -------
  const internal = product?.internal;
  const [costPrice, setCostPrice] = useState(internal?.cost_price != null ? String(internal.cost_price) : "");
  const [weightKg, setWeightKg] = useState(internal?.weight_kg != null ? String(internal.weight_kg) : "");
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
  const [salePrice, setSalePrice] = useState(product?.sale_price != null ? String(product.sale_price) : "");

  const shippingCost = useMemo(() => (parseNum(weightKg) ?? 0) * 45, [weightKg]);
  const totalCost = useMemo(() => (parseNum(costPrice) ?? 0) + shippingCost, [costPrice, shippingCost]);
  const suggestedPrice = useMemo(
    () => Math.round(((parseNum(costPrice) ?? 0) * 1.12 + shippingCost * 1.5) * 100) / 100,
    [costPrice, shippingCost]
  );
  const hasCostData = parseNum(costPrice) !== null || parseNum(weightKg) !== null;

  // Si el precio está vacío y se cargan datos de costo, se autocompleta con
  // el Precio Sugerido — pedido del smoke test. Sigue siendo editable: en
  // cuanto el staff lo toca, `price` deja de estar vacío y este efecto no
  // vuelve a pisarlo.
  useEffect(() => {
    if (price === "" && hasCostData) setPrice(String(suggestedPrice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedPrice, hasCostData]);

  const priceBelowCost = canSeeInternal && totalCost > 0 && parseNum(price) !== null && (parseNum(price) as number) < totalCost;
  const salePriceBelowCost =
    canSeeInternal && totalCost > 0 && parseNum(salePrice) !== null && (parseNum(salePrice) as number) < totalCost;

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel
            htmlFor="name"
            className={labelClasses}
            help="El nombre del producto tal como lo va a ver el cliente en la tienda."
            example="Kit de suspensión clásica"
          >
            Nombre
          </FieldLabel>
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
          <FieldLabel
            htmlFor="slug"
            className={labelClasses}
            help="La parte final de la URL del producto en la tienda. Se autocompleta desde el nombre; podés editarla."
            example="kit-suspension-clasica"
          >
            Slug (URL)
          </FieldLabel>
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
          <FieldLabel
            htmlFor="sku"
            className={labelClasses}
            help="Código interno único para identificar el producto en stock, pedidos y facturas. Si lo dejás vacío, se completa con el slug."
            example="FG-SUSP-001"
          >
            SKU
          </FieldLabel>
          <input
            id="sku"
            name="sku"
            type="text"
            placeholder={slug || "Se completa con el slug si lo dejás vacío"}
            defaultValue={product?.sku}
            className={inputClasses}
          />
          <p className="mt-1 text-xs text-foreground/40">Si lo dejás vacío, se completa con el slug.</p>
          <FieldError errors={state.fieldErrors?.sku} />
        </div>
        <div>
          <FieldLabel
            htmlFor="status"
            className={labelClasses}
            help="Controla si el producto es visible en la tienda pública."
            example="Publicado para que se vea, Borrador mientras lo estás cargando"
          >
            Estado
          </FieldLabel>
          <select id="status" name="status" defaultValue={product?.status ?? "draft"} className={inputClasses}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="hidden">Oculto</option>
            <option value="discontinued">Discontinuado</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel
            htmlFor="category_id"
            className={labelClasses}
            help="Con qué categoría se filtra este producto en /tienda."
            example="Suspensión"
          >
            Categoría
          </FieldLabel>
          <select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""} className={inputClasses}>
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-foreground/40">
            Editables desde <span className="text-foreground/60">/admin/categorias</span>.
          </p>
        </div>
        <div className="flex items-end pb-3">
          <label className="flex items-center gap-2 text-sm text-foreground/70">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured ?? false}
              className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
            />
            Destacado (aparece en la home)
          </label>
        </div>
      </div>

      <div>
        <FieldLabel
          htmlFor="short_description"
          className={labelClasses}
          help="Frase corta que se ve en la tarjeta del producto dentro del catálogo."
          example="Kit de suspensión de alto rendimiento para muscle cars."
        >
          Descripción corta
        </FieldLabel>
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
        <FieldLabel
          htmlFor="description"
          className={labelClasses}
          help="Texto completo que se muestra en la ficha del producto, con más detalle que la descripción corta."
          example="Incluye amortiguadores, muelles reforzados y bujes de poliuretano. Compatible con..."
        >
          Descripción
        </FieldLabel>
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
          <FieldLabel
            htmlFor="price"
            className={labelClasses}
            help="El precio de venta al público. Si completás la info interna de costos y lo dejás vacío, se sugiere solo."
            example="450000"
          >
            Precio
          </FieldLabel>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={cn(inputClasses, priceBelowCost && inputErrorClasses)}
          />
          {priceBelowCost && (
            <p className="mt-1 text-xs font-semibold text-red-500">
              El precio de venta (USD {formatUsd(parseNum(price) ?? 0)}) es menor al costo del producto (USD{" "}
              {formatUsd(totalCost)}).
            </p>
          )}
          <FieldError errors={state.fieldErrors?.price} />
        </div>
        <div>
          <FieldLabel
            htmlFor="sale_price"
            className={labelClasses}
            help="Si cargás un valor acá, se muestra en la tienda con el precio normal tachado y este destacado como oferta."
            example="380000"
          >
            Precio de oferta (opcional)
          </FieldLabel>
          <input
            id="sale_price"
            name="sale_price"
            type="number"
            min="0"
            step="0.01"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            className={cn(inputClasses, salePriceBelowCost && inputErrorClasses)}
          />
          {salePriceBelowCost && (
            <p className="mt-1 text-xs font-semibold text-red-500">
              El precio de oferta (USD {formatUsd(parseNum(salePrice) ?? 0)}) es menor al costo del producto (USD{" "}
              {formatUsd(totalCost)}).
            </p>
          )}
          <FieldError errors={state.fieldErrors?.sale_price} />
        </div>
        <div>
          <FieldLabel htmlFor="currency" className={labelClasses} help="En qué moneda se expresa el precio y el precio de oferta.">
            Moneda
          </FieldLabel>
          <select id="currency" name="currency" defaultValue={product?.currency ?? "ARS"} className={inputClasses}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel
            htmlFor="stock"
            className={labelClasses}
            help="Cuántas unidades hay disponibles ahora mismo. En 0, la tienda lo muestra como 'A pedido'."
            example="6"
          >
            Stock
          </FieldLabel>
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
          <FieldLabel
            htmlFor="low_stock_threshold"
            className={labelClasses}
            help="Por debajo de esta cantidad, el stock se resalta en el listado del admin como bajo."
            example="2"
          >
            Umbral de stock bajo
          </FieldLabel>
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

      {!product && (
        <p className="rounded-sm border border-secondary/30 bg-card/40 p-4 text-xs text-foreground/50">
          Las fotos se cargan después de crear el producto (próxima pantalla).
        </p>
      )}

      {canSeeInternal && (
        <div className="space-y-5 rounded-sm border border-primary/30 bg-primary/5 p-5">
          <div>
            <p className={labelClasses}>Información interna (solo admin)</p>
            <p className="text-xs text-foreground/50">No se muestra en la tienda pública, ni siquiera a editores.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel
                htmlFor="supplier_name"
                className={labelClasses}
                help="A quién le compraste este producto."
                example="AutoParts USA"
              >
                Proveedor
              </FieldLabel>
              <input
                id="supplier_name"
                name="supplier_name"
                type="text"
                defaultValue={internal?.supplier_name ?? ""}
                className={inputClasses}
              />
            </div>
            <div>
              <FieldLabel
                htmlFor="supplier_link"
                className={labelClasses}
                help="Link a la publicación o página del proveedor, para volver a encontrarla rápido."
                example="https://www.ebay.com/itm/..."
              >
                Link
              </FieldLabel>
              <input
                id="supplier_link"
                name="supplier_link"
                type="text"
                placeholder="https://..."
                defaultValue={internal?.supplier_link ?? ""}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel
                htmlFor="cost_price"
                className={labelClasses}
                help="Lo que efectivamente pagaste por el producto, sin envío. Con esto y el peso se calcula el costo total y el precio sugerido."
                example="120"
              >
                Precio producto (USD, lo que pagaste)
              </FieldLabel>
              <input
                id="cost_price"
                name="cost_price"
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <FieldLabel
                htmlFor="weight_kg"
                className={labelClasses}
                help="Peso del producto, usado para calcular el costo de envío (peso × 45 USD)."
                example="3.5"
              >
                Peso (kg)
              </FieldLabel>
              <input
                id="weight_kg"
                name="weight_kg"
                type="number"
                min="0"
                step="0.001"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <dl className="grid gap-4 border-t border-primary/20 pt-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-foreground/40">Costo envío</dt>
              <dd className="mt-1 text-sm text-foreground/80">USD {formatUsd(shippingCost)}</dd>
              <p className="mt-0.5 text-[11px] text-foreground/35">Peso × 45 USD</p>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-foreground/40">Costo total</dt>
              <dd className="mt-1 text-sm text-foreground/80">USD {formatUsd(totalCost)}</dd>
              <p className="mt-0.5 text-[11px] text-foreground/35">Precio producto + costo envío</p>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-foreground/40">Precio sugerido</dt>
              <dd className="mt-1 text-sm font-semibold text-primary">USD {formatUsd(suggestedPrice)}</dd>
              <p className="mt-0.5 text-[11px] text-foreground/35">Precio producto × 1.12 + costo envío × 1.5</p>
            </div>
          </dl>
          <FieldError errors={state.fieldErrors?.cost_price} />
          <FieldError errors={state.fieldErrors?.weight_kg} />
          <FieldError errors={state.fieldErrors?.supplier_link} />
        </div>
      )}

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
