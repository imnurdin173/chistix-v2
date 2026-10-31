export async function uploadToCloudinary(file: File, folder = "chistix"): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "mzlrarfc";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "chistix_preset";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.secure_url) {
    throw new Error(json?.error?.message || "Failed to upload image to Cloudinary");
  }

  return json.secure_url as string;
}