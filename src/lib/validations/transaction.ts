import { z } from "zod";

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const ALLOWED_RECEIPT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const setTermsSchema = z.object({
  transactionId: z.string().uuid(),
  agreedAmountPesos: z.number().min(50).max(500000),
  midmanFeePesos: z.number().min(0).max(100000),
  termsNotes: z.string().trim().min(5).max(2000),
});

export const submitPaymentSchema = z.object({
  transactionId: z.string().uuid(),
  amountPesos: z.number().min(50).max(600000),
  referenceNumber: z.string().trim().min(3).max(120),
  storagePath: z.string().min(1),
  mimeType: z.enum(ALLOWED_RECEIPT_TYPES),
  fileSizeBytes: z.number().int().positive().max(MAX_RECEIPT_BYTES),
});

export const verifyPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  decision: z.enum(["VERIFIED", "REJECTED"]),
  notes: z.string().trim().max(1000).optional(),
});

export const fulfillSchema = z.object({
  transactionId: z.string().uuid(),
  fulfillmentNotes: z.string().trim().min(3).max(2000),
});
