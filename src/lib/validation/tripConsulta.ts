import { z } from "zod";

/**
 * Consulta/solicitud de una travesía desde la landing pública (no requiere
 * cuenta). El llamado a la acción NO crea una reserva: manda una consulta a
 * la bandeja Mensajes (contact_messages), y el staff crea la reserva desde
 * /admin/reservas. Misma filosofía anti-spam que contactFormSchema: el
 * honeypot `company` pasa cualquier string y es la Server Action la que decide.
 */
export const tripConsultaSchema = z.object({
  trip_id: z.string().uuid("Travesía inválida."),
  name: z.string().trim().min(2, "Ingresá tu nombre completo.").max(120),
  email: z.string().trim().email("Ingresá un email válido."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  participants: z
    .string()
    .trim()
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 10, "Entre 1 y 10 participantes.")
    .transform((v) => Number(v)),
  with_copilot: z.boolean(),
  car_preference: z.string().trim().max(120).optional().or(z.literal("")),
  /** Etiquetas de opcionales de interés (se validan contra los de la travesía en la acción). */
  options: z.array(z.string().trim().max(160)).max(10),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  company: z.string(),
});

export type TripConsultaValues = z.infer<typeof tripConsultaSchema>;
