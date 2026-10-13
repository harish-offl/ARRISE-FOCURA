import { supabase } from "@/lib/supabase";

const BUCKET = "study-materials";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured for study material storage.");
  return supabase;
}

export async function saveMaterialFile(userId: string, file: File): Promise<string> {
  const client = requireSupabase();
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export async function loadMaterialFile(path: string): Promise<Blob> {
  const { data, error } = await requireSupabase().storage.from(BUCKET).download(path);
  if (error) throw error;
  return data;
}

export async function removeMaterialFile(path: string): Promise<void> {
  const { error } = await requireSupabase().storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
