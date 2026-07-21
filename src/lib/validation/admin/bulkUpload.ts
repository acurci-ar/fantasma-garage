/**
 * Estado compartido entre las Server Actions de carga múltiple
 * (addGalleryImages/addProjectImages) y el componente cliente que las invoca
 * (BulkImageUploadForm). Vive en un archivo neutral, sin directiva "use
 * client" ni "use server", para no mezclar ese tipo con ninguno de los dos
 * límites de compilación.
 */
export interface BulkUploadActionState {
  status: "idle" | "success" | "error";
  message: string;
  /** Cuántas imágenes de este lote se subieron/fallaron — el cliente los va sumando a través de varios lotes. */
  uploaded?: number;
  failed?: number;
}
