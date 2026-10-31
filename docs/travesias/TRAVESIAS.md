# Travesías — módulo y costos de la Travesía Ruta 66

Nueva entrada del sitio: **Travesías** (viajes premium en autos clásicos). Este documento
cubre (1) cómo funciona el módulo en el código y (2) la investigación de costos reales de la
primera travesía (Ruta 66 / SEMA 2027), con fuentes. La planilla con el modelo económico
completo está en `docs/travesias/Travesia_Ruta66_Costos.xlsx`.

---

## 1. El módulo en el sitio

| Pieza | Archivo(s) |
|---|---|
| Modelo de datos + RLS + bucket `trip-images` + carga inicial | `supabase/migrations/0023_trips.sql` |
| Tipos | `src/types/trips.ts` |
| Acceso a datos (Supabase con fallback a demo) | `src/lib/content/trips.ts`, `src/lib/content/seed-trips.ts` |
| Páginas públicas | `src/app/travesias/page.tsx` (listado), `src/app/travesias/[slug]/page.tsx` (landing) |
| Componentes de la landing | `src/features/trips/*` (hero, días, mapa SVG, incluye, formulario de reserva, barra fija) |
| Admin | `src/app/admin/travesias/**`, `src/features/admin/Trip*.tsx`, `src/actions/admin/trips.ts`, `src/lib/validation/admin/trip.ts` |
| Menú / footer / sitemap | `Navbar.tsx` y `Footer.tsx` reciben `showTravesias`; `layout.tsx` lo calcula con `getMenuTrips()` |

**Cómo aparece (o no) en el menú.** El link "Travesías" se muestra solo si existe al menos una
travesía con `status = published` **y** `show_in_menu = true`. Desde `/admin/travesias` hay
botones rápidos *Publicar / Pasar a borrador* y *Mostrar en menú / Sacar del menú*. Los
borradores no se ven para el público, pero el staff logueado sí puede abrir `/travesias/<slug>`
para previsualizarlos (aparece una etiqueta "Borrador").

**Travesías parametrizadas.** Todo el contenido de la landing sale de la base: hero (título,
antetítulo, subtítulo, resumen, portada), fechas, duración, precio y cupos, destacados,
"qué incluye / no incluye", opcionales, paradas del mapa (nombre, lat, lng, día) y un bloque por
día (`trip_days`: título, relato, actividades, alojamiento, comidas, km, foto principal y
secundaria). Las listas se cargan "una línea por ítem"; los campos compuestos se separan con `|`.

**Reservas.** El botón del CTA abre un formulario que reutiliza la Server Action de contacto:
el pedido llega a `/admin/mensajes` con asunto `Reserva: <travesía>`. Si se carga una
`cta_url` (por ejemplo un link de pago), el botón lleva ahí en vez del formulario.

**Imágenes.** Se pueden subir archivos (van al bucket `trip-images`, con miniatura WebP como
el resto del sitio) o pegar URLs. Se habilitó `images.unsplash.com` en `next.config.mjs`
(remotePatterns y CSP `img-src`). Las fotos de demostración son de Unsplash (licencia libre) y
llevan crédito; conviene reemplazarlas por material propio del primer viaje.

**Mapa.** Es un SVG generado a partir de las paradas (sin tiles ni librerías externas, para
respetar la CSP del sitio), con botón "Abrir en Google Maps" que arma la ruta real.

### Puesta en marcha

1. Aplicar `supabase/migrations/0023_trips.sql` (`supabase db push` o pegar en el SQL Editor).
   Crea las tablas, el bucket y carga la Travesía Ruta 66 **publicada y en el menú**, más
   "Europa" y "Ruta 40" como borradores para completar.
2. `npm install` limpio (ver nota del README: el `node_modules` actual está incompleto).
3. Revisar la travesía en `/admin/travesias` → Editar; ajustar textos, precio y fotos.

Se corrigió además un import faltante en `src/actions/account.ts` (`getSiteUrl`) que rompía
`tsc`/`next build` desde el último refactor.

