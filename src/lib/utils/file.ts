/**
 * Límite para documentos adjuntos (facturas, fichas técnicas, etc. — ver
 * ProjectDocumentForm / actions/admin/projects.ts). 4MB, no más: Vercel
 * rechaza con 413 cualquier body de más de ~4.5MB en una función serverless
 * (ver misma nota en lib/utils/image.ts). Si el archivo pesa más, conviene
 * subirlo a un hosting propio (Drive, etc.) y guardar el link en su lugar.
 */
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024; // 4 MB

export function exceedsDocumentLimit(bytes: number): boolean {
  return bytes > MAX_DOCUMENT_BYTES;
}
