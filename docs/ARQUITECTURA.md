# Fantasma Garage — Plan de arquitectura y decisiones

Resumen previo a la implementación, según lo pedido en la sección 13 del documento fuente (`Fantasma_Garage_Landing_y_Admin_Especificacion.docx`).

## 1. Alcance de esta etapa (Etapa 1: Base + Landing)

Este es un proyecto grande (landing premium + tienda + panel admin + Mercado Pago). Para entregar algo **ejecutable y revisable** en lugar de código a medias, esta primera entrega prioriza:

1. Arquitectura completa del proyecto (carpetas, tipos, acceso a datos).
2. Sistema de diseño (paleta, tipografía, componentes UI base).
3. Landing pública completa: Header, Hero, Servicios, Proceso, Proyectos destacados, Galerías, Video/YouTube, Tienda destacada, Contacto, Footer.
4. Rutas de la arquitectura de información completa (sección 4) navegables, aunque algunas (`/tienda`, `/carrito`, `/cuenta`, `/admin`) muestran una versión funcional mínima o un estado "en construcción" claramente indicado, en vez de un 404.
5. Modelo de datos completo en SQL (todas las tablas de la sección 8), políticas RLS y seed de demostración — listos para aplicarse contra un proyecto Supabase real.
6. Documentación de instalación, variables de entorno y despliegue.

Quedan para próximas etapas (documentado en el README como roadmap): carrito y checkout completo, integración Mercado Pago (Checkout Pro + webhook), panel `/admin` con CRUD real, autenticación completa de "Mi Cuenta", importación/exportación CSV y gestor multimedia avanzado. Los tipos, el modelo de datos y las rutas ya están preparados para que esas etapas se conecten sin rehacer la base.

## 2. Decisiones técnicas

- **Next.js 14 App Router + TypeScript estricto.** Server Components por defecto; Client Components solo donde hay interacción (Navbar con scroll, drawer móvil, formularios, lightbox).
- **Tailwind CSS** con la paleta exacta de la sección 3.1 mapeada como tokens (`background`, `card`, `secondary`, `primary`, `foreground`), más variantes de opacidad para overlays.
- **Supabase** para base de datos, autenticación y storage. Se define `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (Server Components/Actions con cookies vía `@supabase/ssr`) y `lib/supabase/admin.ts` (service role, uso exclusivo en servidor).
- **Capa de acceso a contenido desacoplada (`lib/content/queries.ts`).** Cada función (`getServices`, `getFeaturedProjects`, etc.) intenta leer de Supabase si las variables de entorno están configuradas; si no, usa `lib/content/seed-data.ts` (datos tipados, marcados como demo). Esto permite que el proyecto **corra y se vea completo sin credenciales**, y que baste con configurar `.env.local` para pasar a datos reales — sin tocar los componentes visuales.
- **Zod** para validar formularios y payloads de Server Actions (contacto, login/registro).
- **Sin dependencias de UI de terceros** (no shadcn ni librerías de componentes) para mantener control total sobre la dirección visual "Industrial Heritage Premium" pedida; componentes propios en `components/ui`.

## 3. Sistema de diseño

| Token | Valor | Uso |
|---|---|---|
| `background` | `#070A0D` | Fondo base de toda la app |
| `card` | `#023859` | Tarjetas, paneles, inputs |
| `secondary` | `#03658C` | Bordes, estados hover secundarios, acentos medios |
| `primary` | `#05C7F2` | Énfasis puntual: CTAs, links activos, focus ring — nunca como fondo dominante |
| `foreground` | `#EBF2F2` | Texto principal sobre fondo oscuro |

- Tipografía: display condensada de alto contraste para títulos (`--font-display`, se usa `Oswald` vía `next/font/google` como aproximación libre a una display "Kustom Kulture" compacta), cuerpo en `Inter` (sans-serif legible).
- Animaciones: transiciones 180–320 ms, `prefers-reduced-motion` respetado con `motion-reduce:transition-none` y equivalentes.
- Accesibilidad: anillo de foco visible en `primary`, contraste AA verificado sobre `background`/`card`, targets táctiles mínimos de 44px en botones y links de navegación.

## 4. Mapa de componentes

```
components/ui        Button, Container, Section, SectionHeading, Card, Badge
components/layout     Navbar, MobileDrawer, Footer
features/home         Hero, AuthorityStrip, ServicesGrid, ProcessTimeline,
                       FeaturedProjects, GalleriesShowcase, WorkshopVideos,
                       FeaturedShop, ContactSection
```

## 5. Modelo de datos

Implementado íntegro en `supabase/migrations/0001_init.sql` según la sección 8 del documento (perfiles, roles, productos, variantes, categorías, marcas, pedidos, ítems, movimientos de inventario, proyectos, imágenes de proyecto, galerías, imágenes de galería, videos, servicios, testimonios, mensajes de contacto, configuración del sitio y auditoría). Políticas RLS en `0002_rls_policies.sql`: lectura pública de contenido publicado, escritura restringida a rol `admin`/`editor`, `contact_messages` con insert público y lectura solo admin, `orders`/`order_items` visibles solo para su dueño o admin.

## 6. Recursos visuales

Las 7 fotografías referenciadas por el documento (logo, hero, servicios y
galerías) estaban disponibles en la carpeta `imagenes/` del proyecto y se
importaron directamente a `public/images/` con los mismos nombres de
archivo. El detalle de qué archivo real corresponde a cada uso está en
`public/images/README-IMAGENES.md`.

La carpeta `imagenes/` contiene además más de 1.250 fotos adicionales
(carpetas `Trabajos/`, `SEMA/`, `Amigos/`, `Repuestos/`, `Famosos/`,
`youtube-thumbnails/`, `banner/`) que no forman parte de esta etapa: importar
ese volumen de contenido a proyectos, galerías y catálogo reales es tarea
del gestor multimedia de `/admin` (próxima etapa), no algo para hardcodear
en los seeds de esta entrega.

## 7. Estructura de carpetas final

Ver sección 9.1 del documento; implementada tal cual en `src/`.