---

## 2. Investigación de costos — Travesía Ruta 66 (SEMA 2027)

Precios relevados en octubre de 2026 (USD). Para noviembre de 2027 la planilla aplica un
ajuste del 6 % (inflación + semana SEMA, la de mayor demanda hotelera del año en Las Vegas).

### Autos clásicos (alquiler en Las Vegas)
- **777 Exotics Las Vegas**: 1965 Mustang Convertible USD 449/día; 1966 Mustang GT350 y 1969
  Mustang USD 499/día; '68 Chevelle, '71 Buick GS y '77 Trans Am USD 449/día (tarifa 24 h).
  Fuente: https://777exoticslv.com/classic-car-rentals/
- **Ride Free** (1969 Camaro): USD 499/día, 150 millas/día incluidas, USD 0,75/milla extra;
  exige póliza primaria. Fuente: https://ridefree.com/rent-a-chevy-camaro-classic-muscle-car
- Seguro suplementario (daño + RC): referencias Bonzah/RentalCover USD 7–15/día por daño; con
  RC hasta USD 1M y recargo por vehículo de colección se presupuestan USD 45/día.
  Fuente: https://www.thetraveler.org/bonzah-vs-rentalcover-which-rental-car-insurance-wins/
- **Supuesto de modelo**: USD 475/día × 5 días por auto. Con 15 autos hay que negociar una
  flota con 2–3 proveedores (ninguno tiene 15 clásicos disponibles).

