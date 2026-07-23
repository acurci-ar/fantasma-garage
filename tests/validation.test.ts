import assert from "node:assert/strict";
import { test } from "node:test";
import { checkoutFormSchema } from "../src/lib/validation/checkout.ts";
import { productSchema } from "../src/lib/validation/product.ts";
import { profileSchema } from "../src/lib/validation/account.ts";
import { newsletterSchema } from "../src/lib/validation/newsletter.ts";
import { newsletterInterestSchema } from "../src/lib/validation/admin/newsletterInterest.ts";
import { newsletterSubscriberSchema } from "../src/lib/validation/admin/newsletterSubscriber.ts";
import { videoSchema } from "../src/lib/validation/admin/video.ts";
import { projectSchema } from "../src/lib/validation/admin/project.ts";
import { gallerySchema } from "../src/lib/validation/admin/gallery.ts";

const validCheckout = {
  fullName: "Juan Pérez",
  email: "juan@example.com",
  phone: "1122334455",
  street: "Av. Siempre Viva 742",
  city: "Buenos Aires",
  province: "Buenos Aires",
  postalCode: "1425",
  notes: "",
  items: [{ productId: "9c858901-8a57-4791-81fe-4c455b099bc9", variantId: null, quantity: 2 }],
};

test("checkoutFormSchema acepta un pedido válido", () => {
  const result = checkoutFormSchema.safeParse(validCheckout);
  assert.equal(result.success, true);
});

test("checkoutFormSchema rechaza carrito vacío", () => {
  const result = checkoutFormSchema.safeParse({ ...validCheckout, items: [] });
  assert.equal(result.success, false);
});

test("checkoutFormSchema rechaza email inválido", () => {
  const result = checkoutFormSchema.safeParse({ ...validCheckout, email: "no-es-un-email" });
  assert.equal(result.success, false);
});

test("checkoutFormSchema acepta ids de producto en modo demo (no UUID)", () => {
  // Con Supabase sin configurar, seed-data.ts usa ids como "prod-1": la
  // validación de formato no debe rechazarlos acá, sino la Server Action
  // (que revisa contra la base real y explica el motivo real).
  const result = checkoutFormSchema.safeParse({
    ...validCheckout,
    items: [{ productId: "prod-1", variantId: null, quantity: 1 }],
  });
  assert.equal(result.success, true);
});

test("checkoutFormSchema rechaza productId vacío", () => {
  const result = checkoutFormSchema.safeParse({
    ...validCheckout,
    items: [{ productId: "", variantId: null, quantity: 1 }],
  });
  assert.equal(result.success, false);
});

const validProduct = {
  name: "Kit de suspensión",
  slug: "kit-suspension",
  sku: "FG-001",
  short_description: "",
  description: "",
  price: "450000",
  sale_price: "",
  stock: "5",
  low_stock_threshold: "2",
  currency: "ARS",
  status: "published",
  image_url: "/images/productos/suspension.webp",
  image_alt: "Kit de suspensión",
};

test("productSchema acepta un producto válido y castea números", () => {
  const result = productSchema.safeParse(validProduct);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.price, 450000);
    assert.equal(result.data.stock, 5);
    assert.equal(result.data.sale_price, null);
  }
});

test("productSchema rechaza slug con mayúsculas o espacios", () => {
  const result = productSchema.safeParse({ ...validProduct, slug: "Kit Suspensión" });
  assert.equal(result.success, false);
});

test("productSchema rechaza precio no numérico", () => {
  const result = productSchema.safeParse({ ...validProduct, price: "gratis" });
  assert.equal(result.success, false);
});

test("productSchema rechaza stock negativo", () => {
  const result = productSchema.safeParse({ ...validProduct, stock: "-3" });
  assert.equal(result.success, false);
});

test("profileSchema acepta nombre y teléfono válidos", () => {
  const result = profileSchema.safeParse({ full_name: "Juan Pérez", phone: "1122334455" });
  assert.equal(result.success, true);
});

test("profileSchema acepta teléfono vacío (opcional)", () => {
  const result = profileSchema.safeParse({ full_name: "Juan Pérez", phone: "" });
  assert.equal(result.success, true);
});

test("profileSchema rechaza nombre demasiado corto", () => {
  const result = profileSchema.safeParse({ full_name: "J", phone: "" });
  assert.equal(result.success, false);
});

test("newsletterSchema acepta email con intereses seleccionados", () => {
  const result = newsletterSchema.safeParse({ email: "juan@example.com", interests: ["marcas", "eventos"] });
  assert.equal(result.success, true);
});

