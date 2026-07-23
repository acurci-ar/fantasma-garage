# TODO — Fantasma Garage

Pendientes fuera del código (cuentas externas, configuración de dashboards, DNS). Nada de esto se resuelve con un commit — son pasos que hay que hacer a mano.

## Email (Resend)

- [ ] Crear cuenta en [resend.com](https://resend.com) y generar un API key.
- [ ] Cargar `RESEND_API_KEY` en las variables de entorno de Vercel.
- [ ] Verificar el dominio propio en Resend (Domains → Add Domain, agregar los registros DNS que pida).
- [ ] Una vez verificado, cargar `RESEND_FROM_EMAIL="Fantasma Garage <respuestas@tudominio>"` en Vercel (hasta entonces se manda desde el dominio de prueba de Resend, que funciona pero es menos profesional).
- [ ] Probar de punta a punta: responder un mensaje real desde `/admin/mensajes/[id]` y confirmar que llega el email y que se ve en `/cuenta` del cliente.

## Supabase Auth

- [ ] Dashboard → Authentication → URL Configuration → cambiar **Site URL** de `http://localhost:3000` al dominio real.
- [ ] Agregar a **Redirect URLs**: `https://tudominio/auth/callback` (y el dominio en general, según pida el dashboard).
- [ ] Revisar y personalizar el **template del email de confirmación** (Authentication → Email Templates → Confirm signup) — hoy es el genérico de Supabase, sin la marca de Fantasma Garage.
- [ ] Probar el flujo completo de registro: crear una cuenta nueva, confirmar el email, y verificar que quede logueado automáticamente (sin tener que loguearse de nuevo a mano).

## Dominio propio

- [ ] Definir el dominio final (`fantasmagarage.com` vs `fantasmagarage.com.ar` vs otro).
- [ ] Apuntar el DNS del dominio elegido a Vercel y configurarlo como dominio del proyecto.
- [ ] Una vez definido, avisar para actualizar `NEXT_PUBLIC_SITE_URL` y todo lo que depende de él (JSON-LD en `layout.tsx`, `robots.ts`, `sitemap.ts`, `llms.txt`).

## Datos del negocio (SEO / IA)

- [ ] Entrar a `/admin/configuracion` y cargar dirección real, teléfono (`+54911...`) y coordenadas — hoy están vacíos a propósito (el JSON-LD los omite en vez de mostrar datos falsos).

## Posicionamiento en IAs (fuera del código)

- [ ] Crear/reclamar la ficha de **Google Business Profile** con categoría, dirección, teléfono, horario y fotos reales.
- [ ] Pedir reseñas activamente a clientes con proyectos terminados.
- [ ] Sumar menciones en foros de autos clásicos, prensa especializada y directorios locales.
- [ ] Sumar contenido de casos/artículos ("cómo restauramos tal auto") — hoy no hay blog ni FAQ, y es lo que más ayuda a que una IA cite al taller en vez de solo mencionarlo.
- [ ] Cada tanto, probar preguntándole a ChatGPT/Perplexity/Claude "restaurador de autos antiguos en Argentina" para ver si aparece Fantasma Garage.

## Deploy

- [ ] Pushear los commits pendientes a `main` (varios quedaron comiteados localmente sin subir).
