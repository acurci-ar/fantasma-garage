import type { Trip } from "@/types/trips";

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-primary">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-foreground/35">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function TripIncludes({ trip }: { trip: Trip }) {
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-primary">Qué incluye</h3>
        <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {trip.includes.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85">
              <Check />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-10 lg:col-span-5">
        {trip.excludes.length > 0 && (
          <div>
            <h3 className="font-display text-sm uppercase tracking-[0.2em] text-foreground/50">No incluye</h3>
            <ul className="mt-5 space-y-3">
              {trip.excludes.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/60">
                  <Cross />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {trip.optionals.length > 0 && (
          <div className="rounded-sm border border-secondary/40 bg-card/40 p-6">
            <h3 className="font-display text-sm uppercase tracking-[0.2em] text-primary">Opcionales</h3>
            <ul className="mt-4 divide-y divide-secondary/20">
              {trip.optionals.map((o) => (
                <li key={o.label} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                  <span className="text-foreground/85">{o.label}</span>
                  {/* Igual que el precio base: los importes de los opcionales
                      se muestran solo si el admin activó show_price. */}
                  <span className="shrink-0 font-display uppercase tracking-wide text-foreground/60">
                    {trip.show_price ? o.price : "Consultar"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
