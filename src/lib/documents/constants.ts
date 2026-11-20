export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function validateDocumentFile(file: File): string | null {
  if (file.size > MAX_DOCUMENT_BYTES) return "File must be 10 MB or smaller";
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) return "Allowed types: PDF, JPEG, PNG, WebP";
  return null;
}

export function documentTypeLabel(type: string): string {
  return type.replace(/_/g, " ");
}
