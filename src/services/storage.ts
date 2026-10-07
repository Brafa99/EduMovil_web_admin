
import { supabase } from "../supabase";

const BUCKET = "instituciones";
const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function subirImagenInstitucion(
  file: File,
  institucionId = "pruebas"
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Solo se permiten imágenes JPG, PNG o WebP.");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("La imagen no debe superar los 5 MB.");
  }

  const extension = file.type === "image/jpeg"
    ? "jpg"
    : file.type.split("/")[1];

  const filePath =
    `${institucionId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}