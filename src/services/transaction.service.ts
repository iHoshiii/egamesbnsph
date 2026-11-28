import "server-only";
import { prisma } from "@/lib/prisma";

const WELCOME_MSG =
  "Welcome to your transaction room! Your buyer, seller, and selected midman are now connected. Please wait for the midman to accept the assignment and provide instructions. Do not send passwords, OTPs, or recovery codes through this platform.";

export async function createTransactionFromProposal(proposalId: string) {
  const existing = await prisma.transaction.findUnique({
    where: { proposalId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const proposal = await prisma.transactionProposal.findUnique({
    where: { id: proposalId },
    include: {
      listing: { select: { id: true, priceCentavos: true } },
      midmanProfile: { select: { id: true, userId: true } },
    },
  });

  if (!proposal || proposal.status !== "ACCEPTED") {
    throw new Error("Proposal must be mutually accepted first.");
  }

  return prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.create({
      data: {
        type: "TRANSACTION",
        listingId: proposal.listingId,
        members: {
          createMany: {
            data: [
              { userId: proposal.buyerId },
              { userId: proposal.sellerId },
              { userId: proposal.midmanProfile.userId },
            ],
          },
        },
        messages: {
          create: {
            senderId: proposal.midmanProfile.userId,
            body: WELCOME_MSG,
          },
        },
      },
    });

    const created = await tx.transaction.create({
      data: {
        listingId: proposal.listingId,
        proposalId: proposal.id,
        conversationId: conv.id,
        buyerId: proposal.buyerId,
        sellerId: proposal.sellerId,
        midmanProfileId: proposal.midmanProfileId,
        agreedAmountCentavos: proposal.listing.priceCentavos,
        status: "MIDMAN_ASSIGNED",
        events: {
          create: {
            actorId: null,
            eventType: "ROOM_CREATED",
            summary: "Transaction room created after mutual midman agreement.",
          },
        },
      },
    });

    return created.id;
  });
}

export async function getUserTransactions(userId: string) {
  return prisma.transaction.findMany({
    where: {
      OR: [
        { buyerId: userId },
        { sellerId: userId },
        { midmanProfile: { userId } },
      ],
    },
    include: {
      listing: { select: { id: true, title: true, priceCentavos: true } },
      midmanProfile: { select: { displayName: true, userId: true } },
      queueEntry: { select: { position: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getTransactionDetail(transactionId: string, userId: string) {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      listing: { select: { id: true, title: true, priceCentavos: true, status: true } },
      buyer: { select: { id: true, profile: { select: { displayName: true, username: true } } } },
      seller: { select: { id: true, profile: { select: { displayName: true, username: true } } } },
      midmanProfile: {
        include: { paymentMethods: { where: { isActive: true } } },
      },
      agreements: true,
      queueEntry: true,
      events: { orderBy: { createdAt: "desc" }, take: 20 },
      payments: {
        orderBy: { createdAt: "desc" },
        include: { receipts: true, verifications: true },
      },
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: { select: { id: true, profile: { select: { displayName: true, username: true } } } },
            },
          },
        },
      },
    },
  });

  if (!tx) return null;
  const isParticipant =
    tx.buyerId === userId || tx.sellerId === userId || tx.midmanProfile.userId === userId;
  return isParticipant ? tx : null;
}
