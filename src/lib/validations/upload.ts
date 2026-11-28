import { z } from "zod";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const uploadMetaSchema = z.object({
  storagePath: z
    .string()
    .min(3, "Invalid file path.")
    .max(300, "File path is too long.")
    .refine((p) => !p.includes("..") && !p.startsWith("/"), "Invalid storage path."),
  mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
    message: "Only JPEG, PNG, and WebP images are allowed.",
  }),
  fileSizeBytes: z
    .number()
    .int()
    .positive("File cannot be empty.")
    .max(MAX_UPLOAD_BYTES, "File must be 5 MB or smaller."),
});

export function validateUploadFile(input: {
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
}) {
  return uploadMetaSchema.safeParse(input);
}
