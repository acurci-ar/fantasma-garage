"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  projectSchema,
  projectImageSchema,
  projectAccessSchema,
  projectStageSchema,
  projectCustomStageSchema,
  projectVideoSchema,
  projectDocumentSchema,
  projectBudgetSchema,
  projectExpenseSchema,
  projectTimeEntrySchema,
} from "@/lib/validation/admin/project";
import { createClient } from "@/lib/supabase/server";
import { uploadImageToBucket, uploadFileToBucket, uploadPrivateFile } from "@/lib/supabase/upload";
import type { BulkUploadActionState } from "@/lib/validation/admin/bulkUpload";

export interface ProjectActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * ABMC de proyectos (/admin/proyectos). Usa el cliente con sesión (no
 * admin): la RLS `projects_staff_write` ya exige is_staff(), como segunda
 * barrera además del chequeo de rol en app/admin/layout.tsx — mismo
 * criterio que products.ts.
 *
 * `featured` es lo que realmente controla si el proyecto aparece en
 * /proyectos y en la home: getFeaturedProjects() (lib/content/queries.ts)
 * filtra por featured=true, no por `status` (que es solo la etiqueta
 * en_curso/finalizado/en_pausa que se muestra en la ficha).
 */
function parseProjectForm(formData: FormData) {
  const raw = {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    make: String(formData.get("make") ?? ""),
    model: String(formData.get("model") ?? ""),
    year: String(formData.get("year") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    story: String(formData.get("story") ?? ""),
    status: String(formData.get("status") ?? "en_curso"),
    featured: formData.get("featured") === "on",
    seo_title: String(formData.get("seo_title") ?? ""),
    seo_description: String(formData.get("seo_description") ?? ""),
    cover_url: String(formData.get("cover_url") ?? ""),
    vin: String(formData.get("vin") ?? ""),
    engine: String(formData.get("engine") ?? ""),
    transmission: String(formData.get("transmission") ?? ""),
    client_name: String(formData.get("client_name") ?? ""),
    visibility: String(formData.get("visibility") ?? "public"),
  };
  return projectSchema.safeParse(raw);
}

export async function createProject(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos del formulario.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { cover_url, ...projectData } = parsed.data;

  let finalCoverUrl = cover_url;
  let finalCoverThumbUrl: string | null = null;
  const coverFile = formData.get("cover_file");
  if (coverFile instanceof File && coverFile.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, coverFile, "project-images", projectData.slug);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalCoverUrl = uploaded.url;
    finalCoverThumbUrl = uploaded.thumbUrl;
  }

  if (!finalCoverUrl) {
    return { status: "error", message: "Subí una foto de portada o pegá una URL." };
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ ...projectData, cover_url: finalCoverUrl, cover_thumb_url: finalCoverThumbUrl })
    .select("id")
    .single();

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Ya existe un proyecto con ese slug." : "No pudimos crear el proyecto.",
    };
  }

  // Copiamos el catálogo global de hitos como línea de tiempo inicial del
  // proyecto, todos activados por defecto — el staff los desactiva/agrega
  // custom después desde la solapa "Seguimiento" (ver ProjectStageManager).
  const { data: templates } = await supabase
    .from("project_stage_templates")
    .select("id, name, position")
    .order("position", { ascending: true });

  if (templates && templates.length > 0) {
    await supabase.from("project_stages").insert(
      templates.map((template) => ({
        project_id: project.id,
        template_id: template.id,
        name: template.name,
        position: template.position,
        enabled: true,
        status: "pendiente" as const,
      }))
    );
  }

  revalidatePath("/admin/proyectos");
  revalidatePath("/proyectos");
  redirect(`/admin/proyectos/${project.id}`);
}

