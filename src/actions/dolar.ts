"use server";

export interface BlueDollarRate {
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

/**
 * Cotización del dólar blue (DolarApi.com, sin key, gratuita), para poder
 * comparar el costo interno de un producto contra su precio público cuando
 * están en monedas distintas (product_internal_info.currency vs.
 * products.currency) — ver el cálculo en ProductForm.tsx.
 *
 * Se pide server-side (no con fetch directo desde el navegador) para no
 * tener que sumar dolarapi.com a la Content-Security-Policy connect-src
 * del sitio (next.config.mjs, sección 7.1) — cuantos menos dominios
 * externos hable el browser, mejor. `next.revalidate` cachea la respuesta
 * 5 minutos: no hace falta pegarle a la API por cada tecla que tipea el
 * admin en el formulario.
 *
 * Devuelve null (en vez de tirar) si la API falla o cambia de forma: quien
 * llama tiene que manejar el caso "no se pudo convertir" en vez de mostrar
 * una comparación posiblemente incorrecta.
 */
export async function getBlueDollarRate(): Promise<BlueDollarRate | null> {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/blue", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { compra?: unknown; venta?: unknown; fechaActualizacion?: unknown };
    if (typeof data.compra !== "number" || typeof data.venta !== "number") return null;

    return {
      compra: data.compra,
      venta: data.venta,
      fechaActualizacion: typeof data.fechaActualizacion === "string" ? data.fechaActualizacion : new Date().toISOString(),
    };
  } catch (error) {
    console.error("[dolar] No se pudo obtener la cotización del dólar blue:", error);
    return null;
  }
}
