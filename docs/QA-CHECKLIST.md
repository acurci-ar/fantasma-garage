# Checklist de QA manual — Etapa 1 (Base + Landing)

## Navegación

- [ ] Todas las rutas de la sección 4 cargan sin 404: `/`, `/servicios`, `/proyectos`, `/proyectos/[slug]`, `/galerias`, `/galerias/sema`, `/galerias/amigos`, `/galerias/trabajos`, `/videos`, `/tienda`, `/tienda/[slug]`, `/carrito`, `/cuenta`, `/login`, `/registro`, `/contacto`, `/admin`.
- [ ] El menú funciona en desktop y el drawer funciona en móvil (abre, cierra, cierra al navegar).
- [ ] El header pasa de transparente a sólido con blur al hacer scroll.
- [ ] No hay overflow horizontal en ningún breakpoint (probar 360px, 768px, 1024px, 1440px).

## Landing

- [ ] Hero muestra el H1 "Restauramos historia.", CTAs "Ver proyectos" y "Conocer el proceso" funcionan.
- [ ] Franja de autoridad (años de experiencia, proyectos realizados) visible.
- [ ] Servicios: 5 tarjetas con imagen, enlazan a `/servicios#slug`.
- [ ] Proceso: timeline horizontal en desktop, vertical en móvil, 7 etapas.
- [ ] Proyectos destacados: tarjetas con estado, enlazan al detalle.
- [ ] Galerías: 3 portadas (SEMA, Amigos, Trabajos), enlazan a `/galerias/[tipo]`.
- [ ] Videos: fachada de YouTube no carga el iframe hasta hacer click (verificar con DevTools > Network que no hay request a youtube.com al cargar la página).
- [ ] Tienda destacada: productos con precio formateado en ARS, estado "sin stock" visible cuando corresponde.
- [ ] Formulario de contacto: validación inline, mensaje de éxito/error, honeypot no visible.

## Accesibilidad

- [ ] Navegación completa por teclado (Tab) en navbar, drawer, lightbox de galería y formulario.
- [ ] Foco visible en todos los elementos interactivos.
- [ ] Lightbox de galería: Escape cierra, flechas izquierda/derecha navegan.
- [ ] `prefers-reduced-motion` respetado (probar activándolo en el sistema operativo).
- [ ] Contraste de texto sobre fondo oscuro y sobre imágenes es legible.

## SEO / rendimiento

- [ ] `next build` no reporta errores de TypeScript ni warnings críticos.
- [ ] `/sitemap.xml` y `/robots.txt` responden correctamente.
- [ ] Cada página tiene un único `<h1>` y metadata propia (ver pestaña de título del navegador).
- [ ] Lighthouse (modo incógnito, throttling por defecto): LCP < 2.5s, CLS < 0.1 en Home.

## Datos / Supabase

- [ ] Sin `.env.local`: el sitio carga completo con datos de demostración (seed-data.ts), sin errores en consola.
- [ ] Con `.env.local` configurado y migraciones + seed aplicados: el sitio muestra los mismos datos, ahora desde Supabase.
- [ ] Formulario de contacto inserta filas en `contact_messages` cuando Supabase está configurado.
- [ ] `/admin` redirige a `/login` si no hay sesión (con Supabase configurado).

## Seguridad

- [ ] No hay claves ni secretos commiteados (`git grep -i "service_role"` no debería encontrar valores reales).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` solo se usa en `lib/supabase/admin.ts`, nunca en un Client Component.
- [ ] RLS activo en todas las tablas (`select * from pg_tables where rowsecurity = false` en el esquema `public` no debería devolver filas de negocio).
