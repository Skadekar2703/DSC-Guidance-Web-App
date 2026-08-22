import { supabase } from "../lib/supabase";

const BUCKET_NAME = "study-materials";

/**
 * Uploads a file to Supabase Storage with optional progress tracking.
 * @param {string} folder Target subfolder (e.g. 'materials', 'pyq', 'biology')
 * @param {File} file Browser File object
 * @param {function} [onProgress] Progress callback percentage (0-100)
 * @returns {Promise<{ downloadUrl: string, storagePath: string }>}
 */
export const uploadFile = async (folder = "materials", file, onProgress) => {
  if (!file) throw new Error("No file provided for upload.");

  const fileExtension = file.name.substring(file.name.lastIndexOf("."));
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20);
  const uniqueFileName = `${folder}/${Date.now()}_${sanitizedName}${fileExtension}`;

  if (onProgress) onProgress(20);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(uniqueFileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw error;
  }

  if (onProgress) onProgress(80);

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(uniqueFileName);

  if (onProgress) onProgress(100);

  return {
    downloadUrl: publicUrlData.publicUrl,
    storagePath: data.path,
  };
};

/**
 * Deletes a file from Supabase Storage.
 * @param {string} storagePath Storage relative object path (e.g., 'materials/1739_file.pdf')
 */
export const deleteFile = async (storagePath) => {
  if (!storagePath) return;

  // Clean path if full URL was provided by mistake
  let cleanPath = storagePath;
  if (storagePath.includes(`${BUCKET_NAME}/`)) {
    cleanPath = storagePath.split(`${BUCKET_NAME}/`).pop();
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([cleanPath]);

  if (error) {
    console.error(`Error deleting storage file at ${cleanPath}:`, error);
    throw error;
  }
};

const SUBJECT_ASSETS_BUCKET = "subject-assets";
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Uploads a subject logo or banner to subject-assets storage bucket.
 * @param {object} params
 * @param {string} params.subjectId ID of the subject
 * @param {'logo'|'banner'} params.assetType Type of subject asset
 * @param {File} params.file File object to upload
 * @param {function} [params.onProgress] Callback for progress updates
 * @returns {Promise<{ downloadUrl: string, storagePath: string }>}
 */
export const uploadSubjectAsset = async ({ subjectId, assetType, file, onProgress }) => {
  if (!file) throw new Error("No file provided for upload.");
  if (!subjectId) throw new Error("Subject ID is required for asset upload.");

  const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (
    (!file.type || !ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) &&
    !ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)
  ) {
    throw new Error("Invalid file type. Only PNG, JPG, JPEG, and WEBP images are allowed.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("File size exceeds 5MB limit. Please upload a smaller image.");
  }

  const cleanExt = fileExt ? fileExt.replace(".", "") : "png";
  const objectPath = `subjects/${subjectId}/${assetType}.${cleanExt}`;

  if (onProgress) onProgress(20);

  const { data, error } = await supabase.storage
    .from(SUBJECT_ASSETS_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error(`Supabase Storage ${assetType} upload error:`, error);
    throw error;
  }

  if (onProgress) onProgress(80);

  const { data: publicUrlData } = supabase.storage
    .from(SUBJECT_ASSETS_BUCKET)
    .getPublicUrl(objectPath);

  if (onProgress) onProgress(100);

  const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  return {
    downloadUrl: publicUrl,
    storagePath: data.path,
  };
};

/**
 * Deletes a subject asset from subject-assets storage bucket.
 * @param {string} storagePathOrUrl
 */
export const deleteSubjectAsset = async (storagePathOrUrl) => {
  if (!storagePathOrUrl) return;

  let cleanPath = storagePathOrUrl.split("?")[0];
  if (cleanPath.includes(`${SUBJECT_ASSETS_BUCKET}/`)) {
    cleanPath = cleanPath.split(`${SUBJECT_ASSETS_BUCKET}/`).pop();
  }

  const { error } = await supabase.storage
    .from(SUBJECT_ASSETS_BUCKET)
    .remove([cleanPath]);

  if (error) {
    console.warn(`Could not delete storage file at ${cleanPath}:`, error);
  }
};