### Hoteles (por habitación y noche, con impuestos y resort fee)
| Noche | Hotel | Referencia | Fuente |
|---|---|---|---|
| jue 4 y vie 5 | The Venetian | USD 360 (dom–jue) / 457 (vie–sáb) + resort fee 45 + 13,38 % = 51,02 | [KAYAK](https://www.kayak.com/Las-Vegas-Hotels-The-Venetian-Resort-Las-Vegas.31420.ksp), [feelingvegas](https://www.feelingvegas.com/does-the-venetian-las-vegas-have-a-resort-fee/) |
| sáb 6 | Boulder Dam Hotel (1933) | USD 88–166; fin de semana ≈ 146 | [KAYAK](https://www.kayak.com/Boulder-City-Hotels-Boulder-Dam-Hotel.3239.ksp) |
| dom 7 | El Rancho Motel / Lodge on Route 66, Williams | USD 91–146; octubre ≈ 131 | [KAYAK](https://www.kayak.com/Williams-Hotels-El-Rancho-Motel.78717.ksp) |
| lun 8 | El Tovar (1905) | "varios cientos de dólares" + 6,9 %; reservas abren 13 meses antes | [getcostidea](https://getcostidea.com/how-much-does-it-cost-to-stay-at-el-tovar-hotel-grand-canyon-rates-fees/) |
| mar 9 | Circa Resort (Downtown) | resort fee USD 50; Golden Nugget 46 | [Las Vegas Advisor](https://www.lasvegasadvisor.com/resort-fees-downtown/) |
| mié 10 | Bellagio Fountain View | USD 229–299 entre semana + fee 55 (+ imp. ≈ 62) | [lasvegaswonders](https://lasvegaswonders.com/?p=8834) |

**Sobre el Venetian:** sí hay margen. Las dos noches cuestan ≈ USD 1.100 por participante
(3,7 % del precio) y resuelven el "impacto del primer día" y la cercanía al SEMA (5 minutos
del Convention Center). La regla que planteaste es correcta: si se cena en el Venetian conviene
dormir ahí; bajar de categoría después se nota. Por eso el cierre es en el Bellagio (donde
está "O"), no en un hotel menor.

**¿Qué es el Strip?** Es el tramo de Las Vegas Boulevard (unos 6,8 km) donde están los grandes
casinos-resort: Venetian, Bellagio, Caesars, Wynn, etc. "Fuera del Strip" = Downtown (Fremont
Street, casinos históricos, Museo del Neón) u otros barrios; por eso la noche 5 va a Circa, en
Fremont, a 5 minutos del Museo del Neón.

### Actividades
- **SEMA Show viernes público (2026)**: USD 130 solo piso; USD 170 con concierto SEMA Fest.
  **No es gratuito** en 2026; verificar política 2027.
  Fuente: https://theweeklydriver.com/2026/10/sema-show-2026-complete-guide/
- **Hoover Dam**: Dam Tour oficial USD 30 pp / Powerplant USD 15 (último tour 15:30 → el
  "atardecer" es en miradores y el puente O'Callaghan–Tillman). Tour privado de grupo desde
  Las Vegas: USD 823 pp para 2 personas (baja con más pax).
  Fuentes: https://www.maxtour.co/how-much-are-tours-from-las-vegas-to-the-hoover-dam/ ,
  https://www.expedia.com/things-to-do/private-group-hoover-dam-highlights-tour-from-las-vegas.a4590436.activity-details
- **Helicóptero Gran Cañón (borde sur, Papillon)**: North Canyon 25–30' desde USD 309;
  Grand Kingdom 40–50' desde USD 359. Recomendación: borde sur de 45' (ya están en El Tovar);
  los vuelos con aterrizaje son solo desde West Rim/Las Vegas y arrancan en USD 500+ con un
  día entero de traslado. Fuente: https://papillon.com/las-vegas-tours/south-rim/helicopter
- **Ingreso al Gran Cañón**: USD 35 por vehículo + **USD 100 por persona no residente**
  (política NPS vigente desde 1-ene-2026 en 11 parques; pase anual no residente USD 250).
  Fuente: https://www.flyingdawnmarie.com/new-blog/national-park-pass-changes-2026
- **Barbacoa western privada**: catering BBQ premium ≈ USD 123 por invitado (cortes premium,
  ahumados, servicio completo); se presupuesta USD 125 pp + USD 3.000 fijos (rancho, fogón,
  música en vivo, montaje). Fuente: https://latestcost.com/bbq-25-guests-cost-price/
- **Experiencia de pista**: SpeedVegas 5 vueltas Lamborghini/Ferrari USD 399, Porsche GT4 RS
  349, AMG GT R 299; Exotics Racing 20 vueltas Corvette Z06 USD 899. Se presupuesta USD 750 pp
  (2 autos × 5 vueltas). Fuentes: https://lasvegaswonders.com/?p=9456 ,
  https://www.lasvegasadvisor.com/things-to-do/exotics-racing/
- **Museo del Neón**: nocturna USD 35 + tour guiado USD 15; privados a cotizar.
  Fuente: https://neonmuseum.org/news/how-much-does-it-cost-to-visit-the-neon-museum/
- **Valle de Fuego**: USD 15 por vehículo de otro estado.
  Fuente: https://thebettervacation.com/de/Las-Vegas/Tal-des-Feuers/
- **Cirque du Soleil "O"**: USD 109 a más de 250 según fecha y ubicación (opcional).
  Fuente: https://thebettervacation.com/las-vegas/best-shows-in-las-vegas/

### Comidas (por persona, con impuestos y propina)
- Golden Steer: cortes USD 60–85 + ≈ 40 en guarniciones/propina → USD 150 con bebida.
  Steakhouses premium del Strip: cortes USD 75–150. Fuente: https://lasvegaswonders.com/las-vegas-steakhouse-prices/
- Hard Rock Café (menú "Electric" 3 pasos): USD 66,25 con propina 18 %.
  Fuente: https://www.expedia.com/things-to-do/comer-en-el-hard-rock-cafe-las-vegas-strip.a438498.detalles-actividades
- Resto (diner Kingman USD 28, Boulder City 35/70, Williams 60, El Tovar 45, speakeasy 140,
  cena de cierre 200, desayunos 30): supuestos razonables para el nivel del viaje.

### Vuelos, traslados, seguros, combustible
- **EZE–LAS turista**: promedio 12 meses USD 984, rango 886–1.223, ofertas nov. 1.001–1.151;
  sin directos, 1–3 escalas (AA vía DFW ≈ 18 h). Se presupuesta USD 1.150.
  Fuente: https://www.kayak.com/flight-routes/Buenos-Aires-Ministro-Pistarini-EZE/Las-Vegas-McCarran-LAS
- **Business**: promedio EE.UU.–Buenos Aires USD 3.988 → upgrade ≈ USD 2.850 de costo,
  precio sugerido USD 3.300. Fuente: https://www.kayak.com/flight-routes/Business-Class-United-States-US0/Buenos-Aires-BUE.bc.ksp
- **Sprinter con chofer** (hasta 14 pax): aeropuerto → Strip USD 550; USD 240/h mínimo 3 h.
  Fuente: https://www.detaileddrivers.com/locations/las-vegas/sprinter-van-rental
- **Vehículo de apoyo** (pickup F-150/SUV): ≈ USD 60–95/día (octubre es el mes más caro).
  Fuente: https://www.kayak.co.uk/Las-Vegas-Pick-up-truck-Car-Hire.35107.cpk.ksp
- **Asistencia al viajero**: cotizaciones Assist Card ≈ AR$ 9.700/día (ene-2026, con promo);
  se presupuestan USD 9/día × 9 días. Fuente: https://www.assistcard.com/ar/seguro-de-viaje-estados-unidos
- **Combustible**: AAA oct-2026 Nevada USD 5,33/gal (Las Vegas 5,38), Arizona 4,55 → USD 5,00
  promedio. Con 1.350 km por auto y 12 mpg (V8 carburado) ≈ 70 galones ≈ **USD 350 por auto**,
  es decir ≈ USD 0,26 por km. Fuentes: https://www.fox5vegas.com/2026/10/22/aaa-nevada-data-shows-gas-prices-falling/ ,
  https://ktar.com/arizona-news/gas-prices-drop-over-10-cents-in-arizona
- **Mecánico y fotógrafo/videógrafo**: son staff (Javier, Jorge). Costo = pasaje turista,
  hotel y comidas (incluidos como fijos) + USD 3.000 de producción (equipo, drone fuera del
  parque, edición, música) + USD 900 de herramientas/repuestos.

### Resultado (hoja "Margen y rentabilidad")
| | 5 participantes | 15 participantes |
|---|---|---|
| Ingresos | USD 150.000 | USD 450.000 |
| Costos fijos | ≈ 24.600 | ≈ 27.800 |
| Costos variables | ≈ 61.700 | ≈ 165.400 |
| Contingencia 8 % + financieros 3 % | ≈ 11.400 | ≈ 29.000 |
| **Costo total** | **≈ 97.800** | **≈ 222.100** |
| Costo por participante | ≈ 19.600 | ≈ 14.800 |
| **Margen bruto** | **≈ 52.200 (35 %)** | **≈ 227.900 (51 %)** |

El punto de equilibrio es de 2 participantes: los costos fijos son bajos porque el staff viaja
en turista y rota como acompañante. El precio de USD 30.000 deja margen incluso en el primer
viaje de 5; a partir de 15 el negocio escala bien porque hoteles, comidas y autos son
variables y los fijos casi no cambian.

### Riesgos y cosas a confirmar
1. **Flota de clásicos**: 15 autos a la vez exige contrato anticipado con 2–3 rentadoras y
   depósitos (USD 2.500–5.000 por auto, reembolsables). Pedir cláusula de kilometraje libre.
2. **El Tovar**: abrir reserva en octubre de 2026 (13 meses antes) para 8–17 habitaciones.
3. **SEMA**: entrada del viernes paga en 2026 (USD 130); confirmar 2027.
4. **Recargo NPS no residente** (USD 100 pp): política nueva, puede cambiar.
5. **Licencias**: licencia argentina + permiso internacional; edad mínima de las rentadoras
   (en general 25 años) y tarjeta de crédito a nombre de cada conductor.
6. **Drones**: prohibidos dentro del Parque Nacional del Gran Cañón.
