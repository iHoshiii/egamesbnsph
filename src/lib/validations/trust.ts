import { z } from "zod";

export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_EVIDENCE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const createReviewSchema = z.object({
  transactionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(1000),
});

export const openDisputeSchema = z.object({
  transactionId: z.string().uuid(),
  reason: z.string().trim().min(10).max(2000),
});

export const addEvidenceSchema = z.object({
  disputeId: z.string().uuid(),
  storagePath: z.string().min(1),
  mimeType: z.enum(ALLOWED_EVIDENCE_TYPES),
  fileSizeBytes: z.number().int().positive().max(MAX_EVIDENCE_BYTES),
  notes: z.string().trim().max(500).optional(),
});

export const resolveDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  outcome: z.enum(["COMPLETED", "CANCELLED"]),
  notes: z.string().trim().min(5).max(2000),
});

export const createReportSchema = z.object({
  targetType: z.enum(["LISTING", "USER", "REVIEW"]),
  targetId: z.string().uuid(),
  reason: z.string().trim().min(5).max(1000),
});
