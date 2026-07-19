# Fantasma Garage

Landing pública y base de administración de tienda para Fantasma Garage —
atelier de restauración de autos clásicos y muscle cars de colección.

Implementado según `Fantasma_Garage_Landing_y_Admin_Especificacion.docx`.
Ver el resumen de arquitectura y alcance de esta entrega en
[`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md) — **léelo primero**, explica
qué está construido en esta etapa y qué queda para las siguientes.

## Stack

- Next.js 14 (App Router) + TypeScript estricto
- Tailwind CSS (paleta oficial de marca)
- Supabase (base de datos, autenticación, storage) — opcional en esta etapa
- Zod para validación de formularios

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- (Opcional) Cuenta de Supabase para conectar datos reales

## Instalación local

```bash
cd fantasma-garage
npm install
npm run dev
```

Abrí http://localhost:3000. **El proyecto funciona sin ninguna configuración
adicional**: usa datos de demostración definidos en
`src/lib/content/seed-data.ts` (marcados como tal en el propio código y en
la UI). Esto permite revisar el diseño y la navegación completa sin depender
de credenciales.

## Imágenes

Las 7 fotografías que pedía el documento (logo, hero, servicios y
galerías) ya están importadas en `public/images/` desde tu carpeta
`imagenes/`. Esa carpeta tiene además más de 1.250 fotos sin usar todavía
(`Trabajos/`, `SEMA/`, `Amigos/`, `Repuestos/`, `Famosos/`...) — ver el
detalle y cómo sumar más en
[`public/images/README-IMAGENES.md`](./public/images/README-IMAGENES.md).

## Conectar Supabase (datos reales)

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Copiá `.env.example` a `.env.local` y completá:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
   (Dashboard de Supabase → Project Settings → API)
3. Aplicá las migraciones, en orden, desde el SQL Editor del dashboard o con
   la CLI de Supabase:
   ```bash
   supabase link --project-ref <tu-project-ref>
   supabase db push
   ```
   o pegando manualmente el contenido de:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls_policies.sql`
   - `supabase/seed.sql` (datos de demostración, opcional)
4. Reiniciá `npm run dev`. La capa de datos (`src/lib/content/queries.ts`)
   detecta automáticamente las variables de entorno y pasa a consultar
   Supabase en vez de los datos locales — no hay que tocar componentes.
5. Para tener tu primer usuario administrador: registrate desde `/registro`
   y luego, en el SQL Editor de Supabase:
   ```sql
   update public.profiles set role = 'admin' where id = '<tu-user-id>';
   ```
   (el user id está en Authentication → Users del dashboard).

## Variables de entorno

Ver [`.env.example`](./.env.example) para la lista completa, sin secretos.
Incluye las variables de Mercado Pago y YouTube Data API ya preparadas para
la próxima etapa, aunque todavía no se usan en el código.

## Scripts

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción
npm run start      # servir el build de producción
npm run typecheck  # chequeo de TypeScript sin emitir archivos
npm run test       # tests unitarios (node --test) sobre utilidades puras
```

## Despliegue en Vercel

1. Subí el proyecto a un repositorio Git (GitHub, GitLab o Bitbucket).
2. Importá el repo en [vercel.com/new](https://vercel.com/new).
3. Configurá las variables de entorno de `.env.example` en Vercel → Project
   Settings → Environment Variables (como mínimo las de Supabase si querés
   datos reales en producción).
4. Deploy. Vercel detecta Next.js automáticamente, no requiere configuración
   adicional.

## Qué incluye esta etapa (Etapa 1: Base + Landing)

- Arquitectura completa del proyecto, sistema de diseño y componentes UI.
- Landing pública completa: Header, Hero, Servicios, Proceso, Proyectos
  destacados, Galerías (SEMA/Amigos/Trabajos con lightbox accesible),
  Videos con fachada de YouTube (lazy load), Tienda destacada, Contacto,
  Footer.
- Todas las rutas de la arquitectura de información (sección 4 del
  documento) navegables: las de tienda/cuenta/admin muestran una versión
  funcional mínima o un estado "próxima etapa" coherente con el diseño, en
  vez de un 404.
- Catálogo de tienda de solo lectura, con búsqueda y ficha de producto.
- Formulario de login/registro conectado a Supabase Auth (si está
  configurado).
- Formulario de contacto con Server Action, validación Zod, honeypot
  anti-spam, e inserción en `contact_messages` cuando hay Supabase.
- Modelo de datos completo (todas las tablas de la sección 8), políticas
  RLS por rol y seed de demostración, listos para Supabase.
- SEO: metadata estática y dinámica, Open Graph, JSON-LD (AutoRepair,
  BreadcrumbList, Product, VideoObject), sitemap.xml, robots.txt, 404
  coherente con el diseño.
- Middleware que protege `/admin` verificando sesión server-side (no solo
  ocultando botones en el cliente).

## Roadmap — próximas etapas

No incluido todavía, preparado para conectarse sin rehacer la base (tipos,
modelo de datos y rutas ya existen):

1. **Tienda completa**: carrito persistente (drawer, cantidades,
   subtotal), checkout con Mercado Pago Checkout Pro (preference creada
   server-side), retornos success/pending/failure, webhook idempotente.
2. **Panel `/admin` completo**: CRUD de productos/inventario, pedidos y
   pagos, proyectos, galerías, videos, testimonios, banners y
   configuración de Home; dashboard con KPIs; auditoría de acciones
   sensibles.
3. **Mi Cuenta**: perfil, direcciones, historial de pedidos.
4. **Gestor multimedia**: subida múltiple, recorte, conversión a
   WebP/AVIF, alt text y crédito.
5. **YouTube Data API**: sincronización automática de la playlist con
   fallback manual (ya soportado por el modelo de datos vía `videos.source`).
6. **Importación/exportación CSV** de catálogo.

## QA

Ver [`docs/QA-CHECKLIST.md`](./docs/QA-CHECKLIST.md) para el checklist
manual de esta etapa.

## Estructura del proyecto

```
src/
  app/            rutas (App Router)
  components/     ui/ (Button, Card, Section...) y layout/ (Navbar, Footer)
  features/home/  secciones de la landing y componentes de interacción
  lib/
    supabase/     clientes browser/server/admin
    content/      seed-data.ts (demo) + queries.ts (Supabase con fallback)
    validation/   esquemas Zod
    utils/        formato, slugs, YouTube
  actions/        Server Actions (contacto)
  types/          tipos de dominio (mirror del modelo de datos SQL)
supabase/
  migrations/     esquema + RLS
  seed.sql        datos de demostración
public/images/    fotos reales importadas + guía de imágenes disponibles
docs/             arquitectura y checklist de QA
tests/            tests unitarios sobre utilidades puras
```

## Nota sobre verificación en este entorno

El proyecto se construyó y probó parcialmente en un entorno de desarrollo
en sandbox cuyo `npm install` completo no llegó a terminar de forma
confiable (limitaciones de tiempo/IO del entorno, no del proyecto en sí).
Puede haber quedado una carpeta `node_modules/` y `.npm-cache/` parciales o
corruptas en este mismo directorio: **borralas antes de instalar** —

```bash
rm -rf node_modules .npm-cache package-lock.json
npm install
```

Se verificó en este entorno:

- `npm run test` — 7/7 tests unitarios sobre utilidades puras.
- Sintaxis y grafo de módulos de **las 56 rutas/archivos de `src/app` y
  `src/middleware.ts`** (100% de las páginas), bundleados con esbuild sin
  errores de resolución de imports/exports ni de JSX/TypeScript.
- Revisión manual de compatibilidad de API con Next.js 14.2 (`params` y
  `cookies()` síncronos, no las versiones `Promise` de Next 15 — se
  encontró y corrigió este desajuste en 3 rutas dinámicas).

Lo que **no** se pudo correr en este entorno es `tsc --noEmit` completo (con
chequeo de tipos cruzados entre archivos) ni `next build`, porque `npm
install` no llegó a completarse de forma confiable. Igualmente, como primer
paso en tu máquina, corré `npm install && npm run typecheck && npm run
build` para confirmar que todo compila en tu entorno antes de desplegar, y
reportá cualquier ajuste menor que haga falta.
