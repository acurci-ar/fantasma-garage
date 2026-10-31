import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { needsUnoptimizedImage } from "@/lib/utils/image";
import type { TripDay } from "@/types/trips";

function Chip({ icon, children }: { icon: "bed" | "fork" | "road"; children: React.ReactNode }) {
  const paths = {
    bed: "M3 14V7a1 1 0 0 1 1-1h3a2 2 0 0 1 2 2v1h5a3 3 0 0 1 3 3v2M3 14h14M3 14v2M17 14v2",
    fork: "M6 2v6a2 2 0 0 0 2 2v8M8 2v6M4 2v6M14 2c-1.5 0-3 2-3 5v3h3v8",
    road: "M4 18 8 2M16 18 12 2M10 4v2M10 9v2M10 14v2",
  };
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-secondary/40 bg-background/60 px-3 py-1.5 text-xs text-foreground/75">
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d={paths[icon]} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
      </svg>
      {children}
    </span>
  );
}

function DayBlock({ day, index }: { day: TripDay; index: number }) {
  const reverse = index % 2 === 1;
  const number = day.day_label.replace(/\D/g, "") || String(index);

  return (
    <article
      id={`dia-${number}`}
      className="relative grid items-center gap-8 border-t border-secondary/20 py-14 lg:grid-cols-12 lg:gap-12 lg:py-20"
    >
      {/* Imagen principal + secundaria superpuesta */}
      <div className={cn("relative lg:col-span-7", reverse && "lg:order-2")}>
        {day.image_url ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-card sm:aspect-[16/10]">
            <Image
              src={day.image_url}
              alt={day.title}
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
              unoptimized={needsUnoptimizedImage(day.image_url)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            {day.image_credit && (
              <span className="absolute bottom-2 right-3 text-[10px] uppercase tracking-wide text-foreground/40">
                {day.image_credit}
              </span>
            )}
          </div>
        ) : (
          <div className="aspect-[16/10] rounded-sm bg-card" />
        )}
        {day.secondary_image_url && (
          <div
            className={cn(
              "absolute -bottom-6 hidden w-[42%] overflow-hidden rounded-sm border-4 border-background shadow-2xl sm:block",
              reverse ? "-left-4 lg:-left-8" : "-right-4 lg:-right-8"
            )}
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={day.secondary_image_url}
                alt=""
                fill
                sizes="25vw"
                className="object-cover"
                unoptimized={needsUnoptimizedImage(day.secondary_image_url)}
              />
            </div>
          </div>
        )}
        {/* Número de día gigante, decorativo */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-10 select-none font-display text-[7rem] leading-none text-foreground/[0.06] sm:text-[9rem] lg:-top-14 lg:text-[11rem]",
            reverse ? "right-0" : "left-0"
          )}
        >
          {number.padStart(2, "0")}
        </span>
      </div>

      {/* Texto */}
      <div className={cn("relative lg:col-span-5", reverse && "lg:order-1")}>
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {day.day_label}
          {day.date_label && (
            <>
              <span className="h-px w-6 bg-primary/60" aria-hidden="true" />
              <span className="text-foreground/60">{day.date_label}</span>
            </>
          )}
        </p>
        <h3 className="mt-4 font-display text-3xl uppercase leading-tight tracking-tight text-foreground sm:text-4xl">
          {day.title}
        </h3>
        <p className="mt-5 text-base leading-relaxed text-foreground/75">{day.description}</p>

        {day.highlights.length > 0 && (
          <ul className="mt-6 space-y-2.5">
            {day.highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-sm text-foreground/80">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {h}
              </li>
            ))}
          </ul>
        )}

        {(day.lodging || day.meals || day.distance_km) && (
          <div className="mt-7 flex flex-wrap gap-2">
            {day.lodging && <Chip icon="bed">{day.lodging}</Chip>}
            {day.meals && <Chip icon="fork">{day.meals}</Chip>}
            {day.distance_km ? <Chip icon="road">{day.distance_km} km al volante</Chip> : null}
          </div>
        )}
      </div>
    </article>
  );
}

export function TripDays({ days }: { days: TripDay[] }) {
  return (
    <div className="mt-6">
      {days.map((day, i) => (
        <DayBlock key={day.id} day={day} index={i} />
      ))}
    </div>
  );
}
