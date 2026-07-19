# Imágenes

Las fotografías reales del documento de especificación **sí estaban
disponibles** en tu carpeta de proyecto (`imagenes/`) y ya se importaron
acá, **optimizadas para web** (redimensionadas + convertidas a WebP):

| Archivo en `public/images/` | Origen real (`imagenes/...`) | Peso original → optimizado | Usado en |
|---|---|---|---|
| `logo/fantasma-logo-800.webp` | `logo/fantasma-logo-800.jpg` | 118 KB → 27 KB (400×400) | Navbar, Footer, favicon |
| `hero/hangar.webp` | `Epicas/Hangar.png` | 2111 KB → 145 KB (1402×1122) | Hero de la Home |
| `productos/suspension.webp` | `Epicas/Suspención.png` | 1928 KB → 82 KB (1000×1000) | Producto/servicio de suspensión |
| `productos/motor.webp` | `Epicas/Motor.png` | 2424 KB → 128 KB (1000×1000) | Producto/servicio de motor |
| `galeria/detalles.webp` | `Epicas/Detalles.png` | 2458 KB → 153 KB (1000×1000) | Galería SEMA / proceso |
| `galeria/mecanica.webp` | `Epicas/Mecanica.png` | 2444 KB → 170 KB (1000×1000) | Galería Amigos / proceso mecánica |
| `galeria/chapa.webp` | `Epicas/Chapa.png` | 2459 KB → 117 KB (1000×1000) | Galería Trabajos / proceso chapa |
| `galeria/trabajos.webp` | `Trabajos/Da6aDXkFGPI_1.webp` | 235 KB → 160 KB (1000×1000) | Portada genérica de "Trabajos" y proyecto destacado — foto de ejemplo, hay 897 más para elegir |

**Total: 13,85 MB → 0,96 MB** (≈93% menos peso). Redimensionado con Pillow:
tope de 1000 px de lado más largo para fotos de tarjeta/galería (se ven a
como mucho ~33–50vw en pantalla), 1920 px para el hero (full-bleed) y 400 px
para el logo (se muestra a 40–44 px), todo recodificado a WebP calidad
80–85. `next/image` sigue optimizando/redimensionando al vuelo por
breakpoint arriba de esta base ya liviana.

Quedan además, sin usar todavía en el código, varios archivos `.svg`/`.png`/`.jpg`
de intentos anteriores (placeholders generados y los originales sin
comprimir) — podés borrarlos, no están referenciados en ningún componente.

## Hay mucho más material disponible sin usar

Tu carpeta `imagenes/` tiene bastante más de lo que el documento de
especificación pedía explícitamente:

| Carpeta | Archivos | Uso sugerido |
|---|---|---|
| `Trabajos/` | 897 | Galería "Trabajos", antes/después de proyectos |
| `SEMA/` | 138 | Galería "SEMA" |
| `Repuestos/` | 112 | Catálogo de tienda real |
| `Amigos/` | 84 | Galería "Amigos" |
| `Famosos/` | 18 | Contenido editorial / redes |
| `Epicas/` | 13 | Ya usadas para hero/servicios/galerías (ver tabla arriba) |
| `youtube-thumbnails/` | 8 | Miniaturas manuales de video |
| `banner/` | 2 | Banners promocionales / OG image alternativa |

Importar las 1.250+ fotos restantes a un catálogo, proyectos y galerías
reales es trabajo del **gestor multimedia del panel `/admin`** (próxima
etapa: subida, recorte, alt text, orden — ver `docs/ARQUITECTURA.md`), no
algo para hardcodear en `seed-data.ts`/`seed.sql`. Mientras tanto, para
reemplazar cualquiera de las 8 imágenes ya usadas por otra de estas
carpetas:

1. Copiá el archivo a `public/images/<carpeta>/<nombre>`.
2. Actualizá la referencia en `src/lib/content/seed-data.ts` (fallback sin
   Supabase) y en `supabase/seed.sql` (datos para la base real).
