"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/CartContext";
import { createOrder } from "@/actions/checkout";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/format";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

export interface CheckoutFormInitialValues {
  fullName?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

export function CheckoutForm({ initialValues }: { initialValues?: CheckoutFormInitialValues }) {
  const { items, subtotal, currency, clear } = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-secondary/30 bg-card/40 p-10 text-center">
        <p className="text-sm text-foreground/60">Tu carrito está vacío.</p>
        <div className="mt-6">
          <Button href="/tienda">Ir a la tienda</Button>
        </div>
      </div>
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors(undefined);

    const form = new FormData(e.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      street: String(form.get("street") ?? ""),
      city: String(form.get("city") ?? ""),
      province: String(form.get("province") ?? ""),
      postalCode: String(form.get("postalCode") ?? ""),
      notes: String(form.get("notes") ?? ""),
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    };

    startTransition(async () => {
      const result = await createOrder(payload);
      if (result.status === "error") {
        setError(result.message);
        setFieldErrors(result.fieldErrors);
        return;
      }
      clear();
      router.push(`/pedido/${result.orderId}`);
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className={labelClasses}>
              Nombre completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={initialValues?.fullName ?? ""}
              className={inputClasses}
            />
            <FieldError errors={fieldErrors?.fullName} />
          </div>
          <div>
            <label htmlFor="email" className={labelClasses}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={initialValues?.email ?? ""}
              className={inputClasses}
            />
            <FieldError errors={fieldErrors?.email} />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className={labelClasses}>
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={initialValues?.phone ?? ""}
            className={inputClasses}
          />
          <FieldError errors={fieldErrors?.phone} />
        </div>

        <div>
          <label htmlFor="street" className={labelClasses}>
            Dirección de envío
          </label>
          <input
            id="street"
            name="street"
            type="text"
            placeholder="Calle y número"
            required
            defaultValue={initialValues?.street ?? ""}
            className={inputClasses}
          />
          <FieldError errors={fieldErrors?.street} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="city" className={labelClasses}>
              Localidad
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              defaultValue={initialValues?.city ?? ""}
              className={inputClasses}
            />
            <FieldError errors={fieldErrors?.city} />
          </div>
          <div>
            <label htmlFor="province" className={labelClasses}>
              Provincia
            </label>
            <input
              id="province"
              name="province"
              type="text"
              required
              defaultValue={initialValues?.province ?? ""}
              className={inputClasses}
            />
            <FieldError errors={fieldErrors?.province} />
          </div>
          <div>
            <label htmlFor="postalCode" className={labelClasses}>
              Código postal
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              required
              defaultValue={initialValues?.postalCode ?? ""}
              className={inputClasses}
            />
            <FieldError errors={fieldErrors?.postalCode} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClasses}>
            Notas para la entrega (opcional)
          </label>
          <textarea id="notes" name="notes" rows={3} className={inputClasses} />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" loading={isPending} className="w-full sm:w-auto">
            Confirmar pedido
          </Button>
          {error && (
            <p role="status" aria-live="polite" className="text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        <p className="text-xs text-foreground/40">
          Todavía no está integrado el pago con Mercado Pago: tu pedido queda registrado como pendiente de
          pago y nos contactamos para coordinarlo.
        </p>
      </form>

      <aside className="h-fit rounded-sm border border-secondary/30 bg-card/40 p-6">
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Tu pedido</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={`${item.productId}-${item.variantId ?? "base"}`}
              className="flex justify-between gap-3 text-sm text-foreground/70"
            >
              <span>
                {item.name} × {item.quantity}
              </span>
              <span className="text-foreground">{formatCurrency(item.unitPrice * item.quantity, item.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-secondary/20 pt-4 text-sm text-foreground/70">
          <span>Subtotal</span>
          <span className="font-display text-lg text-foreground">{formatCurrency(subtotal, currency)}</span>
        </div>
      </aside>
    </div>
  );
}
