"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { projectSchema, projectImageSchema } from "@/lib/validation/admin/project";
import { createClient } from "@/lib/supabase/server";
import { uploadImageToBucket } from "@/lib/supabase/upload";
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
    position: String(formData.get("position") ?? "0"),
    is_before: formData.get("is_before") === "on",
    is_after: formData.get("is_after") === "on",
  });
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
  const { url, ...imageData } = parsed.data;

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

  const { error } = await supabase
    .from("project_images")
    .insert({ ...imageData, url: finalUrl, thumb_url: finalThumbUrl, project_id: projectId });

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
  const { url, ...imageData } = parsed.data;

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

  const update: Record<string, unknown> = { ...imageData, thumb_url: finalThumbUrl };
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
