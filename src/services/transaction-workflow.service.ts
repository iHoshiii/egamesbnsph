import "server-only";
import { prisma } from "@/lib/prisma";

export async function midmanRespondAssignment(
  transactionId: string,
  midmanUserId: string,
  accept: boolean,
) {
  const record = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { midmanProfile: { select: { id: true, userId: true } } },
  });

  if (!record || record.midmanProfile.userId !== midmanUserId) {
    throw new Error("Unauthorized midman action.");
  }
  if (record.status !== "MIDMAN_ASSIGNED") {
    throw new Error("Assignment can no longer be changed.");
  }

  if (!accept) {
    return prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "CANCELLED" },
      }),
      prisma.transactionEvent.create({
        data: {
          transactionId,
          actorId: midmanUserId,
          eventType: "MIDMAN_DECLINED",
          summary: "Midman declined the assignment.",
        },
      }),
    ]);
  }

  return prisma.$transaction(async (tx) => {
    const agg = await tx.transactionQueue.aggregate({
      where: {
        midmanProfileId: record.midmanProfileId,
        status: { in: ["WAITING", "IN_PROGRESS"] },
      },
      _max: { position: true },
    });
    const nextPos = (agg._max.position ?? 0) + 1;

    await tx.transactionQueue.create({
      data: {
        transactionId,
        midmanProfileId: record.midmanProfileId,
        position: nextPos,
        status: "WAITING",
      },
    });
    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: "QUEUED" },
    });
    await tx.transactionEvent.create({
      data: {
        transactionId,
        actorId: midmanUserId,
        eventType: "MIDMAN_ACCEPTED",
        summary: `Midman accepted assignment and queued at #${nextPos}.`,
      },
    });
  });
}

export async function setTransactionTerms(
  transactionId: string,
  midmanUserId: string,
  agreedAmountCentavos: number,
  midmanFeeCentavos: number,
  termsNotes: string,
) {
  const record = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { midmanProfile: { select: { userId: true } } },
  });
  if (!record || record.midmanProfile.userId !== midmanUserId) {
    throw new Error("Only the assigned midman can set terms.");
  }

  return prisma.$transaction([
    prisma.transactionAgreement.deleteMany({ where: { transactionId } }),
    prisma.transaction.update({
      where: { id: transactionId },
      data: { agreedAmountCentavos, midmanFeeCentavos, termsNotes, status: "TERMS_PENDING" },
    }),
    prisma.transactionEvent.create({
      data: {
        transactionId,
        actorId: midmanUserId,
        eventType: "TERMS_SET",
        summary: "Midman published transaction terms for buyer and seller approval.",
      },
    }),
  ]);
}

export async function approveTransactionTerms(transactionId: string, userId: string) {
  const record = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!record || record.status !== "TERMS_PENDING") {
    throw new Error("Terms are not pending approval.");
  }
  if (record.buyerId !== userId && record.sellerId !== userId) {
    throw new Error("Only buyer or seller can approve terms.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.transactionAgreement.upsert({
      where: { transactionId_userId: { transactionId, userId } },
      create: { transactionId, userId },
      update: { approvedAt: new Date() },
    });
    const count = await tx.transactionAgreement.count({ where: { transactionId } });
    if (count >= 2) {
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: "PAYMENT_PENDING" },
      });
      await tx.transactionEvent.create({
        data: {
          transactionId,
          actorId: userId,
          eventType: "TERMS_APPROVED",
          summary: "Both buyer and seller approved the terms. Ready for payment.",
        },
      });
    }
  });
}

export async function markFulfillmentSubmitted(
  transactionId: string,
  sellerId: string,
  fulfillmentNotes: string,
) {
  const record = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!record || record.sellerId !== sellerId || record.status !== "PAYMENT_VERIFIED") {
    throw new Error("Fulfillment can only be submitted after payment verification.");
  }

  return prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: { fulfillmentNotes, status: "FULFILLMENT_PENDING" },
    }),
    prisma.transactionEvent.create({
      data: {
        transactionId,
        actorId: sellerId,
        eventType: "FULFILLMENT_SUBMITTED",
        summary: "Seller marked fulfillment as completed.",
      },
    }),
  ]);
}

export async function confirmReceiptAndComplete(transactionId: string, buyerId: string) {
  const record = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!record || record.buyerId !== buyerId || record.status !== "FULFILLMENT_PENDING") {
    throw new Error("Confirmation is only available after seller fulfillment.");
  }

  const now = new Date();
  return prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "COMPLETED", buyerConfirmedAt: now, completedAt: now },
    }),
    prisma.listing.update({ where: { id: record.listingId }, data: { status: "SOLD" } }),
    prisma.transactionQueue.updateMany({ where: { transactionId }, data: { status: "COMPLETED" } }),
    prisma.midmanProfile.update({
      where: { id: record.midmanProfileId },
      data: { completedCount: { increment: 1 } },
    }),
    prisma.transactionEvent.create({
      data: {
        transactionId,
        actorId: buyerId,
        eventType: "COMPLETED",
        summary: "Buyer confirmed receipt. Transaction completed.",
      },
    }),
  ]);
}
