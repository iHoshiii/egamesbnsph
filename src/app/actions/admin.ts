"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSessionUser } from "@/services/auth.service";
import {
  moderateListing,
  resolveDispute,
  updateReportStatus,
} from "@/services/admin.service";
import { resolveDisputeSchema } from "@/lib/validations/trust";
import type { ListingStatus, ReportStatus } from "@/generated/prisma/enums";

export async function resolveDisputeAction(payload: unknown) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  const parsed = resolveDisputeSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid resolution." };

  try {
    await resolveDispute(
      parsed.data.disputeId,
      user.id,
      parsed.data.outcome,
      parsed.data.notes,
    );
    revalidatePath("/admin");
    revalidatePath("/transactions");
    revalidatePath("/marketplace");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to resolve dispute." };
  }
}

export async function moderateListingAction(listingId: string, status: ListingStatus) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  try {
    await moderateListing(listingId, user.id, status);
    revalidatePath("/admin");
    revalidatePath("/marketplace");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Moderation failed." };
  }
}

export async function updateReportStatusAction(reportId: string, status: ReportStatus) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  try {
    await updateReportStatus(reportId, user.id, status);
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Report update failed." };
  }
}
