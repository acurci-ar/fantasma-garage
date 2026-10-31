import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(4000)
  .transform((v) => (v === "" ? null : v));

const money = z
  .string()
  .trim()
  .refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0, "Ingresá un monto válido.")
  .transform((v) => Number(v));

/** "Etiqueta | precio" por línea → [{label, price}] (price numérico, 0 si no se indica). */
const optionsField = z.string().transform((v) =>
  v
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label = "", price] = l.split("|").map((s) => s.trim());
      const n = Number((price ?? "").replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", "."));
      return { label, price: Number.isFinite(n) ? n : 0 };
    })
    .filter((o) => o.label)
);

export const reservationSchema = z.object({
  trip_id: z.string().uuid("Elegí una travesía."),
  full_name: z.string().trim().min(2, "Ingresá el nombre del cliente.").max(120),
  email: z.string().trim().email("Ingresá un email válido."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  participants: z
    .string()
    .trim()
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 50, "Entre 1 y 50 participantes.")
    .transform((v) => Number(v)),
  with_copilot: z.boolean(),
  car_preference: z.string().trim().max(160).optional().or(z.literal("")),
  status: z.enum(["solicitada", "lista_espera", "confirmada", "senada", "pagada", "cancelada"]),
  currency: z.enum(["USD", "ARS"]),
  total_amount: money,
  options: optionsField,
  public_notes: optionalText,
  admin_notes: optionalText,
});

export type ReservationFormValues = z.infer<typeof reservationSchema>;

export const paymentSchema = z.object({
  amount: money.refine((n) => n > 0, "El monto debe ser mayor a cero."),
  currency: z.enum(["USD", "ARS"]),
  method: z.enum(["transferencia", "tarjeta", "efectivo", "cripto", "otro"]),
  paid_at: z
    .string()
    .trim()
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "Usá el formato AAAA-MM-DD."),
  reference: z.string().trim().max(160).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

/** Inversa para precargar el textarea de opcionales al editar. */
export const optionsToLines = (items: { label: string; price: number }[] | null | undefined) =>
  (items ?? []).map((o) => `${o.label} | ${o.price}`).join("\n");
