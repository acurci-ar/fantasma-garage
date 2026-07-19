import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { getOrderConfirmation } from "@/lib/content/queries";

export const metadata: Metadata = { title: "Pedido confirmado", robots: { index: false, follow: false } };

export default async function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const order = await getOrderConfirmation(id);
  if (!order) notFound();

  return (
    <Section className="pt-32">
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          eyebrow="¡Gracias!"
          title="Pedido recibido"
          description={`Pedido #${order.id.slice(0, 8).toUpperCase()} — te contactamos para coordinar el pago y el envío.`}
        />

        <div className="mt-10 rounded-sm border border-secondary/30 bg-card/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge tone="primary">Pago pendiente</Badge>
            <span className="text-xs text-foreground/40">{formatDate(order.created_at)}</span>
          </div>

          <ul className="mt-6 space-y-3 border-t border-secondary/20 pt-6">
            {order.items.map((item) => {
              const snapshot = item.product_snapshot as { name?: string };
              return (
                <li key={item.id} className="flex justify-between gap-3 text-sm text-foreground/70">
                  <span>
                    {snapshot.name ?? "Producto"} × {item.quantity}
                  </span>
                  <span className="text-foreground">
                    {formatCurrency(item.unit_price * item.quantity, order.currency)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex items-center justify-between border-t border-secondary/20 pt-6 text-sm text-foreground/70">
            <span>Total</span>
            <span className="font-display text-xl text-primary">{formatCurrency(order.total, order.currency)}</span>
          </div>
        </div>

        <p className="mt-8 text-sm text-foreground/60">
          El pago con Mercado Pago todavía no está integrado: nos vamos a comunicar por WhatsApp o email para
          coordinar el pago y el envío de tu pedido.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Button href="/tienda">Seguir comprando</Button>
          <Button href="/contacto" variant="secondary">
            Contactar
          </Button>
        </div>
      </div>
    </Section>
  );
}
