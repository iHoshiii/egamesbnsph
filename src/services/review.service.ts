import "server-only";
import { prisma } from "@/lib/prisma";

export async function createReview(
  transactionId: string,
  buyerId: string,
  rating: number,
  comment: string,
) {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { review: true },
  });

  if (!tx || tx.buyerId !== buyerId) {
    throw new Error("Only the buyer can review this transaction.");
  }
  if (tx.status !== "COMPLETED") {
    throw new Error("Reviews are only allowed for completed transactions.");
  }
  if (tx.review) {
    throw new Error("A review has already been submitted.");
  }

  const vouchSlug = `vouch-${transactionId.slice(0, 8)}-${crypto.randomUUID().slice(0, 6)}`;

  return prisma.$transaction(async (db) => {
    const review = await db.review.create({
      data: {
        transactionId,
        reviewerId: buyerId,
        midmanProfileId: tx.midmanProfileId,
        rating,
        comment,
        vouchSlug,
      },
    });

    const stats = await db.review.aggregate({
      where: { midmanProfileId: tx.midmanProfileId },
      _avg: { rating: true },
    });

    await db.midmanProfile.update({
      where: { id: tx.midmanProfileId },
      data: { ratingAverage: stats._avg.rating ?? rating },
    });

    return review;
  });
}

export async function getReviewByVouchSlug(vouchSlug: string) {
  return prisma.review.findUnique({
    where: { vouchSlug },
    include: {
      reviewer: {
        select: { profile: { select: { displayName: true, username: true } } },
      },
      midmanProfile: { select: { id: true, displayName: true } },
      transaction: {
        select: {
          id: true,
          agreedAmountCentavos: true,
          completedAt: true,
          listing: { select: { title: true } },
        },
      },
    },
  });
}
