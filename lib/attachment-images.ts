/** Max upload size aligned with typical Supabase bucket default (~50 MB). */
export const MAX_IMAGE_UPLOAD_BYTES = 50 * 1024 * 1024

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tif|tiff)$/i

export function isLikelyImageFile(file: File): boolean {
  const type = (file.type || "").toLowerCase().trim()
  if (type.startsWith("image/")) return true
  if (IMAGE_EXT.test(file.name)) return true
  if (type === "application/octet-stream" && IMAGE_EXT.test(file.name)) return true
  return false
}

export function validateImageAttachment(file: File): string | null {
  if (!isLikelyImageFile(file)) {
    return "Only image uploads are supported (e.g. JPEG, PNG, WebP, HEIC)."
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return "Image is too large (max 50 MB)."
  }
  if (file.size <= 0) {
    return "File is empty."
  }
  return null
}

export function safeStorageFileSegment(name: string): string {
  const trimmed = name.trim() || "image"
  return trimmed.replace(/[^\w.\-()+ ]/g, "_").slice(0, 200)
}
