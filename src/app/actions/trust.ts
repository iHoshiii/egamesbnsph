"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSessionUser } from "@/services/auth.service";
import { createReview } from "@/services/review.service";
import { addDisputeEvidence, openDispute } from "@/services/dispute.service";
import { createReport } from "@/services/admin.service";
import {
  addEvidenceSchema,
  createReportSchema,
  createReviewSchema,
  openDisputeSchema,
} from "@/lib/validations/trust";

export async function createReviewAction(payload: unknown) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  const parsed = createReviewSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid review." };

  try {
    const review = await createReview(
      parsed.data.transactionId,
      user.id,
      parsed.data.rating,
      parsed.data.comment,
    );
    revalidatePath(`/transactions/${parsed.data.transactionId}`);
    revalidatePath("/midmen");
    return { vouchSlug: review.vouchSlug };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to submit review." };
  }
}

export async function openDisputeAction(payload: unknown) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  const parsed = openDisputeSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid dispute." };

  try {
    await openDispute(parsed.data.transactionId, user.id, parsed.data.reason);
    revalidatePath(`/transactions/${parsed.data.transactionId}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to open dispute." };
  }
}

export async function addEvidenceAction(payload: unknown, transactionId: string) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  const parsed = addEvidenceSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid evidence." };

  try {
    await addDisputeEvidence(parsed.data.disputeId, user.id, {
      storagePath: parsed.data.storagePath,
      mimeType: parsed.data.mimeType,
      fileSizeBytes: parsed.data.fileSizeBytes,
      notes: parsed.data.notes,
    });
    revalidatePath(`/transactions/${transactionId}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload evidence." };
  }
}

export async function createReportAction(payload: unknown) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  const parsed = createReportSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid report." };

  try {
    await createReport(user.id, parsed.data.targetType, parsed.data.targetId, parsed.data.reason);
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to submit report." };
  }
}
