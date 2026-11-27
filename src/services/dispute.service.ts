import "server-only";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

interface EvidenceInput {
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  notes?: string;
}

export async function openDispute(
  transactionId: string,
  userId: string,
  reason: string,
) {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { dispute: true },
  });

  if (!tx || (tx.buyerId !== userId && tx.sellerId !== userId)) {
    throw new Error("Only the buyer or seller can open a dispute.");
  }
  if (["COMPLETED", "CANCELLED", "DISPUTED"].includes(tx.status)) {
    throw new Error("A dispute cannot be opened in the current state.");
  }
  if (tx.dispute) {
    throw new Error("A dispute is already open for this transaction.");
  }

  return prisma.$transaction(async (db) => {
    const dispute = await db.dispute.create({
      data: { transactionId, openedById: userId, reason, status: "OPEN" },
    });
    await db.transaction.update({
      where: { id: transactionId },
      data: { status: "DISPUTED" },
    });
    await db.transactionEvent.create({
      data: {
        transactionId,
        actorId: userId,
        eventType: "DISPUTE_OPENED",
        summary: "Dispute opened. Normal transaction progression paused.",
      },
    });
    return dispute;
  });
}

export async function addDisputeEvidence(
  disputeId: string,
  userId: string,
  evidence: EvidenceInput,
) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      transaction: {
        include: { midmanProfile: { select: { userId: true } } },
      },
    },
  });

  if (!dispute) throw new Error("Dispute not found.");
  const t = dispute.transaction;
  const allowed =
    t.buyerId === userId || t.sellerId === userId || t.midmanProfile.userId === userId;
  if (!allowed) throw new Error("Unauthorized to upload dispute evidence.");

  return prisma.disputeEvidence.create({
    data: {
      disputeId,
      uploadedById: userId,
      storagePath: evidence.storagePath,
      mimeType: evidence.mimeType,
      fileSizeBytes: evidence.fileSizeBytes,
      notes: evidence.notes ?? null,
    },
  });
}

export async function getSignedDisputeEvidenceUrl(storagePath: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("private-disputes")
    .createSignedUrl(storagePath, 300);
  if (error || !data) return null;
  return data.signedUrl;
}