export async function updateProject(
  id: string,
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos del formulario.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { cover_url, ...projectData } = parsed.data;

  const { data: existingProject } = await supabase
    .from("projects")
    .select("cover_url, cover_thumb_url")
    .eq("id", id)
    .maybeSingle();

  let finalCoverUrl = cover_url;
  // Si no se subió un archivo nuevo y la URL de portada no cambió,
  // conservamos la miniatura existente (ver lib/supabase/upload.ts: solo el
  // archivo subido genera miniatura, una URL pegada a mano no tiene).
  let finalCoverThumbUrl: string | null =
    existingProject?.cover_url === cover_url ? existingProject?.cover_thumb_url ?? null : null;

  const coverFile = formData.get("cover_file");
  if (coverFile instanceof File && coverFile.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, coverFile, "project-images", projectData.slug);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalCoverUrl = uploaded.url;
    finalCoverThumbUrl = uploaded.thumbUrl;
  }

  if (!finalCoverUrl) {
    return { status: "error", message: "Subí una foto de portada o pegá una URL." };
  }

  const { error } = await supabase
    .from("projects")
    .update({ ...projectData, cover_url: finalCoverUrl, cover_thumb_url: finalCoverThumbUrl })
    .eq("id", id);

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Ya existe un proyecto con ese slug." : "No pudimos actualizar el proyecto.",
    };
  }

  revalidatePath("/admin/proyectos");
  revalidatePath(`/admin/proyectos/${id}`);
  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${projectData.slug}`);
  return { status: "success", message: "Proyecto actualizado." };
}

export async function deleteProject(id: string): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar el proyecto." };
  }

  revalidatePath("/admin/proyectos");
  revalidatePath("/proyectos");
  return { status: "success", message: "Proyecto eliminado." };
}

// ---------------------------------------------------------------------------
// Imágenes del proyecto (antes/después, etapas del proceso)
// ---------------------------------------------------------------------------

export interface ProjectImageActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

function parseProjectImageForm(formData: FormData) {
  return projectImageSchema.safeParse({
    url: String(formData.get("url") ?? ""),
    alt: String(formData.get("alt") ?? ""),
    stage: String(formData.get("stage") ?? ""),
    stage_id: String(formData.get("stage_id") ?? ""),
    position: String(formData.get("position") ?? "0"),
    is_before: formData.get("is_before") === "on",
    is_after: formData.get("is_after") === "on",
    visibility: String(formData.get("visibility") ?? "public"),
  });
}

/** `stage_id` llega como "" del <select> cuando no se eligió hito: se guarda como null, no como cadena vacía (violaría la FK). */
function normalizeStageId(stageId: string): string | null {
  return stageId === "" ? null : stageId;
}

/**
 * Alta de varias fotos a la vez (input file con `multiple`). Se guardan sin
 * texto alternativo, etapa ni marca de antes/después — el ABMC de cada
 * project_image (arriba, ver página /admin/proyectos/[id]) permite completar
 * esos datos foto por foto después de la carga masiva. Si alguna imagen
 * individual falla al subir, seguimos con las demás en vez de abortar todo
 * el lote.
 */
export async function addProjectImages(
  projectId: string,
  _prevState: BulkUploadActionState,
  formData: FormData
): Promise<BulkUploadActionState> {
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) {
    return { status: "error", message: "Seleccioná al menos una imagen.", uploaded: 0, failed: 0 };
  }

  const supabase = await createClient();

  const { data: lastImage } = await supabase
    .from("project_images")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextPosition = (lastImage?.position ?? 0) + 1;
  const rows: Record<string, unknown>[] = [];

  for (const file of files) {
    const uploaded = await uploadImageToBucket(supabase, file, "project-images", projectId);
    if ("error" in uploaded) continue;
    rows.push({
      project_id: projectId,
      url: uploaded.url,
      thumb_url: uploaded.thumbUrl,
      alt: "",
      stage: null,
      is_before: false,
      is_after: false,
      position: nextPosition++,
    });
  }

  if (rows.length === 0) {
    return {
      status: "error",
      message: "No pudimos subir ninguna de las imágenes de este lote.",
      uploaded: 0,
      failed: files.length,
    };
  }

  const { error } = await supabase.from("project_images").insert(rows);
  if (error) {
    return {
      status: "error",
      message: "Subimos las imágenes pero no pudimos guardarlas. Probá de nuevo.",
      uploaded: 0,
      failed: files.length,
    };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath("/proyectos");

  const skipped = files.length - rows.length;
  return {
    status: "success",
    message:
      skipped > 0
        ? `Se subieron ${rows.length} de ${files.length} imágenes de este lote (${skipped} fallaron).`
        : `Se subieron ${rows.length} imagen${rows.length === 1 ? "" : "es"} de este lote.`,
    uploaded: rows.length,
    failed: skipped,
  };
}

export async function addProjectImage(
  projectId: string,
  _prevState: ProjectImageActionState,
  formData: FormData
): Promise<ProjectImageActionState> {
  const parsed = parseProjectImageForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { url, stage_id, ...imageData } = parsed.data;

  let finalUrl = url;
  let finalThumbUrl: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, file, "project-images", projectId);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalUrl = uploaded.url;
    finalThumbUrl = uploaded.thumbUrl;
  }

  if (!finalUrl) {
    return { status: "error", message: "Subí una imagen o pegá una URL." };
  }

  const { error } = await supabase.from("project_images").insert({
    ...imageData,
    stage_id: normalizeStageId(stage_id),
    url: finalUrl,
    thumb_url: finalThumbUrl,
    project_id: projectId,
  });

  if (error) {
    return { status: "error", message: "No pudimos agregar la imagen." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  return { status: "success", message: "Imagen agregada." };
}

export async function updateProjectImage(
  id: string,
  projectId: string,
  _prevState: ProjectImageActionState,
  formData: FormData
): Promise<ProjectImageActionState> {
  const parsed = parseProjectImageForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { url, stage_id, ...imageData } = parsed.data;

  const { data: existingImage } = await supabase
    .from("project_images")
    .select("url, thumb_url")
    .eq("id", id)
    .maybeSingle();

  let finalUrl = url;
  let finalThumbUrl: string | null = existingImage?.url === url ? existingImage?.thumb_url ?? null : null;

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, file, "project-images", projectId);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalUrl = uploaded.url;
    finalThumbUrl = uploaded.thumbUrl;
  }

  const update: Record<string, unknown> = { ...imageData, stage_id: normalizeStageId(stage_id), thumb_url: finalThumbUrl };
  if (finalUrl) update.url = finalUrl;

  const { error } = await supabase.from("project_images").update(update).eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos actualizar la imagen." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  return { status: "success", message: "Imagen actualizada." };
}

export async function deleteProjectImage(
  id: string,
  projectId: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_images").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar la imagen." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  return { status: "success", message: "Imagen eliminada." };
}

// ---------------------------------------------------------------------------
// Accesos: usuarios puntuales con acceso a un proyecto privado (solapa Ficha)
// ---------------------------------------------------------------------------

export interface ProjectAccessActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function grantProjectAccess(
  projectId: string,
  _prevState: ProjectAccessActionState,
  formData: FormData
): Promise<ProjectAccessActionState> {
  const parsed = projectAccessSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!parsed.success) {
    return { status: "error", message: "Revisá el email.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_access")
    .insert({ project_id: projectId, email: parsed.data.email });

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Ese email ya tiene acceso." : "No pudimos otorgar el acceso.",
    };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { status: "success", message: "Acceso otorgado." };
}

export async function revokeProjectAccess(
  id: string,
  projectId: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_access").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos quitar el acceso." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { status: "success", message: "Acceso quitado." };
}

// ---------------------------------------------------------------------------
// Línea de tiempo: activar/desactivar hitos, editar estado/fechas, custom
// ---------------------------------------------------------------------------

export interface ProjectStageActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/** Toggle rápido de enabled, sin pasar por el resto del form (usado por el switch de la lista). */
export async function toggleProjectStage(
  id: string,
  projectId: string,
  enabled: boolean
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_stages").update({ enabled }).eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos actualizar el hito." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  return { status: "success", message: "Hito actualizado." };
}

export async function updateProjectStage(
  id: string,
  projectId: string,
  _prevState: ProjectStageActionState,
  formData: FormData
): Promise<ProjectStageActionState> {
  const parsed = projectStageSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    enabled: formData.get("enabled") === "on",
    status: String(formData.get("status") ?? "pendiente"),
    started_at: String(formData.get("started_at") ?? ""),
    completed_at: String(formData.get("completed_at") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos del hito.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { started_at, completed_at, ...rest } = parsed.data;
  const { error } = await supabase
    .from("project_stages")
    .update({ ...rest, started_at: started_at || null, completed_at: completed_at || null })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos actualizar el hito." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  return { status: "success", message: "Hito actualizado." };
}

/** Agrega un hito custom (sin template_id) al final de la línea de tiempo del proyecto. */
export async function addCustomProjectStage(
  projectId: string,
  _prevState: ProjectStageActionState,
  formData: FormData
): Promise<ProjectStageActionState> {
  const parsed = projectCustomStageSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) {
    return { status: "error", message: "Ingresá un nombre.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: lastStage } = await supabase
    .from("project_stages")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("project_stages").insert({
    project_id: projectId,
    template_id: null,
    name: parsed.data.name,
    position: (lastStage?.position ?? 0) + 1,
    enabled: true,
    status: "pendiente",
  });

  if (error) {
    return { status: "error", message: "No pudimos agregar el hito." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { status: "success", message: "Hito agregado." };
}

/** Solo se pueden borrar hitos custom (sin template_id); los del catálogo global se desactivan, no se borran. */
export async function deleteProjectStage(
  id: string,
  projectId: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_stages").delete().eq("id", id).is("template_id", null);

  if (error) {
    return { status: "error", message: "No pudimos eliminar el hito." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { status: "success", message: "Hito eliminado." };
}

// ---------------------------------------------------------------------------
// Multimedia: videos (YouTube o archivo propio)
// ---------------------------------------------------------------------------

export interface ProjectVideoActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

function parseProjectVideoForm(formData: FormData) {
  return projectVideoSchema.safeParse({
    kind: String(formData.get("kind") ?? "youtube"),
    youtube_url: String(formData.get("youtube_url") ?? ""),
    video_url: String(formData.get("video_url") ?? ""),
    visibility: String(formData.get("visibility") ?? "public"),
    stage_id: String(formData.get("stage_id") ?? ""),
    position: String(formData.get("position") ?? "0"),
  });
}

export async function addProjectVideo(
  projectId: string,
  _prevState: ProjectVideoActionState,
  formData: FormData
): Promise<ProjectVideoActionState> {
  const parsed = parseProjectVideoForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos del video.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { stage_id, video_url, ...videoData } = parsed.data;

  let finalVideoUrl = video_url || null;
  const file = formData.get("file");
  if (videoData.kind === "file" && file instanceof File && file.size > 0) {
    const { exceedsVideoFileLimit, MAX_VIDEO_FILE_BYTES } = await import("@/lib/utils/video");
    if (exceedsVideoFileLimit(file.size)) {
      return {
        status: "error",
        message: `El archivo pesa más de ${Math.round(MAX_VIDEO_FILE_BYTES / (1024 * 1024))}MB. Para clips más pesados, pegá un link de YouTube o de un hosting propio.`,
      };
    }
    const uploaded = await uploadFileToBucket(supabase, file, "project-videos", projectId);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalVideoUrl = uploaded.url;
  }

  if (videoData.kind === "file" && !finalVideoUrl) {
    return { status: "error", message: "Subí un archivo de video o pegá una URL." };
  }

  const { error } = await supabase.from("project_videos").insert({
    ...videoData,
    youtube_url: videoData.kind === "youtube" ? videoData.youtube_url || null : null,
    video_url: videoData.kind === "file" ? finalVideoUrl : null,
    stage_id: normalizeStageId(stage_id),
    project_id: projectId,
  });

  if (error) {
    return { status: "error", message: "No pudimos agregar el video." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  return { status: "success", message: "Video agregado." };
}

export async function updateProjectVideo(
  id: string,
  projectId: string,
  _prevState: ProjectVideoActionState,
  formData: FormData
): Promise<ProjectVideoActionState> {
  const parsed = parseProjectVideoForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos del video.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { stage_id, video_url, ...videoData } = parsed.data;

  let finalVideoUrl = video_url || null;
  const file = formData.get("file");
  if (videoData.kind === "file" && file instanceof File && file.size > 0) {
    const { exceedsVideoFileLimit, MAX_VIDEO_FILE_BYTES } = await import("@/lib/utils/video");
    if (exceedsVideoFileLimit(file.size)) {
      return {
        status: "error",
        message: `El archivo pesa más de ${Math.round(MAX_VIDEO_FILE_BYTES / (1024 * 1024))}MB. Para clips más pesados, pegá un link de YouTube o de un hosting propio.`,
      };
    }
    const uploaded = await uploadFileToBucket(supabase, file, "project-videos", projectId);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalVideoUrl = uploaded.url;
  }

  const { error } = await supabase
    .from("project_videos")
    .update({
      ...videoData,
      youtube_url: videoData.kind === "youtube" ? videoData.youtube_url || null : null,
      video_url: videoData.kind === "file" ? finalVideoUrl : null,
      stage_id: normalizeStageId(stage_id),
    })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos actualizar el video." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  return { status: "success", message: "Video actualizado." };
}

export async function deleteProjectVideo(
  id: string,
  projectId: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_videos").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar el video." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  return { status: "success", message: "Video eliminado." };
}

// ---------------------------------------------------------------------------
// Documentación (solapa Documentos) — siempre privada, bucket 'project-private'
// ---------------------------------------------------------------------------

export interface ProjectDocumentActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function addProjectDocument(
  projectId: string,
  _prevState: ProjectDocumentActionState,
  formData: FormData
): Promise<ProjectDocumentActionState> {
  const parsed = projectDocumentSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) {
    return { status: "error", message: "Ingresá un nombre.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Seleccioná un archivo." };
  }

  const { exceedsDocumentLimit, MAX_DOCUMENT_BYTES } = await import("@/lib/utils/file");
  if (exceedsDocumentLimit(file.size)) {
    return {
      status: "error",
      message: `El archivo pesa más de ${Math.round(MAX_DOCUMENT_BYTES / (1024 * 1024))}MB. Subilo a un hosting propio y compartí el link por otro medio.`,
    };
  }

  const supabase = await createClient();
  const uploaded = await uploadPrivateFile(supabase, file, "project-private", projectId);
  if ("error" in uploaded) return { status: "error", message: uploaded.error };

  const { error } = await supabase.from("project_documents").insert({
    project_id: projectId,
    name: parsed.data.name,
    file_path: uploaded.path,
  });

  if (error) {
    return { status: "error", message: "No pudimos guardar el documento." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { status: "success", message: "Documento agregado." };
}

export async function deleteProjectDocument(
  id: string,
  projectId: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();

  const { data: doc } = await supabase.from("project_documents").select("file_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("project_documents").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar el documento." };
  }

  if (doc?.file_path) {
    await supabase.storage.from("project-private").remove([doc.file_path]);
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { status: "success", message: "Documento eliminado." };
}

// ---------------------------------------------------------------------------
// Seguimiento presupuesto: presupuesto inicial, gastos/extras, horas —
// siempre privados (solo staff o accesos otorgados, ver RLS).
// ---------------------------------------------------------------------------

export interface ProjectBudgetActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function upsertProjectBudget(
  projectId: string,
  _prevState: ProjectBudgetActionState,
  formData: FormData
): Promise<ProjectBudgetActionState> {
  const parsed = projectBudgetSchema.safeParse({
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? "ARS"),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_budgets")
    .upsert({ project_id: projectId, ...parsed.data }, { onConflict: "project_id" });

  if (error) {
    return { status: "error", message: "No pudimos guardar el presupuesto." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { status: "success", message: "Presupuesto actualizado." };
}

export interface ProjectExpenseActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function addProjectExpense(
  projectId: string,
  _prevState: ProjectExpenseActionState,
  formData: FormData
): Promise<ProjectExpenseActionState> {
  const parsed = projectExpenseSchema.safeParse({
    kind: String(formData.get("kind") ?? "gasto"),
    description: String(formData.get("description") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? "ARS"),
    expense_date: String(formData.get("expense_date") ?? new Date().toISOString().slice(0, 10)),
    category: String(formData.get("category") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_expenses").insert({ project_id: projectId, ...parsed.data });

  if (error) {
    return { status: "error", message: "No pudimos guardar el gasto." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { status: "success", message: "Gasto agregado." };
}

export async function deleteProjectExpense(
  id: string,
  projectId: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_expenses").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar el gasto." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { status: "success", message: "Gasto eliminado." };
}

export interface ProjectTimeEntryActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function addProjectTimeEntry(
  projectId: string,
  _prevState: ProjectTimeEntryActionState,
  formData: FormData
): Promise<ProjectTimeEntryActionState> {
  const parsed = projectTimeEntrySchema.safeParse({
    description: String(formData.get("description") ?? ""),
    hours: String(formData.get("hours") ?? ""),
    entry_date: String(formData.get("entry_date") ?? new Date().toISOString().slice(0, 10)),
  });
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_time_entries").insert({ project_id: projectId, ...parsed.data });

  if (error) {
    return { status: "error", message: "No pudimos guardar las horas." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { status: "success", message: "Horas registradas." };
}

export async function deleteProjectTimeEntry(
  id: string,
  projectId: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_time_entries").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar el registro." };
  }

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { status: "success", message: "Registro eliminado." };
}