test("newsletterSchema acepta email sin intereses (default vacío)", () => {
  const result = newsletterSchema.safeParse({ email: "juan@example.com" });
  assert.equal(result.success, true);
  if (result.success) assert.deepEqual(result.data.interests, []);
});

test("newsletterSchema rechaza email inválido", () => {
  const result = newsletterSchema.safeParse({ email: "no-es-un-email", interests: [] });
  assert.equal(result.success, false);
});

test("newsletterSchema acepta cualquier slug de interés (la pertenencia se valida server-side)", () => {
  // Los intereses ya no son un enum fijo (ver newsletter_interests, editable
  // desde /admin/newsletter/intereses): el schema solo valida forma, no que
  // el slug exista o esté activo — eso lo resuelve subscribeNewsletter
  // consultando la tabla.
  const result = newsletterSchema.safeParse({ email: "juan@example.com", interests: ["chevy-nova"] });
  assert.equal(result.success, true);
});

test("newsletterSchema rechaza un interés vacío", () => {
  const result = newsletterSchema.safeParse({ email: "juan@example.com", interests: [""] });
  assert.equal(result.success, false);
});

test("newsletterInterestSchema acepta un tag válido y castea el orden", () => {
  const result = newsletterInterestSchema.safeParse({
    slug: "chevy-nova",
    label: "Chevy Nova",
    active: true,
    sort_order: "3",
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.sort_order, 3);
});

test("newsletterInterestSchema rechaza un slug con mayúsculas o espacios", () => {
  const result = newsletterInterestSchema.safeParse({
    slug: "Chevy Nova",
    label: "Chevy Nova",
    active: true,
    sort_order: "0",
  });
  assert.equal(result.success, false);
});

test("newsletterSubscriberSchema acepta un suscriptor válido", () => {
  const result = newsletterSubscriberSchema.safeParse({
    email: "juan@example.com",
    interests: ["eventos"],
    status: "activo",
  });
  assert.equal(result.success, true);
});

test("newsletterSubscriberSchema rechaza un estado inválido", () => {
  const result = newsletterSubscriberSchema.safeParse({
    email: "juan@example.com",
    interests: [],
    status: "pendiente",
  });
  assert.equal(result.success, false);
});

test("videoSchema acepta un video válido y castea el orden", () => {
  const result = videoSchema.safeParse({
    title: "Restauración de suspensión — parte 1",
    youtube_url: "https://www.youtube.com/watch?v=abc123",
    featured: true,
    position: "2",
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.position, 2);
});

test("videoSchema rechaza una URL que no es de YouTube", () => {
  const result = videoSchema.safeParse({
    title: "Video de prueba",
    youtube_url: "https://vimeo.com/12345",
    featured: false,
    position: "0",
  });
  assert.equal(result.success, false);
});

test("projectSchema acepta un proyecto válido y castea el año", () => {
  const result = projectSchema.safeParse({
    title: "Chevy Nova 1972",
    slug: "chevy-nova-1972",
    make: "Chevrolet",
    model: "Nova",
    year: "1972",
    summary: "Restauración completa de chapa, pintura y mecánica.",
    story: "",
    status: "en_curso",
    featured: true,
    seo_title: "",
    seo_description: "",
    cover_url: "/images/proyectos/nova.webp",
    vin: "",
    engine: "",
    transmission: "",
    client_name: "",
    visibility: "public",
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.year, 1972);
});

test("projectSchema rechaza un slug con mayúsculas o espacios", () => {
  const result = projectSchema.safeParse({
    title: "Chevy Nova 1972",
    slug: "Chevy Nova 1972",
    make: "Chevrolet",
    model: "Nova",
    year: "1972",
    summary: "Restauración completa.",
    story: "",
    status: "en_curso",
    featured: false,
    seo_title: "",
    seo_description: "",
    cover_url: "",
  });
  assert.equal(result.success, false);
});

test("gallerySchema acepta una galería válida", () => {
  const result = gallerySchema.safeParse({
    title: "SEMA",
    description: "Nuestro stand en SEMA.",
    status: "published",
    cover_url: "/images/galeria/sema.webp",
  });
  assert.equal(result.success, true);
});

test("gallerySchema rechaza un estado inválido", () => {
  const result = gallerySchema.safeParse({
    title: "SEMA",
    description: "",
    status: "activo",
    cover_url: "/images/galeria/sema.webp",
  });
  assert.equal(result.success, false);
});
